// src/hooks/useCrud.js
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useCrud = (api, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modals, setModals] = useState({
    create: false,
    edit: false,
    detail: false,
    delete: false,
  });

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getAll();
      setData(response.data || []);
    } catch (err) {
      toast.error(err.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Create
  const handleCreate = useCallback(async (values) => {
    try {
      await api.create(values);
      toast.success(options.messages?.create || 'تم الإنشاء بنجاح');
      setModals(prev => ({ ...prev, create: false }));
      loadData();
    } catch (err) {
      toast.error(err.message || 'فشل في الإنشاء');
    }
  }, [api, loadData, options.messages]);

  // Update
  const handleUpdate = useCallback(async (id, values) => {
    try {
      await api.update(id, values);
      toast.success(options.messages?.update || 'تم التحديث بنجاح');
      setModals(prev => ({ ...prev, edit: false }));
      setSelectedItem(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'فشل في التحديث');
    }
  }, [api, loadData, options.messages]);

  // Delete
  const handleDelete = useCallback(async (id) => {
    try {
      await api.delete(id);
      toast.success(options.messages?.delete || 'تم الحذف بنجاح');
      setModals(prev => ({ ...prev, delete: false }));
      setSelectedItem(null);
      loadData();
    } catch (err) {
      toast.error(err.message || 'فشل في الحذف');
    }
  }, [api, loadData, options.messages]);

  // Toggle status (if supported)
  const handleToggle = useCallback(async (id, toggleApi) => {
    try {
      await toggleApi(id);
      toast.success(options.messages?.toggle || 'تم تغيير الحالة بنجاح');
      loadData();
    } catch (err) {
      toast.error(err.message || 'فشل في تغيير الحالة');
    }
  }, [loadData, options.messages]);

  // Modal helpers
  const openModal = useCallback((type, item = null) => {
    setSelectedItem(item);
    setModals(prev => ({ ...prev, [type]: true }));
  }, []);

  const closeModal = useCallback((type) => {
    setModals(prev => ({ ...prev, [type]: false }));
    if (type !== 'detail') setSelectedItem(null);
  }, []);

  return {
    data,
    setData,
    loading,
    selectedItem,
    modals,
    loadData,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggle,
    openModal,
    closeModal,
  };
};