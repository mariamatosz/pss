#!/usr/bin/env Rscript
# Transcrições verificadas -> validação -> JSON público, sem estimar valores ausentes.
if (!requireNamespace('jsonlite', quietly=TRUE)) stop('Instale jsonlite: install.packages("jsonlite")')
args <- commandArgs(trailingOnly=TRUE)
csv <- if (length(args)>=1) args[1] else 'analise/indicadores-publicos.csv'
metadata <- if (length(args)>=2) args[2] else 'analise/fontes-indicadores.json'
output <- if (length(args)>=3) args[3] else 'dados/indicadores-publicos.json'
d <- read.csv(csv, colClasses='character', check.names=FALSE, fileEncoding='UTF-8-BOM', na.strings='')
m <- jsonlite::fromJSON(metadata, simplifyVector=FALSE)
if (!identical(names(d),c('conjunto','rotulo','valor')) || !nrow(d) || anyNA(d)) stop('CSV vazio, incompleto ou com cabeçalhos inválidos. Saída preservada.')
if (any(!nzchar(trimws(as.matrix(d))))) stop('Campos vazios. Saída preservada.')
v <- suppressWarnings(as.numeric(d$valor))
if (any(!is.finite(v)) || any(v<0)) stop('Valores inválidos: use ponto decimal e números não negativos.')
if (anyDuplicated(d[c('conjunto','rotulo')])) stop('Categorias duplicadas no mesmo conjunto.')
ids <- vapply(m$conjuntos, function(s) s$id, character(1))
if (!length(ids) || anyDuplicated(ids) || !setequal(ids,unique(d$conjunto))) stop('Conjuntos do CSV e metadados não correspondem.')
if (length(m$revisado_em)!=1 || !grepl('^\\d{4}-\\d{2}-\\d{2}$',m$revisado_em)) stop('Informe a data da conferência em AAAA-MM-DD.')
fields <- c('id','titulo','fonte','periodo','abrangencia','populacao','localizador','nota','url','publicacao')
sets <- lapply(m$conjuntos,function(s){
  if (!all(vapply(fields,function(k) is.character(s[[k]]) && length(s[[k]])==1 && nzchar(s[[k]]) && !grepl('[<>]',s[[k]]),logical(1)))) stop('Metadados incompletos.')
  if (!s$tipo %in% c('line','bar') || !s$unidade %in% c('%','manifestações') || !startsWith(s$url,'https://')) stop('Tipo, unidade ou URL inválido.')
  idx <- which(d$conjunto==s$id)
  if (s$unidade=='%' && any(v[idx]>100)) stop('Percentual acima de 100.')
  if (s$unidade=='manifestações' && any(v[idx]!=floor(v[idx]))) stop('Manifestações devem ser contagens inteiras.')
  s$itens <- lapply(idx,function(i)list(rotulo=d$rotulo[i],valor=v[i]))
  s
})
result <- list(schema_version=1L,revisado_em=m$revisado_em,conjuntos=sets)
encoded <- jsonlite::toJSON(result,auto_unbox=TRUE,pretty=TRUE,null='null',digits=4)
if(!jsonlite::validate(encoded))stop('Falha na validação do JSON.')
dir.create(dirname(output),recursive=TRUE,showWarnings=FALSE)
tmp <- tempfile(tmpdir=dirname(output),fileext='.json')
writeLines(encoded,tmp,useBytes=TRUE)
if(!file.copy(tmp,output,overwrite=TRUE))stop('Não foi possível salvar a saída.')
unlink(tmp)
message('Indicadores exportados: ',output)
