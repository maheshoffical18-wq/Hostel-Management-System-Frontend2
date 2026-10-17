import axios from "axios";
const api = axios.create({
  baseURL: "https://hostel-management-system-backend-2.onrender.com/api",
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hostel_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export default api;
