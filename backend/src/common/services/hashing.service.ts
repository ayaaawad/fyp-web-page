import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto';

export interface SecretHashPayload {
  hash: string;
  salt: string;
  iterations: number;
  keylen: number;
  digest: string;
}

@Injectable()
export class HashingService {
  constructor(private readonly configService: ConfigService) {}

  hashSecret(secret: string): SecretHashPayload {
    const iterations = Number(this.configService.get('PBKDF2_ITERATIONS'));
    const keylen = Number(this.configService.get('PBKDF2_KEYLEN'));
    const digest = this.configService.get<string>('PBKDF2_DIGEST') ?? 'sha512';

    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(secret, salt, iterations, keylen, digest).toString(
      'hex',
    );

    return {
      hash,
      salt,
      iterations,
      keylen,
      digest,
    };
  }

  verifySecret(secret: string, payload: SecretHashPayload): boolean {
    const derived = pbkdf2Sync(
      secret,
      payload.salt,
      payload.iterations,
      payload.keylen,
      payload.digest,
    ).toString('hex');

    return timingSafeEqual(
      Buffer.from(derived, 'hex'),
      Buffer.from(payload.hash, 'hex'),
    );
  }
}
