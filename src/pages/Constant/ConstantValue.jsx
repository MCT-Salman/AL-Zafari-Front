// src\pages\constants\ConstantValue.jsx
import { useState, useEffect, useMemo } from "react";
import { constantApi } from "../../api/constantApi";
import { useCrud } from "../../hooks/useCrud";
import { useExport } from "../../hooks/useExport";
import { CrudModal } from "../../components/common/CrudModal";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Download, Tag, CheckCircle } from "lucide-react";
import CrudActions from "../../components/common/CrudActions";
import StatsCard from "../../components/common/StatsCard";
import SearchInput from "../../components/common/SearchInput";
import FilterSelect from "../../components/common/FilterSelect";
import MessageAlert from "../../components/common/MessageAlert";
import PageHeader from "../../components/common/PageHeader";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import ResultsCounter from "../../components/common/ResultsCounter";
import RowsPerPageSelector from "../../components/common/RowsPerPageSelector";
import PaginationControls from "../../components/common/PaginationControls";
import SwitchActive from "../../components/common/SwitchActive";
import { materialApi } from "../../api/materialApi";

// القيم المتاحة للاختيار
const AVAILABLE_VALUES = ["22", "44", "66"];
// الوحدات المتاحة
const AVAILABLE_UNITS = [
  { value: "مم", label: "مم (مليمتر)" },
  { value: "سم", label: "سم (سنتيمتر)" },
  { value: "متر", label: "متر" }
];

