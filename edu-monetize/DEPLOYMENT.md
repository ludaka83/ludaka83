## Tiwane School - Deployment Guide

This project is a Next.js (App Router) app with Prisma (SQLite). You can deploy via:
- Shared Node hosting (build locally, upload, run `next start`)
- VPS with PM2 (recommended)
- Docker container

### 1) Requirements
- Node.js 20+
- npm 10+
- A writable directory for uploads (default: `public/uploads`)
- Environment variables set (copy `.env.example` to `.env` and fill values)

Required env vars:
- `DATABASE_URL` (e.g., `file:./prisma/dev.db` for SQLite)
- `ADMIN_PASSWORD` (set a strong password)
- `UPLOAD_DIR` (default `public/uploads`)
- Optional: `NEXT_PUBLIC_ADS_ENABLED`, `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADS_FREQUENCY`

### 2) Production Build

On your machine:
```bash
cp .env.example .env
# edit .env accordingly
npm ci
npx prisma generate
npm run build
```
This creates `.next/` and generates Prisma client in `app/generated/prisma`.

Upload the entire project folder to your host (including `.next`, `public`, `app/generated`, `prisma`, and `node_modules` if your host cannot build). If the host can build, you can instead run the build there.

### 3) Run in Production (without Docker)

If your host supports Node and you can SSH:
```bash
npm ci --omit=dev
npx prisma generate
npm run start
# App listens on PORT 3000 by default (configure reverse proxy or hosting panel)
```

#### PM2 (VPS)
Use the provided `ecosystem.config.js`:
```bash
npm i -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```
Ensure your reverse proxy (Nginx/Apache) forwards to port 3000.

### 4) Docker

Build and run:
```bash
docker build -t tiwane-school .
# create a volume for persistent uploads and db if desired
# Example with bind mounts:
mkdir -p ./public/uploads
mkdir -p ./prisma

docker run -d \
  --name tiwane-school \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e ADMIN_PASSWORD=change_me \
  -e DATABASE_URL="file:./prisma/dev.db" \
  -e UPLOAD_DIR="public/uploads" \
  -v $(pwd)/public/uploads:/app/public/uploads \
  -v $(pwd)/prisma:/app/prisma \
  tiwane-school
```

### 5) File Uploads and Persistence
- Uploads are saved under `UPLOAD_DIR` (default `public/uploads/{videos,notes,presentations}`)
- For Docker or ephemeral hosts, mount a volume to persist these files

### 6) Common Hosts
- Vercel: Works, but local file uploads using the Node FS will not persist (use external storage)
- Shared cPanel: Use NodeJS App feature, set env vars, run `npm ci && npm run build`, set start script `next start -p 3000`
- VPS: Use PM2 + Nginx reverse proxy

### 7) Admin Access
- Set `ADMIN_PASSWORD` in the environment
- Visit `/admin` to upload/delete lessons

### 8) Troubleshooting
- 401 Unauthorized on upload/delete: check `ADMIN_PASSWORD` in server env and in admin headers
- Uploaded files 404: ensure `UPLOAD_DIR` is under `public/` and writable; for Docker ensure volume is mounted
- Prisma errors: make sure `DATABASE_URL` points at a writable path; run `npx prisma generate` after deployment