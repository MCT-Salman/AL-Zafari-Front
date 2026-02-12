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
    successMessages: {
      create: "?? ????? ?????? ?????",
      update: "?? ????? ?????? ?????",
      delete: "?? ??? ?????? ?????",
    },
    errorMessages: {
      create: "??? ?? ??? ??????",
      update: "??? ?? ??? ??????",
      delete: "??? ?? ??? ??????",
      fetch: "??? ?? ????? ???????",
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
      { key: "batch_number", header: "??? ??????" },
      { key: "entry_date", header: "????? ???????", format: (item) => batchApi.formatEntryDate(item) },
      { key: "material_name", header: "??????", format: (item) => batchApi.getMaterialName(item) },
      { key: "material_type", header: "??? ??????", format: (item) => batchApi.getMaterialType(item) },
      { key: "dimensions", header: "???????", format: (item) => batchApi.formatMaterialDimensions(item) },
      { key: "notes", header: "?????????" },
    ],
    columnWidths: [
      { wch: 5 },   // #
      { wch: 20 },  // ??? ??????
      { wch: 20 },  // ????? ???????
      { wch: 15 },  // ??????
      { wch: 12 },  // ??? ??????
      { wch: 25 },  // ???????
      { wch: 30 },  // ?????????
    ],
    sheetName: "???????",
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredBatches, "???????");
  };

  // Handle save with validation
  const handleSaveBatch = async (data) => {
    setFormError("");
    
    // Validation
    const batchNumber = data?.batch_number?.trim();
    const entryDate = data?.entry_date;
    const materialId = data?.material_id;
    
    if (!batchNumber || !entryDate || !materialId) {
      setFormError("???? ??? ???? ?????? ????????");
      return;
    }

    // Prepare data to send
    const dataToSend = {
      batch_number: batchNumber,
      entry_date: entryDate,
      material_id: parseInt(materialId),
      notes: data.notes || "",
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
      title: "?????? ???????",
      value: stats.total,
      unit: "????",
      icon: Package,
      iconColor: "text-secondary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-f"
    },
    {
      id: 2,
      title: "????? ??? ?????",
      value: stats.thisMonth,
      unit: "????",
      icon: Calendar,
      iconColor: "text-primary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-primary-f"
    },
    {
      id: 3,
      title: "???? ???????",
      value: stats.uniqueMaterials,
      unit: "????",
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
          title="????? ???????"
          subtitle={`?????? ???????: ${batches.length}`}
          actionLabel="????? ???? ?????"
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
            <h2 className="text-xl font-bold">????? ???????</h2>
          </div>

          {/* Messages */}
          {error && (
            <MessageAlert
              type="error"
              message={error}
              onDismiss={() => {}}
              dismissable={true}
            />
          )}

          {/* Search */}
          <div className="-my-4">
            <SearchInput
              placeholder="???? ?? ???? (????? ?? ?????? ?? ?????????)"
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
                  <span>???? ???????...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>????? Excel ({filteredBatches.length})</span>
                </>
              )}
            </Button>
          </div>

          {/* Batches Table */}
          {loading ? (
            <LoadingState message="???? ????? ???????..." />
          ) : filteredBatches.length === 0 ? (
            <EmptyState message="?? ???? ?????" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg ">
                <Table onSort={handleSort}>
                  <TableHeader>
                    <TableRow>
                      <TableHead sortable sortKey="batch_number">??? ??????</TableHead>
                      <TableHead sortable sortKey="entry_date">????? ???????</TableHead>
                      <TableHead>??????</TableHead>
                      <TableHead>???????</TableHead>
                      <TableHead>?????????</TableHead>
                      <TableHead>?????????</TableHead>
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
            ? "????? ???? ?????" 
            : modalState.mode === "edit" 
            ? "????? ??????" 
            : modalState.mode === "view"
            ? "?????? ??????"
            : ""
        }
        loading={modalState.loading}
        size="lg"
        formData={formData}
        setFormData={setFormData}
        fields={
          modalState.mode === "view"
            ? [
                { key: "batch_number", label: "??? ??????" },
                { key: "entry_date", label: "????? ???????", formatValue: (key, value) => batchApi.formatEntryDate(selectedItem) },
                { key: "material_name", label: "??????", formatValue: (key, value) => batchApi.getMaterialName(selectedItem) },
                { key: "material_type", label: "??? ??????", formatValue: (key, value) => batchApi.getMaterialType(selectedItem) },
                { key: "dimensions", label: "???????", formatValue: (key, value) => batchApi.formatMaterialDimensions(selectedItem) },
                { key: "notes", label: "?????????" },
              ]
            : []
        }
        deleteTitle="??? ??????"
        deleteMessage="?? ??? ????? ?? ????? ?? ??? ??? ??????? ?? ???? ??????? ?? ??? ???????."
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
              <label className="text-sm font-medium">??? ?????? <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={formData.batch_number}
                onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                placeholder={batchApi.generateBatchNumber()}
              />
              <p className="text-xs text-gray-500">????? ???? ?????? ?????? ??? ??????</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">????? ??????? <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                className="w-full p-2 border rounded-md"
                value={formData.entry_date}
                onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">?????? <span className="text-red-500">*</span></label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData.material_id}
                onChange={(e) => setFormData({...formData, material_id: e.target.value})}
              >
                <option value="">???? ??????</option>
                {materials.map((material) => (
                  <option key={material.material_id} value={material.material_id}>
                    {material.material_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">?????????</label>
              <textarea
                className="w-full p-2 border rounded-md"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                placeholder="??????? ??????..."
              />
            </div>
          </div>
        )}
      </CrudModal>
    </div>
  );
}
