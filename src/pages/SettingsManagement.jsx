// src/pages/SettingsManagement.jsx
import { useState, useEffect, useMemo } from "react";
import { settingApi } from "../api/settingApi";
import { useCrud } from "../hooks/useCrud";
import { CrudModal } from "../components/common/CrudModal";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Settings, Percent, History, Edit, Trash2, Plus, Info } from "lucide-react";
import CrudActions from "../components/common/CrudActions";
import MessageAlert from "../components/common/MessageAlert";
import PageHeader from "../components/common/PageHeader";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { getApiData } from "../utils/api";

export default function SettingsManagement() {
  const [activeTab, setActiveTab] = useState("general");

  // --- General Settings CRUD ---
  const settingsAdapter = useMemo(() => ({
    getItems: () => settingApi.getSettings(),
    createItem: (data) => settingApi.createSetting(data),
    updateItem: (id, data) => settingApi.updateSettingById(id, data),
    deleteItem: (id) => settingApi.deleteSetting(id),
  }), []);

  const {
    items: settings,
    loading: settingsLoading,
    error: settingsError,
    modalState: settingsModal,
    selectedItem: selectedSetting,
    fetchItems: fetchSettings,
    openCreateModal: openCreateSetting,
    openEditModal: openEditSetting,
    openDeleteModal: openDeleteSetting,
    closeModal: closeSettingsModal,
    handleSave: handleSaveSetting,
    handleDelete: handleDeleteSetting,
  } = useCrud(settingsAdapter, {
    idField: 'id',
    successMessages: {
      create: "تم إضافة الإعداد بنجاح",
      update: "تم تحديث الإعداد بنجاح",
      delete: "تم حذف الإعداد بنجاح",
    }
  });

  const [settingFormData, setSettingFormData] = useState({
    key: "",
    value: "",
    description: ""
  });

  // Explicit handlers for settings
  const handleOpenCreateSetting = () => {
    setSettingFormData({ key: "", value: "", description: "" });
    openCreateSetting();
  };

  const handleOpenEditSetting = (setting) => {
    setSettingFormData({
      key: setting.key || "",
      value: setting.value || "",
      description: setting.description || ""
    });
    openEditSetting(setting);
  };

  // --- Discounts CRUD ---
  const discountsAdapter = useMemo(() => ({
    getItems: () => settingApi.getDiscounts(),
    createItem: (data) => settingApi.createDiscount(data),
    updateItem: (id, data) => settingApi.updateDiscount(id, data),
    deleteItem: (id) => settingApi.deleteDiscount(id),
  }), []);

  const {
    items: discounts,
    loading: discountsLoading,
    error: discountsError,
    modalState: discountsModal,
    selectedItem: selectedDiscount,
    fetchItems: fetchDiscounts,
    openCreateModal: openCreateDiscount,
    openEditModal: openEditDiscount,
    openDeleteModal: openDeleteDiscount,
    closeModal: closeDiscountsModal,
    handleSave: handleSaveDiscount,
    handleDelete: handleDeleteDiscount,
  } = useCrud(discountsAdapter, {
    idField: 'id',
    successMessages: {
      create: "تم إضافة الخصم بنجاح",
      update: "تم تحديث الخصم بنجاح",
      delete: "تم حذف الخصم بنجاح",
    }
  });

  const [discountFormData, setDiscountFormData] = useState({
    type: "percentage",
    quantityCondition: "GREATER_THAN",
    quantity: "",
    value: ""
  });

  // Explicit handlers for discounts
  const handleOpenCreateDiscount = () => {
    setDiscountFormData({
      type: "percentage",
      quantityCondition: "GREATER_THAN",
      quantity: "",
      value: ""
    });
    openCreateDiscount();
  };

  const handleOpenEditDiscount = (discount) => {
    setDiscountFormData({
      type: discount.type || "percentage",
      quantityCondition: discount.quantityCondition || "GREATER_THAN",
      quantity: discount.quantity || "",
      value: discount.value || ""
    });
    openEditDiscount(discount);
  };

  // --- Logs ---
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await settingApi.getExchangeRateLogs();
      setLogs(getApiData(response, []) || []);
    } catch (err) {
      setLogsError(err.message || "فشل في جلب السجلات");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line
  }, []);

  const handleTabChange = (val) => {
    setActiveTab(val);
    if (val === "general") fetchSettings();
    if (val === "discounts") fetchDiscounts();
    if (val === "logs") fetchLogs();
  };

  const getConditionLabel = (cond) => {
    const map = {
      'GREATER_THAN': 'أكبر من',
      'LESS_THAN': 'أصغر من',
      'EQUAL_TO': 'يساوي',
      'GREATER_THAN_OR_EQUAL_TO': 'أكبر من أو يساوي',
      'LESS_THAN_OR_EQUAL_TO': 'أصغر من أو يساوي'
    };
    return map[cond] || cond;
  };

  return (
    <div className="min-h-screen bg-gray-50 space-y-6 p-4 md:p-8">
      <PageHeader
        title="إدارة إعدادات النظام"
        subtitle="إدارة الإعدادات العامة والخصومات وسجلات الصرف"
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            الإعدادات العامة
          </TabsTrigger>
          <TabsTrigger value="discounts" className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            إدارة الخصومات
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            سجل سعر الصرف
          </TabsTrigger>
        </TabsList>

        {/* --- GENERAL SETTINGS TAB --- */}
        <TabsContent value="general">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">قائمة الإعدادات</h2>
              <Button onClick={handleOpenCreateSetting} className="bg-primary-f hover:bg-secondary-f text-white gap-2">
                <Plus className="w-4 h-4" />
                إضافة إعداد جديد
              </Button>
            </div>

            {settingsError && <MessageAlert type="error" message={settingsError} />}

            {settingsLoading ? (
              <LoadingState message="جاري تحميل الإعدادات..." />
            ) : settings.length === 0 ? (
              <EmptyState message="لا يوجد إعدادات مضافة" />
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم (Key)</TableHead>
                      <TableHead>القيمة</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settings.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-sm">{s.key}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-primary-f border-primary-f/30">
                            {s.value}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 italic text-sm">{s.description || "-"}</TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <CrudActions
                              onEdit={() => handleOpenEditSetting(s)}
                              onDelete={() => openDeleteSetting(s)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* --- DISCOUNTS TAB --- */}
        <TabsContent value="discounts">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">قائمة الخصومات</h2>
              <Button onClick={handleOpenCreateDiscount} className="bg-primary-f hover:bg-secondary-f text-white gap-2">
                <Plus className="w-4 h-4" />
                إضافة خصم جديد
              </Button>
            </div>

            {discountsError && <MessageAlert type="error" message={discountsError} />}

            {discountsLoading ? (
              <LoadingState message="جاري تحميل الخصومات..." />
            ) : discounts.length === 0 ? (
              <EmptyState message="لا يوجد خصومات مضافة" />
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>النوع</TableHead>
                      <TableHead>الشرط (الكمية)</TableHead>
                      <TableHead>القيمة</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discounts.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <Badge className={d.type === 'percentage' ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}>
                            {d.type === 'percentage' ? 'نسبة مئوية' : d.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getConditionLabel(d.quantityCondition)} {d.quantity}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {d.value} {d.type === 'percentage' ? '%' : ''}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <CrudActions
                              onEdit={() => handleOpenEditDiscount(d)}
                              onDelete={() => openDeleteDiscount(d)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* --- LOGS TAB --- */}
        <TabsContent value="logs">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">سجل تغييرات سعر الصرف</h2>

            {logsError && <MessageAlert type="error" message={logsError} />}

            {logsLoading ? (
              <LoadingState message="جاري تحميل السجلات..." />
            ) : logs.length === 0 ? (
              <EmptyState message="لا يوجد سجلات حتى الآن" />
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>السعر القديم</TableHead>
                      <TableHead>السعر الجديد</TableHead>
                      <TableHead>بواسطة (ID)</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...logs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-gray-500 line-through">{log.oldRate} ل.س</TableCell>
                        <TableCell className="font-bold text-primary-f">{log.newRate} ل.س</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <Info className="w-3 h-3 text-gray-400" />
                            المستخدم #{log.changedBy}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {new Date(log.createdAt).toLocaleString('ar-SA')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- MODALS --- */}

      {/* General Settings Modal */}
      <CrudModal
        isOpen={settingsModal.isOpen}
        mode={settingsModal.mode}
        onClose={closeSettingsModal}
        onSubmit={handleSaveSetting}
        onDelete={handleDeleteSetting}
        data={selectedSetting}
        title={settingsModal.mode === 'create' ? "إضافة إعداد" : "تعديل إعداد"}
        loading={settingsModal.loading}
        formData={settingFormData}
        setFormData={setSettingFormData}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">اسم الإعداد (Key) <span className="text-red-500">*</span></label>
            <Input
              value={settingFormData.key || ""}
              onChange={(e) => setSettingFormData({ ...settingFormData, key: e.target.value })}
              placeholder="مثال: exchange.rate"
              disabled={settingsModal.mode === 'edit'}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">القيمة <span className="text-red-500">*</span></label>
            <Input
              value={settingFormData.value || ""}
              onChange={(e) => setSettingFormData({ ...settingFormData, value: e.target.value })}
              placeholder="أدخل القيمة"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">الوصف</label>
            <Input
              value={settingFormData.description || ""}
              onChange={(e) => setSettingFormData({ ...settingFormData, description: e.target.value })}
              placeholder="وصف مختصر للإعداد"
            />
          </div>
        </div>
      </CrudModal>

      {/* Discounts Modal */}
      <CrudModal
        isOpen={discountsModal.isOpen}
        mode={discountsModal.mode}
        onClose={closeDiscountsModal}
        onSubmit={handleSaveDiscount}
        onDelete={handleDeleteDiscount}
        data={selectedDiscount}
        title={discountsModal.mode === 'create' ? "إضافة خصم جديد" : "تعديل الخصم"}
        loading={discountsModal.loading}
        formData={discountFormData}
        setFormData={setDiscountFormData}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">النوع</label>
              <Select
                value={discountFormData.type}
                onValueChange={(val) => setDiscountFormData({ ...discountFormData, type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">نسبة مئوية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">الشرط</label>
              <Select
                value={discountFormData.quantityCondition}
                onValueChange={(val) => setDiscountFormData({ ...discountFormData, quantityCondition: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GREATER_THAN">أكبر من</SelectItem>
                  <SelectItem value="LESS_THAN">أصغر من</SelectItem>
                  <SelectItem value="EQUAL_TO">يساوي</SelectItem>
                  <SelectItem value="GREATER_THAN_OR_EQUAL_TO">أكبر من أو يساوي</SelectItem>
                  <SelectItem value="LESS_THAN_OR_EQUAL_TO">أصغر من أو يساوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الكمية</label>
              <Input
                type="number"
                value={discountFormData.quantity || ""}
                onChange={(e) => setDiscountFormData({ ...discountFormData, quantity: e.target.value })}
                placeholder="أدخل الكمية المستهدفة"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">القيمة</label>
              <Input
                type="number"
                step="0.01"
                value={discountFormData.value || ""}
                onChange={(e) => setDiscountFormData({ ...discountFormData, value: e.target.value })}
                placeholder="قيمة الخصم (مثلاً 0.5)"
              />
            </div>
          </div>
        </div>
      </CrudModal>

    </div>
  );
}
