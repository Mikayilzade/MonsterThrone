(function (g) {
  'use strict';
  async function boot() {
    if (typeof DecompressionStream !== 'function') {
      document.body.innerHTML = '<div style="padding:30px;font:16px system-ui;color:white;background:#071017;min-height:100vh">Нужен современный Chrome, Edge или Safari с поддержкой DecompressionStream.</div>';
      return;
    }
    const encoded = (g.__monsterHeroDemoBundleParts || []).join('');
    delete g.__monsterHeroDemoBundleParts;
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const data = JSON.parse(await new Response(stream).text());
    const style = document.createElement('style');
    style.textContent = data.css;
    document.head.appendChild(style);
    (0, eval)(data.config);
    (0, eval)(data.game);
    (0, eval)(data.app);
  }
  g.MonsterHeroDemoReady = boot().catch((error) => {
    console.error(error);
    document.body.innerHTML = `<div style="padding:30px;font:16px system-ui;color:white;background:#071017;min-height:100vh"><h2>Демо не запустилось</h2><pre style="white-space:pre-wrap">${String(error && error.stack || error)}</pre></div>`;
  });
})(typeof globalThis !== 'undefined' ? globalThis : self);
