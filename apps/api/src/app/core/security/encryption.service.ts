import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

export interface EncryptionResult {
  encryptedData: string;
  iv: string;
  tag: string;
}

export interface KeyRotationInfo {
  keyId: string;
  algorithm: string;
  createdAt: Date;
  rotatedAt?: Date;
  status: 'active' | 'rotating' | 'deprecated';
}

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits

  private currentKeyId: string;
  private encryptionKeys = new Map<string, Buffer>();
  private keyRotationInterval = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(private configService: ConfigService) {
    this.initializeEncryption();
    this.startKeyRotationScheduler();
  }

  private initializeEncryption(): void {
    // Load master key from environment or key management service
    const masterKey = this.configService.get<string>('ENCRYPTION_MASTER_KEY');
    
    if (!masterKey) {
      this.logger.warn('No master encryption key found, generating new key');
      const newKey = this.generateEncryptionKey();
      this.currentKeyId = 'key_' + Date.now();
      this.encryptionKeys.set(this.currentKeyId, newKey);
    } else {
      this.currentKeyId = 'master_key';
      this.encryptionKeys.set(this.currentKeyId, Buffer.from(masterKey, 'hex'));
    }

    this.logger.log('Encryption service initialized');
  }

  async encrypt(data: string, keyId?: string): Promise<EncryptionResult> {
    try {
      const useKeyId = keyId || this.currentKeyId;
      const key = this.encryptionKeys.get(useKeyId);

      if (!key) {
        throw new Error(`Encryption key not found: ${useKeyId}`);
      }

      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from(useKeyId)); // Use keyId as additional authenticated data

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      this.logger.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  async decrypt(encryptedData: string, iv: string, tag: string, keyId?: string): Promise<string> {
    try {
      const useKeyId = keyId || this.currentKeyId;
      const key = this.encryptionKeys.get(useKeyId);

      if (!key) {
        throw new Error(`Decryption key not found: ${useKeyId}`);
      }

      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(Buffer.from(useKeyId));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));

      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  async encryptPII(data: any): Promise<string> {
    // Encrypt personally identifiable information with special handling
    const serialized = JSON.stringify(data);
    const result = await this.encrypt(serialized);
    
    // Combine all components into a single string for storage
    return `${this.currentKeyId}:${result.iv}:${result.tag}:${result.encryptedData}`;
  }

  async decryptPII(encryptedString: string): Promise<any> {
    try {
      const parts = encryptedString.split(':');
      if (parts.length !== 4) {
        throw new Error('Invalid encrypted PII format');
      }

      const [keyId, iv, tag, encryptedData] = parts;
      const decrypted = await this.decrypt(encryptedData, iv, tag, keyId);
      
      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('PII decryption failed:', error);
      throw new Error('PII decryption failed');
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateSecureToken(length: number = 32): Promise<string> {
    return crypto.randomBytes(length).toString('hex');
  }

  async generateApiKey(): Promise<string> {
    const prefix = 'amysoft_';
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(16).toString('hex');
    
    return `${prefix}${timestamp}_${randomPart}`;
  }

  async generateCSRFToken(): Promise<string> {
    return crypto.randomBytes(32).toString('base64url');
  }

  async verifyCSRFToken(token: string, expectedToken: string): Promise<boolean> {
    try {
      return crypto.timingSafeEqual(
        Buffer.from(token, 'base64url'),
        Buffer.from(expectedToken, 'base64url')
      );
    } catch (error) {
      return false;
    }
  }

  async hashSensitiveData(data: string): Promise<string> {
    // Use SHA-256 for non-password sensitive data
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async generateDataKey(): Promise<{ keyId: string; key: Buffer }> {
    const keyId = `dek_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const key = this.generateEncryptionKey();
    
    // Store the key (in production, this would be stored securely)
    this.encryptionKeys.set(keyId, key);
    
    return { keyId, key };
  }

  async rotateEncryptionKey(): Promise<string> {
    this.logger.log('Starting encryption key rotation');
    
    try {
      // Generate new key
      const newKeyId = `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      const newKey = this.generateEncryptionKey();
      
      // Store new key
      this.encryptionKeys.set(newKeyId, newKey);
      
      // Mark old key for deprecation (keep for decryption of existing data)
      const oldKeyId = this.currentKeyId;
      
      // Update current key
      this.currentKeyId = newKeyId;
      
      this.logger.log(`Encryption key rotated: ${oldKeyId} -> ${newKeyId}`);
      
      // Schedule old key cleanup (would be more sophisticated in production)
      setTimeout(() => {
        this.cleanupDeprecatedKey(oldKeyId);
      }, 24 * 60 * 60 * 1000); // 24 hours
      
      return newKeyId;
    } catch (error) {
      this.logger.error('Key rotation failed:', error);
      throw new Error('Encryption key rotation failed');
    }
  }

  async getKeyRotationInfo(): Promise<KeyRotationInfo[]> {
    const keyInfo: KeyRotationInfo[] = [];
    
    this.encryptionKeys.forEach((key, keyId) => {
      keyInfo.push({
        keyId,
        algorithm: this.algorithm,
        createdAt: new Date(), // In production, this would be stored metadata
        status: keyId === this.currentKeyId ? 'active' : 'deprecated'
      });
    });
    
    return keyInfo;
  }

  async secureWipe(data: string): Promise<void> {
    // Overwrite sensitive data in memory (limited effectiveness in JS)
    if (typeof data === 'string') {
      // Fill the string with random data multiple times
      for (let i = 0; i < 3; i++) {
        data = crypto.randomBytes(data.length).toString('hex').substring(0, data.length);
      }
    }
  }

  async encryptionHealthCheck(): Promise<{
    status: string;
    keyCount: number;
    currentKeyId: string;
    lastRotation?: Date;
  }> {
    try {
      // Test encryption/decryption
      const testData = 'encryption-health-check';
      const encrypted = await this.encrypt(testData);
      const decrypted = await this.decrypt(encrypted.encryptedData, encrypted.iv, encrypted.tag);
      
      if (decrypted !== testData) {
        throw new Error('Encryption health check failed');
      }
      
      return {
        status: 'healthy',
        keyCount: this.encryptionKeys.size,
        currentKeyId: this.currentKeyId,
        // lastRotation would be retrieved from storage in production
      };
    } catch (error) {
      this.logger.error('Encryption health check failed:', error);
      return {
        status: 'unhealthy',
        keyCount: this.encryptionKeys.size,
        currentKeyId: this.currentKeyId
      };
    }
  }

  private generateEncryptionKey(): Buffer {
    return crypto.randomBytes(this.keyLength);
  }

  private startKeyRotationScheduler(): void {
    setInterval(() => {
      this.rotateEncryptionKey().catch(error => {
        this.logger.error('Scheduled key rotation failed:', error);
      });
    }, this.keyRotationInterval);
  }

  private cleanupDeprecatedKey(keyId: string): void {
    if (keyId !== this.currentKeyId) {
      this.encryptionKeys.delete(keyId);
      this.logger.log(`Deprecated encryption key cleaned up: ${keyId}`);
    }
  }

  // Field-level encryption for specific data types
  async encryptEmail(email: string): Promise<string> {
    return this.encryptPII({ type: 'email', value: email });
  }

  async decryptEmail(encryptedEmail: string): Promise<string> {
    const decrypted = await this.decryptPII(encryptedEmail);
    return decrypted.value;
  }

  async encryptPhone(phone: string): Promise<string> {
    return this.encryptPII({ type: 'phone', value: phone });
  }

  async decryptPhone(encryptedPhone: string): Promise<string> {
    const decrypted = await this.decryptPII(encryptedPhone);
    return decrypted.value;
  }

  async encryptCreditCard(cardNumber: string): Promise<string> {
    // Special handling for credit card data
    const last4 = cardNumber.slice(-4);
    const masked = '*'.repeat(cardNumber.length - 4) + last4;
    
    return this.encryptPII({ 
      type: 'credit_card', 
      value: cardNumber,
      masked: masked 
    });
  }

  async getMaskedCreditCard(encryptedCard: string): Promise<string> {
    const decrypted = await this.decryptPII(encryptedCard);
    return decrypted.masked || '**** **** **** ****';
  }

  onModuleDestroy(): void {
    // Clear all keys from memory
    this.encryptionKeys.clear();
    this.logger.log('Encryption service destroyed, keys cleared from memory');
  }
}