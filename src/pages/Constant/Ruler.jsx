// src\pages\Constant\Ruler.jsx
import { useState, useEffect, useMemo } from "react";
import { rulerApi } from "../../api/rulerApi";
import { materialApi } from "../../api/materialApi";
import { colorApi } from "../../api/colorApi";
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
import { Download, Ruler as RulerIcon, Package, Palette } from "lucide-react";
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

export default function Ruler() {
  // Create adapter to map generic CRUD method names to rulerApi method names
  const rulerApiAdapter = useMemo(() => ({
    getItems: (...args) => rulerApi.getRulers(...args),
    getItemById: (...args) => rulerApi.getRulerById(...args),
    createItem: (...args) => rulerApi.createRuler(...args),
    updateItem: (...args) => rulerApi.updateRuler(...args),
    deleteItem: (...args) => rulerApi.deleteRuler(...args),
  }), []);

  // Use CRUD hook
  const {
    items: rulers,
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
  } = useCrud(rulerApiAdapter, {
    idField: 'ruler_id',
    successMessages: {
      create: "تم إنشاء المسطرة بنجاح",
      update: "تم تحديث المسطرة بنجاح",
      delete: "تم حذف المسطرة بنجاح",
    },
    errorMessages: {
      create: "فشل في حفظ المسطرة",
      update: "فشل في حفظ المسطرة",
      delete: "فشل في حذف المسطرة",
      fetch: "فشل في تحميل المساطر",
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    ruler_type: "",
    material_id: "",
    color_id: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");

  // Materials and colors for dropdowns
  const [materials, setMaterials] = useState([]);
  const [colors, setColors] = useState([]);

  // Load rulers, materials, and colors on mount
  useEffect(() => {
    fetchItems();
    loadMaterials();
    loadColors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load materials for dropdown
  const loadMaterials = async () => {
    try {
      const response = await materialApi.getMaterials();
      setMaterials(response.data || []);
    } catch (error) {
      console.error("Failed to load materials:", error);
    }
  };

  // Load colors for dropdown
  const loadColors = async () => {
    try {
      const response = await colorApi.getColors();
      setColors(response.data || []);
    } catch (error) {
      console.error("Failed to load colors:", error);
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
      { key: "ruler_type", header: "نوع المسطرة" },
      { key: "material_name", header: "المادة", format: (item) => rulerApi.getMaterialName(item) },
      { key: "color_name", header: "اللون", format: (item) => rulerApi.getColorName(item) },
      { key: "color_code", header: "كود اللون", format: (item) => rulerApi.getColorCode(item) },
      { key: "dimensions", header: "الأبعاد", format: (item) => rulerApi.formatMaterialDimensions(item) },
      { key: "notes", header: "الملاحظات" },
    ],
    columnWidths: [
      { wch: 5 },   // #
      { wch: 15 },  // نوع المسطرة
      { wch: 20 },  // المادة
      { wch: 15 },  // اللون
      { wch: 12 },  // كود اللون
      { wch: 25 },  // الأبعاد
      { wch: 25 },  // الملاحظات
    ],
    sheetName: "المساطر",
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredRulers, "المساطر");
  };

  // Handle save with validation
  const handleSaveRuler = async (data) => {
    setFormError("");

    // Validation
    const rulerType = data?.ruler_type?.trim();
    const materialId = data?.material_id;
    const colorId = data?.color_id;

    if (!rulerType || !materialId || !colorId) {
      setFormError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Prepare data to send
    const dataToSend = {
      ruler_type: rulerType,
      material_id: parseInt(materialId),
      color_id: parseInt(colorId),
      notes: data.notes || "",
    };

    await handleSave(dataToSend);
  };

  // Calculate stats
  const stats = {
    total: rulers.length,
    newType: rulers.filter((r) => r.ruler_type === "new").length,
    oldType: rulers.filter((r) => r.ruler_type === "old").length,
  };

  // Filter rulers
  let filteredRulers = rulers.filter(
    (ruler) => {
      const matchesSearch =
        ruler.ruler_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rulerApi.getMaterialName(ruler)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rulerApi.getColorName(ruler)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rulerApi.getColorCode(ruler)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ruler.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    }
  );

  // Apply sorting if sortConfig is set
  if (sortConfig.key && sortConfig.direction) {
    filteredRulers = [...filteredRulers].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // معالجة النصوص العربية
      if (typeof aValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue, "ar")
          : bValue.localeCompare(aValue, "ar");
      }

      // معالجة الأرقام والقيم الأخرى
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
  const totalPages = Math.ceil(filteredRulers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedRulers = filteredRulers.slice(startIndex, endIndex);

  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  const mainStats = [
    {
      id: 1,
      title: "إجمالي المساطر",
      value: stats.total,
      unit: "مسطرة",
      icon: RulerIcon,
      iconColor: "text-secondary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-f"
    },
    {
      id: 2,
      title: "مساطر جديدة",
      value: stats.newType,
      unit: "مسطرة",
      icon: Package,
      iconColor: "text-primary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-primary-f"
    },
    {
      id: 3,
      title: "مساطر قديمة",
      value: stats.oldType,
      unit: "مسطرة",
      icon: Palette,
      iconColor: "text-secondary-s",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-s"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 space-y-8 p-2">
      <div className=" mx-auto">
        <PageHeader
          title="إدارة المساطر"
          subtitle={`إجمالي المساطر: ${rulers.length}`}
          actionLabel="إضافة مسطرة جديدة"
          onAction={openCreateModal}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {mainStats.map((stat) => (
            <StatsCard key={stat.id} {...stat} />
          ))}
        </div>

        {/* Rulers Table Card */}
        <Card className="p-6">
          <div className="">
            <h2 className="text-xl font-bold">قائمة المساطر</h2>
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
              placeholder="ابحث عن مسطرة (النوع أو المادة أو اللون أو الملاحظات)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters and Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultsCounter
              current={filteredRulers.length}
              total={rulers.length}
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
              disabled={exportLoading || filteredRulers.length === 0}
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
                  <span>تصدير Excel ({filteredRulers.length})</span>
                </>
              )}
            </Button>
          </div>

          {/* Rulers Table */}
          {loading ? (
            <LoadingState message="جاري تحميل المساطر..." />
          ) : filteredRulers.length === 0 ? (
            <EmptyState message="لا توجد مساطر" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg ">
                <Table onSort={handleSort}>
                  <TableHeader>
                    <TableRow>
                      <TableHead sortable sortKey="ruler_type">نوع المسطرة</TableHead>
                      <TableHead>المادة</TableHead>
                      <TableHead>اللون</TableHead>
                      <TableHead>الأبعاد</TableHead>
                      <TableHead>الملاحظات</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRulers.map((ruler) => (
                      <TableRow key={ruler.ruler_id}>
                        <TableCell className="font-medium">
                          <Badge
                            variant={ruler.ruler_type === "new" ? "default" : "secondary"}
                            className={ruler.ruler_type === "new" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                          >
                            {ruler.ruler_type === "new" ? "جديدة" : "قديمة"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {rulerApi.getMaterialName(ruler)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: rulerApi.getColorCode(ruler) || "#ccc" }}
                            />
                            <div>
                              <div>{rulerApi.getColorName(ruler)}</div>
                              <div className="text-xs text-gray-500">{rulerApi.getColorCode(ruler)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {rulerApi.formatMaterialDimensions(ruler)}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {ruler.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CrudActions
                              onView={() => openViewModal(ruler.ruler_id)}
                              onEdit={() => openEditModal(ruler)}
                              onDelete={() => openDeleteModal(ruler)}
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
            ruler_type: "",
            material_id: "",
            color_id: "",
            notes: "",
          });
        }}
        onSubmit={handleSaveRuler}
        onDelete={handleDelete}
        data={selectedItem}
        title={
          modalState.mode === "create"
            ? "إضافة مسطرة جديدة"
            : modalState.mode === "edit"
              ? "تعديل المسطرة"
              : modalState.mode === "view"
                ? "تفاصيل المسطرة"
                : ""
        }
        loading={modalState.loading}
        size="lg"
        formData={formData}
        setFormData={setFormData}
        fields={
          modalState.mode === "view"
            ? [
              { key: "ruler_type", label: "نوع المسطرة", formatValue: (key, value) => value === "new" ? "جديدة" : "قديمة" },
              { key: "material_name", label: "المادة", formatValue: (key, value) => rulerApi.getMaterialName(selectedItem) },
              { key: "color_name", label: "اللون", formatValue: (key, value) => rulerApi.getColorName(selectedItem) },
              { key: "color_code", label: "كود اللون", formatValue: (key, value) => rulerApi.getColorCode(selectedItem) },
              { key: "dimensions", label: "الأبعاد", formatValue: (key, value) => rulerApi.formatMaterialDimensions(selectedItem) },
              { key: "notes", label: "الملاحظات" },
            ]
            : []
        }
        deleteTitle="حذف المسطرة"
        deleteMessage="هل أنت متأكد من رغبتك في حذف هذه المسطرة؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={rulerApi.formatRulerInfo(selectedItem)}
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
                  <SelectItem value="new">جديدة</SelectItem>
                  <SelectItem value="old">قديمة</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Label>اللون <span className="text-red-500">*</span></Label>
              <Select
                value={formData.color_id?.toString()}
                onValueChange={(value) => setFormData({ ...formData, color_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر اللون" />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.color_id} value={color.color_id.toString()}>
                      {color.color_name} ({color.color_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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