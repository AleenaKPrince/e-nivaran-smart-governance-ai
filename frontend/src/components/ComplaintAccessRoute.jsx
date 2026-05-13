import { Navigate } from "react-router-dom";
import { hasCitizenSession, hasStaffAdminSession } from "../utils/auth";

const ComplaintAccessRoute = ({ children }) => {
  if (!hasCitizenSession() && !hasStaffAdminSession()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ComplaintAccessRoute;
