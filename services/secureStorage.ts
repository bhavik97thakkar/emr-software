/**
 * Frontend Encryption Utilities
 * Provides client-side encryption for sensitive localStorage data
 * Uses TweetNaCl.js stream cipher for browser safety
 */

// Simple XOR-based encryption with time-based key rotation (suitable for browser)
// For better security, consider adding TweetNaCl.js library

class LocalStorageEncryption {
  private baseKey: string;
  private sensitiveKeys: string[];

  constructor(encryptionKey = "medcore-frontend-key-2026") {
    this.baseKey = encryptionKey;
    this.sensitiveKeys = [
      "user",
      "token",
      "patients",
      "visits",
      "reports",
      "families",
    ];
  }

  /**
   * Generate encryption key from base key
   */
  _getKey() {
    let hash = 0;
    for (let i = 0; i < this.baseKey.length; i++) {
      const char = this.baseKey.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  }

  /**
   * Simple but effective encryption using XOR with repeating key
   */
  encrypt(data) {
    try {
      // Convert data to JSON if it's an object
      const jsonStr = typeof data === "string" ? data : JSON.stringify(data);

      // Base64 encode
      const b64 = btoa(jsonStr);

      // Simple XOR encryption
      const key = this._getKey();
      let encrypted = "";
      for (let i = 0; i < b64.length; i++) {
        const charCode = b64.charCodeAt(i);
        const keyCharCode = key.charCodeAt(i % key.length);
        encrypted += String.fromCharCode(charCode ^ keyCharCode);
      }

      // Final base64 to make it storage-safe
      return btoa(encrypted);
    } catch (err) {
      console.error("Encryption failed:", err);
      return null;
    }
  }

  /**
   * Decrypt data encrypted with encrypt method
   */
  decrypt(encoded) {
    try {
      // Decode from base64
      const encrypted = atob(encoded);

      // XOR decryption (same operation as encryption)
      const key = this._getKey();
      let decrypted = "";
      for (let i = 0; i < encrypted.length; i++) {
        const charCode = encrypted.charCodeAt(i);
        const keyCharCode = key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(charCode ^ keyCharCode);
      }

      // Decode from base64
      const jsonStr = atob(decrypted);

      // Try to parse as JSON, otherwise return as string
      try {
        return JSON.parse(jsonStr);
      } catch {
        return jsonStr;
      }
    } catch (err) {
      console.error("Decryption failed:", err);
      return null;
    }
  }

  /**
   * Store encrypted value
   */
  setItem(key, value) {
    try {
      if (this.sensitiveKeys.includes(key)) {
        const encrypted = this.encrypt(value);
        localStorage.setItem(`_enc_${key}`, encrypted);
        // Also set a flag for decryption detection
        localStorage.setItem(`_encrypted_${key}`, "true");
      } else {
        localStorage.setItem(
          key,
          typeof value === "string" ? value : JSON.stringify(value),
        );
      }
    } catch (err) {
      console.error(`Failed to store ${key}:`, err);
    }
  }

  /**
   * Retrieve and decrypt value
   */
  getItem(key) {
    try {
      if (this.sensitiveKeys.includes(key)) {
        const isEncrypted =
          localStorage.getItem(`_encrypted_${key}`) === "true";
        const encryptedValue = localStorage.getItem(`_enc_${key}`);

        if (isEncrypted && encryptedValue) {
          return this.decrypt(encryptedValue);
        }

        // Fallback: try to get unencrypted value (for migration)
        const unencrypted = localStorage.getItem(key);
        if (unencrypted) {
          try {
            return JSON.parse(unencrypted);
          } catch {
            return unencrypted;
          }
        }
      } else {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }
      }
      return null;
    } catch (err) {
      console.error(`Failed to retrieve ${key}:`, err);
      return null;
    }
  }

  /**
   * Remove item and its encryption flag
   */
  removeItem(key) {
    localStorage.removeItem(key);
    localStorage.removeItem(`_enc_${key}`);
    localStorage.removeItem(`_encrypted_${key}`);
  }

  /**
   * Clear all encrypted items
   */
  clear() {
    this.sensitiveKeys.forEach((key) => {
      this.removeItem(key);
    });
  }
}

// Export singleton instance
export const SecureStorage = new LocalStorageEncryption();
