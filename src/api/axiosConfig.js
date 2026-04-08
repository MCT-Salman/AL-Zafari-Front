// src\api\axiosConfig.js
import axios from 'axios';
import { isLoggingOut } from '@/utils/authSession';

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
    if (isLoggingOut()) {
      return Promise.reject(new axios.Cancel("Logout in progress"));
    }

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
    if (axios.isCancel(error) || isLoggingOut()) {
      return Promise.reject(error);
    }

    // console.error('API Response Error:', {
    //   status: error.response?.status,
    //   url: error.config?.url,
    //   message: error.message,
    //   data: error.response?.data,
    // });

    // Normalize error message to server message or details if present
    const respData = error.response?.data;
    let serverMessage = null;
    if (respData) {
      if (respData.details) serverMessage = typeof respData.details === 'string' ? respData.details : JSON.stringify(respData.details);
      else if (respData.message) serverMessage = respData.message;
      else if (respData.error) serverMessage = respData.error;
      else if (typeof respData === "string") serverMessage = respData;
      else if (respData.errors) serverMessage = JSON.stringify(respData.errors);
    }
    if (serverMessage) {
      error.message = serverMessage;
    }

    const originalRequest = error.config;

    // تجديد التوكن إذا كان منتهي الصلاحية
    if (error.response?.status === 401 && !originalRequest._retry && !isLoggingOut()) {
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
