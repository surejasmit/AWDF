# AGENTS.md

## Project Structure

The project is structured into two main applications:
- `Frontend/`: React 19 + Vite 8 frontend application.
- `backend/`: Express 5 + MongoDB (Mongoose) REST API.
- `docs/`: API & Architecture documentation.
- `scripts/`: Development and test runner scripts.

## Commands

### Frontend Commands (from `Frontend/`):
```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # Production build (output: dist/)
npm run lint     # ESLint check
npm run preview  # Preview production build
```

### Backend Commands (from `backend/`):
```bash
npm start        # Start Express server (http://localhost:5000)
npm run dev      # Start with file watcher
npm test         # Run automated API & integration test suite (34 tests)
```

## Architecture & Code Conventions

- **Database**: Pure MongoDB via Mongoose. No Firebase.
- **Authentication**: JWT Bearer token authentication with bcrypt password hashing (10 rounds).
- **Task Isolation**: Every task database query MUST include `{ user: req.user.id }`.
- **Frontend**: Plain JavaScript + JSX (no TypeScript), React 19, Vite 8.
- **Components**: Co-located JSX + CSS in `Frontend/src/component/`.
- **API Endpoints**: Centralized in `Frontend/src/config/config.js` and `Frontend/src/services/api.js`.
