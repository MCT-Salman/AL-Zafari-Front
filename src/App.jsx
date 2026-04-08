// src\App.jsx
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import ProductionManager from "./pages/Production/ProductionManager";
import ProductionDashboard from "./pages/Production/ProductionDashboard";
import ProductionRecords from "./pages/ProductionRecords";
import InvoiceManager from "./pages/Sales/InvoiceManager";
import { isLoggingOut } from "./utils/authSession";

let toastErrorGuardInstalled = false;
if (!toastErrorGuardInstalled) {
  const originalToastError = toast.error.bind(toast);
  toast.error = (...args) => {
    if (isLoggingOut()) return;
    return originalToastError(...args);
  };
  toastErrorGuardInstalled = true;
}

const MainLayout = lazy(() => import("@/components/Layout/MainLayout"));
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const Settings = lazy(() => import("@/pages/Settings"));
const Users = lazy(() => import("@/pages/Users"));
const SettingsManagement = lazy(() => import("@/pages/SettingsManagement"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const VerifyOtp = lazy(() => import("@/pages/VerifyOtp"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const ConstantTabs = lazy(() => import("./pages/Constant/ConstantTabs"));
const CustomerManagement = lazy(() => import("./pages/Sales/CustomerManagement"));
const OrderManagement = lazy(() => import("./pages/Sales/OrderManagement"));
const OrderPreparer = lazy(() => import("./pages/Sales/OrderPreparer"));
const SalesPage = lazy(() => import("./pages/Sales/SimpleOrderCreation"));
const OrderPreparationPage = lazy(() => import("./pages/OrderPreparation/OrderPreparationPage"));
const InvoiceHistory = lazy(() => import("./pages/Admin/InvoiceHistory"));
const SalesHome = lazy(() => import("./pages/Sales/SalesHome"));
const SalesDashboard = lazy(() => import("./pages/Sales/SalesDashboard"));
const OrderPreparerDashboard = lazy(() => import("./pages/Sales/OrderPreparerDashboard"));
const WarehouseKeeper = lazy(() => import("./pages/Warehouse/WarehouseKeeper"));
const SlittingManager = lazy(() => import("./pages/Slitting/SlittingManager"));
const CuttingManager = lazy(() => import("./pages/Cutting/CuttingManager"));
const GluingManager = lazy(() => import("./pages/Gluing/GluingManager"));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">
    جاري التحميل...
  </div>
);

const DefaultRoute = () => {
  const { user } = useAuth();
  const target =
    user?.role === 'production_manager'
      ? "/production/dashboard"
      : user?.role === 'Dissection_Technician'
        ? "/slitting"
        : user?.role === 'Cutting_Technician'
          ? "/cutting"
          : user?.role === 'Gluing_Technician'
            ? "/gluing"
            : user?.role === 'cashier'
              ? "/sales"
              : user?.role === 'sales'
                ? "/order-preparer"
                : user?.role === 'Warehouse_Keeper'
                  ? "/warehouse"
                  : "/dashboard";
  return <Navigate to={target} replace />;
};

// Dashboard switcher based on role
const DashboardSwitcher = () => {
  const { user } = useAuth();
  if (user?.role === 'cashier') return <SalesHome />;
  if (user?.role === 'sales') return <OrderPreparerDashboard />;
  if (user?.role === 'production_manager') return <Navigate to="/production/dashboard" replace />;
  if (user?.role === 'Dissection_Technician') return <Navigate to="/slitting" replace />;
  if (user?.role === 'Cutting_Technician') return <Navigate to="/cutting" replace />;
  if (user?.role === 'Gluing_Technician') return <Navigate to="/gluing" replace />;
  if (user?.role === 'Warehouse_Keeper') return <Navigate to="/warehouse" replace />;
  return <Dashboard />;
};

const App = () => {
  return (
    <>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected/App routes wrapped with MainLayout */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<DefaultRoute />} />
              <Route path="/dashboard" element={<DashboardSwitcher />} />
              <Route path="/profile" element={
                <RoleProtectedRoute allowedRoles="admin">
                  <Profile />
                </RoleProtectedRoute>
              } />
              <Route path="/settings" element={
                <RoleProtectedRoute allowedRoles="admin">
                  <Settings />
                </RoleProtectedRoute>
              } />
              <Route path="/constants" element={
                <RoleProtectedRoute allowedRoles="admin">
                  <ConstantTabs />
                </RoleProtectedRoute>
              } />
              <Route path="/settings-management" element={
                <RoleProtectedRoute allowedRoles="admin">
                  <SettingsManagement />
                </RoleProtectedRoute>
              } />
              <Route path="/users" element={
                <RoleProtectedRoute allowedRoles="admin">
                  <Users />
                </RoleProtectedRoute>
              } />
              <Route path="/invoice-history" element={
                <RoleProtectedRoute allowedRoles="admin">
                  <InvoiceHistory />
                </RoleProtectedRoute>
              } />
              <Route path="/order-preparation" element={
                <RoleProtectedRoute allowedRoles="production_manager">
                  <OrderPreparationPage />
                </RoleProtectedRoute>
              } />
             
              
              <Route path="/invoice-history" element={
                <RoleProtectedRoute allowedRoles="admin">
                  <InvoiceHistory />
                </RoleProtectedRoute>
              } />

               <Route path="/production/dashboard" element={
                <RoleProtectedRoute allowedRoles="production_manager">
                  <ProductionDashboard />
                </RoleProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Routes without MainLayout */}
             <Route path="/invoice" element={
                <RoleProtectedRoute allowedRoles={["sales", "admin", "cashier"]}>
                  <InvoiceManager />
                </RoleProtectedRoute>
              } />
             <Route path="/production" element={
                <RoleProtectedRoute allowedRoles="production_manager">
                  <ProductionManager />
                </RoleProtectedRoute>
              } />
            
              <Route path="/production-records" element={
                <RoleProtectedRoute allowedRoles="production_manager">
                  <ProductionRecords />
                </RoleProtectedRoute>
              } />
            <Route path="/orders" element={
              <RoleProtectedRoute allowedRoles={["sales", "cashier"]}>
                <OrderManagement />
              </RoleProtectedRoute>
            } />
            <Route path="/order-preparer" element={
              <RoleProtectedRoute allowedRoles={["sales", "cashier"]}>
                <OrderPreparer />
              </RoleProtectedRoute>
            } />
            <Route path="/sales" element={
              <RoleProtectedRoute allowedRoles={["sales", "cashier"]}>
                <SalesPage />
              </RoleProtectedRoute>
            } />
            <Route path="/customers" element={
              <RoleProtectedRoute allowedRoles={["sales", "cashier"]}>
                <CustomerManagement />
              </RoleProtectedRoute>
            } />
            <Route path="/sales/dashboard" element={
              <RoleProtectedRoute allowedRoles={["sales", "cashier"]}>
                <SalesDashboard />
              </RoleProtectedRoute>
            } />
            <Route path="/order-preparer-dashboard" element={
              <RoleProtectedRoute allowedRoles="sales">
                <OrderPreparerDashboard />
              </RoleProtectedRoute>
            } />
            <Route path="/warehouse" element={
              <RoleProtectedRoute allowedRoles="Warehouse_Keeper">
                <WarehouseKeeper />
              </RoleProtectedRoute>
            } />
            <Route path="/slitting" element={
              <RoleProtectedRoute allowedRoles="Dissection_Technician">
                <SlittingManager />
              </RoleProtectedRoute>
            } />
            <Route path="/cutting" element={
              <RoleProtectedRoute allowedRoles="Cutting_Technician">
                <CuttingManager />
              </RoleProtectedRoute>
            } />
            <Route path="/gluing" element={
              <RoleProtectedRoute allowedRoles="Gluing_Technician">
                <GluingManager />
              </RoleProtectedRoute>
            } />
            
          </Routes>
        </Suspense>
      </AuthProvider>
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={16}
        containerStyle={{
          top: 24,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 9999,
        }}
        toastOptions={{
          duration: 5000,

          style: {
            direction: 'rtl',
            fontFamily: "'Segoe UI', 'Tahoma', sans-serif",
            padding: '18px 24px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            boxShadow: `
        0 8px 32px 0 rgba(31, 38, 135, 0.15),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.6)
      `,
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#1f2937',
            fontSize: '15px',
            fontWeight: '600',
            maxWidth: '420px',
            margin: '0 auto',
            gap: '12px',
          },

          success: {
            style: {
              background: 'rgba(236, 253, 245, 0.9)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#065f46',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#d1fae5',
            },
          },

          error: {
            style: {
              background: 'rgba(254, 242, 242, 0.9)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#991b1b',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fee2e2',
            },
          },

          loading: {
            style: {
              background: 'rgba(239, 246, 255, 0.9)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#1e40af',
            },
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#dbeafe',
            },
          },
        }}
      >
        {(t) => (
          <div className="pointer-events-auto">
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <div className="flex items-center gap-3 w-full">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {icon}
                    <span className="truncate">{message}</span>
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 shadow-sm hover:bg-gray-100"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={() => toast.dismiss(t.id)}
                  >
                    ×
                  </button>
                </div>
              )}
            </ToastBar>
          </div>
        )}
      </Toaster>
    </>
  );
};

export default App;
