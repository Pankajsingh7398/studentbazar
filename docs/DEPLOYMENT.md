# StudentBazaar — Production Deployment Guide

This guide describes production deployment of the full-stack architecture across managed cloud tiers.

---

## 1. Cloud Architecture Overview

| Component | Target Provider | Free / Low-Cost Tier |
| :--- | :--- | :--- |
| **Frontend Storefront** | Vercel / Netlify / Cloudflare Pages | Free Tier (Global CDN, Automated SSL) |
| **Backend REST API** | Render / Railway / Fly.io | Standard Web Service |
| **Persistent Database** | MongoDB Atlas | M0 Free Shared Cluster |
| **Product Media Storage** | Cloudinary | Free Tier (25 GB managed storage) |
| **Payment Gateway** | Razorpay | Standard Test & Live Gateway |

---

## 2. MongoDB Atlas Configuration
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User (e.g. `sb_app_user`) with read/write permissions.
3. In **Network Access**, whitelist your hosting provider IP or add `0.0.0.0/0` with strong authentication.
4. Obtain connection URI:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/studentbazaar?retryWrites=true&w=majority
   ```

---

## 3. Backend Deployment (Render / Railway)
1. Set root directory to `server`.
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. Add Environment Variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `MONGODB_URI=<Your MongoDB Atlas connection URI>`
   - `FRONTEND_URL=https://studentbazaar.vercel.app`
   - `JWT_SECRET=<64-char random string>`
   - `COOKIE_SECRET=<64-char random string>`
   - `CLOUDINARY_CLOUD_NAME=...`
   - `CLOUDINARY_API_KEY=...`
   - `CLOUDINARY_API_SECRET=...`
   - `RAZORPAY_KEY_ID=...`
   - `RAZORPAY_KEY_SECRET=...`
   - `RAZORPAY_WEBHOOK_SECRET=...`

---

## 4. Frontend Deployment (Vercel / Netlify)
1. Point to the repository root directory.
2. In `js/api.js`, the API base URL automatically checks:
   - If running on `localhost`: `http://localhost:5000/api/v1`
   - In production: configured via `window.__STUDENTBAZAAR_API_URL__` or relative `/api/v1` (with proxy).
3. Ensure CORS on the backend allows the production frontend domain.

---

## 5. Post-Deployment Smoke Test
1. Access `/api/v1/health` and verify database state returns `connected`.
2. Run database seed once: `npm run seed` to load archival notebooks and taxonomy.
3. Test customer registration, login, cart synchronization, and checkout.
