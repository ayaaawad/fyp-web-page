import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(4000),
  FRONTEND_ORIGIN: Joi.string().default('http://localhost:3000'),
  JWT_SECRET: Joi.string().min(24).required(),
  VECTOR_ENCRYPTION_KEY_BASE64: Joi.string().base64().required(),
  SIMILARITY_THRESHOLD: Joi.number().min(0).max(1).default(0.92),
  PBKDF2_ITERATIONS: Joi.number().integer().min(100000).default(210000),
  PBKDF2_KEYLEN: Joi.number().integer().min(32).default(64),
  PBKDF2_DIGEST: Joi.string().default('sha512'),
  ADMIN_EMAIL: Joi.string().email().default('awadaya18@gmail.com'),
  ADMIN_PASSWORD: Joi.string().min(8).required(),
  ADMIN_USER_ID: Joi.string().default('admin-awadaya18'),
  FIREBASE_PROJECT_ID: Joi.string().allow('').optional(),
  FIREBASE_SERVICE_ACCOUNT_KEY: Joi.string().allow('').optional(),
  FIRESTORE_EMULATOR_HOST: Joi.string().allow('').optional(),
});
