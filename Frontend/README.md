# AWDF Frontend Application

The React 19 + Vite 8 frontend for the AWDF developer portfolio and task management application.

## Quick Start

```bash
npm install
npm run dev      # Start Vite dev server on http://localhost:5173
npm run build    # Production build to dist/
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Environment Configuration

Configure `VITE_API_BASE_URL` in `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Code Conventions
- Plain JavaScript + JSX (no TypeScript)
- Components located in `src/component/` with co-located `.css` files
- Centralized API endpoints configured in `src/config/config.js`
- API services in `src/services/api.js`
- Pure REST client interacting directly with the Express + MongoDB backend
