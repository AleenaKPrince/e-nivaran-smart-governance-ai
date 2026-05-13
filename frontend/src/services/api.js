import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
});

api.interceptors.request.use(
  (config) => {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        const token = userData?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (_error) {
      // Ignore malformed localStorage payload and continue without auth header.
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const registerStaff = async (staffData) => {
  return api.post("/staff/register", staffData);
};

export default api;
