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

  // State for materials and type selection
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Create adapter for constant values
  const constantValueApiAdapter = useMemo(() => ({
    getItems: async () => {
      if (!selectedMaterialId) {
        return { success: true, data: [] };
      }

      const response = await constantApi.getConstantValuesByMaterial(
        selectedMaterialId,
        selectedType || null
      );

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
        material_id: parseInt(data.material_id),
        type: data.type,
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
        material_id: parseInt(data.material_id),
        type: data.type,
        value: data.value.toString(),
        unit: data.unit || "",
        label: data.label || `${data.value} ${data.unit || ""}`.trim(),
        isDefault: Boolean(data.isDefault),
        notes: data.notes || ""
      };
      return await constantApi.updateConstantValue(id, payload);
    },
    deleteItem: (...args) => constantApi.deleteConstantValue(...args),
  }), [selectedMaterialId, selectedType]);

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

  // Form state for ConstantValue
  const [formData, setFormData] = useState({
    material_id: "",
    type: "",
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

  // Load values when material or type changes
  useEffect(() => {
    if (selectedMaterialId) {
      fetchItems();
    }
  }, [selectedMaterialId, selectedType]);

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [defaultFilter, setDefaultFilter] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Use export hook
  const { exportToExcel, loading: exportLoading } = useExport({
    columns: [
      { key: 'material_name', header: 'المادة' },
      { key: 'value', header: 'القيمة' },
      { key: 'unit', header: 'الوحدة' },
      { key: 'type', header: 'النوع' },
      { key: 'label', header: 'العنوان' },
      {
        key: 'isDefault',
        header: 'افتراضي',
        format: (value) => value ? 'نعم' : 'لا'
      },
      { key: 'notes', header: 'الملاحظات' },
    ],
    columnWidths: [
      { wch: 20 },  // المادة
      { wch: 10 },  // القيمة
      { wch: 10 },  // الوحدة
      { wch: 15 },  // النوع
      { wch: 20 },  // العنوان
      { wch: 10 },  // افتراضي
      { wch: 25 },  // الملاحظات
    ],
    sheetName: 'القيم الثابتة',
  });

  // Handle export
  const handleExport = () => {
    // Add material name to each value for export
    const exportData = filteredValues.map(value => ({
      ...value,
      material_name: materials.find(m => m.material_id === value.material_id)?.material_name || '',
    }));

    exportToExcel(exportData, 'القيم_الثابتة');
  };

  // Handle save with validation
  const handleSaveValue = async (idOrValueData, valueData) => {
    setFormError("");

    const isEditMode = typeof idOrValueData === 'number' || typeof idOrValueData === 'string';
    const actualValueData = isEditMode ? valueData : idOrValueData;

    // Validation
    const materialId = actualValueData?.material_id;
    const type = actualValueData?.type?.trim();
    const value = actualValueData?.value?.toString().trim();
    const unit = actualValueData?.unit?.trim();

    if (!materialId || materialId === "" || isNaN(parseInt(materialId))) {
      setFormError("يرجى اختيار المادة");
      return;
    }

    if (!type || type === "") {
      setFormError("يرجى اختيار نوع القيمة");
      return;
    }

    if (!value || value === "") {
      setFormError("يرجى إدخال القيمة");
      return;
    }

    if (!unit || unit === "") {
      setFormError("يرجى اختيار الوحدة");
      return;
    }

    const dataToSend = {
      material_id: parseInt(materialId),
      type: type,
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
  }, [searchTerm, defaultFilter, selectedMaterialId, selectedType]);

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

  const selectedMaterialName = materials.find(m => m.material_id === parseInt(selectedMaterialId))?.material_name || "";

  const handleOpenCreate = () => {
    setFormData({
      material_id: selectedMaterialId,
      type: selectedType,
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
          subtitle={selectedMaterialName ? `المادة: ${selectedMaterialName}` : "اختر المادة أولاً"}
          actionLabel="إضافة قيمة جديدة"
          onAction={handleOpenCreate}
          disabled={!selectedMaterialId}
        />

        {/* Material and Type Selector */}
        <Card className="p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>المادة</Label>
              <Select
                value={selectedMaterialId}
                onValueChange={setSelectedMaterialId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem
                      key={material.material_id}
                      value={material.material_id.toString()}
                    >
                      {material.material_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>نوع القيمة (اختياري)</Label>
              <Select
                value={selectedType}
                onValueChange={setSelectedType}
                disabled={!selectedMaterialId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="width">العرض</SelectItem>
                  <SelectItem value="height">الطول</SelectItem>
                  <SelectItem value="thickness">السماكة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center">
              <p className="text-sm text-gray-600">
                {materials.length} مادة متاحة
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
              {selectedMaterialName ? `قيم ${selectedMaterialName}` : "القيم الثابتة"}
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
              disabled={!selectedMaterialId}
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
              disabled={!selectedMaterialId}
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
              disabled={exportLoading || filteredValues.length === 0 || !selectedMaterialId}
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

          {!selectedMaterialId ? (
            <EmptyState message="يرجى اختيار المادة أولاً لعرض القيم" />
          ) : loading ? (
            <LoadingState message="جاري تحميل القيم الثابتة..." />
          ) : filteredValues.length === 0 ? (
            <EmptyState message="لا توجد قيم ثابتة لهذه المادة" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg ">
                <Table onSort={handleSort}>
                  <TableHeader>
                    <TableRow>
                      <TableHead sortable sortKey="value">القيمة</TableHead>
                      <TableHead sortable sortKey="unit">الوحدة</TableHead>
                      <TableHead sortable sortKey="type">النوع</TableHead>
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
                          <Badge variant="secondary">
                            {value.type === 'width' ? 'العرض' :
                             value.type === 'height' ? 'الطول' :
                             value.type === 'thickness' ? 'السمك' : value.type}
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
                            <CrudActions
                              onView={() => openViewModal(value.constant_value_id || value.id)}
                              onEdit={() => {
                                setFormData({
                                  material_id: value.material_id?.toString() || selectedMaterialId,
                                  type: value.type || "",
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
            material_id: selectedMaterialId || "",
            type: selectedType || "",
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
              { key: 'type', label: 'النوع' },
              { key: 'label', label: 'العنوان' },
              {
                key: 'isDefault',
                label: 'افتراضي',
                formatValue: (key, value) => value ? 'نعم' : 'لا'
              },
              { key: 'notes', label: 'الملاحظات' },
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

            {/* Type Selector */}
            <div className="space-y-2">
              <Label>نوع القيمة <span className="text-red-500">*</span></Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع القيمة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="width">العرض</SelectItem>
                  <SelectItem value="height">الطول</SelectItem>
                  <SelectItem value="thickness">السماكة</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                placeholder="مثال: 22"
              />
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