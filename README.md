# Portfolio — GitHub Repos Section

A React portfolio app with an iOS-style GitHub repositories page.

## Features Added

### GitHub Repositories Page (`/github/:username`)

- Route: `/github/surejasmit`
- Fetches all public repos via GitHub REST API (`https://api.github.com/users/{username}/repos`)
- iOS-style grouped table UI (SF font, frosted nav bar, 0.5px separators)
- Each row shows: repo name, description, language dot, star count, fork badge
- Rows open the repo in a new tab
- Loading spinner and error state included
- Dark mode support (follows `prefers-color-scheme`)

### Files changed / added

| File | What |
|------|------|
| `src/component/Github.jsx` | New — fetches & renders repos |
| `src/component/Github.css` | New — iOS-style styles |
| `src/App.jsx` | Updated — added `<Routes>` with `/` and `/github/:username` |
| `src/main.jsx` | Updated — wrapped `<App>` in `<BrowserRouter>` |
| `src/component/NavBar.jsx` | Updated — added "GitHub" nav link |
| `package.json` | Added `react-router-dom` dependency |

## Screenshots

### Repositories List

<img width="1917" height="972" alt="image" src="https://github.com/user-attachments/assets/3d63d05d-3b99-4c6c-bb39-4deb808dcc37" />


### Error State

<img width="1917" height="972" alt="image" src="https://github.com/user-attachments/assets/96ced8e7-f59b-46df-8759-e77a0aae4524" />
---

## Commands

```sh
npm run dev      # dev server
npm run build    # production build
npm run lint     # ESLint
npm run preview  # preview production build
```
