import { Navigate } from "react-router-dom";
import { getCurrentUserRole, hasStaffAdminSession } from "../utils/auth";

const ProtectedRoute = ({ children, allowedRole }) => {
  if (!hasStaffAdminSession()) {
    return <Navigate to="/login" replace />;
  }

  const role = getCurrentUserRole();

  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
