# Deployment Architecture Diagram

## 🏗️ LOCAL → PRODUCTION MIGRATION

```
┌────────────────────────────────────────────────────────────────┐
│                    YOUR DEVELOPMENT MACHINE                     │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📁 Project Folder                                              │
│  ├─ vite.config.ts ✅ (updated)                               │
│  ├─ netlify.toml ✅ (created)                                 │
│  ├─ server.js ✅ (CORS updated)                               │
│  ├─ services/db.ts ✅ (API URL updated)                       │
│  └─ package.json                                               │
│                                                                  │
│  $ git push origin main                                         │
│         ↓ (pushes to GitHub)                                    │
└────────────────────────────────────────────────────────────────┘
        │
        │ GitHub Detects Commit
        ↓
┌────────────────────────────────────────────────────────────────┐
│                      GITHUB REPOSITORY                          │
├────────────────────────────────────────────────────────────────┤
│ Webhook triggers both services automatically                    │
└────────────────────────────────────────────────────────────────┘
        │
        ├──────────────────────┬──────────────────────┐
        ↓                      ↓                      ↓
   ┌─────────────┐    ┌──────────────┐    ┌────────────────┐
   │ RENDER.COM  │    │ NETLIFY      │    │ MONGODB ATLAS  │
   ├─────────────┤    ├──────────────┤    ├────────────────┤
   │ Node.js     │    │ React Build  │    │ Database       │
   │ Backend     │    │ Frontend     │    │ (No changes)   │
   │ Port 10000  │    │ Dist Folder  │    │                │
   │             │    │              │    │                │
   │ Env Vars:   │    │ Env Vars:    │    │ Credentials:   │
   │ ✓ MONGODB   │    │ ✓ VITE_API   │    │ ✓ draarticlin  │
   │ ✓ PORT      │    │   _URL       │    │   ic:***       │
   │ ✓ NODE_ENV  │    │ ✓ NODE_ENV   │    │                │
   │ ✓ ADMIN ACC │    │ ✓ BUILD_CMD  │    │ Database:      │
   │             │    │ ✓ PUBLISH    │    │ emr_dr_aarti   │
   └─────────────┘    └──────────────┘    └────────────────┘
        │                    │                    ↑
        │ API Server        │ Frontend App       │
        │ Port: 10000        │ Port: 443 (HTTPS) │
        │                    │                   │
        └────────┬───────────┴───────────────────┘
                 └─ API calls via HTTPS
                 └─ MongoDB queries
                 └─ Cloud sync every 10 seconds


               FINAL URLS FOR DR. AARTI
    
    Frontend:  https://emr-aarti.netlify.app
    Backend:   https://emr-aarti-backend.onrender.com
    
    Login: demo@medcore.in / demo123
```

---

## 📡 REQUEST FLOW

```
┌─────────────────────┐
│  DR. AARTI'S        │
│  BROWSER            │
└──────────┬──────────┘
           │ https://emr-aarti.netlify.app
           ↓
┌─────────────────────────────────────────┐
│  NETLIFY CDN                             │
│  (React App - index.html + JS bundle)   │
└──────────┬──────────────────────────────┘
           │ Click "Save Patient"
           ↓
┌──────────────────────────────────────────────────┐
│  Browser executes JavaScript                     │
│  Calls: https://emr-aarti-backend.onrender... │
│  Endpoint: /api/patients                        │
└──────────┬───────────────────────────────────────┘
           │ HTTP POST request
           ↓
┌──────────────────────────────────────────────────┐
│  RENDER.COM NODE.JS SERVER                       │
│  server.js runs Express app                      │
│  Validates request + CORS check                  │
└──────────┬───────────────────────────────────────┘
           │ Query: db.collection('patients')
           ↓
┌──────────────────────────────────────────────────┐
│  MONGODB ATLAS (Cloud)                           │
│  Database: emr_dr_aarti                          │
│  Collection: patients                            │
│  Stores data permanently                         │
└──────────┬───────────────────────────────────────┘
           │ Returns JSON
           ↓
┌──────────────────────────────────────────────────┐
│  RENDER SERVER                                   │
│  Formats response + sets headers                 │
└──────────┬───────────────────────────────────────┘
           │ Sends back to frontend
           ↓
┌─────────────────────────────────────────────────┐
│  NETLIFY (Frontend)                              │
│  JavaScript receives response                    │
│  Updates UI: "Patient saved!"                    │
│  Stores in localStorage                          │
│  Triggers auto-sync (next flush in 10 sec)      │
└──────────┬──────────────────────────────────────┘
           │ Display update in browser
           ↓
┌──────────────────────────────────────────────────┐
│  DR. AARTI SEES ✅                                │
│  Patient successfully added to the system        │
│  SyncHub shows: "Cloud Connected" (green)        │
└──────────────────────────────────────────────────┘
```

---

## 🔄 AUTO-SYNC CYCLE

