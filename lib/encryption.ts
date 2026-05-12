import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Ensure ENCRYPTION_KEY is a 32-byte (64 character hex) string in production
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/**
 * Encrypts a plain text string using AES-256-CBC.
 */
export function encrypt(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    ALGORITHM, 
    Buffer.from(ENCRYPTION_KEY, 'hex'), 
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-CBC encrypted string.
 * Returns the original text if it's not in the expected encrypted format.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    // Return original if not encrypted (useful for backward compatibility during rollout)
    return encryptedText;
  }
  
  const [ivHex, encrypted] = parts;
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      Buffer.from(ENCRYPTION_KEY, 'hex'), 
      iv
    );
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error("[Encryption] Failed to decrypt text", error);
    return encryptedText;
  }
}
