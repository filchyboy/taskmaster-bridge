// Polyfill for crypto.getRandomValues in Node.js environments
// This is used as a fallback if the --experimental-global-webcrypto flag is not set

if (typeof global !== 'undefined' && (!global.crypto || !global.crypto.getRandomValues)) {
  const crypto = require('crypto');
  
  global.crypto = {
    ...global.crypto,
    getRandomValues: function(typedArray) {
      if (!ArrayBuffer.isView(typedArray)) {
        throw new TypeError('Expected input to be an ArrayBufferView');
      }
      
      const bytes = crypto.randomBytes(typedArray.length);
      typedArray.set(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength));
      return typedArray;
    }
  };
}
