# Task Management & Portfolio API Documentation

Complete specification for the REST API powered by **Node.js**, **Express 5**, and **MongoDB (Mongoose)**.

---

## 1. Base URL & Common Conventions

- **Base URL**: `http://localhost:5000` (or configured `PORT`)
- **Content-Type**: `application/json`
- **Authentication**: Bearer Token in `Authorization` header (`Authorization: Bearer <JWT_TOKEN>`)

### Standard Response Envelope (JSON)

**Success Example:**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "token": "eyJhbGciOi...",
  "user": {
    "id": "65fc1234567890abcdef1234",
    "name": "Smit Sureja",
    "email": "smit@example.com",
    "createdAt": "2026-09-21T10:00:00.000Z"
  }
}
```

**Error Example:**
```json
{
  "success": false,
  "message": "Validation Error: Task title is required and cannot be empty."
}
```

---

## 2. API Endpoints Inventory

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/` | No | Root endpoint overview and service status |
| `GET` | `/health` / `/api/health` | No | System health, uptime & MongoDB connection state |
| `POST` | `/auth/register` | No | Register new user account with bcrypt password hashing |
| `POST` | `/auth/login` | No | Authenticate user credentials and issue 1h JWT |
| `GET` | `/auth/me` | **Yes (Bearer)** | Get current authenticated user profile |
| `GET` | `/tasks` | **Yes (Bearer)** | Fetch all tasks belonging to authenticated user |
| `POST` | `/tasks` | **Yes (Bearer)** | Create new task for authenticated user |
| `GET` | `/tasks/:id` | **Yes (Bearer)** | Fetch single task by ID (validates ownership) |
| `PUT` | `/tasks/:id` | **Yes (Bearer)** | Full update of task title and/or completed status |
| `PATCH` | `/tasks/:id` | **Yes (Bearer)** | Partial update of task title and/or completed status |
| `DELETE` | `/tasks/:id` | **Yes (Bearer)** | Delete task by ID (validates ownership) |

---

## 3. Detailed Endpoint Reference

### A. Health & System Status

#### `GET /health`
- **Purpose**: Verifies that the API server is reachable and reports MongoDB connection health.
- **Headers**: None
- **Response (200 OK / 503 Service Unavailable)**:
```json
{
  "status": "healthy",
  "server": "Task Management API",
  "version": "1.0.0",
  "uptime": "120s",
  "timestamp": "2026-09-21T10:00:00.000Z",
  "database": {
    "provider": "MongoDB",
    "status": "connected",
    "host": "127.0.0.1",
    "name": "taskmanager"
  }
}
```

---

### B. Authentication Endpoints

#### `POST /auth/register`
- **Purpose**: Registers a new user account. Passwords are automatically hashed with bcrypt (10 rounds).
- **Request Body**:
```json
{
  "name": "Smit Sureja",
  "email": "smit@example.com",
  "password": "Password123!"
}
```
- **Validation Rules**:
  - `name`: String, required, min 2 characters.
  - `email`: String, required, valid email regex format, unique across users.
  - `password`: String, required, min 6 characters.
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "User registered successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "67df8b9a1234567890abcdef",
    "name": "Smit Sureja",
    "email": "smit@example.com",
    "createdAt": "2026-09-21T10:00:00.000Z"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Validation failure or email already exists.

#### `POST /auth/login`
- **Purpose**: Authenticates credentials and returns signed JWT token (expires in 1 hour).
- **Request Body**:
```json
{
  "email": "smit@example.com",
  "password": "Password123!"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "67df8b9a1234567890abcdef",
    "name": "Smit Sureja",
    "email": "smit@example.com"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid email or incorrect password.

#### `GET /auth/me`
- **Purpose**: Retrieves profile information for the authenticated user token.
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "67df8b9a1234567890abcdef",
    "name": "Smit Sureja",
    "email": "smit@example.com",
    "createdAt": "2026-09-21T10:00:00.000Z"
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Missing, invalid, or expired token.

---

### C. Task Management Endpoints (CRUD)

#### `GET /tasks`
- **Purpose**: Fetches all tasks created by the authenticated user, sorted by `createdAt` descending.
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
```json
[
  {
    "id": "67df8c101234567890abcdef",
    "title": "Implement MongoDB Schema",
    "text": "Implement MongoDB Schema",
    "completed": false,
    "user": "67df8b9a1234567890abcdef",
    "createdAt": "2026-09-21T10:05:00.000Z",
    "updatedAt": "2026-09-21T10:05:00.000Z"
  }
]
```

#### `POST /tasks`
- **Purpose**: Creates a new task associated with the current user ID.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "title": "Configure production environment variables"
}
```
- **Success Response (201 Created)**:
```json
{
  "id": "67df8c101234567890abcdef",
  "title": "Configure production environment variables",
  "text": "Configure production environment variables",
  "completed": false,
  "user": "67df8b9a1234567890abcdef",
  "createdAt": "2026-09-21T10:10:00.000Z",
  "updatedAt": "2026-09-21T10:10:00.000Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: Empty or missing title.
  - `401 Unauthorized`: Missing or invalid JWT.

#### `GET /tasks/:id`
- **Purpose**: Fetches a single task by its 24-character hexadecimal ObjectId.
- **Path Parameters**: `id` (e.g. `67df8c101234567890abcdef`)
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
```json
{
  "id": "67df8c101234567890abcdef",
  "title": "Configure production environment variables",
  "text": "Configure production environment variables",
  "completed": false,
  "user": "67df8b9a1234567890abcdef",
  "createdAt": "2026-09-21T10:10:00.000Z",
  "updatedAt": "2026-09-21T10:10:00.000Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid ObjectId format.
  - `404 Not Found`: Task does not exist or belongs to another user.

#### `PUT /tasks/:id` / `PATCH /tasks/:id`
- **Purpose**: Updates title, completion status, or both on a specific task owned by user.
- **Path Parameters**: `id` (e.g. `67df8c101234567890abcdef`)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "title": "Configure production environment variables",
  "completed": true
}
```
- **Success Response (200 OK)**:
```json
{
  "id": "67df8c101234567890abcdef",
  "title": "Configure production environment variables",
  "text": "Configure production environment variables",
  "completed": true,
  "user": "67df8b9a1234567890abcdef",
  "createdAt": "2026-09-21T10:10:00.000Z",
  "updatedAt": "2026-09-21T10:15:00.000Z"
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid ID or no fields provided to update.
  - `404 Not Found`: Task not found or unauthorized access attempt.

#### `DELETE /tasks/:id`
- **Purpose**: Permanently removes a task owned by the user from MongoDB.
- **Path Parameters**: `id` (e.g. `67df8c101234567890abcdef`)
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Task deleted successfully."
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid ObjectId format.
  - `404 Not Found`: Task not found or unauthorized access attempt.

---

## 4. User Isolation & Security Model

1. **User Isolation**: Every database query on `Task` contains `{ user: req.user.id }`. User A cannot read, update, or delete any task created by User B under any circumstances.
2. **Password Safety**: Passwords are saved as bcrypt hashes with 10 salt rounds. Passwords are automatically stripped in `toJSON` serialization and excluded from `GET /auth/me` queries.
3. **Token Expiration**: JWT tokens expire after 1 hour (configurable via `JWT_EXPIRES_IN`). Expired tokens immediately return `401 Unauthorized` with a specific `TokenExpiredError` message.
