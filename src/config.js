// This module exports a configuration object with the appropriate API base URL
// based on the environment (development or production).

// Vite exposes environment variables on the special `import.meta.env` object.
// `import.meta.env.MODE` will be 'development' when running `npm run dev`
// and 'production' when running `npm run build`.

const getApiBaseUrl = () => {
  if (import.meta.env.MODE === 'development') {
    // In development, your backend is likely running on localhost.
    // Replace 'http://127.0.0.1:8000' if your local backend runs on a different port.
    return 'http://127.0.0.1:8000';
  } else {
    // In production, we are using Nginx as a reverse proxy.
    // All API requests should be prefixed with /api.
    return '/api';
  }
};

const config = {
  API_BASE_URL: getApiBaseUrl(),
};

export default config;
