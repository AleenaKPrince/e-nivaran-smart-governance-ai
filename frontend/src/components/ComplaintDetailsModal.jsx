import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const STATUS_FLOW = ["Submitted", "In Progress", "Resolved"];
const BADGE_CLASS = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
const VALID_NEXT_STATUS = {
  Submitted: ["In Progress"],
  "In Progress": ["Resolved"],
  Resolved: [],
};

export default function ComplaintDetailsModal({ complaint, isOpen, onClose, token, onStatusUpdate }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isOpen || !complaint || !token) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    axios
      .get(`http://localhost:5000/api/staff/complaints/${complaint.complaint_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setDetails(res.data))
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load complaint details");
      })
      .finally(() => setLoading(false));
  }, [isOpen, complaint, token]);

  const allowedNext = useMemo(() => {
    if (!details?.status) return [];
    return VALID_NEXT_STATUS[details.status] || [];
  }, [details?.status]);

  const handleStatusUpdate = async (newStatus) => {
    if (!token || !details || !newStatus || newStatus === details.status) return;

    if (!allowedNext.includes(newStatus)) {
      setError("Invalid status transition");
      return;
    }

    setUpdatingStatus(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.put(
        "http://localhost:5000/api/complaint/update",
        { complaint_id: details.complaint_id, status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Notify report dashboards (same tab + other tabs)
      window.dispatchEvent(new Event("complaint:status-updated"));
      localStorage.setItem("complaintStatusUpdatedAt", Date.now().toString());

      setDetails((prev) => {
        const nowIso = new Date().toISOString();
        const history = Array.isArray(prev.history) ? prev.history : [];
        return {
          ...prev,
          status: newStatus,
          updated_at: nowIso,
          history: [
            ...history,
            {
              updated_by: "You",
              old_status: prev.status,
              new_status: newStatus,
              timestamp: nowIso,
            },
          ],
        };
      });

      setSuccess("Status updated successfully");
      if (onStatusUpdate) {
        onStatusUpdate(details.complaint_id, newStatus);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 flex items-center justify-between sticky top-0">
          <div>
            <h2 className="text-2xl font-bold">Complaint Details</h2>
            <p className="text-blue-100 text-sm">{details?.complaint_id || complaint?.complaint_id}</p>
          </div>
          <button
            onClick={onClose}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded font-bold transition"
          >
            X
          </button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">{success}</div>}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="mt-2 text-gray-500">Loading complaint details...</p>
            </div>
          ) : details ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded border border-gray-200">{details.description}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <MetaItem label="Complaint ID" value={details.complaint_id || "N/A"} mono />
                <MetaItem label="Department" value={details.department || "N/A"} />
                <MetaItem label="Priority" value={<Badge cls={getPriorityColor(details.priority)} text={details.priority || "N/A"} />} />
                <MetaItem label="Routing mode" value={details.routing_mode || "N/A"} />
                <MetaItem label="Assigned staff" value={details.assigned_to || "N/A"} />
                <MetaItem label="Current status" value={<Badge cls={getStatusColor(details.status)} text={details.status || "N/A"} />} />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                <p className="text-sm font-bold text-gray-700 mb-3">Update Status</p>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={details.status || ""}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={updatingStatus || details.status === "Resolved"}
                    className="rounded border border-blue-200 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    {STATUS_FLOW.map((status) => {
                      const disabled = status !== details.status && !allowedNext.includes(status);
                      return (
                        <option key={status} value={status} disabled={disabled}>
                          {status}
                        </option>
                      );
                    })}
                  </select>
                  {details.status === "Resolved" ? (
                    <span className="text-sm text-green-700 font-semibold">Final state reached</span>
                  ) : (
                    <span className="text-xs text-gray-600">
                      Allowed next: {allowedNext.length ? allowedNext.join(", ") : "None"}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Status History</h3>
                {Array.isArray(details.history) && details.history.length > 0 ? (
                  <div className="space-y-3">
                    {details.history.map((entry, idx) => (
                      <div key={`${entry.timestamp || idx}-${idx}`} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-bold text-gray-800">
                            {(entry.old_status || "None") + " -> "}
                            <span className="text-green-600">{entry.new_status || "N/A"}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "N/A"}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Updated by: {entry.updated_by || "System"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No history available</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-xs text-gray-600">
                  <span className="font-bold">Created:</span>{" "}
                  {details.created_at ? new Date(details.created_at).toLocaleString() : "N/A"}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <span className="font-bold">Assigned at:</span>{" "}
                  {details.assigned_at ? new Date(details.assigned_at).toLocaleString() : "N/A"}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <span className="font-bold">Last updated:</span>{" "}
                  {details.updated_at ? new Date(details.updated_at).toLocaleString() : "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">No complaint details found</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-sm font-bold text-gray-600 mb-1">{label}</p>
      <div className={mono ? "text-gray-800 font-mono text-sm" : "text-gray-800 text-sm"}>{value}</div>
    </div>
  );
}

function Badge({ cls, text }) {
  return <span className={`${BADGE_CLASS} ${cls}`}>{text}</span>;
}

function getStatusColor(status) {
  switch (status) {
    case "Submitted":
      return "bg-blue-100 text-blue-800";
    case "In Progress":
      return "bg-yellow-100 text-yellow-800";
    case "Resolved":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getPriorityColor(priority) {
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
}
