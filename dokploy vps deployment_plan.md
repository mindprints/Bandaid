# BandAid Deployment Plan - Dokploy on Hostinger

## Overview
Deploy  BandAid app to Dokploy using GitHub for deployment triggers, with proper secrets management and SQLite database setup.

---

## Pre-Deployment Checklist

### 1. Prepare Repository for Production

**Create `.gitignore` (if not exists)**
```gitignore
# Environment variables
.env
.env.local
.env.production

# Database
*.db
*.db-shm
*.db-wal

# Dependencies
node_modules/
*/node_modules/

# Build outputs
dist/
build/
*/dist/
*/build/

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

**Create `.dockerignore`** (for efficient builds)
```dockerignore
node_modules
.git
.env
*.db
npm-debug.log
.vscode
.idea
```

### 2. Create Production Environment File Template

Create `server/.env.example`:
```env
# Server Configuration
NODE_ENV=production
PORT=3001

# Security
JWT_SECRET=REPLACE_WITH_STRONG_RANDOM_STRING

# Database
DATABASE_PATH=./database/bandaid.db

# Dropbox API
DROPBOX_APP_KEY=REPLACE_WITH_YOUR_APP_KEY
DROPBOX_APP_SECRET=REPLACE_WITH_YOUR_APP_SECRET
DROPBOX_REFRESH_TOKEN=REPLACE_WITH_YOUR_REFRESH_TOKEN
DROPBOX_REDIRECT_URI=https://yourdomain.com/api/dropbox/oauth/callback

# Client URL (for CORS)
CLIENT_URL=https://yourdomain.com
```

---

## Deployment Steps

### Phase 1: Prepare GitHub Repository

**1. Commit All Changes**
```bash
# Make sure everything is committed
git add .
git commit -m "Prepare for production deployment"
git push origin main
```
github repository: https://github.com/mindp/bandaid.git is already prepared for production deployment

**2. Create Production Branch (Optional but Recommended)**
```bash
git checkout -b production
git push origin production
```
This lets you keep `main` for development and `production` for stable releases.
the production branch has not been created yet
---

### Phase 2: Configure Dokploy Project

**1. Create New Project in Dokploy**
- Log into your Dokploy dashboard
- Click "Create New Project"
- Choose **"GitHub"** as source
- Connect your repository
- Select branch: `main` or `production`
We are working on main branch
**2. Project Settings**
- **Project Name**: `bandaid`
- **Build Type**: Node.js / Monorepo
- **Root Directory**: `/` (since it's a monorepo)
- **Port**: `3001` (your backend port)

**3. Build Configuration**

Set these build commands in Dokploy:

**Install Command**:
npm ci --include=dev

**Build Command**:
```bash
npm run build
```
**Start Command**:
```bash
npm run start:prod
```

---

### Phase 3: Update package.json Scripts

Add production scripts to your root `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "build": "npm run build --prefix client && npm run build --prefix server",
    "start:prod": "NODE_ENV=production node server/dist/index.js",
    "db:seed": "node --loader ts-node/esm server/src/database/seeds.ts"
  }
}
```

Update `server/package.json`:
```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

Update `client/package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

---

### Phase 4: Configure Environment Variables in Dokploy

In Dokploy project settings → Environment Variables:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=<generate-strong-random-string>
DATABASE_PATH=/app/database/bandaid.db
DROPBOX_APP_KEY=<your-dropbox-app-key>
DROPBOX_APP_SECRET=<your-dropbox-app-secret>
DROPBOX_REFRESH_TOKEN=<your-dropbox-refresh-token>
DROPBOX_REDIRECT_URI=https://yourdomain.com/api/dropbox/oauth/callback
CLIENT_URL=https://yourdomain.com
```

**How to Generate JWT_SECRET**:
```bash
# On your local machine
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### Phase 5: Database Setup Strategy

**Option A: Persistent Volume (Recommended)**

In Dokploy, configure a persistent volume:
- **Volume Path**: `/app/database`
- **Mount Point**: `/app/database`
- This ensures your database persists across deployments

**Option B: Manual Database Upload**

1. Export your local database:
```bash
# From your local machine
scp server/database/bandaid.db user@your-vps:/path/to/dokploy/volumes/bandaid/database/
```

2. Or use Dokploy's file upload feature

**Initial Database Seeding on Server**:

Create a one-time seed script that runs on first deployment:

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Navigate to your app directory
cd /path/to/dokploy/apps/bandaid

# Run seed script
npm run db:seed
```

---

### Phase 6: Frontend Configuration

