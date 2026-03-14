# EMR Application Deployment Guide
# For Dr. Aarti Demo (2-3 days evaluation)

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         DR. AARTI EMR                            │
├──────────────────┬──────────────────┬──────────────────────────────┤
│   FRONTEND       │    BACKEND       │      DATABASE                │
│   (Netlify)      │    (Render/      │      (Already on MongoDB)    │
│   React + Vite   │     Railway)     │                              │
│   5173 → Live    │     5000 → Live  │   cluster0.adrly70           │
└──────────────────┴──────────────────┴──────────────────────────────┘
```

---

## 🚀 STEP 1: DEPLOY BACKEND (Render.com) - 10 mins

### Option A: Using Render.com (Recommended - Free tier available)

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub account (easier)

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Build command: `npm install`
   - Start command: `node server.js`
   - Runtime: Node
   - Plan: Free (good for demo)

3. **Add Environment Variables** (in Render dashboard)
   ```
   MONGO_URI=mongodb+srv://draarticlinic:AartiClinic123@cluster0.adrly70.mongodb.net/medcore_admin?retryWrites=true&w=majority
   PORT=10000
   NODE_ENV=production
   CLINIC_EMAIL=demo@medcore.in
   CLINIC_PASSWORD=demo123
   CLINIC_NAME=Dr. Aarti Clinic
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get URL like: `https://emr-aarti-backend.onrender.com`

### Option B: Alternative Hosting
- **Railway.app**: https://railway.app (Similar to Render, $5/month)
- **Heroku**: https://heroku.com (Paid, but reliable)
- **AWS EC2**: More complex but free tier available

I recommend **Render.com** for your use case.

---

## 🎨 STEP 2: DEPLOY FRONTEND (Netlify) - 10 mins

### 1. Prepare Frontend Configuration

Update `vite.config.ts` to handle remote backend:

```typescript
// vite.config.ts - Replace existing configuration

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_BASE = process.env.VITE_API_URL || "http://localhost:5000/api";

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_API_URL': JSON.stringify(API_BASE)
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
```

### 2. Update Frontend API URL

Update `services/db.ts` line 5:

```typescript
// OLD:
const API_BASE_URL = 'http://localhost:5000/api';

// NEW:
const API_BASE_URL = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
  ? 'http://localhost:5000/api'
  : (import.meta.env.VITE_API_URL || 'https://emr-aarti-backend.onrender.com/api');
```

### 3. Create Netlify Configuration

Create `netlify.toml` in root directory:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production]
  environment = { VITE_API_URL = "https://emr-aarti-backend.onrender.com/api" }

[context.deploy-preview]
  environment = { VITE_API_URL = "https://emr-aarti-backend.onrender.com/api" }
```

### 4. Create Netlify Account & Deploy

1. Go to https://app.netlify.com
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select GitHub → Select your repo
5. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - Add **Environment variable**: 
     - Key: `VITE_API_URL`
     - Value: `https://emr-aarti-backend.onrender.com/api`
6. Click "Deploy site"
7. Wait 2-3 minutes
8. Get URL like: `https://emr-aarti.netlify.app`

---

## 🔗 STEP 3: CONFIGURE CORS & Backend

### Enable CORS in backend (server.js)

Add after `const app = express();`:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://emr-aarti.netlify.app',  // Your Netlify URL
    'https://*.netlify.app'  // Any Netlify preview
  ],
  credentials: true
}));
```

Make sure `cors` is installed:
```bash
npm install cors
```

---

## ✅ STEP 4: FINAL VERIFICATION

### Test Complete Flow:

1. **Backend Health**
   ```
   https://emr-aarti-backend.onrender.com/api/health
   Response: {"status":"online","admin_db":"ready"}
   ```

2. **Frontend Access**
   ```
   https://emr-aarti.netlify.app
   Should show login page
   ```

3. **Login Test**
   ```
   Email: demo@medcore.in
   Password: demo123
   ```

4. **Data Entry**
   - Add new patient
   - Record visit
   - Check SyncHub
   - Should show "Cloud Connected" ✓

---

## 📱 DEMO INFORMATION FOR DR. AARTI

**Demo Access Details:**
```
🌐 Application: https://emr-aarti.netlify.app
📧 Email: demo@medcore.in
🔑 Password: demo123

Valid for: 2-3 days
Features: All (patients, visits, syncing, reporting)
Data: Fresh & Clean (just cleared)
```

---

## 🔄 Post-Demo Reset

If you need to reset Dr. Aarti's database again:
```bash
node clear-aarti-db.js
```

---

## 📊 Costs Overview

| Service | Cost | Notes |
|---------|------|-------|
| Render Web Service | Free | Requires activity; free tier sleeps after 15 min |
| Netlify | Free | 300 build minutes/month |
| MongoDB Atlas | Free | 512MB storage |
| **Total** | **FREE** | Perfect for demo evaluation |

---

## ⚡ One-Time Setup Summary

### Backend (10 min):
1. Create Render account
2. Connect GitHub repo
3. Add env variables
4. Deploy

### Frontend (10 min):
1. Update `services/db.ts`
2. Create `netlify.toml`
3. Update `vite.config.ts`
4. Deploy from GitHub

### Enable CORS (5 min):
1. Add `cors` package
2. Update `server.js`
3. Deploy backend again

**Total Time: ~25 minutes**

After this, every push to GitHub auto-deploys both frontend and backend!
