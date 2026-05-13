import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import ComplaintDetailsModal from "../components/ComplaintDetailsModal";

const STATUS_OPTIONS = ["All", "Submitted", "In Progress", "Resolved"];
const BADGE_CLASS = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";

export default function StaffDashboard() {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (_err) {
      return null;
    }
  }, []);

  const token = storedUser?.token || localStorage.getItem("token");
  const staffUserId = storedUser?.user_id || null;

  const requestParams = useMemo(() => {
    if (statusFilter === "All") return {};
    return { status: statusFilter };
  }, [statusFilter]);

  const loadComplaints = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!token) {
        setComplaints([]);
        setStats(null);
        setError("Authentication token missing. Please log in again.");
        return;
      }

      const params = {
        ...requestParams,
        ...(staffUserId ? { assigned_to: staffUserId } : {}),
      };

      const res = await axios.get("http://localhost:5000/api/staff/complaints", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setComplaints(Array.isArray(res.data?.complaints) ? res.data.complaints : []);
      setStats(res.data?.stats || {});
    } catch (err) {
      setComplaints([]);
      setStats(null);
      setError(err.response?.data?.error || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [token, staffUserId, requestParams]);

  const updateStatus = async (id, status) => {
    if (!token) return;

    setError(null);
    setSuccess(null);
    setUpdatingId(id);

    try {
      await axios.put(
        "http://localhost:5000/api/complaint/update",
        { complaint_id: id, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Notify report dashboards (same tab + other tabs)
      window.dispatchEvent(new Event("complaint:status-updated"));
      localStorage.setItem("complaintStatusUpdatedAt", Date.now().toString());

      setComplaints((prev) => prev.map((c) => (c.complaint_id === id ? { ...c, status } : c)));

      setStats((prev) => {
        const next = { ...(prev || {}) };
        const all = (complaints || []).map((c) => (c.complaint_id === id ? { ...c, status } : c));
        next.total = all.length;
        next.submitted = all.filter((x) => x.status === "Submitted").length;
        next.in_progress = all.filter((x) => x.status === "In Progress").length;
        next.resolved = all.filter((x) => x.status === "Resolved").length;
        next.critical = all.filter((x) => x.priority === "Critical").length;
        next.high_priority = all.filter((x) => x.priority === "High").length;
        return next;
      });

      const statusText = status === "In Progress" ? "started" : status === "Resolved" ? "resolved" : status;
      setSuccess(`Complaint ${statusText} successfully`);

      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to update status. Try again.";
      setError(errorMsg);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
      case "Submitted":
        return "bg-orange-100 text-orange-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-blue-100 text-blue-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Staff Dashboard</h1>
            <p className="text-gray-600 text-lg">Manage and process complaints assigned to you</p>
          </div>

          {stats && (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600 hover:shadow-xl transition">
                <p className="text-sm font-bold text-gray-600 mb-2">Total Complaints</p>
                <p className="text-4xl font-bold text-blue-600">{stats.total || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition">
                <p className="text-sm font-bold text-gray-600 mb-2">In Progress</p>
                <p className="text-4xl font-bold text-yellow-600">{stats.in_progress || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition">
                <p className="text-sm font-bold text-gray-600 mb-2">Resolved</p>
                <p className="text-4xl font-bold text-green-600">{stats.resolved || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition">
                <p className="text-sm font-bold text-gray-600 mb-2">Critical Priority</p>
                <p className="text-4xl font-bold text-red-600">{stats.critical || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition">
                <p className="text-sm font-bold text-gray-600 mb-2">High Priority</p>
                <p className="text-4xl font-bold text-orange-600">{stats.high_priority || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-400 hover:shadow-xl transition">
                <p className="text-sm font-bold text-gray-600 mb-2">Submitted</p>
                <p className="text-4xl font-bold text-blue-500">{stats.submitted || 0}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Assigned Complaints</h2>
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm rounded border border-blue-200 px-3 py-2 text-gray-800 bg-white"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  onClick={loadComplaints}
                  className="bg-white text-blue-600 px-4 py-2 rounded font-bold text-sm hover:bg-blue-50 transition"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">{success}</div>
              )}

              <div className="mb-4 text-sm text-gray-600">
                {loading ? "Loading..." : `${complaints.length} complaint${complaints.length !== 1 ? "s" : ""}`}
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-4 p-4 border border-gray-100 rounded-lg">
                      <div className="h-10 w-10 rounded bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </div>
                      <div className="h-6 w-24 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <p className="text-lg">No complaints assigned to you</p>
                  <p className="text-sm">Your assigned complaints will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Complaint ID</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Department</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Priority</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map((c) => (
                        <tr key={c.complaint_id} className="border-b border-gray-100 odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono text-gray-500 truncate max-w-xs">{c.complaint_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 max-w-xs truncate">{c.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{c.department || "N/A"}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`${BADGE_CLASS} ${getPriorityColor(c.priority)}`}>
                              {c.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`${BADGE_CLASS} ${getStatusColor(c.status)}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedComplaint(c);
                                setModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold mr-2 shadow-sm transition"
                            >
                              View
                            </button>

                            {c.status === "Submitted" && (
                              <button
                                onClick={() => updateStatus(c.complaint_id, "In Progress")}
                                disabled={updatingId === c.complaint_id}
                                className={`bg-gradient-to-r from-yellow-500 to-yellow-400 text-white px-3 py-1 rounded text-xs font-bold hover:from-yellow-600 hover:to-yellow-500 transition ${
                                  updatingId === c.complaint_id ? "opacity-60 cursor-not-allowed" : ""
                                }`}
                              >
                                {updatingId === c.complaint_id ? "Updating..." : "Start"}
                              </button>
                            )}

                            {c.status === "In Progress" && (
                              <button
                                onClick={() => updateStatus(c.complaint_id, "Resolved")}
                                disabled={updatingId === c.complaint_id}
                                className={`bg-gradient-to-r from-green-600 to-green-500 text-white px-3 py-1 rounded text-xs font-bold hover:from-green-700 hover:to-green-600 transition ${
                                  updatingId === c.complaint_id ? "opacity-60 cursor-not-allowed" : ""
                                }`}
                              >
                                {updatingId === c.complaint_id ? "Updating..." : "Resolve"}
                              </button>
                            )}

                            {c.status === "Resolved" && (
                              <span className={`${BADGE_CLASS} bg-green-100 text-green-800`}>
                                Done
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ComplaintDetailsModal
        complaint={selectedComplaint}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        token={token}
        onStatusUpdate={() => {
          loadComplaints();
        }}
      />
    </Layout>
  );
}
