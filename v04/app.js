(function (g) {
  'use strict';
  function bytesFromBase64(encoded) {
    const binary = atob(encoded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }
  async function load() {
    await g.MonsterWorldV04Ready;
    if (typeof DecompressionStream !== 'function') throw new Error('This browser needs DecompressionStream support');
    const encoded = (g.__monsterV04AppGzip || []).join('');
    delete g.__monsterV04AppGzip;
    const bytes = bytesFromBase64(encoded);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const source = await new Response(stream).text();
    (0, eval)(source);
  }
  g.MonsterWorldV04AppReady = load();
})(typeof globalThis !== 'undefined' ? globalThis : self);
