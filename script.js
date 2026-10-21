(function () {
  'use strict';

  var D = window.DADOS;
  if (!D) { return; }

  var reduzir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var chavesFontes = Object.keys(D.fontes);

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (txt != null) { e.textContent = txt; }
    return e;
  }
  function fmt(n) { return String(n).replace('.', ','); }
  function limpar(node) { while (node.firstChild) { node.removeChild(node.firstChild); } }

  function linkFonte(fid) {
    var a = el('a', 'src', D.fontes[fid].curta + ' [' + (chavesFontes.indexOf(fid) + 1) + ']');
    a.href = '#fonte-' + fid;
    return a;
  }
  function listaFontes(ids, prefixo) {
    var span = el('span');
    if (!ids || !ids.length) { return span; }
    if (prefixo) { span.appendChild(document.createTextNode(prefixo)); }
    ids.forEach(function (fid, i) {
      if (i > 0) { span.appendChild(document.createTextNode(', ')); }
      span.appendChild(linkFonte(fid));
    });
    return span;
  }

  var io = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.2 })
    : null;

  function revelar(box) {
    if (reduzir || !io) { box.classList.add('in'); } else { io.observe(box); }
  }

  function desenharGrafico(box, vista) {
    box.classList.remove('in');
    limpar(box);
    var max = vista.max || 100;
    var unidade = vista.unidade || '';

    vista.linhas.forEach(function (r) {
      var row = el('div', 'crow');
      row.appendChild(el('span', 'clbl', r.l));
      var bars = el('div', 'cbars');
      var series = r.series || [{ n: '', v: r.v, c: r.c }];

      series.forEach(function (s) {
        var track = el('div', 'ctrack');

        if (vista.ref) {
          var rf = el('i', 'cref');
          rf.style.left = (vista.ref[0] / max * 100) + '%';
          rf.style.width = ((vista.ref[1] - vista.ref[0]) / max * 100) + '%';
          rf.setAttribute('aria-hidden', 'true');
          track.appendChild(rf);
        }

        var pct = Math.min(100, s.v / max * 100);
        var valor = fmt(s.v) + (vista.sufixo || '');
        var texto = r.l + (s.n ? ' (' + s.n + ')' : '') + ': ' + valor + unidade;

        var bar = el('div', 'cbar' + (pct < 18 ? ' out' : ''));
        bar.style.setProperty('--w', pct + '%');
        bar.style.setProperty('--c', s.c || vista.cor || '#6f3fc3');
        bar.setAttribute('role', 'img');
        bar.setAttribute('tabindex', '0');
        bar.setAttribute('aria-label', texto);
        bar.appendChild(el('b', null, valor));
        var tip = el('span', 'tip', texto);
        tip.setAttribute('aria-hidden', 'true');
        bar.appendChild(tip);

        track.appendChild(bar);
        bars.appendChild(track);
      });

      row.appendChild(bars);
      box.appendChild(row);
    });

    revelar(box);
  }

  function desenharLista(box, vista) {
    limpar(box);
    var ol = el('ol', 'lista');
    vista.itens.forEach(function (it) {
      var li = el('li', it.br ? 'br' : '');
      li.appendChild(el('span', 'lano', it.ano));
      var corpo = el('div', 'lcorpo');
      corpo.appendChild(el('strong', null, it.p));
      corpo.appendChild(el('span', null, it.t));
      li.appendChild(corpo);
      ol.appendChild(li);
    });
    box.appendChild(ol);
  }

  function mostrarVista(id, chave) {
    var p = D.paineis[id];
    var v = p.vistas[chave];
    var root = document.getElementById('painel-' + id);
    root.dataset.vista = chave;

    root.querySelectorAll('.seg').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.vista === chave ? 'true' : 'false');
    });

    root.querySelector('.ctitle').textContent = v.titulo;

    var leg = root.querySelector('.cleg');
    limpar(leg);
    (v.legenda || []).forEach(function (l) {
      var s = el('span');
      var i = el('i');
      i.style.background = l.c;
      s.appendChild(i);
      s.appendChild(document.createTextNode(l.n));
      leg.appendChild(s);
    });
    if (v.ref) {
      var k = el('span', 'refkey');
      k.appendChild(el('i'));
      k.appendChild(document.createTextNode(v.refRotulo));
      leg.appendChild(k);
    }

    var area = root.querySelector('.chart');
    if (v.tipo === 'lista') { desenharLista(area, v); } else { desenharGrafico(area, v); }

    root.querySelector('.cnota').textContent = v.nota;

    var f = root.querySelector('.cfonte');
    limpar(f);
    f.appendChild(listaFontes(v.fontes, 'Fonte: '));
  }

  function montarPainel(id) {
    var p = D.paineis[id];
    var root = document.getElementById('painel-' + id);

    if (!root.dataset.pronto) {
      root.dataset.pronto = '1';

      root.appendChild(el('h3', 'ptitle', p.titulo));
      root.appendChild(el('p', 'plede', p.lede));

      if (p.stats) {
        var st = el('div', 'hstats compact');
        p.stats.forEach(function (s) {
          var d = el('div', 'hstat');
          d.style.setProperty('--c', s.c);
          d.style.setProperty('--n', s.n);
          d.appendChild(el('div', 'n', s.r));
          d.appendChild(el('p', null, s.t));
          d.appendChild(listaFontes(s.fontes));
          st.appendChild(d);
        });
        root.appendChild(st);
      }

      if (p.aviso) {
        var av = el('div', 'aviso');
        av.appendChild(document.createTextNode(p.aviso + ' '));
        av.appendChild(listaFontes(p.avisoFontes));
        root.appendChild(av);
      }

      if (p.cards) {
        var grid = el('div', 'types');
        p.cards.forEach(function (c) {
          var art = el('article', 'tcard');
          art.style.setProperty('--c', c.c);
          art.appendChild(el('h3', null, c.t));
          art.appendChild(el('p', 'desc', c.d));
          var det = el('details');
          det.appendChild(el('summary', null, p.rotuloMais || 'Saiba mais'));
          var txt = el('p', null, c.mais + ' ');
          txt.appendChild(listaFontes(c.fontes));
          det.appendChild(txt);
          art.appendChild(det);
          grid.appendChild(art);
        });
        root.appendChild(grid);
      }

      if (p.vistas) {
        var box = el('div', 'chartbox');
        var chaves = Object.keys(p.vistas);
        if (chaves.length > 1) {
          var ctrl = el('div', 'ctrl');
          ctrl.setAttribute('role', 'group');
          ctrl.setAttribute('aria-label', 'Escolher visão');
          chaves.forEach(function (k) {
            var b = el('button', 'seg', p.vistas[k].rotulo);
            b.type = 'button';
            b.dataset.vista = k;
            b.setAttribute('aria-pressed', 'false');
            b.addEventListener('click', function () { mostrarVista(id, k); });
            ctrl.appendChild(b);
          });
          box.appendChild(ctrl);
        }
        box.appendChild(el('h4', 'ctitle'));
        box.appendChild(el('div', 'cleg'));
        box.appendChild(el('div', 'chart'));
        box.appendChild(el('p', 'cnota'));
        box.appendChild(el('p', 'cfonte'));
        root.appendChild(box);
      }
    }

    if (p.vistas) { mostrarVista(id, root.dataset.vista || p.vistaPadrao); }
  }

  var abas = Array.prototype.slice.call(document.querySelectorAll('.tab'));

  function ativarAba(tab) {
    abas.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    montarPainel(tab.dataset.painel);
  }

  abas.forEach(function (t, i) {
    t.addEventListener('click', function () { ativarAba(t); });
    t.addEventListener('keydown', function (e) {
      var j = null;
      if (e.key === 'ArrowRight') { j = (i + 1) % abas.length; }
      else if (e.key === 'ArrowLeft') { j = (i - 1 + abas.length) % abas.length; }
      else if (e.key === 'Home') { j = 0; }
      else if (e.key === 'End') { j = abas.length - 1; }
      if (j !== null) {
        e.preventDefault();
        ativarAba(abas[j]);
        abas[j].focus();
      }
    });
  });

  if (abas.length) { ativarAba(abas[0]); }

  var glos = document.getElementById('glossario');
  var glosBtn = document.getElementById('glos-toggle');

  D.glossario.forEach(function (g) {
    var det = el('details', 'gitem');
    det.appendChild(el('summary', null, g.t));
    det.appendChild(el('p', null, g.d));
    glos.appendChild(det);
  });

  glosBtn.addEventListener('click', function () {
    var abrir = glosBtn.getAttribute('aria-pressed') !== 'true';
    glos.querySelectorAll('details').forEach(function (d) { d.open = abrir; });
    glosBtn.setAttribute('aria-pressed', abrir ? 'true' : 'false');
    glosBtn.textContent = abrir ? 'Fechar todas' : 'Abrir todas';
  });

  var canais = document.getElementById('canais');
  D.canais.forEach(function (c) {
    var d = el(c.url ? 'a' : 'div', 'channel');
    if (c.url) { d.href = c.url; d.target = '_blank'; d.rel = 'noopener noreferrer'; d.setAttribute('aria-label', c.n + ', ' + c.d + ' (abre em nova aba)'); }
    d.appendChild(el('strong', null, c.n));
    d.appendChild(el('span', null, c.d));
    canais.appendChild(d);
  });

  var lista = document.getElementById('lista-fontes');
  chavesFontes.forEach(function (k) {
    var f = D.fontes[k];
    var li = el('li');
    li.id = 'fonte-' + k;
    li.appendChild(document.createTextNode(f.completa + ' '));
    var a = el('a', null, f.url);
    a.href = f.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    li.appendChild(a);
    lista.appendChild(li);
  });

  var btn = document.getElementById('menu-btn');
  var menu = document.getElementById('menu');

  function fecharMenu() {
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menu');
  }
  btn.addEventListener('click', function () {
    var aberto = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    btn.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
  });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', fecharMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { fecharMenu(); } });

  if ('IntersectionObserver' in window) {
    var links = {};
    menu.querySelectorAll('a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var secoes = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        Object.keys(links).forEach(function (k) {
          var on = k === e.target.id;
          links[k].classList.toggle('ativo', on);
          if (on) { links[k].setAttribute('aria-current', 'true'); } else { links[k].removeAttribute('aria-current'); }
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(links).forEach(function (k) {
      var s = document.getElementById(k);
      if (s) { secoes.observe(s); }
    });
  }
})();