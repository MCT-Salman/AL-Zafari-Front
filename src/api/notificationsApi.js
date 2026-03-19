// src/api/notificationsApi.js

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

class NotificationsApi {
  async getMyNotifications() {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/my`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch notifications");
      }
      return data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  async getUnreadCount() {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch unread count");
      }
      return data;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      throw error;
    }
  }

  async markRead(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to mark notification as read");
      }
      return data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  async markAllRead() {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to mark all notifications as read");
      }
      return data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }
}

export const notificationsApi = new NotificationsApi();
