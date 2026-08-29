import axios from "axios";

// Points at the Express server's /api router (see backend/src/app.js and
// backend/src/routes/url.routes.js). Override with VITE_API_BASE_URL if
// your backend runs somewhere other than localhost:8001.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Every call here maps 1:1 to a route in backend/src/routes/url.routes.js

export const createShortUrl = (payload) => api.post("/url", payload);

export const getAnalytics = (shortId, page = 1, limit = 50) =>
  api.get(`/analytics/${shortId}`, { params: { page, limit } });

export const getAnalyticsSummary = (shortId) =>
  api.get(`/analytics/${shortId}/summary`);

export const getClickTrends = (shortId) =>
  api.get(`/analytics/${shortId}/trends`);

export const getHourlyTrends = (shortId) =>
  api.get(`/analytics/${shortId}/hourly-trends`);

export const getIdDashboard = (shortId) =>
  api.get(`/analytics/${shortId}/dashboard`);

export const getGlobalDashboard = () => api.get("/dashboard");

export default api;
