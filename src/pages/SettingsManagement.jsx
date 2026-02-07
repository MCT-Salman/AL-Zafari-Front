import { useState, useEffect } from "react";
import { settingApi } from "../api/settingApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Pagination,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Plus } from "lucide-react";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog/DeleteConfirmDialog";
import CrudActions from "../components/common/CrudActions";
import StatsCard from "../components/common/StatsCard";
import SearchInput from "../components/common/SearchInput";
import MessageAlert from "../components/common/MessageAlert";
import PageHeader from "../components/common/PageHeader";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import RowsPerPageSelector from "../components/common/RowsPerPageSelector";
import PaginationControls from "../components/common/PaginationControls";
import StyledDialog from "../components/common/StyledDialog";

export default function SettingsManagement() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    settingId: null,
    loading: false,
  });
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    description: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    // Clear messages after 5 seconds
    if (error || message) {
      const timer = setTimeout(() => {
        setError("");
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, message]);

  useEffect(() => {
    // Reset page when search changes
    setCurrentPage(1);
  }, [searchTerm]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await settingApi.getSettings();
      setSettings(response.data || []);
    } catch (err) {
      setError(err.message || "فشل في تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSetting = () => {
    setEditingSetting(null);
    setFormData({ key: "", value: "", description: "" });
    setFormError("");
    setShowModal(true);
  };

  const handleEditSetting = (setting) => {
    setEditingSetting(setting);
    setFormData({
      key: setting.key,
      value: setting.value,
      description: setting.description || "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSetting = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    // Validation
    if (!formData.key || !formData.value) {
      setFormError("يرجى ملء جميع الحقول المطلوبة");
      setFormLoading(false);
      return;
    }

    try {
      if (editingSetting) {
        // Update setting by key
        await settingApi.updateSettingByKey(editingSetting.key, {
          value: formData.value,
          description: formData.description,
        });
        setMessage("تم تحديث الإعداد بنجاح");
      } else {
        // Create new setting
        await settingApi.createSetting(formData);
        setMessage("تم إنشاء الإعداد بنجاح");
      }
      setShowModal(false);
      loadSettings();
    } catch (err) {
      setFormError(err.message || "فشل في حفظ الإعداد");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSetting = (settingId) => {
    setDeleteConfirm({ isOpen: true, settingId, loading: false });
  };

  const confirmDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      await settingApi.deleteSetting(deleteConfirm.settingId);
      setMessage("تم حذف الإعداد بنجاح");
      setDeleteConfirm({ isOpen: false, settingId: null, loading: false });
      loadSettings();
    } catch (err) {
      setError(err.message || "فشل في حذف الإعداد");
      setDeleteConfirm({ isOpen: false, settingId: null, loading: false });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, settingId: null, loading: false });
  };

  const filteredSettings = settings.filter((setting) =>
    setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    setting.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredSettings.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredSettings.slice(startIndex, endIndex);

  // Calculate stats
  const stats = {
    total: settings.length,
    systemSettings: settings.filter((s) => s.key.includes("exchange") || s.key.includes("system")).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="إدارة الإعدادات"
          subtitle={`إجمالي الإعدادات: ${settings.length}`}
          actionLabel="إضافة إعداد جديد"
          onAction={handleCreateSetting}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            label="إجمالي الإعدادات"
            value={stats.total}
            variant="blue"
          />
          <StatsCard
            label="إعدادات النظام"
            value={stats.systemSettings}
            variant="green"
          />
          <StatsCard
            label="نتائج البحث"
            value={filteredSettings.length}
            variant="purple"
          />
        </div>

        {/* Settings Table Card */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold">قائمة الإعدادات</h2>
          </div>

          {/* Messages */}
          <MessageAlert
            type="error"
            message={error}
            onDismiss={() => setError("")}
            dismissable={true}
          />
          <MessageAlert
            type="success"
            message={message}
            onDismiss={() => setMessage("")}
            dismissable={true}
          />

          {/* Search */}
          <div className="mb-6">
            <SearchInput
              placeholder="ابحث عن إعداد (المفتاح أو القيمة أو الوصف)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Settings Table */}
          {loading ? (
            <LoadingState message="جاري تحميل الإعدادات..." />
          ) : filteredSettings.length === 0 ? (
            <EmptyState message="لا توجد إعدادات" icon="⚙️" />
          ) : (
            <>
              <div className="mb-4 flex justify-end">
                <RowsPerPageSelector
                  value={rowsPerPage}
                  onChange={setRowsPerPage}
                  options={[5, 10, 20, 50]}
                />
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المفتاح</TableHead>
                      <TableHead>القيمة</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>تاريخ التحديث</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{setting.key}</Badge>
                        </TableCell>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                            {setting.value}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm">
                          {setting.description || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(setting.updatedAt).toLocaleDateString("ar-SA")}
                        </TableCell>
                        <TableCell>
                          <CrudActions
                            onEdit={() => handleEditSetting(setting)}
                            onDelete={() => handleDeleteSetting(setting.id)}
                            size="md"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPrevious={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                onNext={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </Card>
      </div>

      {/* Settings Modal */}
      <StyledDialog
        isOpen={showModal}
        onOpenChange={setShowModal}
        title={editingSetting ? "تعديل الإعداد" : "إضافة إعداد جديد"}
        isLoading={formLoading}
        onConfirm={handleSaveSetting}
        confirmLabel="حفظ"
        cancelLabel="إلغاء"
      >
        {formError && (
          <div className="p-3 bg-red-100 text-red-800 rounded text-sm mb-4">
            {formError}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">المفتاح</label>
            <Input
              type="text"
              name="key"
              value={formData.key}
              onChange={handleInputChange}
              placeholder="exchange.rate"
              disabled={formLoading || !!editingSetting}
              title={editingSetting ? "لا يمكن تعديل المفتاح" : ""}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">القيمة</label>
            <Input
              type="text"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              placeholder="12000"
              disabled={formLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">الوصف</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="سعر صرف الدولار"
              disabled={formLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>
        </div>
      </StyledDialog>

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="حذف الإعداد"
        message="هل أنت متأكد من رغبتك في حذف هذا الإعداد؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleteConfirm.loading}
      />
    </div>
  );
}
