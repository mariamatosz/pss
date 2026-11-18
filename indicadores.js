(function () {
  'use strict';
  const select = document.getElementById('indicador-selecao');
  const content = document.getElementById('indicador-conteudo');
  const status = document.getElementById('indicador-status');
  const format = new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 1});
  let chart, generation = 0;
  function node(tag, text, cls) {
    const e = document.createElement(tag);
    if (text != null) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  const validText = s => typeof s === 'string' && s.length > 0 && s.length <= 2000 && !/[<>]/.test(s);
  function validate(d) {
    if (!d || d.schema_version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(d.revisado_em) || !Array.isArray(d.conjuntos) || !d.conjuntos.length) throw Error('Formato inválido');
    const ids = new Set();
    d.conjuntos.forEach(s => {
      if (!['id','titulo','fonte','periodo','abrangencia','populacao','localizador','nota','url','publicacao'].every(k => validText(s[k])) ||
          !Object.hasOwn(window.DADOS.fontes, s.fonte) || !['line','bar'].includes(s.tipo) || !['%', 'manifestações'].includes(s.unidade) ||
          ids.has(s.id) || !Array.isArray(s.itens) || !s.itens.length || new URL(s.url).protocol !== 'https:') throw Error('Conjunto inválido');
      ids.add(s.id);
      const labels = new Set();
      s.itens.forEach(i => {
        if (!validText(i.rotulo) || labels.has(i.rotulo) || !Number.isFinite(i.valor) || i.valor < 0 || (s.unidade === '%' ? i.valor > 100 : !Number.isSafeInteger(i.valor))) throw Error('Valor inválido');
        labels.add(i.rotulo);
      });
    });
  }
  function download(filename, text, type) {
    const url = URL.createObjectURL(new Blob([text], {type}));
    const a = node('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function csvCell(s) {
    let t = String(s);
    if (/^[=+@\-\t\r]/.test(t)) t = "'" + t;
    return '"' + t.replace(/"/g, '""') + '"';
  }
  async function show(s, revision) {
    const current = ++generation;
    const percent = s.unidade === '%';
    const suffix = percent ? '%' : '';
    const unitLabel = percent ? 'Percentual' : 'Manifestações';
    const axisMax = percent ? 100 : Math.max(10, Math.ceil(Math.max(...s.itens.map(i=>i.valor))/20)*20);
    if (chart) { chart.destroy(); chart = null; }
    content.replaceChildren();
    status.textContent = 'Indicador selecionado: ' + s.titulo;
    const card = node('article', null, 'box indicador-card');
    card.appendChild(node('h3', s.titulo));
    card.appendChild(node('p',s.abrangencia+' · '+s.periodo,'note'));
    card.appendChild(node('p',s.nota,'aviso'));
    const explanation = node('details');
    explanation.appendChild(node('summary','Entenda este dado'));
    explanation.appendChild(node('p',s.populacao));
    explanation.appendChild(node('p','Publicação: '+s.publicacao+'. Localização: '+s.localizador+'.'));
    card.appendChild(explanation);
    const plot = node('div',null,'indicador-chart'); plot.setAttribute('aria-hidden','true');
    card.appendChild(plot);
    const wrap = node('div',null,'indicador-table-wrap');
    const table = node('table',null,'pesquisa-tabela');
    table.appendChild(node('caption',s.titulo + ': ' + s.periodo));
    const header = table.createTHead().insertRow();
    ['Categoria / ano',unitLabel].forEach(t => {const th=node('th',t);th.scope='col';header.appendChild(th);});
    const body = table.createTBody();
    s.itens.forEach(i => {const r=body.insertRow(), th=node('th',i.rotulo);th.scope='row';r.append(th,node('td',format.format(i.valor)+suffix));});
    wrap.appendChild(table);card.appendChild(wrap);
    const source = node('p',null,'note');
    const a = node('a',window.DADOS.fontes[s.fonte].curta,'src');a.href='#fonte-'+s.fonte;
    source.append('Fonte: ',a);
    card.appendChild(source);
    const buttons = node('div',null,'btns');
    ['CSV','JSON'].forEach(type => {
      const b=node('button','Baixar este conjunto ('+type+')','btn ghost');b.type='button';
      b.addEventListener('click',() => {
        if(type==='JSON') download(s.id+'.json',JSON.stringify({schema_version:1,revisado_em:revision,conjuntos:[s]},null,2),'application/json;charset=utf-8');
        else {
          const rows=[['conjunto','rotulo','valor','unidade','periodo','abrangencia','populacao','publicacao','fonte_url','localizador','nota','revisado_em'],
            ...s.itens.map(i=>[s.id,i.rotulo,String(i.valor).replace('.',','),s.unidade,s.periodo,s.abrangencia,s.populacao,s.publicacao,s.url,s.localizador,s.nota,revision])];
          download(s.id+'.csv','\uFEFF'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n'),'text/csv;charset=utf-8');
        }
      });buttons.appendChild(b);
    });
    card.appendChild(buttons);content.appendChild(card);
    try {
      await window.carregarApexCharts();
      if(current!==generation) return;
      const localChart = new window.ApexCharts(plot,{
        chart:{type:s.tipo,height:s.tipo==='bar'?Math.max(320,s.itens.length*65):340,fontFamily:'Arial, sans-serif',foreColor:'#433858',toolbar:{show:false},animations:{enabled:!matchMedia('(prefers-reduced-motion: reduce)').matches}},
        series:[{name:unitLabel,data:s.itens.map(i=>i.valor)}],colors:['#6f3fc3'],
        stroke:{width:s.tipo==='line'?3:0,curve:'straight'},markers:{size:s.tipo==='line'?4:0},
        plotOptions:{bar:{horizontal:true,borderRadius:4}},dataLabels:{enabled:false},
        xaxis:s.tipo==='line'?{categories:s.itens.map(i=>i.rotulo),tickPlacement:'on',labels:{rotate:-45}}:
          {categories:s.itens.map((_,i)=>String(i+1)),min:0,max:axisMax,tickAmount:4,labels:{formatter:n=>format.format(n)+suffix}},
        yaxis:s.tipo==='line'?{min:0,max:axisMax,tickAmount:4,labels:{formatter:n=>format.format(n)+suffix}}:{labels:{maxWidth:30}},
        tooltip:{x:{formatter:(_,ctx)=>s.itens[ctx.dataPointIndex].rotulo},y:{formatter:n=>format.format(n)+suffix}},
        grid:{borderColor:'#d6cbe8'}
      });
      chart=localChart;await localChart.render();
      if(current!==generation)return;
      if(s.tipo==='bar') {
        const legend=node('ol',null,'pesquisa-legenda');s.itens.forEach(i=>legend.appendChild(node('li',i.rotulo)));plot.after(legend);
      }
    } catch (_) {
      if(current===generation){plot.hidden=true;status.textContent='O gráfico não pôde ser exibido. A tabela e os downloads continuam disponíveis.';}
    }
  }
  async function init() {
    try {
      const response=await fetch('dados/indicadores-publicos.json',{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw Error('Arquivo indisponível');
      const data=await response.json();validate(data);
      select.replaceChildren();data.conjuntos.forEach(s=>{const option=node('option',s.titulo);option.value=s.id;select.appendChild(option);});
      select.disabled=false;
      select.addEventListener('change',()=>show(data.conjuntos.find(s=>s.id===select.value),data.revisado_em));
      show(data.conjuntos[0],data.revisado_em);
    } catch (_) {
      select.replaceChildren(node('option','Indicadores indisponíveis'));select.disabled=true;
      status.textContent=location.protocol==='file:'?'Os dados estão no projeto, mas o navegador bloqueou a leitura ao abrir o HTML por duplo clique. Abra o site publicado ou use um servidor local, conforme o README.':'Não foi possível carregar os indicadores. Recarregue a página para tentar novamente.';
    }
  }
  const search=document.getElementById('busca-fontes');
  const sources=Array.from(document.querySelectorAll('#lista-fontes > li'));
  const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function filterSources(){const q=normalize(search.value.trim());let total=0;sources.forEach(li=>{li.hidden=!normalize(li.textContent).includes(q);if(!li.hidden)total++;});document.getElementById('fontes-contagem').textContent=total+' de '+sources.length+' fontes encontradas.';}
  search.addEventListener('input',filterSources);filterSources();
  function revealSource(){
    if(location.hash.startsWith('#fonte-')){
      if(search.value){search.value='';filterSources();}
      const target=document.getElementById(location.hash.slice(1));
      if(target){
        const details=target.querySelector('details');
        if(details)details.open=true;
        target.scrollIntoView({block:'start'});
      }
    }
  }
  window.addEventListener('hashchange',revealSource);revealSource();
  init();
})();
