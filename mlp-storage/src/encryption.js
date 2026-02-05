/**
 * Encryption - Handle encryption/decryption for MLP
 * 
 * Uses NaCl (TweetNaCl) for symmetric encryption.
 */

import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { dirname, join } from 'path';
import { createHash, randomBytes } from 'crypto';

export class Encryption {
  constructor(config) {
    this.keyPath = config.key_path?.replace('~', process.env.HOME) || 
                   join(process.env.HOME, '.config/mlp/keys');
    this.algorithm = config.algorithm || 'xchacha20-poly1305';
    this.nacl = null;
    this.naclUtil = null;
    this.secretKey = null;
  }

  /**
   * Initialize encryption (load NaCl and keys)
   */
  async init() {
    if (!this.nacl) {
      // Dynamic import
      const nacl = await import('tweetnacl');
      const naclUtil = await import('tweetnacl-util');
      this.nacl = nacl.default || nacl;
      this.naclUtil = naclUtil.default || naclUtil;
    }
    
    await this.loadOrCreateKey();
  }

  /**
   * Ensure encryption keys exist
   */
  async ensureKeys() {
    await this.init();
    return this.keysExist();
  }

  /**
   * Check if keys exist
   */
  async keysExist() {
    try {
      await access(join(this.keyPath, 'secret.key'));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load or create encryption key
   */
  async loadOrCreateKey() {
    const keyFile = join(this.keyPath, 'secret.key');
    
    try {
      const keyData = await readFile(keyFile, 'utf8');
      this.secretKey = this.naclUtil.decodeBase64(keyData.trim());
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Generate new key
        await mkdir(this.keyPath, { recursive: true });
        this.secretKey = this.nacl.randomBytes(this.nacl.secretbox.keyLength);
        await writeFile(keyFile, this.naclUtil.encodeBase64(this.secretKey));
        
        // Set restrictive permissions
        const { chmod } = await import('fs/promises');
        await chmod(keyFile, 0o600);
      } else {
        throw err;
      }
    }
  }

  /**
   * Encrypt data
   */
  async encrypt(data) {
    if (!this.secretKey) {
      await this.init();
    }
    
    const message = this.naclUtil.decodeUTF8(JSON.stringify(data));
    const nonce = this.nacl.randomBytes(this.nacl.secretbox.nonceLength);
    const encrypted = this.nacl.secretbox(message, nonce, this.secretKey);
    
    return {
      nonce: this.naclUtil.encodeBase64(nonce),
      ciphertext: this.naclUtil.encodeBase64(encrypted),
      algorithm: this.algorithm
    };
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData) {
    if (!this.secretKey) {
      await this.init();
    }
    
    const nonce = this.naclUtil.decodeBase64(encryptedData.nonce);
    const ciphertext = this.naclUtil.decodeBase64(encryptedData.ciphertext);
    
    const decrypted = this.nacl.secretbox.open(ciphertext, nonce, this.secretKey);
    
    if (!decrypted) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
    
    const message = this.naclUtil.encodeUTF8(decrypted);
    return JSON.parse(message);
  }

  /**
   * Hash data (for verification, not encryption)
   */
  hash(data) {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Generate a new keypair for signing
   */
  async generateSigningKeypair() {
    if (!this.nacl) {
      await this.init();
    }
    
    return this.nacl.sign.keyPair();
  }

  /**
   * Sign data
   * If no secretKey provided, uses stored signing key
   */
  async sign(data, secretKey) {
    if (!this.nacl) {
      await this.init();
    }
    
    // If no key provided, load or create one
    if (!secretKey) {
      secretKey = await this.getSigningKey();
    }
    
    const message = this.naclUtil.decodeUTF8(JSON.stringify(data));
    const signature = this.nacl.sign.detached(message, secretKey);
    
    return this.naclUtil.encodeBase64(signature);
  }

  /**
   * Get or create signing keypair
   */
  async getSigningKey() {
    const signingKeyFile = join(this.keyPath, 'signing.key');
    
    try {
      const keyData = await readFile(signingKeyFile, 'utf8');
      return this.naclUtil.decodeBase64(keyData.trim());
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Generate new signing keypair
        const keypair = this.nacl.sign.keyPair();
        await mkdir(this.keyPath, { recursive: true });
        await writeFile(signingKeyFile, this.naclUtil.encodeBase64(keypair.secretKey));
        await writeFile(join(this.keyPath, 'signing.pub'), this.naclUtil.encodeBase64(keypair.publicKey));
        
        const { chmod } = await import('fs/promises');
        await chmod(signingKeyFile, 0o600);
        
        return keypair.secretKey;
      }
      throw err;
    }
  }

  /**
   * Get public key for verification
   */
  async getPublicKey() {
    const pubKeyFile = join(this.keyPath, 'signing.pub');
    
    try {
      const keyData = await readFile(pubKeyFile, 'utf8');
      return this.naclUtil.decodeBase64(keyData.trim());
    } catch {
      // Generate if missing
      await this.getSigningKey();
      const keyData = await readFile(pubKeyFile, 'utf8');
      return this.naclUtil.decodeBase64(keyData.trim());
    }
  }

  /**
   * Verify signature
   */
  async verify(data, signature, publicKey) {
    if (!this.nacl) {
      await this.init();
    }
    
    const message = this.naclUtil.decodeUTF8(JSON.stringify(data));
    const sig = this.naclUtil.decodeBase64(signature);
    
    return this.nacl.sign.detached.verify(message, sig, publicKey);
  }
}

export default Encryption;
