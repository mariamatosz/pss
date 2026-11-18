(function () {
  'use strict';
  const status = document.getElementById('pesquisa-status');
  const content = document.getElementById('pesquisa-conteudo');
  if (!status || !content) return;
  const area = document.getElementById('pesquisa-graficos');
  const filters = document.getElementById('pesquisa-filtros');
  const instances = [];
  const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  let generation = 0;
  let demoMode = false;
  let realData = null;
  const demoButton = document.getElementById("pesquisa-demo-toggle");
  const demoNotice = document.getElementById("pesquisa-demo-aviso");
  const demonstration = {"schema_version": 1, "status": "disponivel", "demonstracao": true, "atualizado_em": "2026-11-17T12:00:00Z", "total_respostas": 30, "grupos": [{"id": "perfil", "titulo": "Perfil das participantes", "graficos": [{"id": "demo-b1_q1", "titulo": "DEMONSTRAÇÃO: Qual a sua faixa etária?", "tipo": "unica", "nota": "Pergunta do formulário da pesquisa. Respostas fictícias para demonstração, não representam participantes reais.", "base": 30, "elegiveis": 30, "sem_resposta": 0, "excluidas": 0, "itens": [{"rotulo": "18 a 24 anos", "quantidade": 8, "percentual": 26.7}, {"rotulo": "25 a 34 anos", "quantidade": 8, "percentual": 26.7}, {"rotulo": "35 a 44 anos", "quantidade": 7, "percentual": 23.3}, {"rotulo": "45 anos ou mais", "quantidade": 7, "percentual": 23.3}]}, {"id": "demo-b1_q2", "titulo": "DEMONSTRAÇÃO: Como você se autodeclara em relação à raça/cor (IBGE)?", "tipo": "unica", "nota": "Pergunta do formulário da pesquisa. Respostas fictícias para demonstração, não representam participantes reais.", "base": 30, "elegiveis": 30, "sem_resposta": 0, "excluidas": 0, "itens": [{"rotulo": "Branca", "quantidade": 6, "percentual": 20.0}, {"rotulo": "Preta", "quantidade": 6, "percentual": 20.0}, {"rotulo": "Parda", "quantidade": 6, "percentual": 20.0}, {"rotulo": "Amarela", "quantidade": 6, "percentual": 20.0}, {"rotulo": "Indígena", "quantidade": 6, "percentual": 20.0}]}]}, {"id": "mulheres", "titulo": "Experiências das mulheres", "graficos": [{"id": "demo-b2a_q4", "titulo": "DEMONSTRAÇÃO: Durante o pré-natal, você recebeu informações sobre seus direitos durante o parto?", "tipo": "unica", "nota": "Pergunta do formulário da pesquisa. Respostas fictícias para demonstração, não representam participantes reais.", "base": 20, "elegiveis": 20, "sem_resposta": 0, "excluidas": 0, "itens": [{"rotulo": "Sim, de forma clara e detalhada", "quantidade": 5, "percentual": 25.0}, {"rotulo": "Sim, mas de forma superficial", "quantidade": 5, "percentual": 25.0}, {"rotulo": "Não recebi nenhuma informação sobre meus direitos", "quantidade": 5, "percentual": 25.0}, {"rotulo": "Não lembro", "quantidade": 5, "percentual": 25.0}]}, {"id": "demo-b2a_q7", "titulo": "DEMONSTRAÇÃO: Você teve acompanhante durante todo o trabalho de parto e/ou parto?", "tipo": "unica", "nota": "Pergunta do formulário da pesquisa. Respostas fictícias para demonstração, não representam participantes reais.", "base": 20, "elegiveis": 20, "sem_resposta": 0, "excluidas": 0, "itens": [{"rotulo": "Sim, por todo o período", "quantidade": 4, "percentual": 20.0}, {"rotulo": "Sim, mas apenas em parte do tempo", "quantidade": 4, "percentual": 20.0}, {"rotulo": "Não, e eu queria ter tido", "quantidade": 4, "percentual": 20.0}, {"rotulo": "Não, mas não era minha preferência", "quantidade": 4, "percentual": 20.0}, {"rotulo": "Não me lembro", "quantidade": 4, "percentual": 20.0}]}, {"id": "demo-b2a_q15", "titulo": "DEMONSTRAÇÃO: Você considera que viveu algum tipo de violência obstétrica?", "tipo": "unica", "nota": "Pergunta do formulário da pesquisa. Respostas fictícias para demonstração, não representam participantes reais.", "base": 20, "elegiveis": 20, "sem_resposta": 0, "excluidas": 0, "itens": [{"rotulo": "Sim, claramente", "quantidade": 8, "percentual": 40.0}, {"rotulo": "Acho que sim, mas não tenho certeza", "quantidade": 4, "percentual": 20.0}, {"rotulo": "Não", "quantidade": 6, "percentual": 30.0}, {"rotulo": "Não sei o que é violência obstétrica", "quantidade": 2, "percentual": 10.0}]}, {"id": "demo-b2a_q23", "titulo": "DEMONSTRAÇÃO: Você chegou a relatar ou denunciar formalmente o ocorrido (ex.: Ouvidoria do SUS, conselho de classe, boletim de ocorrência)?", "tipo": "unica", "nota": "Pergunta do formulário da pesquisa. Respostas fictícias para demonstração, não representam participantes reais.", "base": 12, "elegiveis": 20, "sem_resposta": 0, "excluidas": 8, "itens": [{"rotulo": "Sim, e houve algum retorno ou providência", "quantidade": 2, "percentual": 16.7}, {"rotulo": "Sim, mas não houve retorno ou providência", "quantidade": 2, "percentual": 16.7}, {"rotulo": "Não, mas eu saberia onde denunciar", "quantidade": 4, "percentual": 33.3}, {"rotulo": "Não, e não saberia onde denunciar", "quantidade": 4, "percentual": 33.3}]}, {"id": "demo-b2a_q24", "titulo": "DEMONSTRAÇÃO: Se você não denunciou, qual o principal motivo? (selecione até duas opções)", "tipo": "multipla", "nota": "Pergunta do formulário da pesquisa. Respostas fictícias para demonstração, não representam participantes reais. É possível marcar mais de uma alternativa, por isso a soma pode ultrapassar 100%. Exemplo com oito mulheres que não denunciaram, no máximo duas opções por pessoa.", "base": 8, "elegiveis": 20, "sem_resposta": 0, "excluidas": 12, "itens": [{"rotulo": "Desconhecimento dos canais de denúncia", "quantidade": 3, "percentual": 37.5}, {"rotulo": "Medo de retaliação ou de novo julgamento", "quantidade": 2, "percentual": 25.0}, {"rotulo": "Falta de tempo ou energia no pós-parto", "quantidade": 2, "percentual": 25.0}, {"rotulo": "Sentimento de que não vai resultar em nada", "quantidade": 2, "percentual": 25.0}, {"rotulo": "Não reconhecer na hora que era violência", "quantidade": 1, "percentual": 12.5}, {"rotulo": "Vergonha ou culpa", "quantidade": 1, "percentual": 12.5}, {"rotulo": "Alguém próximo me desencorajou a denunciar", "quantidade": 0, "percentual": 0.0}, {"rotulo": "Não queria reviver o ocorrido", "quantidade": 1, "percentual": 12.5}, {"rotulo": "Outro", "quantidade": 0, "percentual": 0.0}]}]}, {"id": "profissionais", "titulo": "Doulas e profissionais", "graficos": [{"id": "demo-b2b_q8", "titulo": "DEMONSTRAÇÃO: Durante sua atuação, com que frequência presenciou situações que considera violência obstétrica?", "tipo": "unica", "nota": "Pergunta do formulário da pesquisa. Respostas fictícias para demonstração, não representam participantes reais.", "base": 10, "elegiveis": 10, "sem_resposta": 0, "excluidas": 0, "itens": [{"rotulo": "Nunca", "quantidade": 2, "percentual": 20.0}, {"rotulo": "Raramente", "quantidade": 2, "percentual": 20.0}, {"rotulo": "Algumas vezes", "quantidade": 2, "percentual": 20.0}, {"rotulo": "Frequentemente", "quantidade": 2, "percentual": 20.0}, {"rotulo": "Em quase todos os atendimentos que acompanhei", "quantidade": 2, "percentual": 20.0}]}, {"id": "demo-b2b_q11", "titulo": "DEMONSTRAÇÃO: Você já orientou ou apoiou uma parturiente a fazer uma denúncia formal após o parto?", "tipo": "unica", "nota": "Pergunta do formulário da pesquisa. Respostas fictícias para demonstração, não representam participantes reais.", "base": 10, "elegiveis": 10, "sem_resposta": 0, "excluidas": 0, "itens": [{"rotulo": "Sim, mais de uma vez", "quantidade": 3, "percentual": 30.0}, {"rotulo": "Sim, uma vez", "quantidade": 3, "percentual": 30.0}, {"rotulo": "Não, mas já orientei sobre os canais existentes", "quantidade": 2, "percentual": 20.0}, {"rotulo": "Não", "quantidade": 2, "percentual": 20.0}]}, {"id": "demo-b2b_q12", "titulo": "DEMONSTRAÇÃO: Na sua percepção, as parturientes que você acompanha costumam saber identificar e denunciar violência obstétrica?", "tipo": "unica", "nota": "Pergunta do formulário da pesquisa. Respostas fictícias para demonstração, não representam participantes reais.", "base": 10, "elegiveis": 10, "sem_resposta": 0, "excluidas": 0, "itens": [{"rotulo": "Sim, a maioria sabe e denuncia quando necessário", "quantidade": 3, "percentual": 30.0}, {"rotulo": "Sabem identificar, mas raramente denunciam", "quantidade": 3, "percentual": 30.0}, {"rotulo": "A maioria não sabe identificar nem denunciar", "quantidade": 2, "percentual": 20.0}, {"rotulo": "Não sei avaliar", "quantidade": 2, "percentual": 20.0}]}]}, {"id": "geral", "titulo": "Informação e plataforma", "graficos": [{"id": "demo-b3_q2", "titulo": "DEMONSTRAÇÃO: Em uma escala de 1 a 5, o quanto você considera que a violência obstétrica é subnotificada no Brasil?", "tipo": "unica", "nota": "Pergunta do formulário da pesquisa. Respostas fictícias para demonstração, não representam participantes reais.", "base": 30, "elegiveis": 30, "sem_resposta": 0, "excluidas": 0, "itens": [{"rotulo": "1", "quantidade": 5, "percentual": 16.7}, {"rotulo": "2", "quantidade": 5, "percentual": 16.7}, {"rotulo": "3", "quantidade": 5, "percentual": 16.7}, {"rotulo": "4", "quantidade": 5, "percentual": 16.7}, {"rotulo": "5", "quantidade": 5, "percentual": 16.7}, {"rotulo": "Não sei opinar", "quantidade": 5, "percentual": 16.7}]}, {"id": "demo-b3_q7", "titulo": "DEMONSTRAÇÃO: Você considera que uma plataforma pública que reúne e possibilite visualizar dados sobre violência obstétrica poderia ser útil para:", "tipo": "multipla", "nota": "Pergunta do formulário da pesquisa. Respostas fictícias para demonstração, não representam participantes reais. É possível marcar mais de uma alternativa, por isso a soma pode ultrapassar 100%.", "base": 30, "elegiveis": 30, "sem_resposta": 0, "excluidas": 0, "itens": [{"rotulo": "Ajudar mulheres a identificar e denunciar situações de violência obstétrica", "quantidade": 22, "percentual": 73.3}, {"rotulo": "Subsidiar políticas públicas de saúde", "quantidade": 16, "percentual": 53.3}, {"rotulo": "Dar visibilidade ao tema para a sociedade em geral", "quantidade": 20, "percentual": 66.7}, {"rotulo": "Apoiar pesquisas acadêmicas e jornalísticas", "quantidade": 12, "percentual": 40.0}, {"rotulo": "Não vejo utilidade clara", "quantidade": 2, "percentual": 6.7}]}, {"id": "demo-b3_q9", "titulo": "DEMONSTRAÇÃO: Você prefere consumir informações em qual formato?", "tipo": "unica", "nota": "Pergunta do formulário da pesquisa. Respostas fictícias para demonstração, não representam participantes reais.", "base": 30, "elegiveis": 30, "sem_resposta": 0, "excluidas": 0, "itens": [{"rotulo": "Gráficos e visualizações interativas", "quantidade": 6, "percentual": 20.0}, {"rotulo": "Textos explicativos", "quantidade": 6, "percentual": 20.0}, {"rotulo": "Infográficos estáticos", "quantidade": 6, "percentual": 20.0}, {"rotulo": "Vídeos ou animações", "quantidade": 6, "percentual": 20.0}, {"rotulo": "Combinação de formatos", "quantidade": 6, "percentual": 20.0}]}]}]};
  function node(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function loadCharts() { return window.carregarApexCharts(); }
  const integer = n => Number.isSafeInteger(n) && n >= 0;
  const safeText = s => typeof s === 'string' && s.length > 0 && s.length <= 1200 && !/[<>]/.test(s);
  function validate(data) {
    if (!data || data.schema_version !== 1 || !Array.isArray(data.grupos)) throw new Error('Formato inválido');
    if (data.status === 'pendente') {
      if (data.grupos.length || data.total_respostas !== null) throw new Error('Estado pendente inválido');
      return;
    }
    if (data.status !== 'disponivel' || !integer(data.total_respostas) || data.total_respostas < 1 ||
        typeof data.atualizado_em !== 'string' || !Number.isFinite(Date.parse(data.atualizado_em)) || !data.grupos.length) throw new Error('Metadados inválidos');
    const ids = new Set();
    let anyData = false;
    data.grupos.forEach(g => {
      if (!safeText(g.id) || ids.has(g.id) || !safeText(g.titulo) || !Array.isArray(g.graficos)) throw new Error('Grupo inválido');
      ids.add(g.id);
      g.graficos.forEach(q => {
        if (!safeText(q.id) || ids.has(q.id) || !safeText(q.titulo) || !safeText(q.nota) || !['unica', 'multipla'].includes(q.tipo) ||
            ![q.base, q.elegiveis, q.sem_resposta, q.excluidas].every(integer) || q.elegiveis > data.total_respostas ||
            q.base + q.sem_resposta + q.excluidas !== q.elegiveis || !Array.isArray(q.itens)) throw new Error('Pergunta inválida');
        ids.add(q.id);
        if (q.base === 0 && q.itens.length || q.base > 0 && !q.itens.length) throw new Error('Base inconsistente');
        const labels = new Set();
        q.itens.forEach(i => {
          if (!safeText(i.rotulo) || labels.has(i.rotulo) || !integer(i.quantidade) || i.quantidade > q.base ||
              !Number.isFinite(i.percentual) || i.percentual < 0 || i.percentual > 100 ||
              Math.abs(i.percentual - i.quantidade / q.base * 100) > 0.051) throw new Error('Indicador inválido');
          labels.add(i.rotulo);
        });
        if (q.tipo === 'unica' && q.itens.reduce((sum, i) => sum + i.quantidade, 0) !== q.base) throw new Error('Total inconsistente');
        if (q.base > 0) anyData = true;
      });
    });
    if (!anyData) throw new Error('Nenhuma resposta válida');
  }
  function table(q) {
    const details = node('details');
    details.appendChild(node('summary', null, 'Consultar tabela de resultados'));
    const t = node('table', 'pesquisa-tabela');
    t.appendChild(node('caption', null, q.titulo + ': base: ' + number.format(q.base) + ' respostas válidas'));
    const head = t.createTHead().insertRow();
    ['Resposta', 'Quantidade', 'Percentual'].forEach(s => {
      const th = node('th', null, s); th.scope = 'col'; head.appendChild(th);
    });
    const body = t.createTBody();
    q.itens.forEach(i => {
      const row = body.insertRow();
      const th = node('th', null, i.rotulo); th.scope = 'row'; row.appendChild(th);
      row.appendChild(node('td', null, number.format(i.quantidade)));
      row.appendChild(node('td', null, number.format(i.percentual) + '%'));
    });
    details.appendChild(t);
    return details;
  }
  async function showGroup(g, button) {
    const current = ++generation;
    instances.splice(0).forEach(chart => chart.destroy());
    area.replaceChildren();
    filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    const group = node('div', 'pesquisa-grupo');
    group.appendChild(node('h3', null, g.titulo));
    area.appendChild(group);
    for (const q of g.graficos) {
      const card = node('article', 'chartbox pesquisa-card');
      card.appendChild(node('h4', null, q.titulo));
      group.appendChild(card);
      if (!q.base) {
        card.appendChild(node('p', 'note', 'Sem respostas válidas disponíveis para esta pergunta.'));
        continue;
      }
      card.appendChild(node('p', 'note', 'Base: ' + number.format(q.base) + ' respostas válidas. Sem resposta: ' + number.format(q.sem_resposta) + '. Não se aplica ou preferiu não responder: ' + number.format(q.excluidas) + '.'));
      card.appendChild(node('p', 'note', q.nota));
      const chartArea = node('div', 'pesquisa-chart');
      chartArea.setAttribute('aria-hidden', 'true'); // A tabela oferece os mesmos dados a leitores de tela.
      card.appendChild(chartArea);
      const dataTable = table(q);
      card.appendChild(dataTable);
      try {
        await loadCharts();
        if (current !== generation) return;
        const chart = new window.ApexCharts(chartArea, {
          chart: { type: 'bar', height: Math.max(260, q.itens.length * 60), fontFamily: 'system-ui, sans-serif', foreColor: '#433858',
            toolbar: { show: false }, animations: { enabled: !window.matchMedia('(prefers-reduced-motion: reduce)').matches } },
          series: [{ name: 'Respostas válidas (%)', data: q.itens.map(i => i.percentual) }],
          colors: ['#6f3fc3'],
          plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '55%' } },
          dataLabels: { enabled: false },
          xaxis: { categories: q.itens.map((i, n) => String(n + 1)), min: 0, max: 100, tickAmount: 4, labels: { formatter: n => number.format(n) + '%' } },
          yaxis: { labels: { maxWidth: 45 } },
          tooltip: { x: { formatter: (_, context) => q.itens[context.dataPointIndex].rotulo },
            y: { formatter: (n, context) => number.format(n) + '% (' + q.itens[context.dataPointIndex].quantidade + ' respostas)' } },
          grid: { borderColor: '#d6cbe8' }
        });
        instances.push(chart);
        await chart.render();
        if (current !== generation) return;
        // Chaves numeradas evitam truncar alternativas longas em telas pequenas.
        const key = node('ol', 'pesquisa-legenda');
        q.itens.forEach(i => key.appendChild(node('li', null, i.rotulo + ': ' + number.format(i.percentual) + '%')));
        chartArea.after(key);
      } catch (_) {
        if (current !== generation) return;
        chartArea.replaceChildren(node('p', 'note', 'O gráfico não pôde ser carregado. Consulte os resultados na tabela abaixo.'));
        dataTable.open = true;
      }
    }
  }
  function renderData(data) {
    ++generation;
    instances.splice(0).forEach(chart => chart.destroy());
    area.replaceChildren();
    filters.replaceChildren();
    content.hidden = false;
    status.hidden = Boolean(realData) || !demoMode;
    document.getElementById('pesquisa-contexto-real').hidden = demoMode;
    document.getElementById('pesquisa-fonte-real').hidden = demoMode;
    const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(data.atualizado_em));
    document.getElementById('pesquisa-resumo').textContent = demoMode
      ? 'DEMONSTRAÇÃO: 30 participantes fictícias, sendo 20 com experiência de parto e 10 profissionais. Exemplos criados somente para testar a interface.'
      : number.format(data.total_respostas) + ' respostas incluídas na análise. Atualização: ' + date + '. Cada pergunta apresenta sua própria base de respostas.';
    data.grupos.forEach((g, index) => {
      const b = node('button', 'seg', g.titulo);
      b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => showGroup(g, b));
      filters.appendChild(b);
      if (!index) showGroup(g, b);
    });
  }
  demoButton.addEventListener('click', () => {
    demoMode = !demoMode;
    demoButton.textContent = demoMode ? 'Sair da demonstração' : 'Ver demonstração';
    demoButton.setAttribute('aria-expanded', String(demoMode));
    demoNotice.hidden = !demoMode;
    if (demoMode) { validate(demonstration); renderData(demonstration); }
    else if (realData) renderData(realData);
    else {
      ++generation;
      instances.splice(0).forEach(chart => chart.destroy());
      area.replaceChildren(); filters.replaceChildren();
      content.hidden = true; status.hidden = false;
    }
  });
  async function init() {
    try {
      const response = await fetch('dados/resultados-pesquisa.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Falha ao carregar JSON');
      const data = await response.json();
      validate(data);
      if (data.status === 'pendente') return;
      realData = data;
      if (!demoMode) renderData(data);

    } catch (_) {
      status.replaceChildren(node('h3', null, 'Resultados temporariamente indisponíveis'), node('p', null,
        location.protocol === 'file:' ? 'Abra o projeto por um servidor local ou pelo endereço publicado para consultar os resultados.' : 'Não foi possível consultar os resultados agora. Tente novamente mais tarde.'));
      if (!demoMode) content.hidden = true;
      status.hidden = false;
    }
  }
  init();
})();
