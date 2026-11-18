# Como atualizar os resultados da pesquisa

A seção **Resultados da pesquisa** já está integrada ao menu e ao visual original. O arquivo entregue está em estado **pendente**, sem respostas, totais, percentuais ou gráficos simulados. Os dados públicos anteriores continuam em `data.js`, os questionários são uma fonte separada.

## O que cada tecnologia faz

- **R** lê o CSV revisado, valida alternativas, separa os públicos e calcula frequências e percentuais.
- **JSON** contém apenas estatísticas agregadas, é a ligação entre R e o site.
- **ApexCharts** apresenta os gráficos de barras interativos da nova seção. Há tabelas acessíveis com os mesmos resultados.
- O site continua em HTML, CSS e JavaScript. Não precisa de um servidor R, de React ou de um banco de dados para esse fluxo.

## 1. Preparar as respostas

Exporte as respostas do formulário como CSV UTF-8. Guarde o arquivo original **fora da pasta publicada do site**. Faça a revisão de consentimento, elegibilidade e possíveis envios duplicados conforme o protocolo da pesquisa antes de executar o script. Cada linha incluída é tratada como uma resposta, o script não deduplica participantes por nome ou e-mail.

O arquivo `analise/modelo-respostas.csv` contém **somente cabeçalhos**, sem registros de exemplo. Você pode copiar as respostas para essas colunas, ou renomear os cabeçalhos do CSV exportado com os códigos abaixo. Não é necessário preencher perguntas que não foram respondidas: deixe a célula vazia. Não coloque zero em respostas ausentes.

O script também aceita o texto da pergunta registrado em `analise/configuracao.json` como cabeçalho, desconsiderando acentos, pontuação, espaços e numeração inicial. Se o Forms usar outro título, altere o campo `coluna` na configuração para o título exato exportado. Cabeçalhos ambíguos ou repetidos interrompem o processamento.

### Colunas que definem o público

| Código | Pergunta do Apêndice A | Preenchimento |
| --- | --- | --- |
| `b1_q7` | Bloco 1, questão 7: relação com o tema | Alternativa completa do questionário, obrigatória para cada registro |
| `b2a_q1` | Bloco 2A, questão 1: número de partos | Número inteiro (1, 2 etc.), 0 ou “Estou gestante e ainda não tive nenhum parto”, obrigatória para registros de mulheres/ambas as situações |

Para `b1_q7`, os valores aceitos são:

- `Mulher com experiência de parto (gestante, puérpera ou mãe)`
- `Doula ou profissional de acompanhamento ao parto`
- `Ambas as situações (responder considerando sua experiência pessoal de parto)`
- `Outro (especificar)`: não inclua a especificação aberta nesta coluna.

“Ambas as situações” segue o Bloco 2A, conforme a orientação do questionário, e não é contada novamente no Bloco 2B. Gestantes sem parto participam do perfil e das percepções gerais, mas não dos indicadores de experiência de parto. “Outro” participa apenas do perfil e das percepções gerais.

### Perguntas já configuradas para os gráficos

Foi implementada uma seleção de **13 perguntas fechadas do Apêndice A**, não uma transcrição integral de todas as perguntas para gráficos.

| Código | Pergunta | Grupo |
| --- | --- | --- |
| `b1_q1` | Faixa etária | Perfil |
| `b1_q2` | Raça/cor | Perfil |
| `b2a_q4` | Informação sobre direitos no pré-natal | Experiências de parto |
| `b2a_q7` | Presença de acompanhante | Experiências de parto |
| `b2a_q15` | Reconhecimento da experiência de violência obstétrica | Experiências de parto |
| `b2a_q23` | Relato ou denúncia formal | Experiências de parto |
| `b2a_q24` | Motivos para não denunciar (até duas opções) | Experiências de parto |
| `b2b_q8` | Frequência de situações presenciadas | Doulas e profissionais |
| `b2b_q11` | Apoio à denúncia formal | Doulas e profissionais |
| `b2b_q12` | Percepção sobre identificação e denúncia | Doulas e profissionais |
| `b3_q2` | Percepção de subnotificação: escala de 1 a 5 | Percepções gerais |
| `b3_q7` | Utilidade da plataforma (múltipla escolha) | Percepções gerais |
| `b3_q9` | Formato preferido de informação | Percepções gerais |

