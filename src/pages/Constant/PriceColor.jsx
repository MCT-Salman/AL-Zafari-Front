// src\pages\Constant\PriceColor.jsx
import { useState, useEffect, useMemo } from "react";
import { priceColorApi } from "../../api/priceColorApi";
import { colorApi } from "../../api/colorApi";
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
import { Download, DollarSign, Palette, Package } from "lucide-react";
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

export default function PriceColor() {
  // Create adapter to map generic CRUD method names to priceColorApi method names
  const priceColorApiAdapter = useMemo(() => ({
    getItems: (...args) => priceColorApi.getPriceColors(...args),
    getItemById: (...args) => priceColorApi.getPriceColorById(...args),
    createItem: (...args) => priceColorApi.createPriceColor(...args),
    updateItem: (...args) => priceColorApi.updatePriceColor(...args),
    deleteItem: (...args) => priceColorApi.deletePriceColor(...args),
  }), []);

  // Use CRUD hook
  const {
    items: priceColors,
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
  } = useCrud(priceColorApiAdapter, {
    successMessages: {
      create: "?? ????? ??? ????? ?????",
      update: "?? ????? ??? ????? ?????",
      delete: "?? ??? ??? ????? ?????",
    },
    errorMessages: {
      create: "??? ?? ??? ??? ?????",
      update: "??? ?? ??? ??? ?????",
      delete: "??? ?? ??? ??? ?????",
      fetch: "??? ?? ????? ????? ???????",
    },
  });

  // Form state
  const [formData, setFormData] = useState({
    color_id: "",
    constant_value_id: "",
    price_color_By: "",
    price_per_meter: "",
    notes: "",
  });
  const [formError, setFormError] = useState("");

  // Colors and constant values for dropdowns
  const [colors, setColors] = useState([]);
  const [constantValues, setConstantValues] = useState([]);

  // Load price colors, colors, and constant values on mount
  useEffect(() => {
    fetchItems();
    loadColors();
    loadConstantValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load colors for dropdown
  const loadColors = async () => {
    try {
      const response = await colorApi.getColors();
      setColors(response.data || []);
    } catch (error) {
      console.error("Failed to load colors:", error);
    }
  };

  // Load constant values for dropdown (assuming type_id 5 for order types based on API example)
  const loadConstantValues = async () => {
    try {
      const response = await constantApi.getConstantValuesByType(5);
      setConstantValues(response.data || []);
    } catch (error) {
      console.error("Failed to load constant values:", error);
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
      { key: "color_name", header: "?????", format: (item) => priceColorApi.getColorName(item) },
      { key: "color_code", header: "??? ?????", format: (item) => priceColorApi.getColorCode(item) },
      { key: "material_name", header: "??????", format: (item) => priceColorApi.getMaterialName(item) },
      { key: "constant_value", header: "??? ?????", format: (item) => priceColorApi.getConstantValue(item) },
      { key: "price_per_meter", header: "??????" },
      { key: "price_color_By", header: "????? ??????" },
      { key: "notes", header: "?????????" },
    ],
    columnWidths: [
      { wch: 5 },   // #
      { wch: 15 },  // ?????
      { wch: 12 },  // ??? ?????
      { wch: 15 },  // ??????
      { wch: 15 },  // ??? ?????
      { wch: 12 },  // ??????
      { wch: 15 },  // ????? ??????
      { wch: 25 },  // ?????????
    ],
    sheetName: "????? ???????",
  });

  // Handle export
  const handleExport = () => {
    exportToExcel(filteredPriceColors, "?????_???????");
  };

  // Handle save with validation
  const handleSavePriceColor = async (data) => {
    setFormError("");
    
    // Validation
    const colorId = data?.color_id;
    const constantValueId = data?.constant_value_id;
    const priceColorBy = data?.price_color_By?.trim();
    const pricePerMeter = data?.price_per_meter;
    
    if (!colorId || !constantValueId || !priceColorBy || !pricePerMeter) {
      setFormError("???? ??? ???? ?????? ????????");
      return;
    }

    // Validate price is a number
    if (isNaN(pricePerMeter) || parseFloat(pricePerMeter) <= 0) {
      setFormError("???? ????? ??? ????");
      return;
    }

    // Prepare data to send
    const dataToSend = {
      color_id: parseInt(colorId),
      constant_value_id: parseInt(constantValueId),
      price_color_By: priceColorBy,
      price_per_meter: parseFloat(pricePerMeter),
      notes: data.notes || "",
    };

    await handleSave(dataToSend);
  };

  // Calculate stats
  const stats = {
    total: priceColors.length,
    avgPrice: priceColors.length > 0 
      ? (priceColors.reduce((sum, pc) => sum + parseFloat(pc.price_per_meter || 0), 0) / priceColors.length).toFixed(2)
      : 0,
    uniqueColors: [...new Set(priceColors.map(pc => pc.color_id))].length,
  };

  // Filter price colors
  let filteredPriceColors = priceColors.filter(
    (priceColor) => {
      const matchesSearch =
        priceColorApi.getColorName(priceColor)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        priceColorApi.getColorCode(priceColor)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        priceColorApi.getMaterialName(priceColor)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        priceColorApi.getConstantValue(priceColor)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        priceColor.price_per_meter?.toString().includes(searchTerm.toLowerCase()) ||
        priceColor.notes?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    }
  );

  // Apply sorting if sortConfig is set
  if (sortConfig.key && sortConfig.direction) {
    filteredPriceColors = [...filteredPriceColors].sort((a, b) => {
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
  const totalPages = Math.ceil(filteredPriceColors.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedPriceColors = filteredPriceColors.slice(startIndex, endIndex);

  const handleSort = (newSortConfig) => {
    setSortConfig(newSortConfig);
  };

  const mainStats = [
    {
      id: 1,
      title: "?????? ???????",
      value: stats.total,
      unit: "???",
      icon: DollarSign,
      iconColor: "text-secondary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-secondary-f"
    },
    {
      id: 2,
      title: "????? ?????",
      value: stats.avgPrice,
      unit: "????",
      icon: DollarSign,
      iconColor: "text-primary-f",
      bgColor: "bg-primary-s",
      borderColor: "border-primary-f"
    },
    {
      id: 3,
      title: "??????? ???????",
      value: stats.uniqueColors,
      unit: "???",
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
          title="????? ????? ???????"
          subtitle={`?????? ???????: ${priceColors.length}`}
          actionLabel="????? ??? ????"
          onAction={openCreateModal}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {mainStats.map((stat) => (
            <StatsCard key={stat.id} {...stat} />
          ))}
        </div>

        {/* Price Colors Table Card */}
        <Card className="p-6">
          <div className="">
            <h2 className="text-xl font-bold">????? ????? ???????</h2>
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
              placeholder="???? ?? ??? (????? ?? ?????? ?? ????? ?? ?????)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters and Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultsCounter
              current={filteredPriceColors.length}
              total={priceColors.length}
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
              disabled={exportLoading || filteredPriceColors.length === 0}
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
                  <span>????? Excel ({filteredPriceColors.length})</span>
                </>
              )}
            </Button>
          </div>

          {/* Price Colors Table */}
          {loading ? (
            <LoadingState message="???? ????? ????? ???????..." />
          ) : filteredPriceColors.length === 0 ? (
            <EmptyState message="?? ???? ?????" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg ">
                <Table onSort={handleSort}>
                  <TableHeader>
                    <TableRow>
                      <TableHead>?????</TableHead>
                      <TableHead>??????</TableHead>
                      <TableHead>??? ?????</TableHead>
                      <TableHead sortable sortKey="price_per_meter">?????</TableHead>
                      <TableHead>????? ??????</TableHead>
                      <TableHead>?????????</TableHead>
                      <TableHead>?????????</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPriceColors.map((priceColor) => (
                      <TableRow key={priceColor.price_color_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: priceColorApi.getColorCode(priceColor) || "#ccc" }}
                            />
                            <div>
                              <div>{priceColorApi.getColorName(priceColor)}</div>
                              <div className="text-xs text-gray-500">{priceColorApi.getColorCode(priceColor)}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {priceColorApi.getMaterialName(priceColor)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {priceColorApi.getConstantValue(priceColor)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-50 text-green-800">
                            {priceColorApi.formatPriceDisplay(priceColor)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50">
                            {priceColor.price_color_By}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {priceColor.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CrudActions
                              onView={() => openViewModal(priceColor.price_color_id)}
                              onEdit={() => openEditModal(priceColor)}
                              onDelete={() => openDeleteModal(priceColor)}
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
            color_id: "",
            constant_value_id: "",
            price_color_By: "",
            price_per_meter: "",
            notes: "",
          });
        }}
        onSubmit={handleSavePriceColor}
        onDelete={handleDelete}
        data={selectedItem}
        title={
          modalState.mode === "create" 
            ? "????? ??? ????" 
            : modalState.mode === "edit" 
            ? "????? ?????" 
            : modalState.mode === "view"
            ? "?????? ?????"
            : ""
        }
        loading={modalState.loading}
        size="lg"
        formData={formData}
        setFormData={setFormData}
        fields={
          modalState.mode === "view"
            ? [
                { key: "color_name", label: "?????", formatValue: (key, value) => priceColorApi.getColorName(selectedItem) },
                { key: "color_code", label: "??? ?????", formatValue: (key, value) => priceColorApi.getColorCode(selectedItem) },
                { key: "material_name", label: "??????", formatValue: (key, value) => priceColorApi.getMaterialName(selectedItem) },
                { key: "constant_value", label: "??? ?????", formatValue: (key, value) => priceColorApi.getConstantValue(selectedItem) },
                { key: "price_per_meter", label: "?????" },
                { key: "price_color_By", label: "????? ??????" },
                { key: "notes", label: "?????????" },
              ]
            : []
        }
        deleteTitle="??? ?????"
        deleteMessage="?? ??? ????? ?? ????? ?? ??? ??? ?????? ?? ???? ??????? ?? ??? ???????."
        itemName={priceColorApi.formatPriceInfo(selectedItem)}
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
              <label className="text-sm font-medium">????? <span className="text-red-500">*</span></label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData.color_id}
                onChange={(e) => setFormData({...formData, color_id: e.target.value})}
              >
                <option value="">???? ?????</option>
                {colors.map((color) => (
                  <option key={color.color_id} value={color.color_id}>
                    {color.color_name} ({color.color_code})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">??? ????? <span className="text-red-500">*</span></label>
              <select
                className="w-full p-2 border rounded-md"
                value={formData.constant_value_id}
                onChange={(e) => setFormData({...formData, constant_value_id: e.target.value})}
              >
                <option value="">???? ??? ?????</option>
                {constantValues.map((constantValue) => (
                  <option key={constantValue.constant_value_id} value={constantValue.constant_value_id}>
                    {constantValue.value}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">????? ?????? <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={formData.price_color_By}
                onChange={(e) => setFormData({...formData, price_color_By: e.target.value})}
                placeholder="????: isByMeter22"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">????? <span className="text-red-500">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full p-2 border rounded-md"
                value={formData.price_per_meter}
                onChange={(e) => setFormData({...formData, price_per_meter: e.target.value})}
                placeholder="????: 150"
              />
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
