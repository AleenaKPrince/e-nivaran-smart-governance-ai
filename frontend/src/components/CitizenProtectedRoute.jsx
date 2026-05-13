import { Navigate } from "react-router-dom";
import { getCurrentUserRole } from "../utils/auth";

const CitizenProtectedRoute = ({ children }) => {
  const role = getCurrentUserRole();
  if (role !== "citizen") {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default CitizenProtectedRoute;
