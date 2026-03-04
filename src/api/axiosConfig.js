// src\api\axiosConfig.js
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

// console.log('API Base URL:', baseURL);

const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// طلب interceptor لإضافة التوكن
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // console.log('API Request:', {
    //   method: config.method,
    //   url: config.url,
    //   baseURL: config.baseURL,
    //   fullURL: config.baseURL + config.url,
    //   hasToken: !!token,
    // });
    return config;
  },
  (error) => {
    // console.error('Request Error:');
    return Promise.reject(error);
  }
);

// رد interceptor للتعامل مع الأخطاء
axiosInstance.interceptors.response.use(
  (response) => {
    // console.log('API Response Success:', {
    //   status: response.status,
    //   url: response.config.url,
    //   data: response.data,
    // });
    return response;
  },
  async (error) => {
    // console.error('API Response Error:', {
    //   status: error.response?.status,
    //   url: error.config?.url,
    //   message: error.message,
    //   data: error.response?.data,
    // });

    // Normalize error message to server message if present
    const serverMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      (typeof error.response?.data === "string" ? error.response.data : "");
    if (serverMessage) {
      error.message = serverMessage;
    }

    const originalRequest = error.config;

    // تجديد التوكن إذا كان منتهي الصلاحية
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axiosInstance.post('/auth/refresh', { refreshToken });
        const accessToken = response?.data?.data?.accessToken || response?.data?.accessToken;

        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // إعادة توجيه إلى تسجيل الدخول إذا فشل التجديد
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
