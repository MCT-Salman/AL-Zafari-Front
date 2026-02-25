// src\pages\Constant\Color.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import { colorApi } from "../../api/colorApi";
import { rulerApi } from "../../api/rulerApi";
import { materialApi } from "../../api/materialApi";
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
import { Download, Palette, Ruler as RulerIcon, DollarSign, ImagePlus, ImageIcon, X } from "lucide-react";
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

// Base URL for images - Strip /api if it exists to get the server root
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

export default function Color() {
  const fileInputRef = useRef(null);

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
      fetch: "تم تحميل الألوان بنجاح",
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
    ruler_id: "",
    color_code: "",
    color_name: "",
    notes: "",
    imageFile: null,
    imagePreview: null,
  });
  const [formError, setFormError] = useState("");

  // Rulers and Materials for dropdown
  const [rulers, setRulers] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Load colors and rulers on mount
  useEffect(() => {
    fetchItems();
    loadRulers();
    loadMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle open create modal
  const handleOpenCreate = () => {
    setFormError("");
    setFormData({
      material_id: "",
      ruler_id: "",
      color_code: "",
      color_name: "",
      notes: "",
      imageFile: null,
      imagePreview: null,
    });
    openCreateModal();
  };

  // Handle open edit modal
  const handleOpenEdit = (color) => {
    setFormError("");

    // Deep-path extraction of IDs to ensure selection even if rulers list is empty
    const rulerId = (
      color.ruler_id ||
      color.ruler?.ruler_id ||
      color.ruler?.id
    )?.toString() || "";

    const materialId = (
      color.material_id ||
      color.ruler?.material_id ||
      color.ruler?.material?.material_id ||
      color.ruler?.material?.id
    )?.toString() || "";

    setFormData({
      material_id: materialId,
      ruler_id: rulerId,
      color_code: color.color_code || "",
      color_name: color.color_name || "",
      notes: color.notes || "",
      imageFile: null,
      imagePreview: color.imageUrl ? `${API_BASE_URL}${color.imageUrl}` : null,
    });
    openEditModal(color);
  };

  // Load materials for dropdown
  const loadMaterials = async () => {
    try {
      const response = await materialApi.getMaterials();
      setMaterials(response.data || []);
    } catch (error) {
      console.error("Failed to load materials:", error);
    }
  };

  // Load rulers for dropdown
  const loadRulers = async () => {
    try {
      const response = await rulerApi.getRulers();
      setRulers(response.data || []);
    } catch (error) {
      console.error("Failed to load rulers:", error);
    }
  };

  // Helper to get material name from rulers list if missing in color object
  const getMaterialName = (color) => {
    // 1. Try nested structure color.ruler.material
    if (color?.ruler?.material?.material_name) return color.ruler.material.material_name;

    // 2. Try to find in rulers list
    const rulerId = color?.ruler_id || color?.ruler?.ruler_id;
    if (rulerId && rulers.length > 0) {
      const ruler = rulers.find(r => r.ruler_id === rulerId);
      if (ruler?.material?.material_name) return ruler.material.material_name;
    }

    return "غير محدد";
  };

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRulerId, setSelectedRulerId] = useState("");
  const [selectedMaterialName, setSelectedMaterialName] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Use export hook
  const { exportToExcel, loading: exportLoading } = useExport({
    columns: [
      { key: "color_name", header: "اسم اللون" },
      { key: "color_code", header: "كود اللون" },
      { key: "ruler_name", header: "المسطرة", format: (item) => colorApi.getRulerName(item) },
      { key: "material_name", header: "المادة", format: (item) => getMaterialName(item) },
      { key: "notes", header: "الملاحظات" },
    ],
    columnWidths: [
      { wch: 20 },  // اسم اللون
      { wch: 15 },  // كود اللون
      { wch: 20 },  // المسطرة
      { wch: 20 },  // المادة
      { wch: 30 },  // الملاحظات
    ],
    sheetName: "الألوان",
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredColors, "الألوان");
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError("حجم الصورة كبير جداً (الأقصى 5MB)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle save with validation
  const handleSaveColor = async (idOrData, dataOrEmpty) => {
    const isEdit = modalState.mode === 'edit';
    const colorId = isEdit ? (typeof idOrData === 'object' ? selectedItem?.color_id : idOrData) : null;
    const actualData = isEdit ? (dataOrEmpty || idOrData) : idOrData;

    setFormError("");

    // Validation
    const rulerId = formData.ruler_id;
    const colorCode = formData.color_code?.trim();
    const colorName = formData.color_name?.trim();

    if (!rulerId || !colorCode || !colorName) {
      setFormError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Prepare FormData
    const formDataToSend = new FormData();
    formDataToSend.append("ruler_id", rulerId);
    formDataToSend.append("color_code", colorCode);
    formDataToSend.append("color_name", colorName);
    formDataToSend.append("notes", formData.notes || "");

    // Note: Do NOT append color_id to the body for Prisma updates.
    // The ID is already sent in the URL, and sending it in the body as a string
    // causes a type mismatch in Prisma (Expected Int, provided String).

    if (formData.imageFile) {
      formDataToSend.append("imageUrl", formData.imageFile);
    }

    try {
      if (isEdit) {
        await colorApi.updateColor(colorId, formDataToSend);
        fetchItems();
        closeModal();
      } else {
        await colorApi.createColor(formDataToSend);
        fetchItems();
        // Clear form after successful create, but keep modal open
        setFormData({
          material_id: "",
          ruler_id: "",
          color_code: "",
          color_name: "",
          notes: "",
          imageFile: null,
          imagePreview: null,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) {
      setFormError(err.message || "فشل في حفظ اللون");
    }
  };

  // Calculate stats
  const stats = {
    total: colors.length,
  };

  // Filter colors
  let filteredColors = colors.filter(
    (color) => {
      const matchesSearch =
        color.color_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        color.color_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        colorApi.getRulerName(color)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getMaterialName(color)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        color.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      const rulerId = (color.ruler_id || color.ruler?.ruler_id)?.toString();
      const matchesRuler = selectedRulerId === "" || rulerId === selectedRulerId;
      const matchesMaterial = selectedMaterialName === "" || getMaterialName(color) === selectedMaterialName;

      return matchesSearch && matchesRuler && matchesMaterial;
    }
  );

  // Apply sorting if sortConfig is set
  if (sortConfig.key && sortConfig.direction) {
    filteredColors = [...filteredColors].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (typeof aValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue, "ar")
          : bValue.localeCompare(aValue, "ar");
      }

      return sortConfig.direction === "asc"
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });
  }

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRulerId, selectedMaterialName]);

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
  ];

  return (
    <div className="min-h-screen bg-gray-50 space-y-8 p-2">
      <div className=" mx-auto">
        <PageHeader
          title="إدارة الألوان"
          subtitle={`إجمالي الألوان: ${colors.length}`}
          actionLabel="إضافة لون جديد"
          onAction={handleOpenCreate}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-5">
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
              placeholder="ابحث عن لون (الاسم أو الكود أو المسطرة أو المادة أو الملاحظات)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters and Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FilterSelect
              label="المسطرة"
              value={selectedRulerId}
              onChange={(e) => setSelectedRulerId(e.target.value)}
              options={[
                { value: "", label: "جميع المساطر" },
                ...rulers.map(r => ({ value: r.ruler_id.toString(), label: r.ruler_name }))
              ]}
            />

            <FilterSelect
              label="المادة"
              value={selectedMaterialName}
              onChange={(e) => setSelectedMaterialName(e.target.value)}
              options={[
                { value: "", label: "جميع المواد" },
                ...[...new Set(rulers.map(r => r.material?.material_name).filter(Boolean))].map(name => ({ value: name, label: name }))
              ]}
            />

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
                      <TableHead>الصورة</TableHead>
                      <TableHead sortable sortKey="color_name">اسم اللون</TableHead>
                      <TableHead sortable sortKey="color_code">كود اللون</TableHead>
                      <TableHead>المسطرة / المادة</TableHead>
                      <TableHead>الملاحظات</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedColors.map((color) => (
                      <TableRow key={color.color_id}>
                        <TableCell>
                          <div className="w-12 h-12 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden">
                            {color.imageUrl ? (
                              <img
                                src={`${API_BASE_URL}${color.imageUrl}`}
                                alt={color.color_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {color.color_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {color.color_code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="secondary" className="block w-fit">
                              {colorApi.getRulerName(color)}
                            </Badge>
                            <span className="text-xs text-secondary-t">
                              {getMaterialName(color)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {color.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CrudActions
                              onView={() => openViewModal(color.color_id)}
                              onEdit={() => handleOpenEdit(color)}
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
              {
                key: "imageUrl",
                label: "صورة اللون",
                formatValue: (key, value) => value ? (
                  <div className="mt-2 w-32 h-32 rounded-xl border border-primary-f/10 overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img src={`${API_BASE_URL}${value}`} alt="Color" className="w-full h-full object-cover" />
                  </div>
                ) : "لا توجد صورة"
              },
              { key: "ruler_name", label: "المسطرة", formatValue: () => colorApi.getRulerName(selectedItem) },
              { key: "material_name", label: "المادة", formatValue: () => getMaterialName(selectedItem) },
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
                message={formError}
                dismissable={false}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المادة <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.material_id?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, material_id: value, ruler_id: "" })}
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
                <Label>المسطرة <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.ruler_id?.toString() || ""}
                  onValueChange={(value) => setFormData({ ...formData, ruler_id: value })}
                  disabled={!formData.material_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.material_id ? "اختر المادة أولاً" : "اختر المسطرة"} />
                  </SelectTrigger>
                  <SelectContent>
                    {rulers
                      .filter(r => r.material_id?.toString() === formData.material_id?.toString())
                      .map((ruler) => (
                        <SelectItem key={ruler.ruler_id} value={ruler.ruler_id.toString()}>
                          {ruler.ruler_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم اللون <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  value={formData.color_name || ""}
                  onChange={(e) => setFormData({ ...formData, color_name: e.target.value })}
                  placeholder="مثال: أحمر غامق"
                />
              </div>

              <div className="space-y-2">
                <Label>كود اللون <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  value={formData.color_code || ""}
                  onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                  placeholder="مثال: RED003"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>صورة اللون</Label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />

              {!formData.imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary-f/20 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-secondary-s/5 hover:bg-secondary-s/10 transition-colors cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full bg-primary-f/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImagePlus className="w-8 h-8 text-primary-f" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-secondary-f">انقر لاختيار صورة</p>
                    <p className="text-xs text-secondary-t mt-1">PNG, JPG حتى 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-video rounded-xl border border-primary-f/10 overflow-hidden bg-gray-50 flex items-center justify-center group">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      تغيير
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeImage}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>الملاحظات</Label>
              <Textarea
                value={formData.notes || ""}
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
