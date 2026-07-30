(() => {
  'use strict';
  const files = ['game.part01.txt','game.part02.txt','game.part03.txt','game.part04.txt','game.part05.txt'];
  Promise.all(files.map(name => fetch(`./${name}`).then(r => {
    if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
    return r.text();
  }))).then(parts => {
    const source = parts.join('');
    Function(`${source}\n//# sourceURL=hero072/game.js`)();
  }).catch(error => {
    console.error(error);
    document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:24px;color:#ffd2d2;background:#180b0d">Ошибка запуска v0.7.2:\n${error.stack || error}</pre>`;
  });
})();
