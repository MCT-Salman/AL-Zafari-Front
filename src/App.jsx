// src\App.jsx
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from 'react-hot-toast';
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import ProductionManager from "./pages/Production/ProductionManager";
import ProductionRecords from "./pages/ProductionRecords";
import InvoiceManager from "./pages/Sales/InvoiceManager";

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
const InvoiceHistory = lazy(() => import("./pages/Admin/InvoiceHistory"));
const SalesHome = lazy(() => import("./pages/Sales/SalesHome"));
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
      ? "/production"
      : user?.role === 'Dissection_Technician'
        ? "/slitting"
        : user?.role === 'Cutting_Technician'
          ? "/cutting"
          : user?.role === 'Gluing_Technician'
            ? "/gluing"
        : "/dashboard";
  return <Navigate to={target} replace />;
};

// Dashboard switcher based on role
const DashboardSwitcher = () => {
  const { user } = useAuth();
  if (user?.role === 'sales') return <SalesHome />;
  if (user?.role === 'production_manager') return <Navigate to="/production" replace />;
  if (user?.role === 'Dissection_Technician') return <Navigate to="/slitting" replace />;
  if (user?.role === 'Cutting_Technician') return <Navigate to="/cutting" replace />;
  if (user?.role === 'Gluing_Technician') return <Navigate to="/gluing" replace />;
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
              <Route path="/customers" element={
                <RoleProtectedRoute allowedRoles="sales">
                  <CustomerManagement />
                </RoleProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
              <Route path="/orders" element={
                <RoleProtectedRoute allowedRoles="sales">
                  <OrderManagement />
                </RoleProtectedRoute>
              } />
              <Route path="/invoice" element={
                <RoleProtectedRoute allowedRoles={["sales", "admin"]}>
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
          zIndex: 9999,
        }}
        toastOptions={{
          duration: 4000,

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
      />
    </>
  );
};

export default App;