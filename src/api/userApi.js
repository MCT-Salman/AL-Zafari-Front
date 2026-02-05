import axiosInstance from './axiosConfig';

export const userApi = {
  // Get all users
  getUsers: async () => {
    try {
      const response = await axiosInstance.get('/user');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في جلب المستخدمين' };
    }
  },

  // Get user by ID
  getUserById: async (userId) => {
    try {
      const response = await axiosInstance.get(`/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في جلب بيانات المستخدم' };
    }
  },

  // Create user
  createUser: async (userData) => {
    try {
      const response = await axiosInstance.post('/user', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في إنشاء المستخدم' };
    }
  },

  // Update user
  updateUser: async (userId, userData) => {
    try {
      const response = await axiosInstance.put(`/user/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في تحديث المستخدم' };
    }
  },

  // Toggle user status
  // Toggle user status
  toggleUserStatus: async (userId) => {
    try {
      const response = await axiosInstance.patch(`/user/${userId}/toggle-status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في تغيير حالة المستخدم' };
    }
  },

  // Delete user
  deleteUser: async (userId) => {
    try {
      const response = await axiosInstance.delete(`/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'فشل في حذف المستخدم' };
    }
  },
};
