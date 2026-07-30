(() => {
  'use strict';
  const files = ['source01.txt','source02.txt','source03.txt','source04a.txt','source04b.txt','source05.txt','source06.txt'];
  Promise.all(files.map(name => fetch(`./${name}`).then(r => {
    if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
    return r.text();
  }))).then(parts => {
    // Source chunks intentionally split some tokens; trim only their outer
    // line breaks so a static server and every browser rebuild the exact file.
    const source = parts.map(part => part.trim()).join('');
    Function(`${source}\n//# sourceURL=hero072/game.js`)();
  }).catch(error => {
    console.error(error);
    document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:24px;color:#ffd2d2;background:#180b0d">Ошибка запуска v0.7.2:\n${error.stack || error}</pre>`;
  });
})();