As alternativas completas estão em `analise/configuracao.json`, transcritas do PDF fornecido. Acentos e diferenças entre maiúsculas e minúsculas são normalizados. Outras mudanças de redação exigem ajustar a configuração ou padronizar o CSV, respostas desconhecidas geram erro, sem substituir o JSON anterior.

Para múltipla escolha, mantenha todas as opções da participante na mesma célula. O script reconhece opções completas separadas por vírgula (como no Google Forms), ponto e vírgula ou `|`. Opções que já têm vírgula no texto não são separadas indevidamente. Use um editor de planilha para preservar corretamente as aspas do CSV. Alternativas duplicadas na mesma resposta contam uma única vez, mais de duas escolhas em `b2a_q24` e combinações com “Não vejo utilidade clara” em `b3_q7` são rejeitadas.

## 2. Instalar a dependência do R

Instale R e, se preferir, RStudio. No console do R, execute uma vez:

```r
install.packages("jsonlite")
```

Não há outras dependências de R. Não é necessário instalar ApexCharts: a versão 3.49.2 e sua licença acompanham o projeto em `vendor/`.

## 3. Gerar o JSON

Abra um terminal na pasta que contém `index.html` e execute, trocando o caminho pelo CSV revisado:

```sh
Rscript analise/tratar_respostas.R "C:/Pesquisa/respostas-revisadas.csv"
```

A saída será `dados/resultados-pesquisa.json`. O arquivo anterior só é substituído após a validação completa das respostas. Se ocorrer erro, corrija a coluna/registro informado e execute novamente. O JSON anterior permanece disponível, confira se a atualização realmente terminou antes de publicar.

Se o CSV usar **ponto e vírgula** como separador de colunas:

```sh
Rscript analise/tratar_respostas.R "C:/Pesquisa/respostas-revisadas.csv" dados/resultados-pesquisa.json analise/configuracao.json ";"
```

Alternativa no **console do RStudio**, depois de definir a pasta do projeto como diretório de trabalho:

```r
system2(file.path(R.home("bin"), "Rscript"), args = c(
  "analise/tratar_respostas.R",
  shQuote("C:/Pesquisa/respostas-revisadas.csv")
))
```

Um CSV só com os cabeçalhos gera o estado pendente. Para retirar resultados publicados e voltar explicitamente a esse estado:

```sh
Rscript analise/tratar_respostas.R --pendente
```

Esse comando substitui o JSON de resultados por um arquivo sem estatísticas. Não o execute quando quiser manter resultados já publicados.

## 4. Conferir e publicar

Para visualizar localmente, utilize o Live Server do VS Code ou, com Python instalado, execute na raiz do projeto:

```sh
python -m http.server 8000
```

Acesse `http://localhost:8000`. Abrir `index.html` com duplo clique não permite carregar o JSON em muitos navegadores, nesse caso, a seção explica que é necessário um servidor local.

Na **primeira publicação**, envie os arquivos do site mantendo a estrutura:

- `index.html`, `style.css`, `script.js`, `data.js`, `resultados.js`;
- pasta `dados/` com o JSON;
- pasta `vendor/` com ApexCharts e a licença.

Pode publicar em GitHub Pages ou outro serviço para sites estáticos. Nenhuma alteração foi enviada automaticamente ao seu repositório ou ao site publicado.

Nas **atualizações seguintes**, basta processar o CSV novamente e substituir `dados/resultados-pesquisa.json` no mesmo local do site. Abra a seção e confira a data, os totais e as tabelas. O navegador solicita o JSON sem cache, mas a hospedagem pode demorar a disponibilizar uma nova versão.

Não publique os CSVs de respostas, o PDF do TCC, nomes, contatos, relatos livres ou cópias de trabalho. O ZIP entregue não contém respostas individuais. A configuração oferece apenas frequências separadas por pergunta, sem cruzamentos de perfis. Revise a divulgação de categorias com poucas respostas conforme o protocolo aprovado: agregação por si só não garante anonimato em amostras pequenas, não há supressão automática de pequenas contagens nesta versão.

