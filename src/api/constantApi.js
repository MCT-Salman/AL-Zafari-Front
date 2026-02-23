// src\api\constantApi.js
import axiosInstance from './axiosConfig';

export const constantApi = {
  // Constant Types
  getConstantTypes: async () => {
    try {
      const response = await axiosInstance.get('/constant-type');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب أنواع الثوابت' };
    }
  },

  getConstantTypeById: async (id) => {
    try {
      const response = await axiosInstance.get(`/constant-type/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب نوع الثابت' };
    }
  },

  createConstantType: async (data) => {
    try {
      const response = await axiosInstance.post('/constant-type', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إنشاء نوع الثابت' };
    }
  },

  updateConstantType: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/constant-type/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث نوع الثابت' };
    }
  },

  deleteConstantType: async (id) => {
    try {
      const response = await axiosInstance.delete(`/constant-type/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في حذف نوع الثابت' };
    }
  },

  // Constant Values
  getConstantValuesByType: async (type) => {
    try {
      const response = await axiosInstance.get(`/constant-value/by-type/${type}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب القيم الثابتة' };
    }
  },

  getConstantValuesByMaterial: async (materialId, type = null) => {
    try {
      const url = type
        ? `/constant-value/material/${materialId}?type=${type}`
        : `/constant-value/material/${materialId}`;
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في جلب القيم الثابتة' };
    }
  },

  createConstantValue: async (data) => {
    try {
      const response = await axiosInstance.post('/constant-value', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في إنشاء القيمة الثابتة' };
    }
  },

  updateConstantValue: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/constant-value/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في تحديث القيمة الثابتة' };
    }
  },

  deleteConstantValue: async (id) => {
    try {
      const response = await axiosInstance.delete(`/constant-value/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'حدث خطأ في حذف القيمة الثابتة' };
    }
  },
};
