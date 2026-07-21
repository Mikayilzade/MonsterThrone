(function (g) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    require('./core.payload1.js');
    require('./core.payload2.js');
    require('./core.payload3.js');
  }
  function bytesFromBase64(encoded) {
    if (typeof Buffer !== 'undefined' && typeof window === 'undefined') return Uint8Array.from(Buffer.from(encoded, 'base64'));
    const binary = atob(encoded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }
  async function browserLoad(encoded) {
    if (typeof DecompressionStream !== 'function') throw new Error('This browser needs DecompressionStream support');
    const bytes = bytesFromBase64(encoded);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const source = await new Response(stream).text();
    (0, eval)(source);
    return g.MonsterWorldV04;
  }
  const encoded = (g.__monsterV04CoreGzip || []).join('');
  delete g.__monsterV04CoreGzip;
  if (typeof module === 'object' && module.exports) {
    const zlib = require('zlib');
    const source = zlib.gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
    const local = { exports: {} };
    const run = new Function('module', 'exports', 'require', 'globalThis', `${source}\n;return module.exports;`);
    module.exports = run(local, local.exports, require, g);
  } else {
    g.MonsterWorldV04Ready = browserLoad(encoded);
  }
})(typeof globalThis !== 'undefined' ? globalThis : self);
