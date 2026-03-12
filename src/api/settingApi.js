// src\api\settingApi.js
import axiosInstance from './axiosConfig';
import { handleApiError } from "../utils/errorHandler";

export const settingApi = {
  // Get all settings
  getSettings: async () => {
    try {
      const response = await axiosInstance.get('/setting');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في جلب الإعدادات' };
    }
  },

  // Get setting by key
  getSettingByKey: async (key) => {
    try {
      const response = await axiosInstance.get(`/setting/key/${key}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في جلب الإعداد' };
    }
  },

  // Create setting
  createSetting: async (settingData) => {
    try {
      const response = await axiosInstance.post('/setting', settingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في إنشاء الإعداد' };
    }
  },

  // Update setting by ID
  updateSettingById: async (id, settingData) => {
    try {
      const response = await axiosInstance.put(`/setting/id/${id}`, settingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في تحديث الإعداد' };
    }
  },

  // Update setting by key
  updateSettingByKey: async (key, settingData) => {
    try {
      const response = await axiosInstance.put(`/setting/key/${key}`, settingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في تحديث الإعداد' };
    }
  },

  // Delete setting by ID
  deleteSetting: async (id) => {
    try {
      const response = await axiosInstance.delete(`/setting/id/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في حذف الإعداد' };
    }
  },

  // --- Discounts Management ---

  getDiscounts: async () => {
    try {
      const response = await axiosInstance.get('/setting/discounts');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في جلب الخصومات' };
    }
  },

  createDiscount: async (data) => {
    try {
      const response = await axiosInstance.post('/setting/discounts', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في إنشاء الخصم' };
    }
  },

  updateDiscount: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/setting/discounts/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في تحديث الخصم' };
    }
  },

  deleteDiscount: async (id) => {
    try {
      const response = await axiosInstance.delete(`/setting/discounts/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في حذف الخصم' };
    }
  },

  // --- Logs ---

  getExchangeRateLogs: async () => {
    try {
      const response = await axiosInstance.get('/setting/exchange-rate-log');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في جلب سجلات تبديل الصرف' };
    }
  },
};
