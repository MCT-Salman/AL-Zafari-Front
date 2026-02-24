import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * RoleProtectedRoute component | مكون حماية المسارات حسب الصلاحيات
 * @param {Object} props
 * @param {Array|string} props.allowedRoles - Roles allowed to access this route
 * @param {React.ReactNode} props.children - Component to render if role is allowed
 */
export default function RoleProtectedRoute({ allowedRoles, children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const roleList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (allowedRoles && !roleList.includes(user.role)) {
        // Redirect to a safe place (dashboard) if role not allowed
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
