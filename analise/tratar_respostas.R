#!/usr/bin/env Rscript
# Parto sem silêncio: CSV revisado -> estatísticas agregadas -> JSON público.
# Execute na raiz do projeto; veja ATUALIZAR_RESULTADOS.md.
if (!requireNamespace("jsonlite", quietly = TRUE)) {
  stop('Instale a dependência: install.packages("jsonlite")', call. = FALSE)
}
args <- commandArgs(trailingOnly = TRUE)
if (!length(args)) stop('Uso: Rscript analise/tratar_respostas.R respostas.csv [saida.json] [configuracao.json] [separador]\nOu: Rscript analise/tratar_respostas.R --pendente [saida.json]', call. = FALSE)
output <- if (length(args) >= 2) args[2] else "dados/resultados-pesquisa.json"
config_path <- if (length(args) >= 3) args[3] else "analise/configuracao.json"
sep <- if (length(args) >= 4) args[4] else ","
if (!sep %in% c(",", ";", "\t")) stop("Separador CSV inválido.")
pending <- list(schema_version = 1L, status = "pendente", atualizado_em = NULL,
                total_respostas = NULL, grupos = list())
write_result <- function(value) {
  dir.create(dirname(output), recursive = TRUE, showWarnings = FALSE)
  json <- jsonlite::toJSON(value, auto_unbox = TRUE, pretty = TRUE, null = "null", digits = 4)
  temp <- tempfile(tmpdir = dirname(output), fileext = ".json")
  writeLines(json, temp, useBytes = TRUE)
  if (!jsonlite::validate(paste(readLines(temp, warn = FALSE), collapse = "\n"))) stop("JSON inválido.")
  # Só toca a saída após concluir todas as validações.
  if (!file.copy(temp, output, overwrite = TRUE)) stop("Não foi possível gravar a saída.")
  unlink(temp)
  message("JSON gerado: ", output, " (", value$status, ")")
}
if (identical(args[1], "--pendente")) { write_result(pending); quit(status = 0) }
if (!file.exists(args[1])) stop("CSV não encontrado. A saída anterior foi preservada.")
cfg <- jsonlite::fromJSON(config_path, simplifyVector = FALSE)
normalize <- function(x) {
  x[is.na(x)] <- ""
  x <- trimws(gsub("[[:space:]]+", " ", x))
  tolower(iconv(x, from = "UTF-8", to = "ASCII//TRANSLIT"))
}
header_key <- function(x) {
  x <- sub("^[0-9]+[.) -]+", "", normalize(x))
  trimws(gsub("[^a-z0-9]+", " ", x))
}
d <- read.table(args[1], header = TRUE, sep = sep, quote = '"', comment.char = "",
                colClasses = "character", check.names = FALSE, fileEncoding = "UTF-8-BOM",
                na.strings = "", fill = FALSE, blank.lines.skip = TRUE)
if (anyDuplicated(header_key(names(d)))) stop("Existem cabeçalhos duplicados. Renomeie-os com os códigos do modelo.")
d[] <- lapply(d, function(x) { x[is.na(x)] <- ""; trimws(x) })
d <- d[rowSums(as.data.frame(lapply(d, function(x) nzchar(x)))) > 0, , drop = FALSE]
if (!nrow(d)) { write_result(pending); quit(status = 0) }
find_column <- function(code, question, required = FALSE) {
  hit <- which(header_key(names(d)) %in% header_key(c(code, question)))
  if (length(hit) > 1) stop("Duas colunas correspondem a ", code, ". Mantenha apenas uma.")
  if (!length(hit)) {
    if (required) stop("Coluna obrigatória ausente: ", code, ". Consulte o modelo.")
    return(NULL)
  }
  d[[hit]]
}
profile <- find_column(cfg$coluna_perfil, cfg$pergunta_perfil, TRUE)
pkeys <- lapply(cfg$perfis, function(x) normalize(unlist(x)))
if (any(!normalize(profile) %in% unlist(pkeys))) stop("Perfil ausente ou desconhecido em b1_q7. Revise o CSV; nenhum JSON foi atualizado.")
is_woman <- normalize(profile) %in% pkeys$mulheres
is_professional <- normalize(profile) %in% pkeys$profissionais
births <- find_column(cfg$coluna_partos, cfg$pergunta_partos, any(is_woman))
has_birth <- rep(FALSE, nrow(d))
if (any(is_woman)) {
  no_birth <- normalize(births) == normalize(cfg$sem_parto) | births == "0"
  numeric_birth <- grepl("^[0-9]+$", births) & suppressWarnings(as.numeric(births) >= 1)
  numeric_birth[is.na(numeric_birth)] <- FALSE
  if (any(is_woman & !(no_birth | numeric_birth))) stop("Preencha b2a_q1 com um número inteiro de partos ou a opção de gestante sem parto.")
  has_birth <- is_woman & numeric_birth
}
# Reconhece opções inteiras, inclusive quando contêm vírgulas internas.
# Aceita separadores de múltipla escolha: vírgula (Google Forms), ponto e vírgula ou |.
parse_multiple <- function(value, options) {
  keys <- normalize(options)
  walk <- function(rest, depth = 0L) {
    if (!nzchar(rest)) return(integer())
    if (depth >= length(keys)) return(NULL)
    for (i in order(nchar(keys), decreasing = TRUE)) {
      if (startsWith(rest, keys[i])) {
        tail <- trimws(substring(rest, nchar(keys[i]) + 1L))
        if (!nzchar(tail)) return(i)
        if (substr(tail, 1, 1) %in% c(",", ";", "|")) {
          remainder <- trimws(substring(tail, 2))
          if (!nzchar(remainder)) next
          found <- walk(remainder, depth + 1L)
          if (!is.null(found)) return(c(i, found))
        }
      }
    }
    NULL
  }
  walk(normalize(value))
}
# A pergunta 2A.24 só usa participantes que marcaram que NÃO denunciaram em 2A.23.
denunciation_q <- Filter(function(q) q$id == "b2a_q23", cfg$perguntas)[[1]]
denunciation <- find_column(denunciation_q$coluna, denunciation_q$pergunta)
no_report <- if (is.null(denunciation)) rep(FALSE, nrow(d)) else normalize(denunciation) %in%
  normalize(c("Não, mas eu saberia onde denunciar", "Não, e não saberia onde denunciar"))
