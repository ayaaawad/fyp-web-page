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
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
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

## 3.1) Deploy So It Stays Online 24/7
If you close your laptop, local servers stop. To keep the project always available, deploy both apps to cloud hosts.

### Backend (Render)
Quick start option: this repo includes `render.yaml` at the root. In Render, choose **New > Blueprint** and point to this repo to prefill backend service settings.

1. Push this project to GitHub.
2. In Render, create a **Web Service** from your repo.
3. Set **Root Directory** to `backend`.
4. Set:
  - Build Command: `npm install && npm run build`
  - Start Command: `npm run start:prod`
5. Add environment variables:
  - `JWT_SECRET`
  - `VECTOR_ENCRYPTION_KEY_BASE64`
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
  - `FRONTEND_ORIGIN` (set to your frontend URL, or comma-separated list for multiple domains)
  - `FIREBASE_PROJECT_ID` (if using Firestore)
  - `FIREBASE_SERVICE_ACCOUNT_KEY` (if using Firestore)
6. Deploy and copy your backend URL, e.g. `https://your-backend.onrender.com/api`.

### Frontend (Vercel)
1. In Vercel, import the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Add env var (see `frontend/.env.production.example`):
  - `NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com/api`
4. Deploy and copy your frontend URL, e.g. `https://your-app.vercel.app`.

### Final CORS Update
After frontend deployment, set backend `FRONTEND_ORIGIN` to your exact Vercel URL (or comma-separated URLs, including local if needed):
```env
FRONTEND_ORIGIN=https://your-app.vercel.app,http://localhost:3000
```

## 4) Required Backend Behaviors Implemented
- Admin account seeded in Firestore on backend startup using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment variables (not hardcoded in UI).
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
- Admin credentials are now environment-managed. Keep them only in server-side secrets and rotate regularly.
