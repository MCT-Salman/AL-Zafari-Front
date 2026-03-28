// src/api/sliteApi.js
import { getApiData } from "../utils/api";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

class SliteApi {
  async getSlites(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page);
      if (params.limit) queryParams.append("limit", params.limit);
      if (params.search) queryParams.append("search", params.search);

      const url = `${API_BASE_URL}/slite${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch slites");
      }
      return data;
    } catch (error) {
      console.error("Error fetching slites:", error);
      throw error;
    }
  }

  async createSlite(payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/slite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create slite");
      }
      return data;
    } catch (error) {
      console.error("Error creating slite:", error);
      throw error;
    }
  }

  async updateSlite(id, payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/slite/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update slite");
      }
      return data;
    } catch (error) {
      console.error("Error updating slite:", error);
      throw error;
    }
  }

  async deleteSlite(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/slite/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete slite");
      }
      return data;
    } catch (error) {
      console.error("Error deleting slite:", error);
      throw error;
    }
  }

  async deleteSlites(ids = []) {
    try {
      const response = await fetch(`${API_BASE_URL}/slite/all`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({ ids })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete slites");
      }
      return data;
    } catch (error) {
      console.error("Error deleting slites:", error);
      throw error;
    }
  }
}

export const sliteApi = new SliteApi();
