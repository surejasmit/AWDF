# AWDF — Full-Stack Developer Portfolio & Task Management Platform

A production-ready full-stack application featuring a developer portfolio, GitHub repositories explorer, and a secure, user-isolated Task Management system powered by **React 19**, **Vite 8**, **Node.js / Express 5**, and **MongoDB (Mongoose)** with **JWT Bearer Authentication**.

---

## 🌟 Key Features

### 1. Developer Portfolio (`/`)
- **Hero Header**: Profile presentation with dynamic accent color switcher (Purple, Teal, Orange, Rose, Blue).
- **About Section**: Professional background, education timeline, and core technical focus areas.
- **Skills Matrix**: Visual animated progress indicators categorized by Frontend, Languages, and Cloud/DevOps.
- **Contact & Footer**: Direct email and social links (GitHub, LinkedIn) with theme-adaptive styling.

### 2. GitHub Repositories Explorer (`/github/:username`)
- **Route**: `/github/surejasmit`
- Fetches all public repositories in real-time via the GitHub REST API.
- iOS-style grouped list design with language indicator badges, stargazer counts, and fork tags.

### 3. Secure Task Manager (`/task`, `/todo`)
- **Strict User Isolation**: All tasks are strictly scoped to the authenticated user's MongoDB ObjectId.
- **Authentication**: JWT Bearer token authentication with bcrypt password hashing (10 salt rounds).
- **CRUD Operations**: Create tasks, view personal task list, toggle completion status, update titles, and delete tasks.
- **Interactive Auth Modal**: Seamless tab-switching between Sign In and Sign Up with client and server-side validation.

---

## 📁 Project Structure

```
AWDF/
├── frontend/                          # Client-side React 19 + Vite 8 application
│   ├── public/                        # Static assets (favicon, icons)
│   ├── src/
│   │   ├── assets/                    # Images (hero.png, vite.svg, react.svg)
│   │   ├── component/                 # UI Components (with co-located CSS)
│   │   │   ├── About.jsx & About.css
│   │   │   ├── AuthModal.jsx & AuthModal.css
│   │   │   ├── Footer.jsx & Footer.css
│   │   │   ├── Github.jsx & Github.css
│   │   │   ├── Header.jsx & Header.css
│   │   │   ├── NavBar.jsx & NavBar.css
│   │   │   ├── Skills.jsx & Skills.css
│   │   │   └── Todo.jsx & Todo.css
│   │   ├── config/
│   │   │   └── config.js              # Central API configuration (MongoDB endpoints)
│   │   ├── services/
│   │   │   └── api.js                 # API service layer (authService, taskService)
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── package.json
│   └── .env.example
│
├── backend/                           # Server-side Express 5 + Mongoose application
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # Robust MongoDB connection manager
│   │   ├── controllers/
│   │   │   ├── authController.js      # Register, login, profile handlers
│   │   │   ├── taskController.js      # Task CRUD handlers
│   │   │   └── healthController.js    # Health check & system readiness
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT Bearer token validation
│   │   │   ├── validate.js            # Input & ObjectId validation
│   │   │   └── errorHandler.js        # Centralized HTTP error & 404 handler
│   │   ├── models/
│   │   │   ├── User.js                # Mongoose User model with bcrypt & unique email
│   │   │   └── Task.js                # Mongoose Task model with compound index
│   │   ├── routes/
│   │   │   ├── authRoutes.js          # /auth & /api/auth routes
│   │   │   ├── taskRoutes.js          # /tasks & /api/tasks routes
│   │   │   └── healthRoutes.js        # /health & / routes
│   │   ├── services/
│   │   │   ├── authService.js         # Auth business logic & JWT signing
│   │   │   └── taskService.js         # Pure MongoDB queries with user isolation
│   │   ├── app.js                     # Express application configuration
│   │   └── server.js                  # Server entry point & graceful shutdown
│   ├── tests/
│   │   └── test-runner.js             # 34-assertion automated test suite
│   ├── package.json
│   └── .env.example
│
├── docs/
│   ├── API.md                         # Complete API documentation & request catalog
│   └── ARCHITECTURE.md                # System architecture, ERD & data flow diagrams
│
├── scripts/
│   └── test-runner.js                 # Cross-platform test execution helper
│
├── AGENTS.md                          # Guidelines for coding assistants
├── .gitignore                         # Production gitignore
└── README.md                          # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24+ supported)
- **MongoDB**: Local MongoDB instance (e.g. `mongodb://127.0.0.1:27017/taskmanager`) or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string.

---

### Step 1: Clone and Configure Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/taskmanager
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=1h
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
npm start
# Or for live reload during development:
npm run dev
```

The backend will start at `http://localhost:5000`. Verify with `http://localhost:5000/health`.

---

### Step 2: Configure and Start Frontend

```bash
cd Frontend
npm install
cp .env.example .env
```

Edit `Frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

Start the frontend Vite dev server:
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

Run the complete 34-assertion test suite verifying Health, Registration, Login, JWT Validation, CRUD, User Isolation, and Edge Cases:

```bash
cd backend
npm test
```

Or from root:
```bash
node scripts/test-runner.js
```

### Test Coverage Summary:
- **Category A (Health & Readiness)**: 3 tests (Root status, `/health`, `/api/health`).
- **Category B (Authentication Validation)**: 7 tests (Missing name, short name, missing email, invalid email, short password, missing login fields).
- **Category C (Authorization & JWT)**: 3 tests (Missing Bearer token, invalid token, unauthenticated profile).
- **Category D (Database CRUD & Auth)**: 13 tests (Registration, duplicate check, login, profile, task create, fetch all, fetch by ID, update, patch, delete).
- **Category E (User Isolation)**: 5 tests (Strict boundary: User B cannot view, modify, or delete User A's tasks; 404 security concealment).
- **Category F (Edge Cases & Errors)**: 3 tests (Invalid ObjectId format, empty update payload, 404 route handling).

---

## ☁️ MongoDB Atlas Configuration Guide

To connect the application to a cloud MongoDB Atlas cluster:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a new cluster (or select an existing one).
3. Under **Security → Database Access**, create a database user with `readWriteAnyDatabase` or permissions on `taskmanager`.
4. Under **Security → Network Access**, add your IP address (or `0.0.0.0/0` for cloud deployment).
5. Under **Database → Deployment → Connect**, select **"Drivers"** (Node.js) and copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/taskmanager?retryWrites=true&w=majority
   ```
6. Update `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/taskmanager?retryWrites=true&w=majority
   ```
7. Start your backend (`npm start`). Mongoose will connect automatically with connection pooling.

---

## 🔒 Security Summary

- **Pure MongoDB**: All Firebase dependencies, keys, and RTDB calls have been completely purged.
- **Password Protection**: Passwords are saved with bcrypt hashing (10 salt rounds) and never returned in API payloads.
- **User Isolation**: All queries enforce `{ user: req.user.id }` ensuring zero cross-tenant data leaks.
- **Input Validation**: Server-side validation middleware rejects malformed, empty, or malicious payloads before database interaction.
- **CORS Protection**: Restricted to configured origins in production.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
