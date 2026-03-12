// src\api\materialApi.js
import axiosInstance from './axiosConfig';
import { handleApiError } from "../utils/errorHandler";

export const materialApi = {
  // Materials CRUD
  getMaterials: async () => {
    try {
      const response = await axiosInstance.get('/material');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب المواد' };
    }
  },

  getMaterialById: async (id) => {
    try {
      const response = await axiosInstance.get(`/material/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب المادة' };
    }
  },

  createMaterial: async (data) => {
    try {
      const response = await axiosInstance.post('/material', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إنشاء المادة' };
    }
  },

  updateMaterial: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/material/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث المادة' };
    }
  },

  deleteMaterial: async (id) => {
    try {
      const response = await axiosInstance.delete(`/material/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في حذف المادة' };
    }
  },
};
