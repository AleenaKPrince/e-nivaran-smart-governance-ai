import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getRole } from "../utils/auth";
import api from "../services/api";

function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Summary data
  const [summary, setSummary] = useState({
    total_complaints: 0,
    total_departments: 0,
    total_staff: 0,
    resolved_complaints: 0,
    pending_complaints: 0,
  });

  // Department analytics
  const [departmentStats, setDepartmentStats] = useState([]);

  // Staff workload
  const [staffWorkload, setStaffWorkload] = useState([]);

  // Status breakdown
  const [statusBreakdown, setStatusBreakdown] = useState({
    submitted: 0,
    in_progress: 0,
    resolved: 0,
    total: 0,
  });

  const fetchReportsData = useCallback(async ({ silent = false } = {}) => {
    if (isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      if (!silent || !hasLoadedRef.current) {
        setLoading(true);
      }
      setError(null);

      // Fetch all analytics data in parallel
      const [summaryRes, deptsRes, workloadRes, statusRes] = await Promise.all([
        api.get("/reports/summary"),
        api.get("/reports/departments"),
        api.get("/reports/staff-workload"),
        api.get("/reports/status-breakdown"),
      ]);

      setSummary(summaryRes.data);
      setDepartmentStats(deptsRes.data);
      setStaffWorkload(workloadRes.data);
      setStatusBreakdown(statusRes.data);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load reports data");
    } finally {
      if (!silent || !hasLoadedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, []);

  // Verify admin access + real-time refresh triggers
  useEffect(() => {
    if (getRole() !== "admin") {
      navigate("/unauthorized");
      return;
    }

    fetchReportsData();

    // Lightweight polling every 12 seconds while page is visible
    const intervalRef = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchReportsData({ silent: true });
      }
    }, 12000);

    const onFocus = () => fetchReportsData({ silent: true });
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchReportsData({ silent: true });
      }
    };
    const onStatusUpdated = () => fetchReportsData({ silent: true });
    const onStorage = (event) => {
      if (event.key === "complaintStatusUpdatedAt") {
        fetchReportsData({ silent: true });
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("complaint:status-updated", onStatusUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      clearInterval(intervalRef);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("complaint:status-updated", onStatusUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [fetchReportsData, navigate]);

  const handleRefresh = () => {
    fetchReportsData();
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading reports data...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Reports & Analytics
              </h1>
              <p className="text-gray-600">
                System-wide analytics and complaint insights
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <p className="text-red-800 font-semibold">Error loading data</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* SECTION 1: OVERALL ANALYTICS - Summary Cards */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Overall Analytics
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Complaints */}
              <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
                <p className="text-gray-600 text-sm font-semibold mb-2">
                  TOTAL COMPLAINTS
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {summary.total_complaints}
                </p>
              </div>

              {/* Total Departments */}
              <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-purple-500">
                <p className="text-gray-600 text-sm font-semibold mb-2">
                  TOTAL DEPARTMENTS
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {summary.total_departments}
                </p>
              </div>

              {/* Total Staff */}
              <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-500">
                <p className="text-gray-600 text-sm font-semibold mb-2">
                  TOTAL STAFF
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {summary.total_staff}
                </p>
              </div>

              {/* Resolved Complaints */}
              <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-emerald-500">
                <p className="text-gray-600 text-sm font-semibold mb-2">
                  RESOLVED
                </p>
                <p className="text-3xl font-bold text-emerald-600">
                  {summary.resolved_complaints}
                </p>
              </div>

              {/* Pending Complaints */}
              <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-orange-500">
                <p className="text-gray-600 text-sm font-semibold mb-2">
                  PENDING
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {summary.pending_complaints}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: COMPLAINT STATUS BREAKDOWN */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Complaint Status Breakdown
            </h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {/* Submitted */}
                <div className="text-center p-4 border-l-4 border-yellow-500">
                  <p className="text-gray-600 font-semibold mb-2">Submitted</p>
                  <p className="text-4xl font-bold text-yellow-600">
                    {statusBreakdown.submitted}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {statusBreakdown.total > 0
                      ? ((statusBreakdown.submitted / statusBreakdown.total) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>

                {/* In Progress */}
                <div className="text-center p-4 border-l-4 border-blue-500">
                  <p className="text-gray-600 font-semibold mb-2">In Progress</p>
                  <p className="text-4xl font-bold text-blue-600">
                    {statusBreakdown.in_progress}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {statusBreakdown.total > 0
                      ? ((statusBreakdown.in_progress / statusBreakdown.total) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>

                {/* Resolved */}
                <div className="text-center p-4 border-l-4 border-green-500">
                  <p className="text-gray-600 font-semibold mb-2">Resolved</p>
                  <p className="text-4xl font-bold text-green-600">
                    {statusBreakdown.resolved}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {statusBreakdown.total > 0
                      ? ((statusBreakdown.resolved / statusBreakdown.total) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>

              {/* Simple Progress Bar */}
              <div className="mt-6">
                <p className="text-sm text-gray-600 font-semibold mb-2">
                  Overall Progress
                </p>
                <div className="flex h-4 rounded-full overflow-hidden bg-gray-200">
                  <div
                    className="bg-yellow-500 transition-all"
                    style={{
                      width: `${
                        statusBreakdown.total > 0
                          ? (statusBreakdown.submitted / statusBreakdown.total) * 100
                          : 0
                      }%`,
                    }}
                    title={`Submitted: ${statusBreakdown.submitted}`}
                  ></div>
                  <div
                    className="bg-blue-500 transition-all"
                    style={{
                      width: `${
                        statusBreakdown.total > 0
                          ? (statusBreakdown.in_progress / statusBreakdown.total) * 100
                          : 0
                      }%`,
                    }}
                    title={`In Progress: ${statusBreakdown.in_progress}`}
                  ></div>
                  <div
                    className="bg-green-500 transition-all"
                    style={{
                      width: `${
                        statusBreakdown.total > 0
                          ? (statusBreakdown.resolved / statusBreakdown.total) * 100
                          : 0
                      }%`,
                    }}
                    title={`Resolved: ${statusBreakdown.resolved}`}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: DEPARTMENT-WISE ANALYTICS */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Department-wise Analytics
            </h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                      <th className="px-6 py-4 text-left font-semibold">
                        Department
                      </th>
                      <th className="px-6 py-4 text-center font-semibold">
                        Total
                      </th>
                      <th className="px-6 py-4 text-center font-semibold">
                        In Progress
                      </th>
                      <th className="px-6 py-4 text-center font-semibold">
                        Resolved
                      </th>
                      <th className="px-6 py-4 text-center font-semibold">
                        Unassigned
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentStats.length > 0 ? (
                      departmentStats.map((dept, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0
                              ? "bg-white border-b border-gray-200"
                              : "bg-gray-50 border-b border-gray-200"
                          }
                        >
                          <td className="px-6 py-4 font-semibold text-gray-800">
                            {dept.department}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-700 font-bold">
                            {dept.total}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                              {dept.in_progress}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                              {dept.resolved}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                              {dept.unassigned}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION 4: STAFF WORKLOAD PER DEPARTMENT */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Staff Workload per Department
            </h2>
            {staffWorkload.length > 0 ? (
              <div className="space-y-6">
                {staffWorkload.map((deptData, deptIndex) => (
                  <div
                    key={deptIndex}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4">
                      <h3 className="text-xl font-bold text-white">
                        {deptData.department}
                      </h3>
                      <p className="text-indigo-100 text-sm">
                        {deptData.staff.length} staff member
                        {deptData.staff.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {deptData.staff.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {deptData.staff.map((staff, staffIndex) => (
                          <div
                            key={staffIndex}
                            className="px-6 py-4 hover:bg-gray-50 transition"
                          >
                            <div className="grid md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-sm text-gray-600">Staff Member</p>
                                <p className="text-lg font-semibold text-gray-800">
                                  {staff.name}
                                </p>
                                <p className="text-sm text-gray-500">{staff.email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Staff ID</p>
                                <p className="text-lg font-mono text-gray-800">
                                  {staff.staff_id}
                                </p>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="bg-blue-50 rounded p-3 border-l-4 border-blue-500">
                                <p className="text-xs text-gray-600 font-semibold">
                                  TOTAL ASSIGNED
                                </p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">
                                  {staff.total_assigned}
                                </p>
                              </div>
                              <div className="bg-green-50 rounded p-3 border-l-4 border-green-500">
                                <p className="text-xs text-gray-600 font-semibold">
                                  RESOLVED
                                </p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                  {staff.resolved}
                                </p>
                              </div>
                              <div className="bg-amber-50 rounded p-3 border-l-4 border-amber-500">
                                <p className="text-xs text-gray-600 font-semibold">
                                  IN PROGRESS
                                </p>
                                <p className="text-2xl font-bold text-amber-600 mt-1">
                                  {staff.in_progress}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-8 text-center text-gray-500">
                        <p>No staff members in this department</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-500">No staff workload data available</p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h3 className="font-bold text-gray-800 mb-3">ℹ️ Report Information</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>
                • <strong>Total Complaints:</strong> All complaints submitted in the system
              </li>
              <li>
                • <strong>Resolved:</strong> Complaints with status "Resolved"
              </li>
              <li>
                • <strong>Pending:</strong> Complaints with status "Submitted" or "In Progress"
              </li>
              <li>
                • <strong>Department Workload:</strong> Real-time count of complaints per department
              </li>
              <li>
                • <strong>Staff Performance:</strong> Individual staff member complaint statistics
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Reports;

