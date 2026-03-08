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
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Download, Package, Calendar, Tag } from "lucide-react";
import CrudActions from "../../components/common/CrudActions";
import StatsCard from "../../components/common/StatsCard";
import SearchInput from "../../components/common/SearchInput";
import MessageAlert from "../../components/common/MessageAlert";
import PageHeader from "../../components/common/PageHeader";
import FilterSelect from "../../components/common/FilterSelect";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import ResultsCounter from "../../components/common/ResultsCounter";
import RowsPerPageSelector from "../../components/common/RowsPerPageSelector";
import PaginationControls from "../../components/common/PaginationControls";
import { getApiData } from "../../utils/api";

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
      create: "تم إنشاء الطبخة بنجاح",
      update: "تم تحديث الطبخة بنجاح",
      delete: "تم حذف الطبخة بنجاح",
    },
    errorMessages: {
      create: "فشل في حفظ الطبخة",
      update: "فشل في حفظ الطبخة",
      delete: "فشل في حذف الطبخة",
      fetch: "فشل في تحميل الطبخات",
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

  // Synchronize formData with selectedItem when modal opens in edit/create mode
  useEffect(() => {
    if (modalState.isOpen && modalState.mode === "edit" && selectedItem) {
      let formattedDate = "";
      if (selectedItem.entry_date) {
        const date = new Date(selectedItem.entry_date);
        if (!isNaN(date.getTime())) {
          // Format as YYYY-MM-DD for date-only input
          const pad = (num) => String(num).padStart(2, '0');
          formattedDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        }
      }
      setFormData({
        batch_number: selectedItem.batch_number || "",
        entry_date: formattedDate,
        material_id: selectedItem.material_id?.toString() || "",
        notes: selectedItem.notes || "",
      });
    } else if (modalState.isOpen && modalState.mode === "create") {
      // Default to today's date
      const today = new Date();
      const pad = (num) => String(num).padStart(2, '0');
      const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
      setFormData({
        batch_number: "",
        entry_date: todayStr,
        material_id: "",
        notes: "",
      });
    }
  }, [modalState.isOpen, modalState.mode, selectedItem]);

  // Load materials for dropdown
  const loadMaterials = async () => {
    try {
      const response = await materialApi.getMaterials();
      setMaterials(getApiData(response, []) || []);
    } catch (error) {
      // console.error("Failed to load materials:", error);
    }
  };

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Use export hook
  const { exportToExcel, loading: exportLoading } = useExport({
    columns: [
      { key: "batch_number", header: "رقم الطبخة" },
      { key: "entry_date", header: "تاريخ الإدخال", format: (item) => batchApi.formatEntryDate(item) },
      { key: "material_name", header: "المادة", format: (item) => batchApi.getMaterialName(item) },
      { key: "notes", header: "الملاحظات" },
    ],
    columnWidths: [
      { wch: 15 },  // رقم الطبخة
      { wch: 25 },  // تاريخ الإدخال
      { wch: 20 },  // المادة
      { wch: 40 },  // الملاحظات
    ],
    sheetName: "الطبخات",
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredBatches, "الطبخات");
  };

  // Handle save with validation
  const handleSaveBatch = async () => {
    setFormError("");

    // Validation
    const batchNumber = formData.batch_number?.trim();
    const entryDate = formData.entry_date;
    const materialId = formData.material_id;

    if (!materialId || !entryDate || !batchNumber) {
      setFormError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Prepare data to send — combine the selected date with the current time
    const now = new Date();
    const [year, month, day] = entryDate.split('-').map(Number);
    const dateWithCurrentTime = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
    const dataToSend = {
      batch_number: batchNumber,
      entry_date: dateWithCurrentTime.toISOString(),
      material_id: parseInt(materialId),
      notes: formData.notes || "",
    };

    await handleSave(dataToSend);
  };

  // Calculate stats
  const stats = {
    total: batches.length,
    uniqueMaterials: [...new Set(batches.map(b => b.material_id))].length,
  };

  // Filter batches
  let filteredBatches = batches.filter(
    (batch) => {
      const materialName = batchApi.getMaterialName(batch);
      const matchesSearch =
        batch.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batchApi.formatEntryDate(batch)?.includes(searchTerm);

      const matchesMaterial = selectedMaterialId === "" || batch.material_id?.toString() === selectedMaterialId;

      return matchesSearch && matchesMaterial;
    }
  );

  // Apply sorting if sortConfig is set
  if (sortConfig.key && sortConfig.direction) {
    filteredBatches = [...filteredBatches].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === "entry_date") {
        const aDate = new Date(a.entry_date);
        const bDate = new Date(b.entry_date);
        return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
      }

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
  }, [searchTerm, selectedMaterialId]);

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
      title: "إجمالي الطبخات",
      value: stats.total,
      unit: "طبخة",
      icon: Package,
      iconColor: "text-secondary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-f"
    },
    {
      id: 2,
      title: "المواد المستخدمة",
      value: stats.uniqueMaterials,
      unit: "مادة",
      icon: Tag,
      iconColor: "text-primary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-primary-f"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 space-y-8 p-2">
      <div className=" mx-auto">
        <PageHeader
          title="إدارة الطبخات"
          subtitle={`إجمالي الطبخات: ${batches.length}`}
          actionLabel="إضافة طبخة جديدة"
          onAction={openCreateModal}
        />

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mainStats.map((stat) => (
            <StatsCard key={stat.id} {...stat} />
          ))}
        </div> */}

        {/* Batches Table Card */}
        <Card className="p-6">
          <div className="">
            <h2 className="text-xl font-bold">قائمة الطبخات</h2>
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
              placeholder="ابحث عن طبخة (الرقم أو المادة أو الملاحظات)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters and Results */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FilterSelect
              label="المادة"
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              options={[
                { value: "", label: "جميع المواد" },
                ...materials.map(m => ({ value: (m.material_id || "").toString(), label: m.material_name }))
              ]}
            />

            <div className="md:col-start-4">
              <ResultsCounter
                current={filteredBatches.length}
                total={batches.length}
              />
            </div>
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
            <LoadingState message="جاري تحميل الطبخات..." />
          ) : filteredBatches.length === 0 ? (
            <EmptyState message="لا توجد طبخات" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg ">
                <Table onSort={handleSort}>
                  <TableHeader>
                    <TableRow>
                      <TableHead sortable sortKey="batch_number">رقم الطبخة</TableHead>
                      <TableHead sortable sortKey="entry_date">تاريخ الإدخال</TableHead>
                      <TableHead>المادة</TableHead>
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
                          <Badge variant="secondary">
                            {batchApi.getMaterialName(batch)}
                          </Badge>
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
        }}
        onSubmit={handleSaveBatch}
        onDelete={handleDelete}
        data={selectedItem}
        title={
          modalState.mode === "create"
            ? "إضافة طبخة جديدة"
            : modalState.mode === "edit"
              ? "تعديل الطبخة"
              : modalState.mode === "view"
                ? "تفاصيل الطبخة"
                : ""
        }
        loading={modalState.loading}
        size="lg"
        formData={formData}
        setFormData={setFormData}
        fields={
          modalState.mode === "view"
            ? [
              { key: "batch_number", label: "رقم الطبخة" },
              { key: "entry_date", label: "تاريخ الإدخال", formatValue: () => batchApi.formatEntryDate(selectedItem) },
              { key: "material_name", label: "المادة", formatValue: () => batchApi.getMaterialName(selectedItem) },
              { key: "notes", label: "الملاحظات" },
            ]
            : []
        }
        deleteTitle="حذف الطبخة"
        deleteMessage="هل أنت متأكد من رغبتك في حذف هذه الطبخة؟ لا يمكن التراجع عن هذا الإجراء."
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المادة <span className="text-red-500">*</span></Label>
                <FilterSelect
                  value={formData.material_id?.toString() || ""}
                  onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                  options={materials.map((material) => ({
                    value: material.material_id.toString(),
                    label: material.material_name,
                  }))}
                  placeholder="اختر المادة"
                />
              </div>

              <div className="space-y-2">
                <Label>رقم الطبخة <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  value={formData.batch_number || ""}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  placeholder={batchApi.generateBatchNumber()}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>تاريخ الإدخال <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={formData.entry_date || ""}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
              />
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
