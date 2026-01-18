// TOTP (Time-based One-Time Password) implementation
// RFC 6238: https://tools.ietf.org/html/rfc6238

const TOTP = {
  // Base32 decoding
  base32Decode(base32) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let hex = [];
    
    // Remove spaces and convert to uppercase
    base32 = base32.replace(/\s/g, '').toUpperCase();
    
    for (let i = 0; i < base32.length; i++) {
      const val = alphabet.indexOf(base32.charAt(i));
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      hex.push(parseInt(bits.substr(i, 8), 2));
    }
    
    return new Uint8Array(hex);
  },

  // HMAC implementation (supports SHA-1, SHA-256, SHA-512)
  async hmac(key, message, algorithm = 'SHA-1') {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: algorithm },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
    return new Uint8Array(signature);
  },

  // Generate TOTP
  async generate(secret, options = {}) {
    const {
      digits = 6,
      period = 60,
      algorithm = 'SHA-256',
      timestamp = Date.now()
    } = options;

    // Decode the base32 secret
    const key = this.base32Decode(secret);
    
    // Calculate the time counter
    const counter = Math.floor(timestamp / 1000 / period);
    
    // Convert counter to 8-byte buffer
    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setBigUint64(0, BigInt(counter), false);
    
    // Calculate HMAC
    const hmac = await this.hmac(key, new Uint8Array(counterBuffer), algorithm);
    
    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary = 
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    
    // Generate OTP
    const otp = binary % Math.pow(10, digits);
    return otp.toString().padStart(digits, '0');
  },

  // Get remaining seconds until next code
  getRemainingSeconds(period = 60) {
    return period - (Math.floor(Date.now() / 1000) % period);
  }
};

// Make available globally
window.TOTP = TOTP;
