import axios from "axios";

// Base URL: Railway Deployment
//const BASE = "https://generatorbackend-new-project.up.railway.app/";
const BASE = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: BASE,    // Axios baut automatisch die vollständige URL
  timeout: 30000,   // 30 Sekunden Timeout
});

export default api;
