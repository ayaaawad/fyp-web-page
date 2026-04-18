import { EncryptedVector } from '../common/services/vector-crypto.service';

export type UserRole = 'admin' | 'customer';

export interface UserDocument {
  userId: string;
  email: string;
  role: UserRole;
  encryptedVector: EncryptedVector;
  pinHash?: string;
  pinSalt?: string;
  pinIterations?: number;
  pinKeylen?: number;
  pinDigest?: string;
  passwordHash?: string;
  passwordSalt?: string;
  passwordIterations?: number;
  passwordKeylen?: number;
  passwordDigest?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PublicUser {
  userId: string;
  email: string;
  role: UserRole;
}
