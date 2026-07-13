# AGENTS.md

## Structure

All application code lives under `Frontend/`, not the repo root. Run every command from `Frontend/`.

## Commands

All from `Frontend/`:

```
npm run dev      # Vite dev server
npm run build    # Production build (output: dist/)
npm run lint     # ESLint (JS/JSX only)
npm run preview  # Preview production build
```

No test runner, TypeScript, or typecheck is configured.

## Code conventions

- Plain JavaScript + JSX (no TypeScript)
- Vite 8 + React 19
- ESLint flat config with `react-hooks` and `react-refresh` plugins
- Components in `src/component/`, each with a co-located `.css` file (e.g. `NavBar.jsx` + `NavBar.css`)
- No component index files; imports reference files directly
- All data (skills, student info) is hardcoded in `App.jsx` — no API calls or env vars
