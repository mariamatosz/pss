> Organização atual: o painel “Experiências relatadas” contém somente a pesquisa FPA/Sesc, em `data.js`. A seção “O que chegou ao OuvidorSUS” contém somente a série administrativa, com dez observações, tratada pelo fluxo CSV, R e JSON. “Resultados da pesquisa” permanece separado e reservado aos formulários. As descrições de conjuntos anteriores abaixo são históricas.

> Atualização desta versão: o explorador contém somente manifestações sobre violência obstétrica no OuvidorSUS (10 anos) e situações relatadas no parto na pesquisa FPA/Sesc (6 categorias). Foram retirados os três conjuntos de cesarianas e o gráfico de razões de chances. São 16 observações e 22 referências. Os registros anteriores abaixo documentam versões passadas, a seleção atual é esta. Títulos em Georgia itálica, textos corridos em Arial. Os exemplos fictícios continuam exclusivos da demonstração.

# Atualizar dados públicos

O site usa dois fluxos independentes: os questionários da autora e as publicações externas. Este guia trata das publicações externas e dos registros administrativos solicitados pela autora. Para os questionários, use ATUALIZAR_RESULTADOS.md.

## Instalar e abrir o R

Instale R pelo site oficial https://cran.r-project.org/. O RStudio Desktop (https://posit.co/download/rstudio-desktop/) é opcional e facilita o uso. O R precisa estar instalado mesmo que você instale o RStudio.

No console do R ou RStudio, instale uma vez:

```r
install.packages("jsonlite")
```

O visitante do site não precisa instalar R. R é executado no seu computador para produzir o JSON, o navegador lê esse arquivo.

## Atualizar um indicador

1. Consulte o relatório/artigo original. Confirme a tabela, o período, a população, a unidade e se o dado é preliminar. Data de publicação e período da coleta são campos distintos.
2. Edite `analise/indicadores-publicos.csv`. Preserve os cabeçalhos `conjunto,rotulo,valor`. Use ponto decimal, por exemplo `60.6`. Valores ausentes não são zero: não inclua uma linha sem valor, registre a ausência na nota.
3. Atualize `analise/fontes-indicadores.json`: referência, URL, recorte, limitações e data da conferência. Para um novo conjunto, use um identificador único e adicione também a referência em `data.js` (objeto `fontes`). O campo `fonte` deve ser a mesma chave nos dois arquivos.
4. Abra o terminal na pasta que contém `index.html` e execute:

```sh
Rscript analise/exportar_indicadores.R
```

O script valida o CSV e os metadados e produz `dados/indicadores-publicos.json`. Não recalcula os percentuais publicados nem preenche valores faltantes.

Se preferir executar pelo console do RStudio, use Session → Set Working Directory → Choose Directory e escolha a pasta do projeto. Depois:

```r
source("analise/exportar_indicadores.R", encoding = "UTF-8")
```

O script também aceita caminhos no terminal:

```sh
Rscript analise/exportar_indicadores.R analise/indicadores-publicos.csv analise/fontes-indicadores.json dados/indicadores-publicos.json
```

5. Confira o JSON gerado e abra o site por um servidor local. No VS Code, use uma extensão de servidor local, ou, se tiver Python instalado, execute `python -m http.server 8000` e abra http://localhost:8000. Abrir o HTML por duplo clique pode bloquear o carregamento do JSON.
6. Compare tabela, gráfico e downloads com a fonte. Não publique um conjunto se houver erro ou dúvida sobre o denominador.
7. Substitua os arquivos atualizados na hospedagem. Para GitHub Pages, mantenha `index.html`, CSS, JavaScript, `dados/` e `vendor/` na estrutura entregue. Preserve os caminhos relativos.

## Dados entregues

O CSV e o JSON públicos contêm somente os dez registros anuais do OuvidorSUS, de 2016 a 2025. As demais visualizações de pesquisas ficam em data.js, sempre com fonte e período. Não há séries de cesarianas nesta versão.

## Cuidados editoriais

- Uma taxa de cesarianas não equivale à prevalência de violência obstétrica.
- Não combine pesquisas de perguntas e populações diferentes em uma série histórica.
- Os downloads incluem as notas e a fonte para que os valores não percam o contexto.
- O site não consulta novas publicações automaticamente. Atualização exige revisão e nova publicação dos arquivos.
- O conjunto do OuvidorSUS contém dez observações. A unidade deve ser `%` (0 a 100) ou `manifestações` (inteiros não negativos). Não transforme contagens administrativas em percentuais sem denominador documentado.
- A resposta original do pedido do OuvidorSUS ainda precisa ser anexada/conferida para completar a rastreabilidade desse conjunto, já sinalizado no site.

## Publicação dos questionários

Nunca envie para o repositório público CSVs com respostas individuais, nomes, contatos ou textos livres. Revise consentimento, elegibilidade e possibilidade de identificação por grupos pequenos antes de divulgar resultados agregados. A rotina dos formulários não oferece anonimização automática nem supressão automática de células pequenas.
