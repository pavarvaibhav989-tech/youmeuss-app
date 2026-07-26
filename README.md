# 🎬 YouMeUss — Watch Together

> Watch videos in perfect sync with friends, no matter the distance.
> Synchronized playback · Live chat · Video calls · File uploads

**Live at → [youmeuss.vercel.app](https://youmeuss.vercel.app)**

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🔐 **Auth** | Register, login, logout, password reset via email |
| 🏠 **Rooms** | Create a room, share a 6-char code, anyone can join |
| 🎬 **Video Sync** | YouTube links play/pause/seek in perfect sync for everyone |
| 📁 **File Upload** | Host uploads local videos up to 3 GB |
| 💬 **Live Chat** | Real-time messages with typing indicators + history on join |
| 📹 **Video Calls** | WebRTC camera + mic calls inside the room |
| 🕐 **Room History** | Homepage shows your recent rooms — rejoin with one click |
| 🛡️ **Security** | Rate limiting, JWT auth, bcrypt passwords, token expiry |
| 📱 **Mobile** | Responsive layout for phones and tablets |
| ☁️ **Cloud** | Data persists forever — runs 24/7 with no laptop needed |

---

## 🏗️ Tech Stack

### Frontend (Vercel)
- **React 18** + **Vite** — fast dev and tiny production bundles
- **Vanilla CSS** with custom design system (no Tailwind)
- **Three.js** — animated particle background (lazy loaded)
- **Socket.io-client** — real-time events
- **WebRTC** — peer-to-peer video calls
- **YouTube IFrame Player API** — synchronized YouTube playback

### Backend (Railway)
- **Node.js** + **Express** — REST API
- **Socket.io** — real-time room events (chat, video sync, WebRTC signaling)
- **PostgreSQL** (via `pg`) — persistent database
- **bcryptjs** + **JWT** — authentication
- **Multer** — file uploads up to 3 GB
- **Resend** — transactional emails (password reset)
- **express-rate-limit** — abuse prevention

---

## 📁 Project Structure

```
youmeuss/
├── client/                  # React frontend (deployed to Vercel)
│   ├── src/
│   │   ├── components/      # Reusable UI (ChatPanel, VideoPlayer, Navbar, ...)
│   │   ├── pages/           # Route-level pages (LoginPage, RoomPage, ...)
│   │   ├── hooks/           # Custom hooks (useChat, useVideoSync, useWebRTC, ...)
│   │   ├── context/         # AuthContext
│   │   └── lib/             # api.js, socket.js
│   ├── public/              # Static assets (og-image.png, favicon.svg)
│   ├── .env                 # VITE_API_URL=http://localhost:3001
│   └── vite.config.js
│
└── server/                  # Express backend (deployed to Railway)
    ├── src/
    │   ├── routes/          # auth.js, rooms.js, messages.js, videos.js
    │   ├── sockets/         # chatHandler.js, videoHandler.js, roomHandler.js
    │   ├── db/              # index.js (PostgreSQL pool + schema)
    │   ├── middleware/      # auth.js (JWT verify)
    │   └── jobs/            # cleanup.js (deletes rooms inactive > 7 days)
    ├── .env                 # JWT secrets, DATABASE_URL, RESEND_API_KEY
    └── package.json
```

---

## 🚀 Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/your-username/youmeuss-app.git
cd youmeuss-app

# 2. Server setup
cd server
cp .env.example .env        # fill in JWT_SECRET, JWT_REFRESH_SECRET
npm install
npm run dev                 # runs on http://localhost:3001

# 3. Client setup (new terminal)
cd client
cp .env.example .env        # VITE_API_URL=http://localhost:3001
npm install
npm run dev                 # runs on http://localhost:5173
```

> **Database:** Without `DATABASE_URL`, the server logs a warning and uses an in-memory fallback (data doesn't persist). For local Postgres, add `DATABASE_URL=postgresql://...` to `server/.env`.

---

## ☁️ Production Environment Variables

### Server (Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (auto-set by Railway Postgres plugin) |
| `JWT_SECRET` | ✅ | Long random string for access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Long random string for refresh tokens |
| `CLIENT_URL` | ✅ | Your Vercel frontend URL (e.g. `https://youmeuss.vercel.app`) |
| `RESEND_API_KEY` | ✅ | From [resend.com](https://resend.com) — for password reset emails |
| `PORT` | ✅ | `3001` |
| `NODE_ENV` | ✅ | `production` |
| `CLOUDINARY_CLOUD_NAME` | Optional | For persistent cloud video storage |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary credentials |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary credentials |

### Client (Vercel)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway server URL |

---

## 🔑 Key Design Decisions

- **PostgreSQL over SQLite** — data survives Railway restarts and scales horizontally
- **Lazy loading** — Three.js, login page, room page all load on demand (5 KB initial bundle)
- **Rate limiting skipped in dev** — so local testing isn't blocked by limits
- **No user enumeration** — `/forgot-password` always returns 200, even for unknown emails
- **YouTube IFrame Player API** — proper sync (not just iframe embed); host play/pause is detected and broadcast to all participants
- **Error boundaries at 2 levels** — app-level (full page fallback) + widget-level (inline fallback per component)
- **Room cleanup job** — rooms inactive for 7+ days are deleted automatically via `setInterval`

---

## 📝 License

MIT — do whatever you want with it.
