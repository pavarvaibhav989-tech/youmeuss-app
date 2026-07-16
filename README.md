# YouMeUss — Watch Together

Watch videos in sync with your friends. Supports YouTube, direct video files, and live video calls.

## 🚀 Quick Start (Local)

```bash
# 1. Install server dependencies
cd server && npm install

# 2. Install client dependencies
cd ../client && npm install

# 3. Start the backend (in one terminal)
cd server && npm run dev

# 4. Start the frontend (in another terminal)
cd client && npm run dev

# 5. Open http://localhost:5173
```

## 🌐 Deploy to Production

### Backend → Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the **`server`** folder as the root directory
4. Add these environment variables in Railway dashboard:

```
PORT=3001
JWT_SECRET=<generate a long random string>
JWT_REFRESH_SECRET=<generate another long random string>
CLIENT_URL=https://your-app.vercel.app

# Optional: Cloudinary for video uploads accessible to everyone
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

5. Railway will give you a URL like `https://youmeuss-server.railway.app`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select the **`client`** folder as the root directory
3. Add this environment variable:

```
VITE_API_URL=https://youmeuss-server.railway.app
```

4. Deploy — Vercel will give you a URL like `https://youmeuss.vercel.app`
5. Go back to Railway and update `CLIENT_URL` to your Vercel URL

### Optional: Cloudinary (for video uploads)

Without Cloudinary, uploaded videos are stored on Railway's disk and only accessible while the server runs.

With Cloudinary, uploaded videos get a permanent public URL accessible to everyone worldwide:

1. Sign up free at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → copy Cloud Name, API Key, API Secret
3. Add them as env vars in Railway (see above)

## 🏗️ Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + Socket.io
- **Database**: SQLite (sql.js — persists to `youmeuss.db`)
- **Video sync**: Socket.io events
- **Video calls**: WebRTC
- **File storage**: Local disk (dev) / Cloudinary (prod)

## 📁 Project Structure

```
youmeuss/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
│   ├── .env         # VITE_API_URL=http://localhost:3001
│   └── vercel.json
└── server/          # Express backend
    ├── src/
    │   ├── routes/
    │   ├── sockets/
    │   ├── db/
    │   └── middleware/
    ├── .env         # JWT secrets, Cloudinary keys
    └── railway.json
```