**Update `client/vite.config.ts` for Production**:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    // Serve from root in production
    base: '/'
  }
})
```

**Update API Client** (`client/src/api/client.ts`):

```typescript
const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // Production: same domain
  : 'http://localhost:3001/api';  // Development

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});
```

---

### Phase 7: Static File Serving

**Update `server/src/index.ts`** to serve frontend in production:

```typescript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ... your existing middleware ...

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve frontend build files
  const clientPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientPath));
  
  // Handle SPA routing - send all non-API requests to index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientPath, 'index.html'));
    }
  });
}

// ... rest of your server code ...
```

---

### Phase 8: Domain & SSL Setup

**1. Configure Domain in Dokploy**
- Go to your project settings
- Add your domain: `bandaid.yourdomain.com`
- Dokploy will automatically provision SSL via Let's Encrypt

**2. Update DNS Records**
Point your domain to your VPS IP:
```
Type: A
Name: bandaid (or @)
Value: your.vps.ip.address
TTL: 3600
```

**3. Update Dropbox Redirect URI**
In Dropbox App Console:
- Add production redirect URI: `https://bandaid.yourdomain.com/api/dropbox/oauth/callback`

---

### Phase 9: Deploy!

**1. Push to GitHub**
```bash
git add .
git commit -m "Production configuration"
git push origin production
```

**2. Dokploy Auto-Deploy**
- Dokploy will detect the push and automatically deploy
- Monitor the build logs in Dokploy dashboard

**3. Manual Deploy (if needed)**
- In Dokploy, click "Deploy" button
- Watch build logs for errors

---

## Post-Deployment Tasks

### 1. Verify Deployment
```bash
# Check if app is running
curl https://bandaid.yourdomain.com/api/health

# Check authentication
curl -X POST https://bandaid.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Anders","password":"password123"}'
```

### 2. Seed Database (First Time Only)
```bash
# SSH into VPS
ssh user@your-vps

# Navigate to app directory
cd /var/lib/dokploy/applications/bandaid

# Run seed
npm run db:seed
```

### 3. Test Dropbox Integration
- Log in to the app
- Navigate to sync page
- Click "Sync with Dropbox"
- Verify songs/versions are imported

### 4. Monitor Logs
```bash
# In Dokploy dashboard
# Go to your project → Logs
# Watch for errors or issues
```

---

## Backup Strategy

### Automatic Database Backups

Create `server/src/scripts/backup-db.ts`:

```typescript
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || './database/bandaid.db';
const backupDir = './database/backups';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `bandaid-${timestamp}.db`);

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

fs.copyFileSync(dbPath, backupPath);
console.log(`Database backed up to ${backupPath}`);
```

**Set up cron job on VPS**:
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/app && npm run db:backup
```

---

## Troubleshooting

### Build Fails
- Check Dokploy build logs
- Verify all dependencies are in `package.json`
- Ensure TypeScript compiles: `npm run build` locally

### Database Not Persisting
- Verify persistent volume is configured
- Check volume mount path matches `DATABASE_PATH`

### CORS Errors
- Verify `CLIENT_URL` environment variable
- Check CORS middleware in backend
- Ensure cookies are sent with `withCredentials: true`

### Dropbox Sync Fails
- Verify refresh token is set correctly
- Check redirect URI matches Dropbox app settings
- Review server logs for API errors

### 502 Bad Gateway
- Check if backend is running: `docker logs <container-id>`
- Verify PORT environment variable
- Ensure app listens on `0.0.0.0`, not `localhost`

---

## Rollback Plan

If deployment fails:

**1. Revert to Previous Version**
```bash
# In Dokploy, redeploy previous commit
# Or manually:
git revert HEAD
git push origin production
```

**2. Restore Database Backup**
```bash
cp /path/to/backup/bandaid-TIMESTAMP.db /app/database/bandaid.db
```

---

## Security Checklist

- [ ] All secrets in Dokploy environment variables (not in code)
- [ ] `.env` files in `.gitignore`
- [ ] HTTPS enabled via Dokploy/Let's Encrypt
- [ ] JWT secret is strong and random
- [ ] Database file has proper permissions (readable only by app)
- [ ] CORS configured to only allow your domain
- [ ] Dropbox tokens stored securely

---

## Cost Estimates

**Hostinger VPS** (assuming you already have it):
- VPS: ~$5-15/month depending on tier
- Domain: ~$10-15/year
- SSL: Free (Let's Encrypt via Dokploy)

**Total**: ~$5-15/month + domain

---

## Next Steps

1. Review this plan thoroughly
2. Test build process locally: `npm run build`
3. Generate production secrets (JWT, etc.)
4. Set up GitHub repository
5. Configure Dokploy project
6. Deploy!
7. Test all features in production
8. Set up monitoring and backups

Good luck with the deployment! 🚀