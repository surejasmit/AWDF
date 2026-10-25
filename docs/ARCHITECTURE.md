# AWDF Architecture & Design Specification

## 1. System Overview

The AWDF platform is a decoupled, modern full-stack web application designed for developer portfolio presentation and private task management with user authentication.

```mermaid
graph TD
    subgraph Client["Client Tier (frontend/)"]
        A[React 19 + Vite 8 SPA]
        A --> B[Portfolio View]
        A --> C[GitHub Repos Explorer]
        A --> D[Protected Todo Manager]
        A --> E[AuthModal]
    end

    subgraph Server["Server Tier (backend/)"]
        F[Express 5 REST API]
        G[Auth Middleware & JWT]
        H[Validation Middleware]
        I[Auth Service / Controller]
        J[Task Service / Controller]
        K[Health Controller]
    end

    subgraph Database["Data Tier (MongoDB)"]
        L[Users Collection]
        M[Tasks Collection]
    end

    A -->|HTTP / JSON Requests| F
    F --> G
    G --> H
    H --> I
    H --> J
    F --> K
    I -->|Mongoose ODM| L
    J -->|Mongoose ODM| M
```

---

## 2. Database Schema & Data Model (ERD)

```mermaid
erDiagram
    USER ||--o{ TASK : "owns / manages"
    USER {
        ObjectId _id PK "Unique user identifier"
        string name "User full name"
        string email UK "Unique lowercase email"
        string password "Bcrypt hashed password"
        datetime createdAt "Creation timestamp"
        datetime updatedAt "Update timestamp"
    }

    TASK {
        ObjectId _id PK "Unique task identifier"
        string title "Task description / title"
        boolean completed "Task completion flag (default: false)"
        ObjectId user FK "Reference to owning User _id"
        datetime createdAt "Creation timestamp"
        datetime updatedAt "Update timestamp"
    }
```

### Database Indices:
- **`User.email`**: Unique index (`{ email: 1 }`), ensuring zero duplicate email registrations.
- **`Task.user` & `Task.createdAt`**: Compound index (`{ user: 1, createdAt: -1 }`), guaranteeing index-covered sorting and instantaneous task retrieval for each user.

---

## 3. Authentication & Authorization Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant Frontend as React Client
    participant Server as Express Server
    participant DB as MongoDB

    Note over User, DB: User Registration Flow
    User->>Frontend: Fill registration form (Name, Email, Password)
    Frontend->>Server: POST /auth/register { name, email, password }
    Server->>Server: Validate payload (email format, pass min 6 chars)
    Server->>DB: Check if email already exists
    Server->>Server: Hash password with bcrypt (10 salt rounds)
    Server->>DB: Save User document
    Server->>Server: Sign JWT token with JWT_SECRET (1h expiry)
    Server-->>Frontend: 201 Created { success: true, token, user }
    Frontend->>Frontend: Store auth_token & auth_user in localStorage

    Note over User, DB: Authenticated Task Access
    User->>Frontend: Load Todo Manager
    Frontend->>Server: GET /tasks (Header: Authorization: Bearer <token>)
    Server->>Server: Verify JWT signature and expiration
    Server->>DB: Query Task.find({ user: token.id }).sort({ createdAt: -1 })
    DB-->>Server: User's task documents
    Server-->>Frontend: 200 OK [ tasks array ]
    Frontend-->>User: Render task list
```

---

## 4. Strict User Isolation Guarantees

1. **No Cross-User Leaks**: Every CRUD operation against tasks explicitly requires the `user` field matching `req.user.id` decoded from the valid JWT:
   ```js
   const task = await Task.findOne({ _id: taskId, user: req.user.id });
   ```
2. **Resource Concealment (404 instead of 403)**: If User A attempts to view, modify, or delete a task belonging to User B, the server responds with `404 Not Found`, giving zero information about the existence of other users' tasks.
3. **No Unhashed Passwords**: Passwords never enter the database in plaintext. Passwords are automatically stripped before sending JSON responses back to the client.
