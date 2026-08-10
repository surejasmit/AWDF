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

### Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Realtime Database
3. Set database rules for read/write access:

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

4. Update `PROJECT_ID` and `RTDB_BASE_URL` in `config.js`

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
