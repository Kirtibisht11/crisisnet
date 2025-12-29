import axios from "axios";

const BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.token = token;
  return config;
});

export const simulateCrisis = async () => {
  const res = await api.post("/api/alerts/mock");
  return res.data;
};

export default api;
