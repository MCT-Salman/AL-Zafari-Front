// src\pages\Constants.jsx
import { useState, useEffect } from "react";
import { constantApi } from "../api/constantApi";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Pagination,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Edit2, Trash2, Plus } from "lucide-react";
import CrudActions from "../components/common/CrudActions";
import StatsCard from "../components/common/StatsCard";
import SearchInput from "../components/common/SearchInput";
import FilterSelect from "../components/common/FilterSelect";
import ResultsCounter from "../components/common/ResultsCounter";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog/DeleteConfirmDialog";
import MessageAlert from "../components/common/MessageAlert";
import PageHeader from "../components/common/PageHeader";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import { usePagination } from "../hooks/usePagination";

export default function Constants() {
  const [constantTypes, setConstantTypes] = useState([]);
  const [constantValues, setConstantValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTab, setSelectedTab] = useState("");

  // Modal states for values
  const [showValueModal, setShowValueModal] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [formValueData, setFormValueData] = useState({
    value: "",
    unit: "",
    label: "",
    notes: "",
    isDefault: false,
  });

  // Modal states for types
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formTypeData, setFormTypeData] = useState({
    constants_Type_name: "",
    type: "",
    notes: "",
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: null, // 'value' or 'type'
    id: null,
    loading: false,
  });

  // Search & filters (like Users page)
  const [searchTerm, setSearchTerm] = useState("");
  const [defaultFilter, setDefaultFilter] = useState("");

  // Get current type values and apply filters
  const currentType = constantTypes.find((t) => t.constant_type_id.toString() === selectedTab) || constantTypes[0];
  const currentValuesList = constantValues[selectedTab]?.values || currentType?.values || [];
  
  const filteredValues = currentValuesList.filter((v) => {
    const matchesSearch =
      !searchTerm ||
      (v.value && v.value.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.label && v.label.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.notes && v.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDefault =
      defaultFilter === "" ||
      (defaultFilter === "default" && v.isDefault) ||
      (defaultFilter === "not_default" && !v.isDefault);

    return matchesSearch && matchesDefault;
  });

  // Pagination for current tab values - call at top level only
  const currentTabPagination = usePagination(filteredValues, 10);

  // Load constant types on mount
  useEffect(() => {
    loadConstantTypes();
  }, []);

  const loadConstantTypes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await constantApi.getConstantTypes();
      setConstantTypes(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedTab(response.data[0].constant_type_id.toString());
      }
    } catch (err) {
      setError(err.message || "فشل في تحميل أنواع الثوابت");
    } finally {
      setLoading(false);
    }
  };

  const loadConstantValues = async (typeId) => {
    try {
      const response = await constantApi.getConstantValuesByType(typeId);
      setConstantValues((prev) => ({
        ...prev,
        [typeId]: response.data || [],
      }));
    } catch (err) {
      setError(err.message || "فشل في تحميل القيم الثابتة");
    }
  };

  const handleTabChange = (typeId) => {
    setSelectedTab(typeId);
    if (!constantValues[typeId]) {
      loadConstantValues(typeId);
    }
  };

  // Value CRUD handlers
  const handleCreateValue = (typeId) => {
    setEditingValue(null);
    setFormValueData({
      value: "",
      unit: "",
      label: "",
      notes: "",
      isDefault: false,
    });
    setShowValueModal(true);
  };

  const handleEditValue = (value) => {
    setEditingValue(value);
    setFormValueData({
      value: value.value,
      unit: value.unit || "",
      label: value.label || "",
      notes: value.notes || "",
      isDefault: value.isDefault,
    });
    setShowValueModal(true);
  };

  const handleSaveValue = async () => {
    if (!formValueData.value.trim()) {
      setError("القيمة مطلوبة");
      return;
    }

    try {
      const typeId = parseInt(selectedTab);
      if (editingValue) {
        await constantApi.updateConstantValue(editingValue.constant_value_id, {
          value: formValueData.value,
          unit: formValueData.unit,
          label: formValueData.label,
          notes: formValueData.notes,
          isDefault: formValueData.isDefault,
        });
        setMessage("تم تحديث القيمة الثابتة بنجاح");
      } else {
        await constantApi.createConstantValue({
          constant_type_id: typeId,
          value: formValueData.value,
          unit: formValueData.unit,
          label: formValueData.label,
          notes: formValueData.notes,
          isDefault: formValueData.isDefault,
        });
        setMessage("تم إنشاء القيمة الثابتة بنجاح");
      }

      setShowValueModal(false);
      await loadConstantValues(typeId);
    } catch (err) {
      setError(err.message || "حدث خطأ في حفظ القيمة");
    }
  };

  const handleDeleteValue = async (valueId) => {
    setDeleteConfirm({
      isOpen: true,
      type: "value",
      id: valueId,
      loading: false,
    });
  };

  const confirmDeleteValue = async () => {
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      const typeId = parseInt(selectedTab);
      await constantApi.deleteConstantValue(deleteConfirm.id);
      setMessage("تم حذف القيمة الثابتة بنجاح");
      await loadConstantValues(typeId);
      setDeleteConfirm({ isOpen: false, type: null, id: null, loading: false });
    } catch (err) {
      setError(err.message || "حدث خطأ في حذف القيمة");
      setDeleteConfirm({ isOpen: false, type: null, id: null, loading: false });
    }
  };

  // Type CRUD handlers
  const handleCreateType = () => {
    setEditingType(null);
    setFormTypeData({
      constants_Type_name: "",
      type: "",
      notes: "",
    });
    setShowTypeModal(true);
  };

  const handleEditType = (constantType) => {
    setEditingType(constantType);
    setFormTypeData({
      constants_Type_name: constantType.constants_Type_name,
      type: constantType.type,
      notes: constantType.notes,
    });
    setShowTypeModal(true);
  };

  const handleSaveType = async () => {
    if (
      !formTypeData.constants_Type_name.trim() ||
      !formTypeData.type.trim()
    ) {
      setError("اسم النوع والنوع مطلوبان");
      return;
    }

    try {
      if (editingType) {
        await constantApi.updateConstantType(
          editingType.constant_type_id,
          formTypeData
        );
        setMessage("تم تحديث نوع الثابت بنجاح");
      } else {
        await constantApi.createConstantType(formTypeData);
        setMessage("تم إنشاء نوع الثابت بنجاح");
      }

      setShowTypeModal(false);
      await loadConstantTypes();
    } catch (err) {
      setError(err.message || "حدث خطأ في حفظ النوع");
    }
  };

  const handleDeleteType = async (typeId) => {
    setDeleteConfirm({
      isOpen: true,
      type: "type",
      id: typeId,
      loading: false,
    });
  };

  // Stats similar to Users page
  const totalTypes = constantTypes.length;
  const totalValues = constantTypes.reduce(
    (acc, t) => acc + (t.values ? t.values.length : 0),
    0
  );
  const totalDefaults = constantTypes.reduce(
    (acc, t) => acc + (t.values ? t.values.filter((v) => v.isDefault).length : 0),
    0
  );
  const uniqueUnits = new Set(
    constantTypes.flatMap((t) => (t.values || []).map((v) => v.unit).filter(Boolean))
  ).size;

  const confirmDeleteType = async () => {
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      await constantApi.deleteConstantType(deleteConfirm.id);
      setMessage("تم حذف نوع الثابت بنجاح");
      await loadConstantTypes();
      setDeleteConfirm({ isOpen: false, type: null, id: null, loading: false });
    } catch (err) {
      setError(err.message || "حدث خطأ في حذف النوع");
      setDeleteConfirm({ isOpen: false, type: null, id: null, loading: false });
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="إدارة الثوابت"
          subtitle={`إجمالي الأنواع: ${totalTypes}`}
          actionLabel="نوع جديد"
          onAction={handleCreateType}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard label="إجمالي الأنواع" value={totalTypes} variant="blue" />
          <StatsCard label="إجمالي القيم" value={totalValues} variant="green" />
          <StatsCard label="قيمة افتراضية" value={totalDefaults} variant="purple" />
          <StatsCard label="وحدات مميزة" value={uniqueUnits} variant="red" />
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold">قائمة الثوابت</h2>
          </div>

          {/* Messages */}
          <MessageAlert
            type="error"
            message={error}
            onClose={() => setError("")}
          />
          <MessageAlert
            type="success"
            message={message}
            onClose={() => setMessage("")}
          />

          {/* Search */}
          <div className="mb-6">
            <SearchInput
              placeholder="ابحث عن قيمة أو ملصق أو ملاحظة"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <FilterSelect
              label="الافتراضي"
              value={defaultFilter}
              onChange={(e) => setDefaultFilter(e.target.value)}
              options={[
                { value: "", label: "الكل" },
                { value: "default", label: "افتراضي فقط" },
                { value: "not_default", label: "غير افتراضي" },
              ]}
            />

            <ResultsCounter current={filteredValues.length} total={totalValues} />
          </div>

      {error && (
        <MessageAlert
          type="error"
          message={error}
          onClose={() => setError("")}
        />
      )}
      {message && (
        <MessageAlert
          type="success"
          message={message}
          onClose={() => setMessage("")}
        />
      )}

      {constantTypes.length === 0 ? (
        <Card className="p-8">
          <EmptyState
            title="لا توجد أنواع ثوابت"
            description="قم بإنشاء نوع ثابت جديد للبدء"
          />
          <div className="mt-4 flex justify-center">
            <Button onClick={handleCreateType} className="gap-2">
              <Plus className="h-4 w-4" />
              إنشاء نوع ثابت
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Type Management Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">أنواع الثوابت</h3>
            <Button onClick={handleCreateType} variant="default" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              نوع جديد
            </Button>
          </div>

          {/* Tabs for each constant type */}
          <Tabs
            value={selectedTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="flex w-full overflow-x-auto">
              {constantTypes.map((type) => (
                <TabsTrigger
                  key={type.constant_type_id}
                  value={type.constant_type_id.toString()}
                  className="min-w-max"
                >
                  {type.constants_Type_name}
                </TabsTrigger>
              ))}
            </TabsList>

            {constantTypes.map((type) => (
              <TabsContent
                key={type.constant_type_id}
                value={type.constant_type_id.toString()}
              >
                <Card className="p-6">
                  {/* Type Info and Actions */}
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold">
                        {type.constants_Type_name}
                      </h4>
                      <p className="text-sm text-gray-500">{type.notes}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditType(type)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        تعديل
                      </Button>
                      <Button
                        onClick={() => handleDeleteType(type.constant_type_id)}
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>
                    </div>
                  </div>

                  {/* Values Table */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-medium">القيم</h5>
                      <Button
                        onClick={() => handleCreateValue(type.constant_type_id)}
                        size="sm"
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        إضافة قيمة
                      </Button>
                    </div>

                    {(() => {
                      const valuesList = constantValues[type.constant_type_id] || type.values || [];
                      const filteredValues = valuesList.filter((v) => {
                        const matchesSearch =
                          !searchTerm ||
                          (v.value && v.value.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (v.label && v.label.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (v.notes && v.notes.toLowerCase().includes(searchTerm.toLowerCase()));

                        const matchesDefault =
                          defaultFilter === "" ||
                          (defaultFilter === "default" && v.isDefault) ||
                          (defaultFilter === "not_default" && !v.isDefault);

                        return matchesSearch && matchesDefault;
                      });

                      // Use top-level pagination only if this is the selected tab
                      const isSelectedTab = type.constant_type_id.toString() === selectedTab;
                      const displayData = isSelectedTab ? currentTabPagination.paginatedData : filteredValues;

                      if (filteredValues.length === 0) {
                        return (
                          <EmptyState
                            title="لا توجد قيم"
                            description="لم تتم إضافة أي قيم لهذا النوع حتى الآن"
                          />
                        );
                      }

                      return (
                        <div className="space-y-4">
                          <div className="overflow-x-auto rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-right">القيمة</TableHead>
                                  <TableHead>الوحدة</TableHead>
                                  <TableHead>الملصق</TableHead>
                                  <TableHead>ملاحظات</TableHead>
                                  <TableHead>الافتراضي</TableHead>
                                  <TableHead>الإجراءات</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {displayData.map((value) => (
                                  <TableRow key={value.constant_value_id}>
                                    <TableCell className="font-medium">{value.value}</TableCell>
                                    <TableCell>{value.unit || "-"}</TableCell>
                                    <TableCell>{value.label || "-"}</TableCell>
                                    <TableCell className="text-sm text-gray-500">{value.notes || "-"}</TableCell>
                                    <TableCell>
                                      {value.isDefault ? (
                                        <Badge variant="default">نعم</Badge>
                                      ) : (
                                        <Badge variant="outline">لا</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <CrudActions
                                        onEdit={() => handleEditValue(value)}
                                        onDelete={() => handleDeleteValue(value.constant_value_id)}
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {isSelectedTab && (
                            <Pagination
                              currentPage={currentTabPagination.currentPage}
                              totalPages={currentTabPagination.totalPages}
                              totalItems={filteredValues.length}
                              itemsPerPage={10}
                              onPageChange={currentTabPagination.handlePageChange}
                            />
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}

        </Card>

      {/* Value Modal */}
      <Dialog open={showValueModal} onOpenChange={setShowValueModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingValue ? "تعديل قيمة" : "إضافة قيمة جديدة"}
            </DialogTitle>
            {currentType && (
              <DialogDescription>
                لنوع: {currentType.constants_Type_name}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">القيمة *</label>
              <Input
                value={formValueData.value}
                onChange={(e) =>
                  setFormValueData({ ...formValueData, value: e.target.value })
                }
                placeholder="أدخل القيمة"
              />
            </div>

            <div>
              <label className="text-sm font-medium">الوحدة</label>
              <Input
                value={formValueData.unit}
                onChange={(e) =>
                  setFormValueData({ ...formValueData, unit: e.target.value })
                }
                placeholder="مثال: سم، مم، م"
              />
            </div>

            <div>
              <label className="text-sm font-medium">الملصق</label>
              <Input
                value={formValueData.label}
                onChange={(e) =>
                  setFormValueData({ ...formValueData, label: e.target.value })
                }
                placeholder="مثال: 100 م"
              />
            </div>

            <div>
              <label className="text-sm font-medium">ملاحظات</label>
              <Textarea
                value={formValueData.notes}
                onChange={(e) =>
                  setFormValueData({ ...formValueData, notes: e.target.value })
                }
                placeholder="أضف ملاحظات"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">افتراضي</label>
              <Switch
                checked={formValueData.isDefault}
                onCheckedChange={(checked) =>
                  setFormValueData({ ...formValueData, isDefault: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowValueModal(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleSaveValue}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Type Modal */}
      <Dialog open={showTypeModal} onOpenChange={setShowTypeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? "تعديل النوع" : "إضافة نوع جديد"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">اسم النوع *</label>
              <Input
                value={formTypeData.constants_Type_name}
                onChange={(e) =>
                  setFormTypeData({
                    ...formTypeData,
                    constants_Type_name: e.target.value,
                  })
                }
                placeholder="مثال: سماكة"
              />
            </div>

            <div>
              <label className="text-sm font-medium">المفتاح (Slug) *</label>
              <Input
                value={formTypeData.type}
                onChange={(e) =>
                  setFormTypeData({
                    ...formTypeData,
                    type: e.target.value,
                  })
                }
                placeholder="مثال: thickness"
              />
            </div>

            <div>
              <label className="text-sm font-medium">ملاحظات</label>
              <Textarea
                value={formTypeData.notes}
                onChange={(e) =>
                  setFormTypeData({
                    ...formTypeData,
                    notes: e.target.value,
                  })
                }
                placeholder="أضف ملاحظات"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTypeModal(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleSaveType}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={
          deleteConfirm.type === "type"
            ? "حذف نوع الثابت"
            : "حذف القيمة الثابتة"
        }
        description={
          deleteConfirm.type === "type"
            ? "هل أنت متأكد من حذف هذا النوع؟ سيتم حذف جميع القيم المرتبطة به"
            : "هل أنت متأكد من حذف هذه القيمة؟"
        }
        isloading={deleteConfirm.loading}
        onCancel={() =>
          setDeleteConfirm({
            isOpen: false,
            type: null,
            id: null,
            loading: false,
          })
        }
        onConfirm={
          deleteConfirm.type === "type"
            ? confirmDeleteType
            : confirmDeleteValue
        }
      />
      </div>
    </div>
  );
}
