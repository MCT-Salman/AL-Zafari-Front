// src\pages\Constant\Batch.jsx
import { useState, useEffect, useMemo } from "react";
import { batchApi } from "../../api/batchApi";
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
import { Download, Package, Calendar, Tag } from "lucide-react";
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

export default function Batch() {
  // Create adapter to map generic CRUD method names to batchApi method names
  const batchApiAdapter = useMemo(() => ({
    getItems: (...args) => batchApi.getBatches(...args),
    getItemById: (...args) => batchApi.getBatchById(...args),
    createItem: (...args) => batchApi.createBatch(...args),
    updateItem: (...args) => batchApi.updateBatch(...args),
    deleteItem: (...args) => batchApi.deleteBatch(...args),
  }), []);

  // Use CRUD hook
  const {
    items: batches,
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
  } = useCrud(batchApiAdapter, {
    idField: 'batch_id',
    successMessages: {
      create: "تم إنشاء التشغيلة بنجاح",
      update: "تم تحديث التشغيلة بنجاح",
      delete: "تم حذف التشغيلة بنجاح",
    },
    errorMessages: {
      create: "فشل في حفظ التشغيلة",
      update: "فشل في حفظ التشغيلة",
      delete: "فشل في حذف التشغيلة",
      fetch: "فشل في تحميل التشغيلات",
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    batch_number: "",
    entry_date: "",
    material_id: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");

  // Materials for dropdown
  const [materials, setMaterials] = useState([]);

  // Load batches and materials on mount
  useEffect(() => {
    fetchItems();
    loadMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronize formData with selectedItem when modal opens in edit mode
  useEffect(() => {
    if (modalState.isOpen && modalState.mode === "edit" && selectedItem) {
      setFormData({
        batch_number: selectedItem.batch_number || "",
        entry_date: selectedItem.entry_date ? selectedItem.entry_date.substring(0, 16) : "",
        material_id: selectedItem.material_id?.toString() || "",
        notes: selectedItem.notes || "",
      });
    } else if (modalState.isOpen && modalState.mode === "create") {
      setFormData({
        batch_number: "",
        entry_date: new Date().toISOString().substring(0, 16),
        material_id: "",
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
      { key: "batch_number", header: "رقم التشغيلة" },
      { key: "entry_date", header: "تاريخ الإدخال", format: (item) => batchApi.formatEntryDate(item) },
      { key: "material_name", header: "المادة", format: (item) => batchApi.getMaterialName(item) },
      { key: "material_type", header: "نوع المادة", format: (item) => batchApi.getMaterialType(item) },
      { key: "dimensions", header: "الأبعاد", format: (item) => batchApi.formatMaterialDimensions(item) },
      { key: "notes", header: "الملاحظات" },
    ],
    columnWidths: [
      { wch: 5 },   // #
      { wch: 20 },  // رقم التشغيلة
      { wch: 20 },  // تاريخ الإدخال
      { wch: 15 },  // المادة
      { wch: 12 },  // نوع المادة
      { wch: 25 },  // الأبعاد
      { wch: 30 },  // الملاحظات
    ],
    sheetName: "التشغيلات",
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredBatches, "التشغيلات");
  };

  // Handle save with validation
  const handleSaveBatch = async (data) => {
    setFormError("");

    // Validation
    const batchNumber = formData.batch_number?.trim();
    const entryDate = formData.entry_date;
    const materialId = formData.material_id;

    if (!materialId || !entryDate) {
      setFormError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Prepare data to send
    const dataToSend = {
      batch_number: batchNumber || undefined, // API handles auto-generation if undefined
      entry_date: new Date(entryDate).toISOString(),
      material_id: parseInt(materialId),
      notes: formData.notes || "",
    };

    await handleSave(dataToSend);
  };

  // Calculate stats
  const stats = {
    total: batches.length,
    thisMonth: batches.filter((b) => {
      const batchDate = new Date(b.entry_date);
      const now = new Date();
      return batchDate.getMonth() === now.getMonth() &&
        batchDate.getFullYear() === now.getFullYear();
    }).length,
    uniqueMaterials: [...new Set(batches.map(b => b.material_id))].length,
  };

  // Filter batches
  let filteredBatches = batches.filter(
    (batch) => {
      const matchesSearch =
        batch.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batchApi.getMaterialName(batch)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batchApi.getMaterialType(batch)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batchApi.formatEntryDate(batch)?.includes(searchTerm);

      return matchesSearch;
    }
  );

  // Apply sorting if sortConfig is set
  if (sortConfig.key && sortConfig.direction) {
    filteredBatches = [...filteredBatches].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Special handling for date sorting
      if (sortConfig.key === "entry_date") {
        const aDate = new Date(a.entry_date);
        const bDate = new Date(b.entry_date);
        return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
      }

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
  const totalPages = Math.ceil(filteredBatches.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedBatches = filteredBatches.slice(startIndex, endIndex);

  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  const mainStats = [
    {
      id: 1,
      title: "إجمالي التشغيلات",
      value: stats.total,
      unit: "تشغيلة",
      icon: Package,
      iconColor: "text-secondary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-f"
    },
    {
      id: 2,
      title: "تشغيلات هذا الشهر",
      value: stats.thisMonth,
      unit: "تشغيلة",
      icon: Calendar,
      iconColor: "text-primary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-primary-f"
    },
    {
      id: 3,
      title: "عدد المواد المختلفة",
      value: stats.uniqueMaterials,
      unit: "مادة",
      icon: Tag,
      iconColor: "text-secondary-s",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-s"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 space-y-8 p-2">
      <div className=" mx-auto">
        <PageHeader
          title="إدارة التشغيلات"
          subtitle={`إجمالي التشغيلات: ${batches.length}`}
          actionLabel="إضافة تشغيلة جديدة"
          onAction={openCreateModal}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {mainStats.map((stat) => (
            <StatsCard key={stat.id} {...stat} />
          ))}
        </div>

        {/* Batches Table Card */}
        <Card className="p-6">
          <div className="">
            <h2 className="text-xl font-bold">قائمة التشغيلات</h2>
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
              placeholder="ابحث عن تشغيلة (الرقم أو المادة أو النوع أو التاريخ أو الملاحظات)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters and Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultsCounter
              current={filteredBatches.length}
              total={batches.length}
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
              disabled={exportLoading || filteredBatches.length === 0}
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
                  <span>تصدير Excel ({filteredBatches.length})</span>
                </>
              )}
            </Button>
          </div>

          {/* Batches Table */}
          {loading ? (
            <LoadingState message="جاري تحميل التشغيلات..." />
          ) : filteredBatches.length === 0 ? (
            <EmptyState message="لا توجد تشغيلات" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg ">
                <Table onSort={handleSort}>
                  <TableHeader>
                    <TableRow>
                      <TableHead sortable sortKey="batch_number">رقم التشغيلة</TableHead>
                      <TableHead sortable sortKey="entry_date">تاريخ الإدخال</TableHead>
                      <TableHead>المادة</TableHead>
                      <TableHead>الأبعاد</TableHead>
                      <TableHead>الملاحظات</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBatches.map((batch) => (
                      <TableRow key={batch.batch_id}>
                        <TableCell className="font-medium">
                          <Badge variant="outline" className="bg-blue-50">
                            {batchApi.getBatchNumber(batch)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {batchApi.formatEntryDate(batch)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="secondary">
                              {batchApi.getMaterialName(batch)}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">
                              {batchApi.getMaterialType(batch)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {batchApi.formatMaterialDimensions(batch)}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {batch.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CrudActions
                              onView={() => openViewModal(batch.batch_id)}
                              onEdit={() => openEditModal(batch)}
                              onDelete={() => openDeleteModal(batch)}
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
            batch_number: "",
            entry_date: "",
            material_id: "",
            notes: "",
          });
        }}
        onSubmit={handleSaveBatch}
        onDelete={handleDelete}
        data={selectedItem}
        title={
          modalState.mode === "create"
            ? "إضافة تشغيلة جديدة"
            : modalState.mode === "edit"
              ? "تعديل التشغيلة"
              : modalState.mode === "view"
                ? "تفاصيل التشغيلة"
                : ""
        }
        loading={modalState.loading}
        size="lg"
        formData={formData}
        setFormData={setFormData}
        fields={
          modalState.mode === "view"
            ? [
              { key: "batch_number", label: "رقم التشغيلة" },
              { key: "entry_date", label: "تاريخ الإدخال", formatValue: (key, value) => batchApi.formatEntryDate(selectedItem) },
              { key: "material_name", label: "المادة", formatValue: (key, value) => batchApi.getMaterialName(selectedItem) },
              { key: "material_type", label: "نوع المادة", formatValue: (key, value) => batchApi.getMaterialType(selectedItem) },
              { key: "dimensions", label: "الأبعاد", formatValue: (key, value) => batchApi.formatMaterialDimensions(selectedItem) },
              { key: "notes", label: "الملاحظات" },
            ]
            : []
        }
        deleteTitle="حذف التشغيلة"
        deleteMessage="هل أنت متأكد من رغبتك في حذف هذه التشغيلة؟ لا يمكن التراجع عن هذا الإجراء."
        itemName={batchApi.formatBatchInfo(selectedItem)}
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
              <Label>رقم التشغيلة <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                placeholder={batchApi.generateBatchNumber()}
              />
              <p className="text-xs text-gray-500">اتركه فارغاً لتوليد رقم تشغيلة تلقائي</p>
            </div>
            <div className="space-y-2">
              <Label>تاريخ الإدخال <span className="text-red-500">*</span></Label>
              <Input
                type="datetime-local"
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
              />
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
