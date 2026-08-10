import { useState, useEffect } from 'react';

function FetchGitHubImage() {
  const [imageSrc, setImageSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Replace these variables with your project details
    const owner = 'surejasmit';
    const repo = 'portfolio';
    const path = 'path/to/image.png';
    // Use an environment variable for tokens to protect secrets

    const fetchImage = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);

        if (!response.ok) {
          throw new Error('Failed to fetch image data from GitHub API.');
        }

        const data = await response.json();
        
        // GitHub API returns file contents as a base64 string with line breaks
        const cleanBase64 = data.content.replace(/\s/g, '');
        
        // Formulate a data URI structure based on your file extension
        setImageSrc(`data:image/png;base64,${cleanBase64}`);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchImage();
  }, []);

  if (loading) return <p>Loading image...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h3>Image via GitHub API Fetch</h3>
      <img src={imageSrc} alt="Fetched dynamically from GitHub" />
    </div>
  );
}

export default FetchGitHubImage;
