import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import ComplaintSubmit from "./pages/ComplaintSubmit";
import MyComplaints from "./pages/MyComplaints";
import TrackComplaint from "./pages/TrackComplaint";
import Login from "./pages/Login";
import CitizenRegister from "./pages/CitizenRegister";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Reports from "./pages/Reports";
import AdminSettings from "./pages/AdminSettings";
import Chatbot from "./pages/Chatbot";
import Unauthorized from "./pages/Unauthorized";

import ProtectedRoute from "./components/ProtectedRoute";
import ComplaintAccessRoute from "./components/ComplaintAccessRoute";
import CitizenProtectedRoute from "./components/CitizenProtectedRoute";
import { LanguageProvider } from "./context/LanguageContext";

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <Navbar />

        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Landing />} />
          <Route
            path="/complaint"
            element={
              <ComplaintAccessRoute>
                <ComplaintSubmit />
              </ComplaintAccessRoute>
            }
          />
          <Route
            path="/my-complaints"
            element={
              <CitizenProtectedRoute>
                <MyComplaints />
              </CitizenProtectedRoute>
            }
          />
          <Route path="/status" element={<TrackComplaint />} />
          <Route path="/login" element={<Login />} />
          <Route path="/staff/login" element={<Login />} />
          <Route path="/citizen/register" element={<CitizenRegister />} />
          <Route path="/citizen/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/chatbot" element={<Chatbot />} />

          {/* PROTECTED STAFF ROUTE */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRole="staff">
                <StaffDashboard />
              </ProtectedRoute>
            }
          />

          {/* PROTECTED ADMIN ROUTES */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRole="admin">
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminSettings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
