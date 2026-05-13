import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import StaffRegistrationModal from "../components/StaffRegistrationModal";
import UnassignedComplaints from "../components/UnassignedComplaints";

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [showStaffRegistration, setShowStaffRegistration] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleRegistrationSuccess = (staffData) => {
    setRegistrationSuccess(staffData);
    // Clear success message after 3 seconds
    setTimeout(() => setRegistrationSuccess(null), 3000);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Success Notification */}
          {registrationSuccess && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg shadow-md">
              <p className="text-green-800 font-semibold">
                ✓ Staff registered successfully!
              </p>
              <p className="text-green-700 text-sm mt-1">
                <strong>{registrationSuccess.name}</strong> ({registrationSuccess.email}) can now log in as staff in the <strong>{registrationSuccess.department}</strong> department.
              </p>
            </div>
          )}

          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome back, {user?.user_id}. Manage system and staff.
            </p>
          </div>

          {/* Dashboard Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Staff Management Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition border border-blue-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">👥</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Staff Management
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Register and manage department staff members
                  </p>
                  <button
                    onClick={() => setShowStaffRegistration(true)}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:from-blue-700 hover:to-blue-600 transition"
                  >
                    Register New Staff
                  </button>
                </div>
              </div>
            </div>

            {/* System Settings Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition border border-blue-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">⚙️</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    System Settings
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Configure system parameters and priorities
                  </p>
                  <button
                    onClick={() => navigate("/admin/settings")}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:from-blue-700 hover:to-blue-600 transition"
                  >
                    Configure
                  </button>
                </div>
              </div>
            </div>

            {/* Reports Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition border border-blue-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">📊</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Reports & Analytics
                  </h2>
                  <p className="text-gray-600 mb-4">
                    View system analytics and complaint reports
                  </p>
                  <button
                    onClick={() => navigate("/admin/reports")}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:from-blue-700 hover:to-blue-600 transition"
                  >
                    View Reports
                  </button>
                </div>
              </div>
            </div>

            {/* System Health Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition border border-blue-100">
              <div className="flex items-start gap-4 mb-4">
                <div className="text-4xl">🏥</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    System Health
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Monitor system performance and status
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      All Systems Operational
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                      Database Connected
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              Quick Info
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div>
                <p className="font-bold text-blue-600">Admin Role</p>
                <p>Full system access and configuration rights</p>
              </div>
              <div>
                <p className="font-bold text-blue-600">Staff Management</p>
                <p>Register and manage department staff members</p>
              </div>
              <div>
                <p className="font-bold text-blue-600">Departments</p>
                <p>
                  Health, Electricity, LSG, Public Works, Transport, Fire, Police
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <UnassignedComplaints />
          </div>
        </div>
      </div>

      {/* Staff Registration Modal */}
      <StaffRegistrationModal
        isOpen={showStaffRegistration}
        onClose={() => setShowStaffRegistration(false)}
        onSuccess={handleRegistrationSuccess}
      />
    </Layout>
  );
}

export default AdminDashboard;
