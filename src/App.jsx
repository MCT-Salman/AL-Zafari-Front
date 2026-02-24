// src\App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Users from "@/pages/Users";
import Constants from "@/pages/Constants";
import SettingsManagement from "@/pages/SettingsManagement";
import ForgotPassword from "@/pages/ForgotPassword";
import VerifyOtp from "@/pages/VerifyOtp";
import ResetPassword from "@/pages/ResetPassword";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from 'react-hot-toast';
import ConstantTabs from "./pages/Constant/ConstantTabs";
import CustomerManagement from "./pages/Sales/CustomerManagement";
import OrderManagement from "./pages/Sales/OrderManagement";
import SalesHome from "./pages/Sales/SalesHome";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

// Dashboard switcher based on role
const DashboardSwitcher = () => {
  const { user } = useAuth();
  if (user?.role === 'sales') return <SalesHome />;
  return <Dashboard />;
};

const App = () => {
  return (
    <>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected/App routes wrapped with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
            <Route path="/customers" element={
              <RoleProtectedRoute allowedRoles="sales">
                <CustomerManagement />
              </RoleProtectedRoute>
            } />
            <Route path="/orders" element={
              <RoleProtectedRoute allowedRoles="sales">
                <OrderManagement />
              </RoleProtectedRoute>
            } />
            <Route path="/users" element={
              <RoleProtectedRoute allowedRoles="admin">
                <Users />
              </RoleProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
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