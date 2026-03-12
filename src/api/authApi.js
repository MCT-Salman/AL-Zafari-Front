// src\api\authApi.js
import axiosInstance from './axiosConfig';
import { handleApiError } from "../utils/errorHandler";

export const authApi = {
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'حدث خطأ في الاتصال');
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await axiosInstance.post('/auth/logout', { refreshToken });
    } catch (error) {
      throw handleApiError(error, 'حدث خطأ في تسجيل الخروج');
    } finally {
      localStorage.clear();
    }
  },

  register: async (userData) => {
    try {
      const response = await axiosInstance.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'حدث خطأ في التسجيل');
    }
  },

  getProfile: async () => {
    try {
      const response = await axiosInstance.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'حدث خطأ في جلب البيانات');
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await axiosInstance.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'حدث خطأ في تحديث الملف الشخصي');
    }
  },

  validateToken: async (token) => {
    try {
      const response = await axiosInstance.post('/auth/validate-token', { token });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'فشل التحقق من التوكن');
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      const response = await axiosInstance.post('/auth/refresh', { refreshToken });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'فشل تجديد التوكن');
    }
  },

  forgotPassword: async (phone) => {
    try {
      const response = await axiosInstance.post('/auth/forgot-password', { phone });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'فشل في إرسال رمز التحقق');
    }
  },

  verifyOtp: async (phone, otp) => {
    try {
      const response = await axiosInstance.post('/auth/verify-otp', { phone, otp });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'فشل التحقق من الرمز');
    }
  },

  resetPassword: async (resetToken, newPassword) => {
    try {
      const response = await axiosInstance.post('/auth/reset-password', { 
        resetToken, 
        newPassword 
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'فشل في تغيير كلمة المرور');
    }
  }
};