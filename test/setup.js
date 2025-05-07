// Robust polyfill for Web Crypto API in Node.js environments
// This ensures compatibility across different Node.js versions

// First, try to directly access the crypto module
let nodeCrypto;
try {
  nodeCrypto = require('crypto');
} catch (e) {
  console.warn('Node.js crypto module not available');
}

// Define a robust polyfill for the Web Crypto API
function setupWebCrypto() {
  // Skip if we're in a browser environment that already has crypto
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    return;
  }

  // Create or get the global crypto object
  if (typeof global !== 'undefined') {
    if (!global.crypto) {
      global.crypto = {};
    }

    // Implement getRandomValues if it doesn't exist
    if (!global.crypto.getRandomValues) {
      global.crypto.getRandomValues = function(typedArray) {
        if (!ArrayBuffer.isView(typedArray)) {
          throw new TypeError('Expected input to be an ArrayBufferView');
        }

        if (!nodeCrypto) {
          throw new Error('Node.js crypto module is required for getRandomValues polyfill');
        }

        // Generate random bytes
        const bytes = nodeCrypto.randomBytes(typedArray.length);

        // Copy bytes to the typed array
        if (typedArray instanceof Uint8Array) {
          for (let i = 0; i < bytes.length; i++) {
            typedArray[i] = bytes[i];
          }
        } else {
          const uint8View = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
          for (let i = 0; i < bytes.length; i++) {
            uint8View[i] = bytes[i];
          }
        }

        return typedArray;
      };
    }

    // Implement randomUUID if it doesn't exist
    if (!global.crypto.randomUUID) {
      global.crypto.randomUUID = function() {
        if (!nodeCrypto) {
          throw new Error('Node.js crypto module is required for randomUUID polyfill');
        }

        if (typeof nodeCrypto.randomUUID === 'function') {
          return nodeCrypto.randomUUID();
        } else {
          // Fallback for older Node.js versions
          const bytes = nodeCrypto.randomBytes(16);
          bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
          bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10

          return [
            bytes.slice(0, 4).toString('hex'),
            bytes.slice(4, 6).toString('hex'),
            bytes.slice(6, 8).toString('hex'),
            bytes.slice(8, 10).toString('hex'),
            bytes.slice(10, 16).toString('hex')
          ].join('-');
        }
      };
    }

    // Implement subtle crypto if it doesn't exist
    if (!global.crypto.subtle) {
      global.crypto.subtle = {
        digest: async (algorithm, data) => {
          if (!nodeCrypto) {
            throw new Error('Node.js crypto module is required for subtle.digest polyfill');
          }

          const algoName = typeof algorithm === 'string'
            ? algorithm
            : algorithm.name;

          const nodeAlgo = algoName.toLowerCase().replace('-', '');
          const hash = nodeCrypto.createHash(nodeAlgo);

          // Handle different input types
          if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
            const buffer = ArrayBuffer.isView(data)
              ? Buffer.from(data.buffer, data.byteOffset, data.byteLength)
              : Buffer.from(data);
            hash.update(buffer);
          } else {
            hash.update(data);
          }

          const result = hash.digest();
          return result.buffer.slice(
            result.byteOffset,
            result.byteOffset + result.byteLength
          );
        }
      };
    }
  }
}

// Run the setup
setupWebCrypto();

// Log confirmation
console.log('Web Crypto API polyfill initialized');
