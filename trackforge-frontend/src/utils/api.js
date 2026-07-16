import axios from 'axios';

const api = axios.create({
  baseURL: 'https://placement-os-fdyy.vercel.app/api/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let tokenStore = {
  accessToken: null,
};

export const setAccessToken = (token) => {
  tokenStore.accessToken = token;
};

export const getAccessToken = () => {
  return tokenStore.accessToken;
};

// Request interceptor to add Authorization header
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 Unauthorized and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          // Attempt to get a new access token
          const res = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );
          
          const { accessToken } = res.data.data;
          setAccessToken(accessToken);
          
          // Update original request auth header and retry
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token is invalid/expired - clear tokens and force redirect/logout
          localStorage.removeItem('refreshToken');
          setAccessToken(null);
          window.dispatchEvent(new Event('auth_logout_redirect'));
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
