import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface EncryptedVector {
  ciphertext: string;
  iv: string;
  authTag: string;
  algorithm: 'aes-256-gcm';
  dimension: number;
}

@Injectable()
export class VectorCryptoService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const base64Key =
      this.configService.get<string>('VECTOR_ENCRYPTION_KEY_BASE64') ?? '';
    const key = Buffer.from(base64Key, 'base64');

    if (key.length !== 32) {
      throw new Error(
        'VECTOR_ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes',
      );
    }

    this.key = key;
  }

  encryptVector(vector: number[]): EncryptedVector {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const plain = Buffer.from(JSON.stringify(vector), 'utf8');
    const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      algorithm: 'aes-256-gcm',
      dimension: vector.length,
    };
  }

  decryptVector(payload: EncryptedVector): number[] {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.key,
      Buffer.from(payload.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, 'base64')),
      decipher.final(),
    ]);

    const vector = JSON.parse(decrypted.toString('utf8')) as number[];
    if (!Array.isArray(vector)) {
      throw new Error('Stored vector payload is invalid');
    }

    return vector.map((value) => Number(value));
  }
}
