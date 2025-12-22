import axios from 'axios';

const api = axios.create({
  baseURL: typeof window !== 'undefined' ? '/api' : (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://intranet-api-esdr.onrender.com'),
  withCredentials: true, // Important for cookies
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for 401 & Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Call refresh endpoint - cookie is sent automatically thanks to withCredentials
        const { data } = await api.post('/auth/refresh');
        
        // Data should contain new accessToken
        // Update localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', data.accessToken);
        }
        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        
        // Notify AuthContext listener if possible (optional for MVP)
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
