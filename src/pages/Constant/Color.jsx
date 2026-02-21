// src\pages\Constant\Color.jsx
import { useState, useEffect, useMemo } from "react";
import { colorApi } from "../../api/colorApi";
import { materialApi } from "../../api/materialApi";
import { rulerApi } from "../../api/rulerApi";
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
import { Download, Palette, Package, DollarSign, ImagePlus } from "lucide-react";
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

export default function Color() {
  // Create adapter to map generic CRUD method names to colorApi method names
  const colorApiAdapter = useMemo(() => ({
    getItems: (...args) => colorApi.getColors(...args),
    getItemById: (...args) => colorApi.getColorById(...args),
    createItem: (...args) => colorApi.createColor(...args),
    updateItem: (...args) => colorApi.updateColor(...args),
    deleteItem: (...args) => colorApi.deleteColor(...args),
  }), []);

  // Use CRUD hook
  const {
    items: colors,
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
  } = useCrud(colorApiAdapter, {
    idField: 'color_id',
    successMessages: {
      create: "تم إنشاء اللون بنجاح",
      update: "تم تحديث اللون بنجاح",
      delete: "تم حذف اللون بنجاح",
    },
    errorMessages: {
      create: "فشل في حفظ اللون",
      update: "فشل في حفظ اللون",
      delete: "فشل في حذف اللون",
      fetch: "فشل في تحميل الألوان",
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    material_id: "",
    color_code: "",
    color_name: "",
    ruler_type: "مسطرة جديدة",
    notes: "",
  });
  const [formError, setFormError] = useState("");

  // Materials for dropdown
  const [materials, setMaterials] = useState([]);

  // Load colors and materials on mount
  useEffect(() => {
    fetchItems();
    loadMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize formData with selectedItem when modal opens in edit mode
  useEffect(() => {
    if (modalState.isOpen && modalState.mode === "edit" && selectedItem) {
      setFormData({
        material_id: selectedItem.material_id?.toString() || "",
        color_code: selectedItem.color_code || "",
        color_name: selectedItem.color_name || "",
        ruler_type: selectedItem.ruler_type || "مسطرة جديدة",
        notes: selectedItem.notes || "",
      });
    } else if (modalState.isOpen && modalState.mode === "create") {
      setFormData({
        material_id: "",
        color_code: "",
        color_name: "",
        ruler_type: "مسطرة جديدة",
        notes: "",
      });
    }
  }, [modalState.isOpen, modalState.mode, selectedItem]);

  // Load materials for dropdown
  const loadMaterials = async () => {
    try {
      const response = await materialApi.getMaterials();
      setMaterials(response.data || []);
    } catch (error) {
      console.error("Failed to load materials:", error);
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
      { key: "color_name", header: "اسم اللون" },
      { key: "color_code", header: "كود اللون" },
      { key: "material_name", header: "المادة" },
      { key: "prices_count", header: "عدد الأسعار", format: (item) => colorApi.getPricesCount(item) },
      { key: "rulers_count", header: "عدد المساطر", format: (item) => colorApi.getRulersCount(item) },
      { key: "notes", header: "الملاحظات" },
    ],
    columnWidths: [
      { wch: 5 },   // #
      { wch: 20 },  // اسم اللون
      { wch: 15 },  // كود اللون
      { wch: 20 },  // المادة
      { wch: 12 },  // عدد الأسعار
      { wch: 12 },  // عدد المساطر
      { wch: 30 },  // الملاحظات
    ],
    sheetName: "الألوان",
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredColors, "الألوان");
  };

  // Handle save with validation
  const handleSaveColor = async (data) => {
    setFormError("");

    // Validation
    const materialId = formData.material_id;
    const colorCode = formData.color_code?.trim();
    const colorName = formData.color_name?.trim();
    const rulerType = formData.ruler_type;

    if (!materialId || !colorCode || !colorName || !rulerType) {
      setFormError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Prepare data to send
    const dataToSend = {
      material_id: parseInt(materialId),
      color_code: colorCode,
      color_name: colorName,
      notes: formData.notes || "",
    };

    try {
      const response = await handleSave(dataToSend);

      // If we are creating a new color, automatically create a ruler for it
      if (modalState.mode === 'create' && response?.data?.color_id) {
        await rulerApi.createRuler({
          ruler_type: rulerType,
          material_id: parseInt(materialId),
          color_id: response.data.color_id,
          notes: `مسطرة تلقائية للون: ${colorName}`
        });
      }
    } catch (err) {
      console.error("Failed to save color and ruler:", err);
    }
  };

  // Calculate stats
  const stats = {
    total: colors.length,
    withPrices: colors.filter((c) => c.prices && c.prices.length > 0).length,
    withRulers: colors.filter((c) => c.rulers && c.rulers.length > 0).length,
  };

  // Filter colors
  let filteredColors = colors.filter(
    (color) => {
      const matchesSearch =
        color.color_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        color.color_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        color.material?.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        color.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    }
  );

  // Apply sorting if sortConfig is set
  if (sortConfig.key && sortConfig.direction) {
    filteredColors = [...filteredColors].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // ?????? ?????? ???????
      if (typeof aValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue, "ar")
          : bValue.localeCompare(aValue, "ar");
      }

      // ?????? ??????? ?????? ??????
      return sortConfig.direction === "asc"
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });
  }

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredColors.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedColors = filteredColors.slice(startIndex, endIndex);

  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  const mainStats = [
    {
      id: 1,
      title: "إجمالي الألوان",
      value: stats.total,
      unit: "لون",
      icon: Palette,
      iconColor: "text-secondary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-f"
    },
    {
      id: 2,
      title: "ألوان لها أسعار",
      value: stats.withPrices,
      unit: "لون",
      icon: DollarSign,
      iconColor: "text-primary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-primary-f"
    },
    {
      id: 3,
      title: "ألوان لها مساطر",
      value: stats.withRulers,
      unit: "لون",
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
          title="إدارة الألوان"
          subtitle={`إجمالي الألوان: ${colors.length}`}
          actionLabel="إضافة لون جديد"
          onAction={openCreateModal}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {mainStats.map((stat) => (
            <StatsCard key={stat.id} {...stat} />
          ))}
        </div>

        {/* Colors Table Card */}
        <Card className="p-6">
          <div className="">
            <h2 className="text-xl font-bold">قائمة الألوان</h2>
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
              placeholder="ابحث عن لون (الاسم أو الكود أو المادة أو الملاحظات)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters and Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultsCounter
              current={filteredColors.length}
              total={colors.length}
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
              disabled={exportLoading || filteredColors.length === 0}
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
                  <span>تصدير Excel ({filteredColors.length})</span>
                </>
              )}
            </Button>
          </div>

          {/* Colors Table */}
          {loading ? (
            <LoadingState message="جاري تحميل الألوان..." />
          ) : filteredColors.length === 0 ? (
            <EmptyState message="لا توجد ألوان" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg ">
                <Table onSort={handleSort}>
                  <TableHeader>
                    <TableRow>
                      <TableHead sortable sortKey="color_name">اسم اللون</TableHead>
                      <TableHead sortable sortKey="color_code">كود اللون</TableHead>
                      <TableHead>المادة</TableHead>
                      <TableHead>عدد الأسعار</TableHead>
                      <TableHead>عدد المساطر</TableHead>
                      <TableHead>الملاحظات</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedColors.map((color) => (
                      <TableRow key={color.color_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: color.color_code || "#ccc" }}
                            />
                            {color.color_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {color.color_code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {colorApi.getMaterialName(color)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50">
                            {colorApi.getPricesCount(color)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50">
                            {colorApi.getRulersCount(color)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {color.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CrudActions
                              onView={() => openViewModal(color.color_id)}
                              onEdit={() => openEditModal(color)}
                              onDelete={() => openDeleteModal(color)}
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
            material_id: "",
            color_code: "",
            color_name: "",
            notes: "",
          });
        }}
        onSubmit={handleSaveColor}
        onDelete={handleDelete}
        data={selectedItem}
        title={
          modalState.mode === "create"
            ? "إضافة لون جديد"
            : modalState.mode === "edit"
              ? "تعديل اللون"
              : modalState.mode === "view"
                ? "تفاصيل اللون"
                : ""
        }
        loading={modalState.loading}
        size="lg"
        formData={formData}
        setFormData={setFormData}
        fields={
          modalState.mode === "view"
            ? [
              { key: "color_name", label: "اسم اللون" },
              { key: "color_code", label: "كود اللون" },
              { key: "material_name", label: "المادة", formatValue: (key, value) => colorApi.getMaterialName(selectedItem) },
              {
                key: "prices", label: "الأسعار", formatValue: (key, value) => {
                  if (!value || value.length === 0) return "لا توجد أسعار";
                  return `${value.length} سعر`;
                }
              },
              {
                key: "rulers", label: "المساطر", formatValue: (key, value) => {
                  if (!value || value.length === 0) return "لا توجد مساطر";
                  return `${value.length} مسطرة`;
                }
              },
              { key: "notes", label: "الملاحظات" },
            ]
            : []
        }
        deleteTitle="حذف اللون"
        deleteMessage="هل أنت متأكد من رغبتك في حذف هذا اللون؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={selectedItem?.color_name}
      >
        {(modalState.mode === "create" || modalState.mode === "edit") && (
          <div className="space-y-4">
            {formError && (
              <MessageAlert
                type="error"
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

            <div className="space-y-2">
              <Label>نوع المسطرة <span className="text-red-500">*</span></Label>
              <Select
                value={formData.ruler_type}
                onValueChange={(value) => setFormData({ ...formData, ruler_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع المسطرة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="مسطرة جديدة">مسطرة جديدة</SelectItem>
                  <SelectItem value="مسطرة قديمة">مسطرة قديمة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>اسم اللون <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                value={formData.color_name}
                onChange={(e) => setFormData({ ...formData, color_name: e.target.value })}
                placeholder="مثال: أحمر"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>كود اللون <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  value={formData.color_code}
                  onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                  placeholder="مثال: RED001"
                />
              </div>

              <div className="space-y-2">
                <Label>صورة اللون</Label>
                <div className="border-2 border-dashed border-primary-f/20 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-secondary-s/5 hover:bg-secondary-s/10 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 rounded-full bg-primary-f/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImagePlus className="w-8 h-8 text-primary-f" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-secondary-f">انقر لاختيار صورة أو اسحبها هنا</p>
                    <p className="text-xs text-secondary-t mt-1">PNG, JPG حتى 5MB (واجهة فقط)</p>
                  </div>
                  {formData.color_code && (
                    <div
                      className="mt-2 w-12 h-6 rounded border shadow-sm"
                      style={{ backgroundColor: formData.color_code.startsWith('#') ? formData.color_code : '#ccc' }}
                      title="معاينة الكود إذا كان رمزاً سداسياً"
                    />
                  )}
                </div>
              </div>
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
