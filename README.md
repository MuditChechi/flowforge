# FlowForge — Task & Workflow Management

A full-stack Kanban workflow management platform built with React, Node.js, Express, and MongoDB.

## Features

- **Kanban board** with drag-and-drop task management
- **User authentication** — register, login, JWT-secured
- **Team collaboration** — invite members with role-based access (admin/member/viewer)
- **Task management** — priorities, due dates, labels, assignees, comments
- **Analytics dashboard** — completion rates, task distribution, 7-day activity trend (MongoDB aggregation pipeline)
- **Role-based access control** — `viewer` / `member` / `admin`, enforced by middleware on every board and task route
- **Security hardening** — Helmet headers, rate-limited auth endpoints, bcrypt hashing, leak-safe error handling

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, @dnd-kit, Recharts |
| Backend | Node.js, Express.js, Helmet, express-rate-limit |
| Database | MongoDB + Mongoose (compound indexes, aggregation) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Testing | Jest + Supertest + mongodb-memory-server |
| Deployment | Vercel (frontend) + Railway (backend) + MongoDB Atlas |

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB running locally OR a MongoDB Atlas URI

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/flowforge.git
cd flowforge
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MONGO_URI and JWT_SECRET
npm run dev
# Runs on http://localhost:5000
```

### 3. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api (already set for local)
npm run dev
# Runs on http://localhost:5173
```

### 4. Run the tests
```bash
cd backend
npm test   # Jest + Supertest against an in-memory MongoDB
```

---

## Deployment Guide

### Step 1 — MongoDB Atlas (Free tier)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas/database)
2. Create a free cluster
3. Create a database user (username + password)
4. Whitelist all IPs: `0.0.0.0/0` (Network Access tab)
5. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/flowforge
   ```

---

### Step 2 — Deploy Backend on Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo, set the **root directory** to `backend`
3. Add environment variables:
   ```
   MONGO_URI=mongodb+srv://...  (your Atlas URI)
   JWT_SECRET=any_long_random_string_here
   FRONTEND_URL=https://your-app.vercel.app
   PORT=5000
   ```
4. Railway auto-detects Node.js and runs `npm start`
5. Copy your Railway URL: `https://flowforge-backend.up.railway.app`

---

### Step 3 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set **root directory** to `frontend`
3. Add environment variable:
   ```
   VITE_API_URL=https://flowforge-backend.up.railway.app/api
   ```
4. Deploy — Vercel auto-detects Vite
5. Your app is live at `https://flowforge.vercel.app`

---

### Step 4 — Update CORS

Go back to Railway → update `FRONTEND_URL` to your actual Vercel URL:
```
FRONTEND_URL=https://flowforge.vercel.app
```

---

## Project Structure

```
flowforge/
├── backend/
│   ├── src/
│   │   ├── controllers/     # authController, boardController, taskController, analyticsController
│   │   ├── middleware/      # auth.js (JWT), boardRole.js (role-based access control)
│   │   ├── models/          # User, Board, Task
│   │   ├── routes/          # auth, boards, tasks, analytics
│   │   ├── app.js           # Express app factory (middleware + routes)
│   │   └── index.js         # Server bootstrap (env checks + DB connect)
│   ├── tests/               # Jest + Supertest integration tests
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── board/       # KanbanColumn, TaskCard, TaskModal
    │   │   └── Navbar.jsx
    │   ├── contexts/        # AuthContext (JWT + user state)
    │   ├── pages/           # LoginPage, RegisterPage, DashboardPage, BoardPage, AnalyticsPage
    │   ├── services/        # api.js (axios instance + all API calls)
    │   ├── App.jsx          # Routes + auth guards
    │   └── main.jsx
    └── package.json
```

## API Endpoints

### Auth
```
POST   /api/auth/register     Create account
POST   /api/auth/login        Login → returns JWT
GET    /api/auth/me           Get current user (auth required)
```

### Boards
```
GET    /api/boards            Get all boards for user
POST   /api/boards            Create board
GET    /api/boards/:id        Get board details
PUT    /api/boards/:id        Update board
DELETE /api/boards/:id        Archive board
POST   /api/boards/:id/invite Invite member by email
```

Every board/task route is guarded by role: `viewer` (read), `member` (read + write), `admin` (full control incl. delete).

### Tasks
```
GET    /api/tasks/board/:boardId    Get tasks (paginated: ?page&limit)   viewer+
POST   /api/tasks/board/:boardId    Create task                          member+
PUT    /api/tasks/:taskId           Update task                          member+
PATCH  /api/tasks/:taskId/move      Move task (drag-drop)                member+
DELETE /api/tasks/:taskId           Delete task                          admin
POST   /api/tasks/:taskId/comments  Add comment                          member+
```

### Analytics
```
GET    /api/analytics/board/:boardId    Board analytics
GET    /api/analytics/user              User-level analytics
```

---

## Future Improvements (Roadmap)

- [x] Role-based access control middleware
- [x] Backend integration test suite
- [ ] Real-time collaboration with Socket.io
- [ ] File attachments on tasks
- [ ] Board templates
- [ ] Notifications system (email via NodeMailer)
- [ ] Mobile app (React Native)
- [ ] Export board to CSV/PDF
