import axios from 'axios';

const apiUrl = import.meta.env.VITE_SYBIL_API_URL || 'http://127.0.0.1:5000/api/v1';

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  timeout: 600000,
});

api.interceptors.response.use(
  async (res) => {
    return res;
  },
  async (err) => {
    const originalConfig = err.config;
    if (err.response && err.response.status === 401 && !originalConfig._retry) {
      originalConfig._retry = true;
      try {
        await axios.post(apiUrl + 'users/refresh_token', {}, { withCredentials: true });
        await axios.post(apiUrl + 'users/verify-token', {}, { withCredentials: true });
        return api(originalConfig);
      } catch (_error) {
        return Promise.reject(_error);
      }
    }
    return Promise.reject(err);
  }
);
