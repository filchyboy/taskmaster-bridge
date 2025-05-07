// Enhanced polyfill for crypto.getRandomValues in Node.js environments
// This is used as a fallback if the --experimental-global-webcrypto flag is not set

if (typeof global !== 'undefined') {
  const crypto = require('crypto');

  // Create a complete crypto object if it doesn't exist
  if (!global.crypto) {
    global.crypto = {};
  }

  // Add getRandomValues if it doesn't exist
  if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = function(typedArray) {
      if (!ArrayBuffer.isView(typedArray)) {
        throw new TypeError('Expected input to be an ArrayBufferView');
      }

      const bytes = crypto.randomBytes(typedArray.length);

      // Handle different typed arrays
      if (typedArray instanceof Uint8Array) {
        typedArray.set(bytes);
      } else {
        const uint8View = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
        uint8View.set(bytes);
      }

      return typedArray;
    };
  }

  // Add randomUUID if it doesn't exist
  if (!global.crypto.randomUUID) {
    global.crypto.randomUUID = function() {
      return crypto.randomUUID();
    };
  }

  // Add subtle crypto API stub if it doesn't exist
  if (!global.crypto.subtle) {
    global.crypto.subtle = {
      // Add minimal implementation if needed
      digest: async (algorithm, data) => {
        const hash = crypto.createHash(algorithm.toLowerCase().replace('-', ''));
        hash.update(data);
        return hash.digest();
      }
    };
  }

  // Ensure crypto is available in the global scope for browser compatibility
  if (typeof window !== 'undefined' && !window.crypto) {
    window.crypto = global.crypto;
  }
}
