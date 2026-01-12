import axios from "axios";

const BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  if (token) config.headers.token = token;
  return config;
});

export const simulateCrisis = async () => {
  // Call backend simulate endpoint
  const res = await api.post("/simulate/crisis");
  return res.data;
};

export const runPipeline = async () => {
  const res = await api.post('/pipeline/run');
  return res.data;
};

export const getResources = async () => {
  const res = await api.get('/api/resource/resources');
  return res.data;
};

export const setResourceAvailability = async (id, payload) => {
  const res = await api.put(`/api/resource/resources/${id}/availability`, payload);
  return res.data;
};

export const getVolunteers = async () => {
  const res = await api.get('/api/resource/volunteers');
  return res.data;
};

export const setVolunteerAvailability = async (id, payload) => {
  const res = await api.put(`/api/resource/volunteers/${id}/availability`, payload);
  return res.data;
};

export const getVolunteerRequests = async () => {
  const res = await api.get('/api/resource/volunteer_requests');
  return res.data;
};

export const createAssignment = async (payload) => {
  const res = await api.post('/api/resource/assignments', payload);
  return res.data;
};

export const getUserLocation = async () => {
  const res = await api.get('/api/geo/location');
  return res.data;
};

export default api;
