window.env = [
  {
    source: "http://localhost:5173",
    target: { API_BASE_URL: "http://localhost:8080" }
  },
  {
    source: "https://staging.example.com",
    target: { API_BASE_URL: "https://staging-api.example.com" }
  },
  {
    source: "https://app.example.com",
    target: { API_BASE_URL: "https://api.example.com" }
  }
];
