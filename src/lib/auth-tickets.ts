import * as crypto from 'crypto';

interface TicketPayload {
  secret: string;
  expires: string;
  exp: number;
}

const getEncryptionKey = () => {
  return crypto
    .createHash('sha256')
    .update(process.env.APPWRITE_API_KEY || 'clavis-fallback-token-key-2026')
    .digest();
};

export function storeTicket(secret: string, expires: string): string {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  
  const payload: TicketPayload = {
    secret,
    expires,
    exp: Date.now() + 60000,
  };
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  
  const tag = cipher.getAuthTag();
  
  return `${iv.toString('base64url')}.${ciphertext.toString('base64url')}.${tag.toString('base64url')}`;
}

export function redeemTicket(ticket: string): { secret: string; expires: string } | null {
  try {
    const parts = ticket.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const [ivStr, ciphertextStr, tagStr] = parts;
    
    const iv = Buffer.from(ivStr, 'base64url');
    const ciphertext = Buffer.from(ciphertextStr, 'base64url');
    const tag = Buffer.from(tagStr, 'base64url');
    
    const key = getEncryptionKey();
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    
    const payload = JSON.parse(decrypted.toString('utf8')) as TicketPayload;
    
    if (payload.exp <= Date.now()) {
      return null;
    }
    
    return {
      secret: payload.secret,
      expires: payload.expires,
    };
  } catch (error) {
    return null;
  }
}