export default function ConstantValue() {
  // State for constant types (for filter)
  const [constantTypes, setConstantTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(false);

  // Selected type for filtering
  const [selectedTypeId, setSelectedTypeId] = useState("");

  // Load constant types on mount
  useEffect(() => {
    loadConstantTypes();
  }, []);

  const loadConstantTypes = async () => {
    setTypesLoading(true);
    try {
      const response = await constantApi.getConstantTypes();
      if (response.success) {
        setConstantTypes(response.data || []);
      }
    } catch (error) {
      console.error("Failed to load constant types:", error);
    } finally {
      setTypesLoading(false);
    }
  };

  // Create adapter for constant values
  const constantValueApiAdapter = useMemo(() => ({
    getItems: async () => {
      if (!selectedTypeId) {
        return { success: true, data: [] };
      }
      const selectedType = constantTypes.find(
        (t) => t.constant_type_id === parseInt(selectedTypeId)
      );

      const typeKey = selectedType?.type;

      const response = typeKey
        ? await constantApi.getConstantValuesByTypeName(typeKey)
        : await constantApi.getConstantValuesByType(selectedTypeId);

      if (response.success && response.data) {
        return { success: true, data: response.data };
      }
      return { success: true, data: [] };
    },
    getItemById: async (id) => {
      const found = constantValues.find(v =>
        (v.constant_value_id === id || v.id === id || v.constant_value_id === parseInt(id))
      );
      if (found) return { success: true, data: found };
      return { success: false, message: "القيمة غير موجودة" };
    },
    createItem: async (data) => {
      const payload = {
        constant_type_id: parseInt(data.constant_type_id),
        value: data.value.toString(),
        unit: data.unit || "",
        label: data.label || `${data.value} ${data.unit || ""}`.trim(),
        isDefault: Boolean(data.isDefault),
        notes: data.notes || ""
      };
      return await constantApi.createConstantValue(payload);
    },
    updateItem: async (id, data) => {
      const payload = {
        value: data.value.toString(),
        unit: data.unit || "",
        label: data.label || `${data.value} ${data.unit || ""}`.trim(),
        isDefault: Boolean(data.isDefault),
        notes: data.notes || ""
      };
      return await constantApi.updateConstantValue(id, payload);
    },
    deleteItem: (...args) => constantApi.deleteConstantValue(...args),
  }), [selectedTypeId, constantTypes]);

  // Use CRUD hook
  const {
    items: constantValues,
    loading,
    error,
    modalState,
    selectedItem,
    fetchItems,
    openCreateModal,
    openEditModal,
    openViewModal,
    openDeleteModal,
    closeModal,
    handleSave,
    handleDelete,
  } = useCrud(constantValueApiAdapter, {
    idField: 'constant_value_id',
    successMessages: {
      create: "تم إنشاء القيمة الثابتة بنجاح",
      update: "تم تحديث القيمة الثابتة بنجاح",
      delete: "تم حذف القيمة الثابتة بنجاح",
    },
    errorMessages: {
      create: "فشل في حفظ القيمة الثابتة",
      update: "فشل في حفظ القيمة الثابتة",
      delete: "فشل في حذف القيمة الثابتة",
      fetch: "فشل في تحميل القيم الثابتة",
    },
  });

  // Form state for ConstantValueForm
  const [formData, setFormData] = useState({
    constant_type_id: "",
    value: "",
    unit: "",
    label: "",
    isDefault: false,
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    loadMaterials();
  }, [])

  // Load materials for dropdown
  const loadMaterials = async () => {
    try {
      const response = await materialApi.getMaterials();
      setMaterials(response.data || []);
    } catch (error) {
      console.error("Failed to load materials:", error);
    }
  };

  // تحديث الليبل تلقائياً عند تغيير القيمة أو الوحدة
  useEffect(() => {
    if (formData.value || formData.unit) {
      const newLabel = `${formData.value || ""} ${formData.unit || ""}`.trim();
      setFormData(prev => ({
        ...prev,
        label: newLabel
      }));
    }
  }, [formData.value, formData.unit]);

  // Load values when type changes
  useEffect(() => {
    if (selectedTypeId) {
      fetchItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypeId]);

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [defaultFilter, setDefaultFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Use export hook
  const { exportToExcel, loading: exportLoading } = useExport({
    columns: [
      { key: 'value', header: 'القيمة' },
      { key: 'unit', header: 'الوحدة' },
      { key: 'label', header: 'العنوان' },
      {
        key: 'isDefault',
        header: 'افتراضي',
        format: (value) => value ? 'نعم' : 'لا'
      },
      { key: 'notes', header: 'الملاحظات' },
      {
        key: 'type',
        header: 'نوع الثابت',
        format: (value) => value?.constants_Type_name || ''
      },
    ],
    columnWidths: [
      { wch: 5 },
      { wch: 15 },
      { wch: 10 },
      { wch: 20 },
      { wch: 10 },
      { wch: 25 },
      { wch: 20 },
    ],
    sheetName: 'القيم الثابتة',
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredValues, 'القيم_الثابتة');
  };

  // Handle save with validation
  const handleSaveValue = async (idOrValueData, valueData) => {
    setFormError("");

    const isEditMode = typeof idOrValueData === 'number' || typeof idOrValueData === 'string';
    const actualValueData = isEditMode ? valueData : idOrValueData;

    // Validation
    const typeId = actualValueData?.constant_type_id;
    const value = actualValueData?.value?.toString().trim();
    const unit = actualValueData?.unit?.trim();

    if (!typeId || typeId === "" || typeId === "undefined" || isNaN(parseInt(typeId))) {
      setFormError("يرجى اختيار نوع الثابت");
      return;
    }

    if (!value || value === "") {
      setFormError("يرجى اختيار القيمة");
      return;
    }

    if (!unit || unit === "") {
      setFormError("يرجى اختيار الوحدة");
      return;
    }

    const dataToSend = {
      constant_type_id: parseInt(typeId),
      value: value,
      unit: unit,
      label: actualValueData.label || `${value} ${unit}`.trim(),
      isDefault: Boolean(actualValueData.isDefault),
      notes: actualValueData.notes || "",
    };

    await handleSave(dataToSend);
  };

  // Handle toggle default status
  const handleToggleDefault = async (value) => {
    const updatedData = {
      ...value,
      isDefault: !value.isDefault,
    };
    const { constant_value_id, id, constant_type_id, type, ...dataToSend } = updatedData;
    await handleSave(constant_value_id || id, dataToSend);
  };

  // Calculate stats
  const stats = {
    total: constantValues.length,
    defaultValues: constantValues.filter((v) => v.isDefault).length,
    nonDefaultValues: constantValues.filter((v) => !v.isDefault).length,
  };

  let filteredValues = constantValues.filter(
    (value) => {
      const matchesSearch =
        value.value?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        value.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        value.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        value.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDefault = defaultFilter === "" ||
        (defaultFilter === "default" && value.isDefault) ||
        (defaultFilter === "non-default" && !value.isDefault);

      return matchesSearch && matchesDefault;
    }
  );

  // Apply sorting if sortConfig is set
  if (sortConfig.key && sortConfig.direction) {
    filteredValues = [...filteredValues].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (typeof aValue === 'boolean') {
        return sortConfig.direction === 'asc'
          ? (aValue === bValue ? 0 : aValue ? 1 : -1)
          : (aValue === bValue ? 0 : aValue ? -1 : 1);
      }

      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue, 'ar')
          : bValue.localeCompare(aValue, 'ar');
      }

      return sortConfig.direction === 'asc'
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });
  }

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, defaultFilter, selectedTypeId]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredValues.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedValues = filteredValues.slice(startIndex, endIndex);

  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  const mainStats = [
    {
      id: 1,
      title: "إجمالي القيم",
      value: stats.total,
      unit: "قيمة",
      icon: Tag,
      iconColor: "text-secondary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-f"
    },
    {
      id: 2,
      title: "القيم الافتراضية",
      value: stats.defaultValues,
      unit: "قيمة",
      icon: CheckCircle,
      iconColor: "text-primary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-primary-f"
    },
    {
      id: 3,
      title: "القيم غير الافتراضية",
      value: stats.nonDefaultValues,
      unit: "قيمة",
      icon: Tag,
      iconColor: "text-secondary-s",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-s"
    },
  ];

  const selectedTypeName = constantTypes.find(t => t.constant_type_id === parseInt(selectedTypeId))?.constants_Type_name || "";

  const handleOpenCreate = () => {
    // if (!selectedTypeId) {
    //   alert("يرجى اختيار نوع الثابت أولاً");
    //   return;
    // }
    setFormData({
      constant_type_id: selectedTypeId,
      value: "",
      unit: "",
      label: "",
      isDefault: false,
      notes: "",
    });
    setFormError("");
    openCreateModal();
  };

  return (
    <div className="min-h-screen bg-gray-50 space-y-8 p-2">
      <div className=" mx-auto">
        <PageHeader
          title="إدارة القيم الثابتة"
          subtitle={selectedTypeName ? `نوع الثابت: ${selectedTypeName}` : "اختر نوع الثابت أولاً"}
          actionLabel="إضافة قيمة جديدة"
          onAction={handleOpenCreate}
          disabled={!selectedTypeId}
        />

        {/* Type Selector */}
        <Card className="p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع الثابت</Label>
              <Select
                value={selectedTypeId}
                onValueChange={setSelectedTypeId}
                disabled={typesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الثابت" />
                </SelectTrigger>
                <SelectContent>
                  {constantTypes.map((type) => (
                    <SelectItem
                      key={type.constant_type_id}
                      value={type.constant_type_id.toString()}
                    >
                      {type.constants_Type_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center">
              <p className="text-sm text-gray-600">
                {typesLoading ? "جاري تحميل الأنواع..." : `${constantTypes.length} نوع متاح`}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {mainStats.map((stat) => (
            <StatsCard key={stat.id} {...stat} />
          ))}
        </div>

        {/* Values Table Card */}
        <Card className="p-6">
          <div className="">
            <h2 className="text-xl font-bold">
              {selectedTypeName ? `قيم ${selectedTypeName}` : "القيم الثابتة"}
            </h2>
          </div>

          {error && (
            <MessageAlert
              type="error"
              message={error}
              onDismiss={() => { }}
              dismissable={true}
            />
          )}

          <div className="-my-4">
            <SearchInput
              placeholder="ابحث عن قيمة (القيمة أو العنوان أو الوحدة أو الملاحظات)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!selectedTypeId}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FilterSelect
              label="حالة الافتراضي"
              value={defaultFilter}
              onChange={(e) => setDefaultFilter(e.target.value)}
              options={[
                { value: "", label: "جميع القيم" },
                { value: "default", label: "افتراضي فقط" },
                { value: "non-default", label: "غير افتراضي فقط" }
              ]}
              disabled={!selectedTypeId}
            />

            <ResultsCounter
              current={filteredValues.length}
              total={constantValues.length}
            />
          </div>

          <div className="flex justify-between">
            <div className=" flex justify-start">
              <RowsPerPageSelector
                value={rowsPerPage}
                onChange={setRowsPerPage}
                options={[5, 10, 20, 50]}
              />
            </div>

            <Button
              onClick={handleExport}
              disabled={exportLoading || filteredValues.length === 0 || !selectedTypeId}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white p-6 rounded-xl"
            >
              {exportLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>جاري التصدير...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>تصدير Excel ({filteredValues.length})</span>
                </>
              )}
            </Button>
          </div>

          {!selectedTypeId ? (
            <EmptyState message="يرجى اختيار نوع الثابت أولاً لعرض القيم" />
          ) : loading ? (
            <LoadingState message="جاري تحميل القيم الثابتة..." />
          ) : filteredValues.length === 0 ? (
            <EmptyState message="لا توجد قيم ثابتة لهذا النوع" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg ">
                <Table onSort={handleSort}>
                  <TableHeader>
                    <TableRow>
                      <TableHead sortable sortKey="value">القيمة</TableHead>
                      <TableHead sortable sortKey="unit">الوحدة</TableHead>
                      <TableHead sortable sortKey="label">العنوان</TableHead>
                      <TableHead sortable sortKey="isDefault">افتراضي</TableHead>
                      <TableHead sortable sortKey="notes">الملاحظات</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedValues.map((value) => (
                      <TableRow key={value.constant_value_id || value.id}>
                        <TableCell className="font-medium">
                          {value.value}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {value.unit || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {value.label || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={value.isDefault ? 'default' : 'secondary'}
                          >
                            {value.isDefault ? 'نعم' : 'لا'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {value.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* <SwitchActive
                              isActive={value.isDefault}
                              onToggle={() => handleToggleDefault(value)}
                              mode="toggle"
                              confirmBeforeToggle={false}
                              activeLabel="افتراضي"
                              inactiveLabel="غير افتراضي"
                            /> */}
                            <CrudActions
                              onView={() => openViewModal(value.constant_value_id || value.id)}
                              onEdit={() => {
                                setFormData({
                                  constant_type_id: value.constant_type_id?.toString() || selectedTypeId,
                                  value: value.value?.toString() || "",
                                  unit: value.unit || "",
                                  label: value.label || "",
                                  isDefault: value.isDefault || false,
                                  notes: value.notes || "",
                                });
                                openEditModal(value);
                              }}
                              onDelete={() => openDeleteModal(value)}
                              size="md"
                            />
                          </div>
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

      {/* Unified CRUD Modal */}
      <CrudModal
        isOpen={modalState.isOpen}
        mode={modalState.mode}
        onClose={() => {
          closeModal();
          setFormError("");
          setFormData({
            constant_type_id: selectedTypeId || "",
            value: "",
            unit: "",
            label: "",
            isDefault: false,
            notes: "",
          });
        }}
        onSubmit={handleSaveValue}
        onDelete={handleDelete}
        data={selectedItem}
        title={
          modalState.mode === 'create'
            ? 'إضافة قيمة جديدة'
            : modalState.mode === 'edit'
              ? 'تعديل القيمة'
              : modalState.mode === 'view'
                ? 'تفاصيل القيمة'
                : ''
        }
        loading={modalState.loading}
        size="lg"
        formData={formData}
        setFormData={setFormData}
        fields={
          modalState.mode === 'view'
            ? [
              { key: 'value', label: 'القيمة' },
              { key: 'unit', label: 'الوحدة' },
              { key: 'label', label: 'العنوان' },
              {
                key: 'isDefault',
                label: 'افتراضي',
                formatValue: (key, value) => value ? 'نعم' : 'لا'
              },
              { key: 'notes', label: 'الملاحظات' },
              {
                key: 'type',
                label: 'نوع الثابت',
                formatValue: (key, value) => value?.constants_Type_name || selectedTypeName
              },
            ]
            : []
        }
        deleteTitle="حذف القيمة"
        deleteMessage="هل أنت متأكد من رغبتك في حذف هذه القيمة الثابتة؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={selectedItem?.value || selectedItem?.label}
      >
        {(modalState.mode === 'create' || modalState.mode === 'edit') && (
          <div className="space-y-4">
            {formError && (
              <MessageAlert
                type="error"
                message={formError}
                dismissable={false}
              />
            )}

            <div className="space-y-2">
              <Label>المادة <span className="text-red-500">*</span></Label>
              <Select
                value={formData.material_id?.toString()}
                onValueChange={(value) => setFormData({ ...formData, material_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.material_id} value={material.material_id.toString()}>
                      {material.material_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Selector (only in create mode or if no type selected) */}
            {(!selectedTypeId || modalState.mode === 'create') && (
              <div className="space-y-2">
                <Label>نوع الثابت <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.constant_type_id}
                  onValueChange={(value) => setFormData({ ...formData, constant_type_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع الثابت" />
                  </SelectTrigger>
                  <SelectContent>
                    {constantTypes.map((type) => (
                      <SelectItem
                        key={type.constant_type_id}
                        value={type.constant_type_id.toString()}
                      >
                        {type.constants_Type_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* الوحدة - Select Box */}
            <div className="space-y-2">
              <Label>الوحدة <span className="text-red-500">*</span></Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* القيمة - Input Box */}
            <div className="space-y-2">
              <Label>القيمة <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="اختر قيمة موجودة أو اكتب قيمة جديدة"
                list="constant-values-suggestions"
              />
              <datalist id="constant-values-suggestions">
                {Array.from(new Set([
                  ...AVAILABLE_VALUES,
                  ...constantValues.map((v) => v.value?.toString()).filter(Boolean),
                ])).map((val) => (
                  <option key={val} value={val} />
                ))}
              </datalist>
            </div>



            {/* العنوان - يُنشأ تلقائياً */}
            <div className="space-y-2">
              <Label>العنوان (يُنشأ تلقائياً)</Label>
              <Input
                type="text"
                value={formData.label}
                readOnly
                className="bg-gray-100"
                placeholder="سيُنشأ تلقائياً من القيمة والوحدة"
              />
              <p className="text-xs text-gray-500">يتم إنشاء العنوان تلقائياً من: القيمة + الوحدة</p>
            </div>

            {/* افتراضي - Checkbox */}
            <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
              <Label htmlFor="isDefault" className="cursor-pointer select-none">
                تعيين كقيمة افتراضية
              </Label>
            </div>

            {/* الملاحظات */}
            <div className="space-y-2">
              <Label>الملاحظات</Label>
              <Input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>
        )}
      </CrudModal>
    </div>
  );
}