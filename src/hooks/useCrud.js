// src\hooks\useCrud.js
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Extract error message from error object
 * Handles different error response structures:
 * - { error: "...", details: "..." }
 * - { message: "..." }
 * - { response: { data: { error: "...", details: "..." } } }
 */
const extractErrorMessage = (err, defaultMessage) => {
  // If error is a string, return it
  if (typeof err === 'string') {
    return err;
  }

  // Check for error.response.data (axios error structure)
  if (err?.response?.data) {
    const errorData = err.response.data;
    // Check for { error: "...", details: "..." } structure
    if (errorData.error) {
      return errorData.details ? `${errorData.error}: ${errorData.details}` : errorData.error;
    }
    // Check for { message: "..." } structure
    if (errorData.message) {
      return errorData.message;
    }
  }

  // Check for direct error object { error: "...", details: "..." }
  if (err?.error) {
    return err.details ? `${err.error}: ${err.details}` : err.error;
  }

  // Check for message property
  if (err?.message) {
    return err.message;
  }

  // Return default message if nothing found
  return defaultMessage || 'حدث خطأ غير متوقع';
};

/**
 * Custom hook for CRUD operations
 * @param {Object} api - API object with methods: getItems, getItemById, createItem, updateItem, deleteItem, toggleStatus (optional)
 * @param {Object} options - Configuration options
 * @returns {Object} CRUD state and handlers
 */
