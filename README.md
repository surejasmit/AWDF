# Portfolio — React Developer Portfolio with Todo App

A modern React portfolio application featuring a personal portfolio site, GitHub repositories explorer, and a full-stack Todo/Task Manager with Firebase Realtime Database backend.

## Features

### Home Page (`/`)

- Hero section with name, title, and university info
- Smooth scroll-based active section highlighting
- Dynamic theme color support via NavBar
- Integrated Todo/Task Manager widget

### About Section

- Personal bio and background information
- University details
- Responsive design with theme color support

### Skills Section

- Visual skill level bars (percentage-based)
- Categorized skills (Frontend, Languages, Cloud/DevOps)
- Animated progress indicators

### Contact / Footer

- Social links (GitHub, LinkedIn)
- Email contact
- Theme color integration

### GitHub Repositories Page (`/github/:username`)

- Route: `/github/surejasmit`
- Fetches all public repos via GitHub REST API (`https://api.github.com/users/{username}/repos`)
- iOS-style grouped table UI (SF font, frosted nav bar, 0.5px separators)
- Each row shows: repo name, description, language dot, star count, fork badge
- Rows open the repo in a new tab
- Loading spinner and error state included
- Dark mode support (follows `prefers-color-scheme`)

### Todo / Task Manager (`/todo`, `/task`, `/task/:id`)

- Full CRUD operations (Create, Read, Update, Delete)
- Firebase Realtime Database backend
- Toggle task completion status
- Edit existing tasks inline
- Real-time sync with Firebase
- Error handling with user-friendly messages
- Loading states and empty state UI
- Responsive design

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomePage | Main portfolio with all sections |
| `/github/:username` | Github | GitHub repos explorer |
| `/todo` | Todo | Task Manager |
| `/todo/:id` | Todo | Task Manager (specific task) |
| `/task` | Todo | Task Manager (alias) |
| `/task/all` | Todo | Task Manager (all tasks) |
| `/task/:id` | Todo | Task Manager (specific task) |

## Tech Stack

- **Frontend:** React 19, Vite 8
- **Routing:** React Router DOM 7
- **HTTP Client:** Axios, Fetch API
- **Backend:** Firebase Realtime Database (or local Express API)
- **Styling:** Plain CSS with CSS Modules pattern
- **Linting:** ESLint with React Hooks & React Refresh plugins

## Project Structure

```
Frontend/
├── public/
├── src/
│   ├── assets/
│   ├── component/
│   │   ├── About.jsx / About.css
│   │   ├── Footer.jsx / Footer.css
│   │   ├── Github.jsx / Github.css
│   │   ├── Header.jsx / Header.css
│   │   ├── NavBar.jsx / NavBar.css
│   │   ├── Skills.jsx / Skills.css
│   │   ├── Todo.jsx / Todo.css
│   │   └── content.jsx
│   ├── config/
│   │   └── config.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── package.json
├── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```sh
git clone <repository-url>
cd Frontend
npm install
```

### Configuration

Edit `src/config/config.js` to switch between Firebase and local API:

```js
export const CONFIG = {
  MODE: "firebase_rtdb", // or "local_api"
  FIREBASE: {
    PROJECT_ID: "your-project-id",
    COLLECTION: "tasks",
    RTDB_BASE_URL: "https://your-project.firebaseio.com",
  },
  LOCAL_API: {
    BASE_URL: "http://localhost:5000",
    ENDPOINT_PATH: "/data/your-endpoint",
  },
};
```

### Firebase Realtime Database Setup

#### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter project name (e.g., `my-todo-app`)
4. Disable Google Analytics (optional) and click **"Create project"**

#### Step 2: Enable Realtime Database

1. In the left sidebar, click **"Realtime Database"**
2. Click **"Create Database"**
3. Choose a location (e.g., `us-central1`)
4. Select **"Start in test mode"** and click **"Enable"**

#### Step 3: Get Database URL

After creating the database, you'll see a URL like:

```
https://<your-project-id>-default-rtdb.firebaseio.com
```

Copy this URL — it goes into `config.js`.

#### Step 4: Set Database Rules

In the Realtime Database console, go to **"Rules"** tab and paste:

```json
{
  "rules": {
    "tasks": {
      ".read": true,
      ".write": true
    }
  }
}
```

Click **"Publish"** to apply.

> **Warning:** The above rules allow public read/write. For production, add authentication:

```json
{
  "rules": {
    "tasks": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

#### Step 5: Configure `config.js`

```js
// src/config/config.js
export const CONFIG = {
  MODE: "firebase_rtdb",

  FIREBASE: {
    PROJECT_ID: "awdf-ba2b7",                    // Your Firebase project ID
    COLLECTION: "tasks",                          // Database node name
    RTDB_BASE_URL: "https://awdf-ba2b7-default-rtdb.firebaseio.com",
  },
};
```

#### How the Connection Works

The app constructs REST API endpoints from the config:

| Operation | Method | Endpoint |
|-----------|--------|----------|
| **Read all tasks** | `GET` | `https://<project>.firebaseio.com/tasks.json` |
| **Create task** | `POST` | `https://<project>.firebaseio.com/tasks.json` |
| **Update task** | `PATCH` | `https://<project>.firebaseio.com/tasks/<id>.json` |
| **Delete task** | `DELETE` | `https://<project>.firebaseio.com/tasks/<id>.json` |

#### Response Format

Firebase returns data as a nested object with keys as IDs:

```json
{
  "-Nxabc123": {
    "text": "Buy groceries",
    "completed": false
  },
  "-Nxdef456": {
    "text": "Learn React",
    "completed": true
  }
}
```

The app parses this into an array:

```js
[
  { id: "-Nxabc123", text: "Buy groceries", completed: false },
  { id: "-Nxdef456", text: "Learn React", completed: true }
]
```

#### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `403 Forbidden` | Database rules block access | Update rules to allow read/write |
| `404 Not Found` | Wrong project ID or collection name | Check `PROJECT_ID` and `COLLECTION` in config |
| `Network Error` | Firebase URL incorrect | Verify `RTDB_BASE_URL` format |

#### Switch to Local API (Optional)

To use a local Express server instead of Firebase:

```js
export const CONFIG = {
  MODE: "local_api",

  LOCAL_API: {
    BASE_URL: "http://localhost:5000",
    ENDPOINT_PATH: "/data/your-endpoint",
  },
};
```

Ensure your Express server is running on port 5000 with the same CRUD endpoints.

### Development

```sh
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Files Changed / Added

| File | Description |
|------|-------------|
| `src/App.jsx` | Main app with Routes (/, /github/:username, /todo, /task) |
| `src/main.jsx` | Entry point with BrowserRouter |
| `src/component/NavBar.jsx` | Navigation with section links & theme toggle |
| `src/component/Header.jsx` | Hero section with personal info |
| `src/component/About.jsx` | About section |
| `src/component/Skills.jsx` | Skills display with progress bars |
| `src/component/Github.jsx` | GitHub repos fetcher & renderer |
| `src/component/Todo.jsx` | Task Manager with Firebase integration |
| `src/component/Footer.jsx` | Contact section with social links |
| `src/config/config.js` | Centralized API configuration |

## License

This project is open source and available under the [MIT License](LICENSE).
