(function () {
  'use strict';
  let loading;
  window.carregarApexCharts = function () {
    if (window.ApexCharts) return Promise.resolve();
    if (!loading) loading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => reject(new Error('Tempo de carregamento excedido')), 15000);
      script.src = 'vendor/apexcharts.min.js';
      script.onload = () => { clearTimeout(timer); window.ApexCharts ? resolve() : reject(new Error('Gráficos indisponíveis')); };
      script.onerror = () => { clearTimeout(timer); reject(new Error('Gráficos indisponíveis')); };
      document.head.appendChild(script);
    });
    return loading;
  };
})();
