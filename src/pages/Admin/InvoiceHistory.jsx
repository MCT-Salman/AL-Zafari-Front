// src\pages\Admin\InvoiceHistory.jsx
import { useState, useEffect, useMemo } from "react";
import { invoiceApi } from "../../api/invoiceApi";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import SearchInput from "../../components/common/SearchInput";
import DynamicTableFilters, { dynamicTableFiltersDefaults } from "../../components/common/DynamicTableFilters";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import ResultsCounter from "../../components/common/ResultsCounter";
import RowsPerPageSelector from "../../components/common/RowsPerPageSelector";
import PaginationControls from "../../components/common/PaginationControls";
import PageHeader from "../../components/common/PageHeader";
import { Download, Search, Receipt, Calendar, User, DollarSign, TrendingUp, CreditCard, Wallet, Trash2 } from "lucide-react";
import { useExport } from "../../hooks/useExport";
import toast from "react-hot-toast";
import StatsCard from "../../components/common/StatsCard";
import StyledDialog from "../../components/common/StyledDialog";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoiceFilters, setInvoiceFilters] = useState(dynamicTableFiltersDefaults);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingInvoices, setDeletingInvoices] = useState(false);
  const getInvoiceStatusKey = (invoice) => {
    const totalNum = parseFloat(invoice?.total_amount) || 0;
    const paidNum = parseFloat(invoice?.paid_amount) || 0;
    if (totalNum === 0) return "";
    if (paidNum >= totalNum) return "paid";
    if (paidNum === 0) return "unpaid";
    return "partial";
  };

  // Load invoices
  const loadInvoices = async (params = {}) => {
    try {
      setLoading(true);
      const response = await invoiceApi.getInvoices({
        page: currentPage,
        limit: rowsPerPage,
        ...params
      });

      if (response.success) {
        setInvoices(response.data || []);
        setTotalCount(response.total || 0);
      }
    } catch (error) {
      toast.error("فشل في تحميل الفواتير");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [currentPage, rowsPerPage]);

  // Enhanced search functionality
  const filteredInvoices = useMemo(() => {
    const normalize = (value) => String(value || "").toLowerCase().trim();
    const searchValue = normalize(invoiceFilters.search || searchTerm);
    const statusFilter = normalize(invoiceFilters.status);
    const userFilter = String(invoiceFilters.userId || "");
    const fromDate = invoiceFilters.dateFrom ? new Date(`${invoiceFilters.dateFrom}T00:00:00`) : null;
    const toDate = invoiceFilters.dateTo ? new Date(`${invoiceFilters.dateTo}T23:59:59.999`) : null;

    return invoices.filter((inv) => {
      const issuedDate = inv?.issued_at ? new Date(inv.issued_at) : null;
      const invoiceUser = invoiceApi.getUserFromInvoice(inv);
      const userId = invoiceUser?.id ?? invoiceUser?.user_id ?? "";
      const paymentStatus = invoiceApi.getPaymentStatus(inv.total_amount, inv.paid_amount);

      const matchesSearch = !searchValue || (
        normalize(inv.invoice_id).includes(searchValue) ||
        normalize(inv.customer?.name).includes(searchValue) ||
        normalize(inv.customer?.phone).includes(searchValue) ||
        normalize(inv.order_id).includes(searchValue) ||
        normalize(invoiceApi.getFormattedDate(inv.issued_at)).includes(searchValue) ||
        normalize(inv.total_amount).includes(searchValue) ||
        normalize(inv.paid_amount).includes(searchValue) ||
        normalize(inv.remaining_amount).includes(searchValue) ||
        normalize(inv.notes).includes(searchValue) ||
        normalize(inv.status).includes(searchValue) ||
        normalize(paymentStatus?.label).includes(searchValue) ||
        normalize(invoiceApi.formatUserInfo(invoiceUser)).includes(searchValue)
      );

      const matchesStatus = !statusFilter || getInvoiceStatusKey(inv) === statusFilter;
      const matchesUser = !userFilter || String(userId) === userFilter;
      const matchesFromDate = !fromDate || (issuedDate && !Number.isNaN(issuedDate.getTime()) && issuedDate >= fromDate);
      const matchesToDate = !toDate || (issuedDate && !Number.isNaN(issuedDate.getTime()) && issuedDate <= toDate);

      return matchesSearch && matchesStatus && matchesUser && matchesFromDate && matchesToDate;
    });
  }, [invoices, invoiceFilters, searchTerm]);

  const invoiceUserOptions = useMemo(() => {
    const usersMap = new Map();
    (Array.isArray(invoices) ? invoices : []).forEach((inv) => {
      const user = invoiceApi.getUserFromInvoice(inv);
      const userId = user?.id ?? user?.user_id ?? "";
      const userName = invoiceApi.formatUserInfo(user);
      if (userId && userName && !usersMap.has(String(userId))) {
        usersMap.set(String(userId), {
          value: String(userId),
          label: userName
        });
      }
    });
    return Array.from(usersMap.values());
  }, [invoices]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, invoiceFilters]);

  // Reset page when rows per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Calculate pagination for filtered results
  const totalPages = Math.ceil(filteredInvoices.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  // Export functionality
  const { exportToExcel } = useExport({
    sheetName: "سجل الفواتير",
    columns: [
      { key: "invoice_id", header: "رقم الفاتورة" },
      { key: "date", header: "التاريخ" },
      { key: "customer", header: "الزبون" },
      { key: "total", header: "الإجمالي" },
      { key: "paid", header: "المدفوع" },
      { key: "remaining", header: "المتبقي" },
      { key: "status", header: "الحالة" },
      { key: "notes", header: "ملاحظات" },
    ],
    columnWidths: [
      { wch: 12 },
      { wch: 18 },
      { wch: 22 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 28 },
    ],
  });

  // Calculate statistics
  const statsData = useMemo(() => {
    if (filteredInvoices.length === 0) return [];

    const totalSales = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
    const paidAmount = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0);
    const remainingAmount = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.remaining_amount || 0), 0);

    return [
      {
        id: 1,
        title: "إجمالي الفواتير",
        value: filteredInvoices.length,
        unit: "فاتورة",
        icon: Receipt,
        iconColor: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        titleColor: "text-blue-700",
        valueColor: "text-blue-900"
      },
      {
        id: 2,
        title: "إجمالي المبيعات",
        value: invoiceApi.formatCurrency(totalSales).replace(" ل.س", ""),
        unit: "ل.س",
        icon: DollarSign,
        iconColor: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        titleColor: "text-green-700",
        valueColor: "text-green-900"
      },
      {
        id: 3,
        title: "المدفوع",
        value: invoiceApi.formatCurrency(paidAmount).replace(" ل.س", ""),
        unit: "ل.س",
        icon: CreditCard,
        iconColor: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        titleColor: "text-purple-700",
        valueColor: "text-purple-900"
      },
      {
        id: 4,
        title: "المتبقي",
        value: invoiceApi.formatCurrency(remainingAmount).replace(" ل.س", ""),
        unit: "ل.س",
        icon: Wallet,
        iconColor: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        titleColor: "text-orange-700",
        valueColor: "text-orange-900"
      }
    ];
  }, [filteredInvoices]);

  // Multiple delete functions
  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSelectAllInvoices = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.invoice_id));
    }
  };

  const handleDeleteSelectedInvoices = async () => {
    if (selectedInvoices.length === 0) {
      toast.error("يرجى تحديد فاتورة واحدة على الأقل");
      return;
    }
    setShowDeleteDialog(true);
  };

  const confirmDeleteSelectedInvoices = async () => {
    try {
      setDeletingInvoices(true);
      
      // Debug: Log selected invoices
      console.log('Selected invoices to delete:', selectedInvoices);
      console.log('Selected invoices types:', selectedInvoices.map(id => typeof id));
      
      const response = await invoiceApi.deleteMultipleInvoices(selectedInvoices);
      
      if (response.success) {
        toast.success("تم حذف الفواتير بنجاح");
        await loadInvoices();
        setSelectedInvoices([]);
        setShowDeleteDialog(false);
      } else {
        toast.error(response.message || "فشل في حذف الفواتير");
      }
    } catch (error) {
      console.error("Error deleting invoices:", error);
      toast.error(error.message || "حدث خطأ في حذف الفواتير");
    } finally {
      setDeletingInvoices(false);
    }
  };

  const handleExport = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      toast.error("لا توجد فواتير للتصدير");
      return;
    }

    setExporting(true);
    const exportRows = filteredInvoices.map(inv => {
      const status = invoiceApi.getPaymentStatus(inv.total_amount, inv.paid_amount);
      return {
        invoice_id: `#${inv.invoice_id}`,
        date: invoiceApi.getFormattedDate(inv.issued_at),
        customer: inv.customer?.name || "-",
        total: invoiceApi.formatCurrency(inv.total_amount || 0),
        paid: invoiceApi.formatCurrency(inv.paid_amount || 0),
        remaining: invoiceApi.formatCurrency(inv.remaining_amount || 0),
        status: status?.label || "-",
        notes: inv.notes || "",
      };
    });

    exportToExcel(exportRows, "سجل الفواتير");
    setExporting(false);
  };

  const PaymentStatusBadge = ({ total, paid }) => {
    const status = invoiceApi.getPaymentStatus(total, paid);
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${status.className}`}>
        {status.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 space-y-6 p-4 md:p-8">
      <PageHeader
        title="سجل الفواتير"
        subtitle={`إجمالي الفواتير: ${totalCount}`}
      />


      <Card className="p-6">
        {/* Summary Statistics Cards */}
        {statsData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statsData.map((stat) => (
              <StatsCard key={stat.id} {...stat} />
            ))}
          </div>
        )}


        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <DynamicTableFilters
            value={invoiceFilters}
            onChange={setInvoiceFilters}
            fields={{ material: false }}
            resultsCount={filteredInvoices.length}
            totalCount={invoices.length}
            statusOptions={[
              { value: "paid", label: "مدفوعة" },
              { value: "partial", label: "مدفوعة جزئياً" },
              { value: "unpaid", label: "غير مدفوعة" },
            ]}
            userOptions={invoiceUserOptions}
            texts={{
              searchPlaceholder: "بحث في سجل الفواتير...",
              userLabel: "المستخدم",
            }}
          />

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedInvoices.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDeleteSelectedInvoices}
                  className="px-4 py-2 text-sm"
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  حذف المحدد ({selectedInvoices.length})
                </Button>
              )}
              <Button
                onClick={handleExport}
                disabled={exporting || filteredInvoices.length === 0}
                className="bg-green-600 hover:bg-green-700 gap-2 p-6"
              >
                <Download className="w-4 h-4" />
                {exporting ? "جاري التصدير..." : "تصدير Excel"}
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <ResultsCounter
                current={paginatedInvoices.length}
                total={filteredInvoices.length}
              />
              <RowsPerPageSelector
                value={rowsPerPage}
                onChange={setRowsPerPage}
                options={[5,10, 20, 50, 100]}
              />
            </div>
          </div>
        </div>


        {/* Table */}
        <div className="rounded-lg border bg-white overflow-hidden">
          {loading ? (
            <div className="p-8">
              <LoadingState message="جاري تحميل الفواتير..." />
            </div>
          ) : paginatedInvoices.length === 0 ? (
            <div className="p-8">
              <EmptyState message={invoiceFilters.search ? "لا توجد نتائج مطابقة للبحث" : "لا توجد فواتير"} />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold text-center">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                          onChange={handleSelectAllInvoices}
                          className="w-4 h-4 text-primary-f border-gray-300 rounded focus:ring-primary-f"
                        />
                      </TableHead>
                      <TableHead className="font-bold">الرقم</TableHead>
                      <TableHead className="font-bold">التاريخ</TableHead>
                      <TableHead className="font-bold">الزبون</TableHead>
                      <TableHead className="font-bold">الإجمالي</TableHead>
                      <TableHead className="font-bold">المدفوع</TableHead>
                      <TableHead className="font-bold">المتبقي</TableHead>
                      <TableHead className="font-bold">الحالة</TableHead>
                      <TableHead className="font-bold">ملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInvoices.map((invoice) => (
                      <TableRow key={invoice.invoice_id} className="hover:bg-gray-50">
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.invoice_id)}
                            onChange={() => handleSelectInvoice(invoice.invoice_id)}
                            className="w-4 h-4 text-primary-f border-gray-300 rounded focus:ring-primary-f"
                          />
                        </TableCell>
                        <TableCell className="font-mono font-bold">
                          #{invoice.invoice_id}
                        </TableCell>
                        <TableCell>
                          {invoiceApi.getFormattedDate(invoice.issued_at)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{invoice.customer?.name || "-"}</div>
                            {invoice.customer?.phone && (
                              <div className="text-xs text-gray-500" dir="ltr">{invoice.customer.phone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {invoiceApi.formatCurrency(invoice.total_amount || 0)}
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">
                          {invoiceApi.formatCurrency(invoice.paid_amount || 0)}
                        </TableCell>
                        <TableCell className="font-bold text-red-600">
                          {invoiceApi.formatCurrency(invoice.remaining_amount || 0)}
                        </TableCell>
                        <TableCell>
                          <PaymentStatusBadge
                            total={invoice.total_amount}
                            paid={invoice.paid_amount}
                          />
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {invoice.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="border-t p-4">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPrevious={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  onNext={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>


      </Card>

      {/* Delete Confirmation Dialog */}
      <StyledDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="تأكيد الحذف"
        description={`هل أنت متأكد من حذف ${selectedInvoices.length} فاتورة؟ لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع الفواتير المحددة بشكل نهائي.`}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteSelectedInvoices}
        cancelLabel="إلغاء"
        confirmLabel={deletingInvoices ? "جاري الحذف..." : `حذف (${selectedInvoices.length})`}
        isLoading={deletingInvoices}
        confirmVariant="destructive"
      />
    </div>
  );
}