```
┌─────────────────────────────────────┐
│  User adds new patient              │
│  (data saved to localStorage)        │
└──────────────┬──────────────────────┘
               │
               ↓ After 10 seconds
               
┌─────────────────────────────────────────────────────┐
│  Auto-sync triggered                                │
│  Collect all changes from localStorage              │
│  POST to: /api/sync/push-all                        │
└──────────────┬────────────────────────────────────┬─┘
               │                                    │
        ┌──────┴────────┐                          │
        │ Success       │                          │
        ↓               │                          │
   ✅ lastSync         │                ❌ Failure
      updated          │                   (retry in 10s)
      UI refreshed     │
      "Cloud           │
       Connected"      │
       (green)         │
                       │
                  ┌────┴─────┐
                  │ Retry     │
                  │ next cycle│
                  └───────────┘
```

---

## 📦 DEPLOYMENT SEQUENCE

```
STEP 1: LOCAL DEVELOPMENT
├─ Write code
├─ Test locally (localhost:5173)
├─ Fix issues
└─ Commit: git push origin main

STEP 2: GITHUB NOTIFICATION
├─ GitHub receives push
├─ Runs webhooks
└─ Notifies Render & Netlify

STEP 3: BACKEND BUILD (Render)
├─ Pulls latest code from GitHub
├─ Installs dependencies (npm install)
├─ Starts Node.js server (node server.js)
├─ Connects to MongoDB
└─ Ready at: https://emr-aarti-backend.onrender.com

STEP 4: FRONTEND BUILD (Netlify)
├─ Pulls latest code from GitHub
├─ Installs dependencies (npm install)
├─ Builds React app (npm run build)
├─ Optimizes bundle
├─ Deploys to CDN
└─ Ready at: https://emr-aarti.netlify.app

STEP 5: LIVE & WORKING ✅
├─ Frontend loads from Netlify CDN
├─ Backend serves API from Render
├─ Database connection active
└─ Dr. Aarti can access immediately
```

---

## 🔐 SECURITY FLOW

```
Requests from Browser:
    ↓
┌─────────────────────────────────────┐
│ CORS Check (server.js)              │
│ - Is origin whitelisted?            │
│ - emr-aarti.netlify.app ✓           │
│ - localhost:5173 ✓                  │
│ - *.netlify.app ✓                   │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Authorization Check (middleware)    │
│ - Bearer token in headers?          │
│ - Is user authenticated?            │
│ - Which tenant database?            │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Route Handler (server.js /api/...)  │
│ - Execute query                     │
│ - Validate data                     │
│ - Store/retrieve from MongoDB       │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ Response sent with:                 │
│ - Data (JSON)                       │
│ - Status code (200, 401, 500, etc)  │
│ - CORS headers                      │
└──────────────────────────────────────┘
```

---

## 🎯 ENVIRONMENT VARIABLES

```
BACKEND (Render Environment):
├─ MONGODB_URI = Cloud connection string
├─ NODE_ENV = "production"
├─ PORT = 10000
├─ CLINIC_EMAIL = "demo@medcore.in"
├─ CLINIC_PASSWORD = "demo123"
└─ CLINIC_NAME = "Dr. Aarti Clinic Demo"

FRONTEND (Netlify Environment):
├─ VITE_API_URL = "https://emr-aarti-backend.onrender.com/api"
└─ NODE_ENV = "production"

DATABASE (MongoDB Atlas - No setup needed):
├─ Connection: Already configured
├─ Admin DB: medcore_admin
├─ Tenant DB: emr_dr_aarti (cleared ✅)
└─ Credentials: In server.js MONGODB_URI
```

---

## ✅ DEPLOYMENT VERIFICATION POINTS

```
After deployment, check:

1️⃣  Backend Health
    GET /api/health
    Response: {"status":"online","admin_db":"ready"}

2️⃣  Frontend Loads
    GET /
    Status: 200 OK
    Returns: HTML with React app

3️⃣  CORS Works
    POST /api/sync/push-all (from Netlify)
    Response: No CORS error
    Status: 200 or error message (not blocked)

4️⃣  Authentication Works
    POST /api/auth/login
    Credentials: demo@medcore.in / demo123
    Response: token, user data

5️⃣  Database Connection Works
    Any endpoint (GET /api/patients)
    Should connect to MongoDB
    Response time: < 2 seconds

6️⃣  Cloud Sync Works
    Add patient → Auto-sync after 10 sec
    SyncHub: Shows "Cloud Connected" (green)

7️⃣  Multi-tenant Isolation Works
    Demo account → emr_dr_aarti database
    Other accounts → own databases
    No data leakage between tenants
```

---

## 🎓 REFERENCE ARCHITECTURE

```
Layer 1: CLIENT (Netlify CDN)
├─ React Components (TSX)
├─ State Management (React hooks + localStorage)
├─ API Client (services/db.ts)
└─ UI (Tailwind CSS)

Layer 2: NETWORK (HTTPS)
├─ Request: Frontend → Backend
├─ Headers: Authorization, Content-Type, CORS
└─ Response: JSON, Status codes

Layer 3: SERVER (Render Node.js)
├─ Express.js (routing)
├─ Middleware (CORS, auth, parsing)
├─ Controllers (request handlers)
└─ MongoDB drivers (data access)

Layer 4: DATABASE (MongoDB Atlas)
├─ Shared admin database
├─ Multi-tenant architecture
├─ Persistent data storage
└─ Cloud backup built-in
```

---

This diagram shows the **complete journey** from your machine to Dr. Aarti's browser! 🚀
