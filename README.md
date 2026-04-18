# Vein-Based ATM Authentication System (Software Core)

This workspace implements your FYP software-first architecture while NIR hardware is unavailable.

## Stack
- Backend: NestJS + Firestore (NoSQL)
- Frontend: Next.js (App Router) + Tailwind CSS
- Security: PBKDF2 with salting for PIN/password hashing, AES-256-GCM encryption for biometric vectors at rest
- Verification Model: 1:1 userId lookup (direct document fetch, O(1) retrieval path)

## Folder Structure
- `backend/`: secure API, Firestore integration, enrollment/verification/auth/audit logic
- `frontend/`: futuristic dark-themed simulation UI with admin dashboard

## 1) Firestore Setup
1. Create a Firebase project and enable Firestore.
2. Create a service account with Firestore access.
3. In `backend/.env` (copy from `backend/.env.example`), set:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON string)
   - `JWT_SECRET`
   - `VECTOR_ENCRYPTION_KEY_BASE64` (must decode to exactly 32 bytes)
4. Keep `backend/firestore.rules` as deny-all for direct client access when using server-only API access.

### Generate a 32-byte vector encryption key
Use any secure method; example in Node:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 2) Install Dependencies
From workspace root:
```bash
npm run install:all
```

## 3) Run Services
Terminal 1:
```bash
npm run dev:backend
```

Terminal 2:
```bash
npm run dev:frontend
```

- Backend API: `http://localhost:4000/api`
- Frontend UI: `http://localhost:3000`

## 4) Required Backend Behaviors Implemented
- Admin account seeded in Firestore on backend startup:
  - email: `awadaya18@gmail.com`
  - password: `1234554321`
- `POST /api/auth/admin/login`
- `POST /api/users/enroll`
  - Validates input
  - PBKDF2+salt hashes user PIN
  - Encrypts and stores 128D vector
- `POST /api/users/verify`
  - Accepts `userId` + live vector
  - Performs direct userId lookup (1:1)
  - Decrypts stored vector and returns cosine similarity score
- `GET /api/audit-logs` (JWT admin only)

## 5) Frontend Features Implemented
- Futuristic dark theme with NIR-style finger scanner background artwork.
- Registration page with Simulation Mode button to generate random 128D vectors.
- Verification page with Simulation Mode + similarity result output.
- Admin login page and private audit dashboard with:
  - Machine ID
  - Date/Time
  - Transaction Type
  - Success/Fail result

## Notes for FYP Demo
- The admin credential is intentionally fixed to match your requirement for demonstration.
- For production, move admin credential provisioning to secure secret management and rotate credentials.
