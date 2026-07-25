(function (g) {
  'use strict';
  function showRuntimeError(error) {
    const text = String(error && error.stack || error || 'Неизвестная ошибка');
    let box = document.getElementById('runtimeErrorBox');
    if (!box) {
      box = document.createElement('pre');
      box.id = 'runtimeErrorBox';
      box.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;max-height:35vh;overflow:auto;margin:0;padding:12px;border:1px solid #ff7b7b;border-radius:10px;background:rgba(35,5,8,.96);color:#ffd9d9;font:12px/1.4 Consolas,monospace;white-space:pre-wrap;user-select:text';
      document.body.appendChild(box);
    }
    box.textContent = 'Ошибка демоверсии:\n' + text;
  }
  g.addEventListener('error', (event) => showRuntimeError(event.error || event.message));
  g.addEventListener('unhandledrejection', (event) => showRuntimeError(event.reason));
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
    // Render helpers used by the UI bundle must also exist in the global scope.
    g.TAU = Math.PI * 2;
    g.dist = g.MonsterHeroGame.helpers.dist;
    (0, eval)(data.app);
  }
  g.MonsterHeroDemoReady = boot().catch((error) => {
    console.error(error);
    document.body.innerHTML = `<div style="padding:30px;font:16px system-ui;color:white;background:#071017;min-height:100vh"><h2>Демо не запустилось</h2><pre style="white-space:pre-wrap">${String(error && error.stack || error)}</pre></div>`;
  });
})(typeof globalThis !== 'undefined' ? globalThis : self);