group_names <- c(perfil = "Perfil das participantes", mulheres = "Experiências de parto",
                 profissionais = "Doulas e profissionais", geral = "Percepções gerais")
groups <- lapply(names(group_names), function(group) {
  charts <- lapply(Filter(function(q) q$grupo == group, cfg$perguntas), function(q) {
    options <- unlist(q$opcoes)
    if (anyDuplicated(normalize(options))) stop("Opções duplicadas na configuração: ", q$id)
    eligible <- switch(group, mulheres = has_birth, profissionais = is_professional, rep(TRUE, nrow(d)))
    values <- find_column(q$coluna, q$pergunta)
    if (q$id == "b2a_q24") {
      if (!is.null(values) && any(nzchar(values[has_birth])) && is.null(denunciation))
        stop("Para tratar b2a_q24, inclua também b2a_q23.")
      eligible <- eligible & no_report
    }
    counts <- integer(length(options)); base <- 0L; blank <- 0L; excluded <- 0L
    for (row in which(eligible)) {
      value <- if (is.null(values)) "" else values[row]
      if (!nzchar(value)) { blank <- blank + 1L; next }
      selected <- if (q$tipo == "multipla") parse_multiple(value, options) else match(normalize(value), normalize(options))
      if (!length(selected) || anyNA(selected)) stop("Resposta não reconhecida: ", q$id, ", registro ", row, ". Revise as opções; a saída anterior foi preservada.")
      selected <- unique(selected)
      if (!is.null(q$max_escolhas) && length(selected) > q$max_escolhas) stop("Mais escolhas que o permitido em ", q$id, ", registro ", row)
      exclusive <- normalize(unlist(c(q$exclusivas, q$excluir)))
      if (length(selected) > 1 && any(normalize(options[selected]) %in% exclusive)) stop("Opção exclusiva combinada com outra em ", q$id, ", registro ", row)
      if (all(normalize(options[selected]) %in% normalize(unlist(q$excluir)))) { excluded <- excluded + 1L; next }
      base <- base + 1L
      counts[selected] <- counts[selected] + 1L
    }
    keep <- which(!normalize(options) %in% normalize(unlist(q$excluir)))
    items <- if (base > 0L) lapply(keep, function(i) list(rotulo = options[i], quantidade = counts[i], percentual = round(counts[i] / base * 100, 1))) else list()
    note <- if (q$tipo == "multipla") "Múltipla escolha: uma participante pode marcar mais de uma opção." else "Uma resposta por participante."
    if (q$id == "b2a_q24") note <- paste(note, "Base restrita às participantes que responderam que não denunciaram na pergunta 2A.23.")
    if (q$id == "b3_q2") note <- paste(note, "Escala: 1 = nada subnotificada; 5 = extremamente subnotificada. Trata-se de percepção, não de estimativa nacional.")
    list(id = q$id, titulo = q$titulo, tipo = q$tipo, base = base, elegiveis = sum(eligible),
         sem_resposta = blank, excluidas = excluded, nota = note, itens = items)
  })
  list(id = group, titulo = unname(group_names[group]), graficos = charts)
})
if (!any(vapply(groups, function(g) any(vapply(g$graficos, function(q) q$base > 0, logical(1))), logical(1)))) {
  write_result(pending)
} else {
  write_result(list(schema_version = 1L, status = "disponivel", atualizado_em = format(Sys.time(), "%Y-%m-%dT%H:%M:%SZ", tz = "UTC"),
                    total_respostas = nrow(d), grupos = groups))
}
