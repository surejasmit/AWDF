import { useReducer, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Github.css';

function reposReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { loading: false, repos: action.payload, error: null };
    case 'FETCH_ERROR':
      return { loading: false, repos: [], error: action.payload };
    default:
      return state;
  }
}

const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Shell: '#89e051',
  PHP: '#4F5D95',
};

const Github = ({ themeColor }) => {
  const { username } = useParams();
  const [{ repos, loading, error }, dispatch] = useReducer(reposReducer, {
    repos: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    dispatch({ type: 'FETCH_START' });

    fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`)
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      })
      .catch((err) => {
        dispatch({ type: 'FETCH_ERROR', payload: err.message });
      });
  }, [username]);

  return (
    <div className="gh-page">
      <div className="gh-nav">
        <Link to="/" className="gh-back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Portfolio</span>
        </Link>
        <h1 className="gh-title">Repositories</h1>
      </div>

      {loading && (
        <div className="gh-loading">
          <div className="gh-spinner"></div>
        </div>
      )}

      {error && (
        <div className="gh-error">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>Could not load repositories</p>
          <span className="gh-error-detail">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="gh-list">
          {repos.map((repo) => (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="gh-row"
            >
              <div className="gh-row-icon" style={{ backgroundColor: langColor(repo.language) || '#8e8e93' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </div>
              <div className="gh-row-body">
                <div className="gh-row-top">
                  <span className="gh-row-name">{repo.name}</span>
                  {repo.fork && <span className="gh-badge">Fork</span>}
                </div>
                <span className="gh-row-desc">{repo.description || 'No description'}</span>
                <div className="gh-row-meta">
                  {repo.language && (
                    <span>
                      <span className="gh-dot" style={{ backgroundColor: LANG_COLORS[repo.language] || '#8e8e93' }}></span>
                      {repo.language}
                    </span>
                  )}
                  <span>&#9733; {repo.stargazers_count}</span>
                </div>
              </div>
              <svg className="gh-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

function langColor(lang) {
  return LANG_COLORS[lang] || '#8e8e93';
}

export default Github;
