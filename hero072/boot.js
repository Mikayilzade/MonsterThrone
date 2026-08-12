(() => {
  'use strict';
  const files = ['source01.txt','source02.txt','source03.txt','source04a.txt','source04b.txt','source05.txt','source06.txt'];
  const loadStyle=href=>new Promise((resolve,reject)=>{
    if(document.querySelector(`link[href="${href}"]`))return resolve();
    const link=document.createElement('link');link.rel='stylesheet';link.href=href;link.onload=resolve;link.onerror=()=>reject(new Error(`${href}: stylesheet load failed`));document.head.appendChild(link);
  });
  const loadScript=src=>new Promise((resolve,reject)=>{
    if(document.querySelector(`script[src="${src}"]`))return resolve();
    const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(new Error(`${src}: script load failed`));document.head.appendChild(script);
  });
  Promise.all([loadStyle('./hud-layout.css'),loadStyle('./hud-editor.css'),loadStyle('./hud-editor-stabilization.css'),loadStyle('./hud-editor-polish.css')])
    .then(()=>loadScript('./hud-layout.js'))
    .then(()=>loadScript('./hud-editor.js'))
    .then(()=>loadScript('./hud-editor-stabilization.js'))
    .then(()=>loadScript('./hud-editor-polish.js'))
    .then(()=>Promise.all(files.map(name => fetch(`./${name}`).then(r => {
      if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
      return r.text();
    }))))
    .then(parts => {
      // Chunks split identifiers and, in one place, preserve a significant
      // trailing space. Remove line breaks only; String.trim() would turn
      // `const ` + `sk` into the runtime error `constsk`.
      const source = parts.map(part => part.replace(/^[\r\n]+|[\r\n]+$/g,'')).join('');
      Function(`${source}\n//# sourceURL=hero072/game.js`)();
    }).catch(error => {
      console.error(error);
      document.body.innerHTML = `<pre style="white-space:pre-wrap;padding:24px;color:#ffd2d2;background:#180b0d">Ошибка запуска v0.7.2:\n${error.stack || error}</pre>`;
    });
})();
