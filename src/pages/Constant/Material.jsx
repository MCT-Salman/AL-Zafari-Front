import React, { useState, useEffect, useMemo } from "react";
import { materialApi } from "../../api/materialApi";
import { constantApi } from "../../api/constantApi";
import { useCrud } from "../../hooks/useCrud";
import { useExport } from "../../hooks/useExport";
import { CrudModal } from "../../components/common/CrudModal";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Download, Package, Ruler, Palette } from "lucide-react";
import CrudActions from "../../components/common/CrudActions";
import StatsCard from "../../components/common/StatsCard";
import SearchInput from "../../components/common/SearchInput";
import MessageAlert from "../../components/common/MessageAlert";
import PageHeader from "../../components/common/PageHeader";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import ResultsCounter from "../../components/common/ResultsCounter";
import RowsPerPageSelector from "../../components/common/RowsPerPageSelector";
import PaginationControls from "../../components/common/PaginationControls";

export default function Material() {
  // Create adapter to map generic CRUD method names to materialApi method names
  const materialApiAdapter = useMemo(() => ({
    getItems: (...args) => materialApi.getMaterials(...args),
    getItemById: (...args) => materialApi.getMaterialById(...args),
    createItem: (...args) => materialApi.createMaterial(...args),
    updateItem: (...args) => materialApi.updateMaterial(...args),
    deleteItem: (...args) => materialApi.deleteMaterial(...args),
  }), []);

  // Use CRUD hook
  const {
    items: materials,
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
  } = useCrud(materialApiAdapter, {
    idField: 'material_id',
    successMessages: {
      create: "تم إنشاء المادة بنجاح",
      update: "تم تحديث المادة بنجاح",
      delete: "تم حذف المادة بنجاح",
    },
    errorMessages: {
      create: "فشل في حفظ المادة",
      update: "فشل في حفظ المادة",
      delete: "فشل في حذف المادة",
      fetch: "فشل في تحميل المواد",
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    material_name: "",
    type: "",
    constant_height_id: "",
    constant_width_id: "",
    constant_thickness_id: "",
    constant_value_unit: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");

  // Constant values for dropdowns
  const [heightValues, setHeightValues] = useState([]);
  const [widthValues, setWidthValues] = useState([]);
  const [thicknessValues, setThicknessValues] = useState([]);

  // Load materials and constant values on mount
  useEffect(() => {
    fetchItems();
    loadConstantValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load constant values for dropdowns
  const loadConstantValues = async () => {
    try {
      // Load height values (assuming type_id 3 for height based on API example)
      const heightResponse = await constantApi.getConstantValuesByType(3);
      setHeightValues(heightResponse.data || []);

      // Load width values (assuming type_id 2 for width based on API example)
      const widthResponse = await constantApi.getConstantValuesByType(2);
      setWidthValues(widthResponse.data || []);

      // Load thickness values (assuming type_id 4 for thickness based on API example)
      const thicknessResponse = await constantApi.getConstantValuesByType(4);
      setThicknessValues(thicknessResponse.data || []);
    } catch (error) {
      console.error('Failed to load constant values:', error);
    }
  };

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Use export hook
  const { exportToExcel, loading: exportLoading } = useExport({
    columns: [
      { key: 'material_name', header: 'اسم المادة' },
      { key: 'type', header: 'النوع' },
      { key: 'dimensions', header: 'الأبعاد', format: (item) => materialApi.formatDimensions(item) },
      { key: 'constant_value_unit', header: 'وحدة القيمة' },
      { key: 'colors_count', header: 'عدد الألوان', format: (item) => materialApi.getColorsCount(item) },
      { key: 'batches_count', header: 'عدد الدفعات', format: (item) => materialApi.getBatchesCount(item) },
      { key: 'notes', header: 'الملاحظات' },
    ],
    columnWidths: [
      { wch: 5 },   // #
      { wch: 20 },  // اسم المادة
      { wch: 15 },  // النوع
      { wch: 25 },  // الأبعاد
      { wch: 12 },  // وحدة القيمة
      { wch: 10 },  // عدد الألوان
      { wch: 10 },  // عدد الدفعات
      { wch: 30 },  // الملاحظات
    ],
    sheetName: 'المواد',
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredMaterials, 'المواد');
  };

  // Handle save with validation
  const handleSaveMaterial = async (data) => {
    setFormError("");

    // Validation
    const materialName = data?.material_name?.trim();
    const materialType = data?.type?.trim();
    const heightId = data?.constant_height_id;
    const widthId = data?.constant_width_id;
    const thicknessId = data?.constant_thickness_id;
    const unit = data?.constant_value_unit?.trim();

    if (!materialName || !materialType || !heightId || !widthId || !thicknessId || !unit) {
      setFormError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Prepare data to send
    const dataToSend = {
      material_name: materialName,
      type: materialType,
      constant_height_id: parseInt(heightId),
      constant_width_id: parseInt(widthId),
      constant_thickness_id: parseInt(thicknessId),
      constant_value_unit: unit,
      notes: data.notes || "",
    };

    await handleSave(dataToSend);
  };

  // Calculate stats
  const stats = {
    total: materials.length,
    withColors: materials.filter((m) => m.colors && m.colors.length > 0).length,
    withBatches: materials.filter((m) => m.batches && m.batches.length > 0).length,
  };

  // Filter materials
  let filteredMaterials = materials.filter(
    (material) => {
      const matchesSearch =
        material.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    }
  );

  // Apply sorting if sortConfig is set
  if (sortConfig.key && sortConfig.direction) {
    filteredMaterials = [...filteredMaterials].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // معالجة النصوص العربية
      if (typeof aValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue, 'ar')
          : bValue.localeCompare(aValue, 'ar');
      }

      // معالجة الأرقام والقيم الأخرى
      return sortConfig.direction === 'asc'
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });
  }

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredMaterials.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedMaterials = filteredMaterials.slice(startIndex, endIndex);

  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  const mainStats = [
    {
      id: 1,
      title: "إجمالي المواد",
      value: stats.total,
      unit: "مادة",
      icon: Package,
      iconColor: "text-secondary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-f"
    },
    {
      id: 2,
      title: "مواد بها ألوان",
      value: stats.withColors,
      unit: "مادة",
      icon: Palette,
      iconColor: "text-primary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-primary-f"
    },
    {
      id: 3,
      title: "مواد بها دفعات",
      value: stats.withBatches,
      unit: "مادة",
      icon: Package,
      iconColor: "text-secondary-s",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-s"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 space-y-8 p-2">
      <div className=" mx-auto">
        <PageHeader
          title="إدارة المواد"
          subtitle={`إجمالي المواد: ${materials.length}`}
          actionLabel="إضافة مادة جديدة"
          onAction={openCreateModal}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {mainStats.map((stat) => (
            <StatsCard key={stat.id} {...stat} />
          ))}
        </div>

        {/* Materials Table Card */}
        <Card className="p-6">
          <div className="">
            <h2 className="text-xl font-bold">قائمة المواد</h2>
          </div>

          {/* Messages */}
          {error && (
            <MessageAlert
              type="error"
              message={error}
              onDismiss={() => { }}
              dismissable={true}
            />
          )}

          {/* Search */}
          <div className="-my-4">
            <SearchInput
              placeholder="ابحث عن مادة (الاسم أو النوع أو الملاحظات)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters and Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultsCounter
              current={filteredMaterials.length}
              total={materials.length}
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

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={exportLoading || filteredMaterials.length === 0}
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
                  <span>تصدير Excel ({filteredMaterials.length})</span>
                </>
              )}
            </Button>
          </div>

          {/* Materials Table */}
          {loading ? (
            <LoadingState message="جاري تحميل المواد..." />
          ) : filteredMaterials.length === 0 ? (
            <EmptyState message="لا توجد مواد" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg ">
                <Table onSort={handleSort}>
                  <TableHeader>
                    <TableRow>
                      <TableHead sortable sortKey="material_name">اسم المادة</TableHead>
                      <TableHead sortable sortKey="type">النوع</TableHead>
                      <TableHead>الأبعاد</TableHead>
                      <TableHead>وحدة القيمة</TableHead>
                      <TableHead>الألوان</TableHead>
                      <TableHead>الدفعات</TableHead>
                      <TableHead>الملاحظات</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMaterials.map((material) => (
                      <TableRow key={material.material_id}>
                        <TableCell className="font-medium">
                          {material.material_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {material.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Ruler className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">
                              {materialApi.formatDimensions(material)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {material.constant_value_unit}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50">
                            {materialApi.getColorsCount(material)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50">
                            {materialApi.getBatchesCount(material)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {material.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CrudActions
                              onView={() => openViewModal(material.material_id)}
                              onEdit={() => openEditModal(material)}
                              onDelete={() => openDeleteModal(material)}
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
            material_name: "",
            type: "",
            constant_height_id: "",
            constant_width_id: "",
            constant_thickness_id: "",
            constant_value_unit: "",
            notes: "",
          });
        }}
        onSubmit={handleSaveMaterial}
        onDelete={handleDelete}
        data={selectedItem}
        title={
          modalState.mode === 'create'
            ? 'إضافة مادة جديدة'
            : modalState.mode === 'edit'
              ? 'تعديل المادة'
              : modalState.mode === 'view'
                ? 'تفاصيل المادة'
                : ''
        }
        loading={modalState.loading}
        size="lg"
        formData={formData}
        setFormData={setFormData}
        fields={
          modalState.mode === 'view'
            ? [
              { key: 'material_name', label: 'اسم المادة' },
              { key: 'type', label: 'النوع' },
              { key: 'dimensions', label: 'الأبعاد', formatValue: (key, value) => materialApi.formatDimensions(selectedItem) },
              { key: 'constant_value_unit', label: 'وحدة القيمة' },
              {
                key: 'colors', label: 'الألوان', formatValue: (key, value) => {
                  if (!value || value.length === 0) return 'لا توجد ألوان';
                  return value.map(c => c.color_name).join('، ');
                }
              },
              {
                key: 'batches', label: 'الدفعات', formatValue: (key, value) => {
                  if (!value || value.length === 0) return 'لا توجد دفعات';
                  return `${value.length} دفعة`;
                }
              },
              { key: 'notes', label: 'الملاحظات' },
            ]
            : []
        }
        deleteTitle="حذف المادة"
        deleteMessage="هل أنت متأكد من رغبتك في حذف هذه المادة؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={selectedItem?.material_name}
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
              <Label>اسم المادة <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                value={formData.material_name}
                onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                placeholder="مثال: خشب بلوط"
              />
            </div>
            <div className="space-y-2">
              <Label>النوع <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                value={formData.material_type}
                onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                placeholder="مثال: طبيعي"
              />
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>الارتفاع <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.height?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, height: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الارتفاع" />
                  </SelectTrigger>
                  <SelectContent>
                    {heightValues.map((val) => (
                      <SelectItem key={val.constant_value_id} value={val.value.toString()}>
                        {val.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>العرض <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.width?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, width: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العرض" />
                  </SelectTrigger>
                  <SelectContent>
                    {widthValues.map((val) => (
                      <SelectItem key={val.constant_value_id} value={val.value.toString()}>
                        {val.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>السمك <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.thickness?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, thickness: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر السمك" />
                  </SelectTrigger>
                  <SelectContent>
                    {thicknessValues.map((val) => (
                      <SelectItem key={val.constant_value_id} value={val.value.toString()}>
                        {val.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>وحدة القيمة <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="مثال: سم"
              />
            </div>

            <div className="space-y-2">
              <Label>الملاحظات</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>
        )}
      </CrudModal>
    </div>
  );
}