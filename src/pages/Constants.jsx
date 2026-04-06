// src\pages\Constants.jsx
import { useState, useEffect } from "react";
import { constantApi } from "../api/constantApi";
import toast from "react-hot-toast";
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
} from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Edit2, Trash2, Plus, Layers, Hash, Star, Ruler } from "lucide-react";
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
import RowsPerPageSelector from "../components/common/RowsPerPageSelector";
import PaginationControls from "../components/common/PaginationControls";
import StyledDialog from "../components/common/StyledDialog";
import { getApiData } from "../utils/api";

export default function Constants() {
  const [constantTypes, setConstantTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTab, setSelectedTab] = useState("");
  
  // Modal states
  const [showValueModal, setShowValueModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [editingType, setEditingType] = useState(null);
  
  // Form data states
  const [formValueData, setFormValueData] = useState({
    value: "",
    unit: "",
    label: "",
    notes: "",
    isDefault: false,
  });
  
  const [formTypeData, setFormTypeData] = useState({
    constants_Type_name: "",
    type: "",
    notes: "",
  });
  
  const [formLoading, setFormLoading] = useState(false);
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({ 
    isOpen: false, 
    type: null, // 'value' or 'type'
    id: null, 
    loading: false 
  });
  
  // Search & filters
  const [searchTerm, setSearchTerm] = useState("");
  const [defaultFilter, setDefaultFilter] = useState("");
  
  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Load constant types on mount
  useEffect(() => {
    loadConstantTypes();
  }, []);

  const loadConstantTypes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await constantApi.getConstantTypes();
      // GET /constant-type returns values embedded inside each type
      const data = getApiData(response, []);
      setConstantTypes(data || []);
      if (data && data.length > 0) {
        setSelectedTab(data[0].constant_type_id.toString());
      }
    } catch (err) {
      const errorMessage = err.message || "فشل في تحميل أنواع الثوابت";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const reloadConstantValues = async (typeId) => {
    try {
      const response = await constantApi.getConstantValuesByType(typeId);
      const data = getApiData(response, []);
      setConstantTypes(prev => 
        prev.map(type => 
          type.constant_type_id.toString() === typeId.toString() 
            ? { ...type, values: data || [] }
            : type
        )
      );
    } catch (err) {
      const errorMessage = err.message || "فشل في تحميل القيم الثابتة";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleTabChange = (typeId) => {
    setSelectedTab(typeId);
    setCurrentPage(1); // Reset page when changing tabs
  };

  // Value CRUD handlers
  const handleCreateValue = () => {
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

    setFormLoading(true);
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
        const successMessage = "تم تحديث القيمة الثابتة بنجاح";
        setMessage(successMessage);
        toast.success(successMessage);
      } else {
        await constantApi.createConstantValue({
          constant_type_id: typeId,
          value: formValueData.value,
          unit: formValueData.unit,
          label: formValueData.label,
          notes: formValueData.notes,
          isDefault: formValueData.isDefault,
        });
        const successMessage = "تم إنشاء القيمة الثابتة بنجاح";
        setMessage(successMessage);
        toast.success(successMessage);
      }

      setShowValueModal(false);
      await reloadConstantValues(typeId);
    } catch (err) {
      const errorMessage = err.message || "حدث خطأ في حفظ القيمة";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteValue = (valueId) => {
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
      const successMessage = "تم حذف القيمة الثابتة بنجاح";
      setMessage(successMessage);
      toast.success(successMessage);
      await reloadConstantValues(typeId);
      setDeleteConfirm({ isOpen: false, type: null, id: null, loading: false });
    } catch (err) {
      const errorMessage = err.message || "حدث خطأ في حذف القيمة";
      setError(errorMessage);
      toast.error(errorMessage);
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
    if (!formTypeData.constants_Type_name.trim() || !formTypeData.type.trim()) {
      setError("اسم النوع والنوع مطلوبان");
      return;
    }

    setFormLoading(true);
    try {
      if (editingType) {
        await constantApi.updateConstantType(editingType.constant_type_id, formTypeData);
        const successMessage = "تم تحديث نوع الثابت بنجاح";
        setMessage(successMessage);
        toast.success(successMessage);
      } else {
        await constantApi.createConstantType(formTypeData);
        const successMessage = "تم إنشاء نوع الثابت بنجاح";
        setMessage(successMessage);
        toast.success(successMessage);
      }

      setShowTypeModal(false);
      await loadConstantTypes();
    } catch (err) {
      const errorMessage = err.message || "حدث خطأ في حفظ النوع";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteType = (typeId) => {
    setDeleteConfirm({
      isOpen: true,
      type: "type",
      id: typeId,
      loading: false,
    });
  };

  const confirmDeleteType = async () => {
    setDeleteConfirm((prev) => ({ ...prev, loading: true }));
    try {
      await constantApi.deleteConstantType(deleteConfirm.id);
      const successMessage = "تم حذف نوع الثابت بنجاح";
      setMessage(successMessage);
      toast.success(successMessage);
      await loadConstantTypes();
      setDeleteConfirm({ isOpen: false, type: null, id: null, loading: false });
    } catch (err) {
      const errorMessage = err.message || "حدث خطأ في حذف النوع";
      setError(errorMessage);
      toast.error(errorMessage);
      setDeleteConfirm({ isOpen: false, type: null, id: null, loading: false });
    }
  };

  // Calculate stats
  const stats = {
    totalTypes: constantTypes.length,
    totalValues: constantTypes.reduce((acc, t) => acc + (t.values ? t.values.length : 0), 0),
    totalDefaults: constantTypes.reduce((acc, t) => 
      acc + (t.values ? t.values.filter((v) => v.isDefault).length : 0), 0),
    uniqueUnits: new Set(
      constantTypes.flatMap((t) => (t.values || []).map((v) => v.unit).filter(Boolean))
    ).size,
  };

  // Get current type and its values
  const currentType = constantTypes.find((t) => t.constant_type_id.toString() === selectedTab);
  const currentValues = currentType?.values || [];

  // Filter values
  const filteredValues = currentValues.filter((v) => {
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, defaultFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredValues.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedValues = filteredValues.slice(startIndex, endIndex);

  const mainStats = [
    {
      id: 1,
      title: "إجمالي الأنواع",
      value: stats.totalTypes,
      unit: "نوع",
      icon: Layers,
      iconColor: "text-secondary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-f"
    },
    {
      id: 2,
      title: "إجمالي القيم",
      value: stats.totalValues,
      unit: "قيمة",
      icon: Hash,
      iconColor: "text-primary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-primary-f"
    },
    {
      id: 3,
      title: "قيمة افتراضية",
      value: stats.totalDefaults,
      unit: "قيمة",
      icon: Star,
      iconColor: "text-secondary-s",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-s"
    },
    {
      id: 4,
      title: "وحدات مميزة",
      value: stats.uniqueUnits,
      unit: "وحدة",
      icon: Ruler,
      iconColor: "text-secondary-t",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-t"
    }
  ];

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gray-50 space-y-8 p-2">
      <div className=" mx-auto">
        <PageHeader
          title="إدارة الثوابت"
          subtitle={`إجمالي الأنواع: ${stats.totalTypes}`}
          actionLabel="نوع جديد"
          onAction={handleCreateType}
        />

        {/* Stats Cards - Same as Users page */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {mainStats.map((stat) => (
            <StatsCard key={stat.id} {...stat} />
          ))}
        </div>

        {/* Main Content Card - Same as Users page */}
        <Card className="p-6">
          <div className="">
            <h2 className="text-xl font-bold">قائمة الثوابت</h2>
          </div>

          {/* Messages */}
          {error && (
            <MessageAlert
              type="error"
              message={error}
              onDismiss={() => setError("")}
              dismissable={true}
            />
          )}
          {message && (
            <MessageAlert
              type="success"
              message={message}
              onDismiss={() => setMessage("")}
              dismissable={true}
            />
          )}

          {/* Search */}
          <div className="-my-4">
            <SearchInput
              placeholder="ابحث عن قيمة أو تغرية أو ملاحظة"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <ResultsCounter 
              current={filteredValues.length} 
              total={currentValues.length} 
            />
          </div>

          <div className="flex justify-between">
          {/* Rows Per Page Selector */}
          <div className=" flex justify-start">
            <RowsPerPageSelector
              value={rowsPerPage}
              onChange={setRowsPerPage}
              options={[5, 10, 20, 50]}
            />
          </div>
          </div>

          {/* Empty State for No Types - Similar to Users page */}
          {constantTypes.length === 0 ? (
            <EmptyState 
              message="لا توجد أنواع ثوابت" 
              icon=""
              actionLabel="إنشاء نوع جديد"
              onAction={handleCreateType}
            />
          ) : (
            <>
              {/* Tabs for constant types */}
              <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full">
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
                    <div className="space-y-4">
                      {/* Type Header with Actions - Similar to Users table header */}
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold">{type.constants_Type_name}</h3>
                          {type.notes && (
                            <p className="text-sm text-gray-500">{type.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditType(type)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            تعديل النوع
                          </Button>
                          <Button
                            onClick={() => handleDeleteType(type.constant_type_id)}
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف النوع
                          </Button>
                          <Button
                            onClick={handleCreateValue}
                            size="sm"
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            إضافة قيمة
                          </Button>
                        </div>
                      </div>

                      {/* Empty State for No Values - Similar to Users page */}
                      {filteredValues.length === 0 ? (
                        <EmptyState 
                          message="لا توجد قيم لهذا النوع" 
                          icon="📋"
                          actionLabel="إضافة قيمة"
                          onAction={handleCreateValue}
                        />
                      ) : (
                        <>
                          {/* Values Table - Similar to Users table */}
                          <div className="overflow-x-auto rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>القيمة</TableHead>
                                  <TableHead>الوحدة</TableHead>
                                  <TableHead>التغرية</TableHead>
                                  <TableHead>ملاحظات</TableHead>
                                  <TableHead>الافتراضي</TableHead>
                                  <TableHead>الإجراءات</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {paginatedValues.map((value) => (
                                  <TableRow key={value.constant_value_id}>
                                    <TableCell className="font-medium">
                                      {value.value}
                                    </TableCell>
                                    <TableCell>{value.unit || "-"}</TableCell>
                                    <TableCell>{value.label || "-"}</TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                      {value.notes || "-"}
                                    </TableCell>
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
                                        size="md"
                                      />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>

                          {/* Pagination Controls - Same as Users page */}
                          <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPrevious={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            onNext={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            onPageChange={setCurrentPage}
                          />
                        </>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </Card>
      </div>

      {/* Value Modal */}
      <StyledDialog
        isOpen={showValueModal}
        onOpenChange={setShowValueModal}
        title={editingValue ? "تعديل قيمة" : "إضافة قيمة جديدة"}
        description={currentType ? `لنوع: ${currentType.constants_Type_name}` : ""}
        onCancel={() => setShowValueModal(false)}
        onConfirm={handleSaveValue}
        confirmLabel="حفظ"
        cancelLabel="إلغاء"
        isLoading={formLoading}
      >
        <div className="space-y-4">
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
            <label className="text-sm font-medium">التغرية</label>
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
      </StyledDialog>

      {/* Type Modal */}
      <StyledDialog
        isOpen={showTypeModal}
        onOpenChange={setShowTypeModal}
        title={editingType ? "تعديل النوع" : "إضافة نوع جديد"}
        onCancel={() => setShowTypeModal(false)}
        onConfirm={handleSaveType}
        confirmLabel="حفظ"
        cancelLabel="إلغاء"
        isLoading={formLoading}
      >
        <div className="space-y-4">
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
      </StyledDialog>

      {/* Delete Confirmation Dialog - Same as Users page */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={
          deleteConfirm.type === "type"
            ? "حذف نوع الثابت"
            : "حذف القيمة الثابتة"
        }
        message={
          deleteConfirm.type === "type"
            ? "هل أنت متأكد من حذف هذا النوع؟ سيتم حذف جميع القيم المرتبطة به."
            : "هل أنت متأكد من حذف هذه القيمة؟"
        }
        onConfirm={
          deleteConfirm.type === "type"
            ? confirmDeleteType
            : confirmDeleteValue
        }
        onCancel={() =>
          setDeleteConfirm({
            isOpen: false,
            type: null,
            id: null,
            loading: false,
          })
        }
        loading={deleteConfirm.loading}
      />
    </div>
  );
}
