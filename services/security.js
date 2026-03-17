/**
 * Security Utilities Module
 * Provides encryption, validation, and security helpers
 */

const crypto = require('crypto');

// ENCRYPTION CONFIGURATION
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'medcore-secure-key-2026-change-me-prod';
const IV_LENGTH = 16; // For AES, this is always 16

// ════════════════════════════════════════════════════════════
// ENCRYPTION/DECRYPTION UTILITIES
// ════════════════════════════════════════════════════════════

/**
 * Encrypt sensitive data using AES-256-CBC
 * @param {string} text - Data to encrypt
 * @returns {string} - Encrypted data with IV prepended (hex format)
 */
function encryptData(text) {
    try {
        // Create consistent key hash from encryption key
        const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

        // Generate random IV
        const iv = crypto.randomBytes(IV_LENGTH);

        // Create cipher
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Prepend IV to encrypted data (IV doesn't need to be secret)
        return iv.toString('hex') + ':' + encrypted;
    } catch (err) {
        console.error('Encryption error:', err);
        throw new Error('Encryption failed');
    }
}

/**
 * Decrypt data encrypted with encryptData
 * @param {string} encryptedText - Encrypted data with IV prepended
 * @returns {string} - Decrypted data
 */
function decryptData(encryptedText) {
    try {
        // Create consistent key hash from encryption key
        const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

        // Extract IV and encrypted data
        const parts = encryptedText.split(':');
        if (parts.length !== 2) throw new Error('Invalid encrypted format');

        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];

        // Create decipher
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (err) {
        console.error('Decryption error:', err);
        throw new Error('Decryption failed');
    }
}

// ════════════════════════════════════════════════════════════
// PASSWORD VALIDATION
// ════════════════════════════════════════════════════════════

/**
 * Validate password strength
 * Rules:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
function validatePasswordStrength(password) {
    const rules = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const passed = Object.values(rules).filter(r => r).length;
    const strength = passed >= 4 ? 'strong' : passed >= 3 ? 'medium' : 'weak';

    return {
        isValid: passed >= 3, // Require at least 3 rules (removed special char requirement)
        strength,
        rules,
        score: passed
    };
}

// ════════════════════════════════════════════════════════════
// SANITIZATION
// ════════════════════════════════════════════════════════════

/**
 * Sanitize user input to prevent XSS
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj) {
    if (typeof obj === 'string') return sanitizeInput(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    if (obj !== null && typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }
    return obj;
}

// ════════════════════════════════════════════════════════════
// AUDIT LOG HELPERS
// ════════════════════════════════════════════════════════════

/**
 * Create audit log entry
 */
function createAuditLog(req, action, details = {}) {
    return {
        timestamp: new Date(),
        action,
        email: req.body?.email || req.decoded?.email || 'SYSTEM',
        tenantId: req.tenantId || 'SYSTEM',
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        method: req.method,
        endpoint: req.path,
        statusCode: req.statusCode,
        details: sanitizeObject(details),
        success: true
    };
}

// ════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ════════════════════════════════════════════════════════════

/**
 * Generate secure session ID
 */
function generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate token expiry
 */
function isTokenExpired(expiresAt) {
    return new Date() > new Date(expiresAt);
}

// ════════════════════════════════════════════════════════════
// RATE LIMITING HELPERS
// ════════════════════════════════════════════════════════════

const loginAttempts = new Map();
const lockedAccounts = new Map();

/**
 * Track failed login attempt
 */
function recordFailedLogin(email) {
    const key = email;
    const current = loginAttempts.get(key) || { count: 0, timestamp: Date.now() };

    // Reset if > 15 minutes have passed
    if (Date.now() - current.timestamp > 15 * 60 * 1000) {
        loginAttempts.set(key, { count: 1, timestamp: Date.now() });
    } else {
        current.count += 1;
        loginAttempts.set(key, current);
    }

    // Lock account after 5 failed attempts
    if (current.count >= 5) {
        lockedAccounts.set(key, Date.now() + 30 * 60 * 1000); // 30 min lock
    }

    return current.count;
}

/**
 * Clear failed login attempts on successful login
 */
function clearFailedLoginAttempts(email) {
    loginAttempts.delete(email);
}

/**
 * Check if account is locked
 */
function isAccountLocked(email) {
    const lockTime = lockedAccounts.get(email);
    if (!lockTime) return false;

    if (Date.now() > lockTime) {
        lockedAccounts.delete(email);
        return false;
    }

    return true;
}

/**
 * Get remaining lock time in seconds
 */
function getLockTimeRemaining(email) {
    const lockTime = lockedAccounts.get(email);
    if (!lockTime) return 0;

    const remaining = lockTime - Date.now();
    return Math.ceil(remaining / 1000);
}

// ════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════

module.exports = {
    encryptData,
    decryptData,
    validatePasswordStrength,
    sanitizeInput,
    sanitizeObject,
    createAuditLog,
    generateSessionId,
    isTokenExpired,
    recordFailedLogin,
    clearFailedLoginAttempts,
    isAccountLocked,
    getLockTimeRemaining
};
