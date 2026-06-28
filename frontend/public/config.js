window.env = [
  {
    source: "http://localhost:5173",
    target: { API_BASE_URL: "http://localhost:8080" }
  },
  {
    source: "https://smurl-chi.vercel.app",
    target: { API_BASE_URL: "https://smurl-production.up.railway.app" }
  },
  {
    source: "https://app.example.com",
    target: { API_BASE_URL: "https://api.example.com" }
  }
];