export const useCrud = (api, options = {}) => {
  const {
    onSuccess,
    onError,
    idField = 'id',
    successMessages = {
      create: 'تم الإنشاء بنجاح',
      update: 'تم التحديث بنجاح',
      delete: 'تم الحذف بنجاح',
      toggle: 'تم تغيير الحالة بنجاح',
    },
    errorMessages = {
      create: 'فشل في الإنشاء',
      update: 'فشل في التحديث',
      delete: 'فشل في الحذف',
      toggle: 'فشل في تغيير الحالة',
      fetch: 'فشل في جلب البيانات',
    },
    keepOpenOnCreate = false,
    keepOpenOnUpdate = false,
  } = options;

  // State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Modal states
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: null, // 'create', 'edit', 'view', 'delete'
    loading: false,
  });

  // Fetch all items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getItems();
      // Handle different response structures:
      // 1. { data: [...], success: true } - API wrapper format (userApi returns response.data from axios)
      // 2. [...] - Direct array
      // 3. { data: { data: [...] } } - Nested structure
      let items = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && typeof response === 'object') {
        // Check if response has a data property
        if (response.data !== undefined) {
          // If response.data is an array, use it directly
          if (Array.isArray(response.data)) {
            items = response.data;
          } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.data)) {
            // Nested structure: { data: { data: [...] } }
            items = response.data.data;
          } else {
            // Single item or other structure
            items = [];
          }
        } else {
          // Response is an object but no data property
          items = [];
        }
      } else {
        items = [];
      }
      setItems(items);
      return response;
    } catch (err) {
      const errorMsg = extractErrorMessage(err, errorMessages.fetch);
      setError(errorMsg);
      toast.error(errorMsg);
      if (onError) onError(err, 'fetch');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, errorMessages.fetch, onError]);

  // Fetch single item by ID
  const fetchItemById = useCallback(async (id) => {
    try {
      const response = await api.getItemById(id);
      // Handle different response structures
      if (response?.data) {
        // If response.data is an object (not array), it's the item itself
        // Otherwise, it might be nested (response.data.data)
        return Array.isArray(response.data) ? response.data : (response.data.data || response.data);
      }
      return response;
    } catch (err) {
      const errorMsg = extractErrorMessage(err, errorMessages.fetch);
      toast.error(errorMsg);
      if (onError) onError(err, 'fetchById');
      throw err;
    }
  }, [api, errorMessages.fetch, onError]);

  // Create item
  const createItem = useCallback(async (data) => {
    setModalState(prev => ({ ...prev, loading: true }));
    try {
      const response = await api.createItem(data);
      const successMsg = successMessages.create;
      toast.success(successMsg);
      if (onSuccess) onSuccess(response, 'create');
      if (!keepOpenOnCreate) {
        setModalState({ isOpen: false, mode: null, loading: false });
      }
      await fetchItems();
      return response;
    } catch (err) {
      const errorMsg = extractErrorMessage(err, errorMessages.create);
      toast.error(errorMsg);
      if (onError) onError(err, 'create');
      throw err;
    } finally {
      setModalState(prev => ({ ...prev, loading: false }));
    }
  }, [api, successMessages.create, errorMessages.create, onSuccess, onError, fetchItems]);

  // Update item
  const updateItem = useCallback(async (id, data) => {
    setModalState(prev => ({ ...prev, loading: true }));
    try {
      const response = await api.updateItem(id, data);
      const successMsg = successMessages.update;
      toast.success(successMsg);
      if (onSuccess) onSuccess(response, 'update');
      if (!keepOpenOnUpdate) {
        setModalState({ isOpen: false, mode: null, loading: false });
        setSelectedItem(null);
      }
      await fetchItems();
      return response;
    } catch (err) {
      const errorMsg = extractErrorMessage(err, errorMessages.update);
      toast.error(errorMsg);
      if (onError) onError(err, 'update');
      throw err;
    } finally {
      setModalState(prev => ({ ...prev, loading: false }));
    }
  }, [api, successMessages.update, errorMessages.update, onSuccess, onError, fetchItems]);

  // Delete item
  const deleteItem = useCallback(async (id) => {
    setModalState(prev => ({ ...prev, loading: true }));
    try {
      const response = await api.deleteItem(id);
      const successMsg = successMessages.delete;
      toast.success(successMsg);
      if (onSuccess) onSuccess(response, 'delete');
      setModalState({ isOpen: false, mode: null, loading: false });
      await fetchItems();
      return response;
    } catch (err) {
      const errorMsg = extractErrorMessage(err, errorMessages.delete);
      toast.error(errorMsg);
      if (onError) onError(err, 'delete');
      throw err;
    } finally {
      setModalState(prev => ({ ...prev, loading: false }));
    }
  }, [api, successMessages.delete, errorMessages.delete, onSuccess, onError, fetchItems]);

  // Toggle status (if available)
  const toggleStatus = useCallback(async (id) => {
    if (!api.toggleStatus) {
      console.warn('toggleStatus method not available in API');
      return;
    }
    try {
      const response = await api.toggleStatus(id);
      const successMsg = successMessages.toggle;
      toast.success(successMsg);
      if (onSuccess) onSuccess(response, 'toggle');
      await fetchItems();
      return response;
    } catch (err) {
      const errorMsg = extractErrorMessage(err, errorMessages.toggle);
      toast.error(errorMsg);
      if (onError) onError(err, 'toggle');
      throw err;
    }
  }, [api, successMessages.toggle, errorMessages.toggle, onSuccess, onError, fetchItems]);

  // Modal handlers
  const openCreateModal = useCallback(() => {
    setSelectedItem(null);
    setModalState({ isOpen: true, mode: 'create', loading: false });
  }, []);

  const openEditModal = useCallback((item) => {
    setSelectedItem(item);
    setModalState({ isOpen: true, mode: 'edit', loading: false });
  }, []);

  const openViewModal = useCallback(async (itemId) => {
    try {
      const item = await fetchItemById(itemId);
      setSelectedItem(item);
      setModalState({ isOpen: true, mode: 'view', loading: false });
    } catch {
      // Error already handled in fetchItemById
    }
  }, [fetchItemById]);

  const openDeleteModal = useCallback((item) => {
    setSelectedItem(item);
    setModalState({ isOpen: true, mode: 'delete', loading: false });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ isOpen: false, mode: null, loading: false });
    setSelectedItem(null);
  }, []);

  // Handle save (create or update)
  const handleSave = useCallback(async (data) => {
    if (modalState.mode === 'edit' && selectedItem) {
      await updateItem(selectedItem[idField], data);
    } else {
      await createItem(data);
    }
  }, [modalState.mode, selectedItem, createItem, updateItem, idField]);

  // Handle delete confirmation
  const handleDelete = useCallback(async () => {
    if (selectedItem) {
      await deleteItem(selectedItem[idField]);
    }
  }, [selectedItem, deleteItem, idField]);

  return {
    // Data
    items,
    selectedItem,
    loading,
    error,
    modalState,

    // Actions
    fetchItems,
    fetchItemById,
    createItem,
    updateItem,
    deleteItem,
    toggleStatus,

    // Modal handlers
    openCreateModal,
    openEditModal,
    openViewModal,
    openDeleteModal,
    closeModal,
    handleSave,
    handleDelete,

    // Setters (if needed)
    setItems,
    setError,
  };
};