## Como interpretar os números

- A base é o número de participantes elegíveis com resposta válida **naquela pergunta**.
- Células vazias contam como “sem resposta”, sem entrar no denominador.
- “Prefiro não responder” e “Não se aplica” são contadas separadamente e excluídas do denominador.
- “Não sei”, “Não lembro” e alternativas equivalentes são respostas do instrumento e permanecem nas categorias.
- Em `b2a_q24`, só entram participantes que marcaram uma das duas alternativas de **não denúncia** em `b2a_q23`. Quem denunciou ou marcou “Não se aplica” não entra nessa base.
- Múltipla escolha: percentual = participantes que marcaram a opção / participantes com resposta válida. A soma pode ultrapassar 100%.
- Uma categoria pode ter zero **quando há dados reais válidos na pergunta**. Sem respostas válidas, aparece uma mensagem, sem gráfico ou valores zerados de exemplo.
- A escala de subnotificação expressa percepção. Não estima a taxa nacional de subnotificação nem compara diretamente a amostra com registros do OuvidorSUS.

## Arquivos e manutenção

| Arquivo | Função |
| --- | --- |
| `analise/tratar_respostas.R` | Validação, filtros, contagem e exportação |
| `analise/configuracao.json` | Perguntas, alternativas, cabeçalhos e grupos |
| `analise/modelo-respostas.csv` | Modelo vazio para organizar a entrada |
| `dados/resultados-pesquisa.json` | Único arquivo de resultados lido pelo site |
| `resultados.js` | Validação do JSON, filtros, gráficos e tabelas |
| `vendor/apexcharts.min.js` | Biblioteca local, não depende de CDN |

Novas perguntas fechadas podem ser adicionadas à lista `perguntas` da configuração mantendo a estrutura dos exemplos e os grupos existentes. Para perguntas numéricas, novos filtros condicionais ou análises de texto, adapte o script R, não transforme relatos livres em rótulos públicos automaticamente. O PDF contém o instrumento, não o arquivo de respostas: os cabeçalhos da exportação real ainda precisarão ser conferidos quando a coleta estiver disponível.

## Verificação desta entrega

O processamento foi executado em R 4.5.0 com jsonlite 1.9.1 usando dados sintéticos temporários apenas para testes. Foram verificados filtros de público, gestantes sem parto, bases por pergunta, recusas, respostas ausentes, múltipla escolha, CSV com separadores diferentes e rejeição de respostas inválidas sem sobrescrever o JSON anterior. Esses dados de teste não fazem parte do projeto entregue e não foram publicados como resultados da pesquisa.

Também foram verificados em um ambiente DOM os estados pendente/disponível/erro, a troca de grupos, as tabelas, o menu e as abas existentes. Nesses testes, o renderizador ApexCharts foi substituído por um simulador, a biblioteca real está incluída no projeto. A conferência visual em navegador não foi concluída porque o Chromium disponível neste ambiente não conseguiu iniciar. Confira a aparência ao abrir a prévia local antes de publicar.

## Demonstração opcional

Em “Resultados da pesquisa”, clique em “Ver demonstração”. Quatro grupos mostram exemplos fictícios, com aviso geral e identificação em cada gráfico e tabela. “Sair da demonstração” retorna ao estado real. A demonstração não é ativada automaticamente e não é lembrada após recarregar a página.

Os exemplos ficam separados, no objeto `demonstration` de `resultados.js`. Não são lidos pelo R nem gravados em `dados/resultados-pesquisa.json`, que permanece pendente. Ao inserir respostas reais, siga o fluxo R → JSON descrito neste guia, os exemplos não entram na análise. No TCC, descreva a demonstração como teste da interface, nunca como coleta ou resultado.

## Perguntas na demonstração

A demonstração apresenta os enunciados e as alternativas das 13 perguntas selecionadas do Apêndice A do TCC, já configuradas em `analise/configuracao.json`. Não representa o formulário inteiro. Apenas as respostas são fictícias. Os títulos das futuras exportações em R também usam esses enunciados. Nenhuma resposta real foi acrescentada.
