import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function UnassignedComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selections, setSelections] = useState({});

  const staffByDepartment = useMemo(() => {
    return staff.reduce((acc, member) => {
      const dept = member.department || "";
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(member);
      return acc;
    }, {});
  }, [staff]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [complaintsRes, staffRes] = await Promise.all([
        api.get("/admin/complaints/unassigned"),
        api.get("/admin/staff"),
      ]);

      const complaintRows = complaintsRes.data?.complaints || [];
      const staffRows = staffRes.data?.staff || [];
      const deptRows = staffRes.data?.departments || [];

      setComplaints(complaintRows);
      setStaff(staffRows);
      setDepartments(deptRows);

      const initialSelections = {};
      complaintRows.forEach((c) => {
        const defaultDept = c.department && c.department !== "Unclassified" ? c.department : deptRows[0] || "";
        const staffOptions = staffRows.filter((s) => s.department === defaultDept);
        initialSelections[c.complaint_id] = {
          department: defaultDept,
          staff_id: staffOptions[0]?.user_id || "",
        };
      });
      setSelections(initialSelections);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load unassigned complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateSelection = (complaintId, key, value) => {
    setSelections((prev) => {
      const current = prev[complaintId] || { department: "", staff_id: "" };
      if (key === "department") {
        const staffOptions = staffByDepartment[value] || [];
        return {
          ...prev,
          [complaintId]: {
            department: value,
            staff_id: staffOptions[0]?.user_id || "",
          },
        };
      }
      return {
        ...prev,
        [complaintId]: {
          ...current,
          [key]: value,
        },
      };
    });
  };

  const assignComplaint = async (complaintId) => {
    const selected = selections[complaintId] || {};
    if (!selected.department || !selected.staff_id) {
      setError("Please select both department and staff before assigning.");
      return;
    }

    setAssigningId(complaintId);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/admin/complaints/${complaintId}/assign`, {
        department: selected.department,
        staff_id: selected.staff_id,
      });

      setComplaints((prev) => prev.filter((c) => c.complaint_id !== complaintId));
      setSuccess(`Complaint ${complaintId} assigned successfully.`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to assign complaint");
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Unassigned Complaints Management</h2>
        <button
          onClick={loadData}
          className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded text-sm font-semibold hover:bg-blue-100 transition"
        >
          Refresh
        </button>
      </div>

      <p className="text-gray-600 mb-6">Assign unclassified or unassigned complaints manually to the correct department staff.</p>

      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading unassigned complaints...</div>
      ) : complaints.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          <p className="text-lg font-semibold">No unassigned complaints</p>
          <p className="text-sm">All complaints are currently assigned.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="px-3 py-3 text-left text-sm font-bold text-gray-700">Complaint ID</th>
                <th className="px-3 py-3 text-left text-sm font-bold text-gray-700">Description</th>
                <th className="px-3 py-3 text-left text-sm font-bold text-gray-700">Current Department</th>
                <th className="px-3 py-3 text-left text-sm font-bold text-gray-700">Priority</th>
                <th className="px-3 py-3 text-left text-sm font-bold text-gray-700">Status</th>
                <th className="px-3 py-3 text-left text-sm font-bold text-gray-700">Department</th>
                <th className="px-3 py-3 text-left text-sm font-bold text-gray-700">Staff</th>
                <th className="px-3 py-3 text-left text-sm font-bold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((complaint) => {
                const selected = selections[complaint.complaint_id] || { department: "", staff_id: "" };
                const availableStaff = staffByDepartment[selected.department] || [];

                return (
                  <tr key={complaint.complaint_id} className="border-b border-gray-200 align-top">
                    <td className="px-3 py-3 text-xs font-mono text-gray-600">{complaint.complaint_id}</td>
                    <td className="px-3 py-3 text-sm text-gray-700 max-w-sm truncate">{complaint.description}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{complaint.department || "Unclassified"}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{complaint.priority || "N/A"}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{complaint.status || "N/A"}</td>
                    <td className="px-3 py-3">
                      <select
                        value={selected.department}
                        onChange={(e) => updateSelection(complaint.complaint_id, "department", e.target.value)}
                        className="w-44 rounded border border-gray-300 px-2 py-1.5 text-sm"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={selected.staff_id}
                        onChange={(e) => updateSelection(complaint.complaint_id, "staff_id", e.target.value)}
                        className="w-52 rounded border border-gray-300 px-2 py-1.5 text-sm"
                      >
                        <option value="">Select Staff</option>
                        {availableStaff.map((member) => (
                          <option key={member.user_id} value={member.user_id}>
                            {member.name} ({member.email})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => assignComplaint(complaint.complaint_id)}
                        disabled={assigningId === complaint.complaint_id}
                        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {assigningId === complaint.complaint_id ? "Assigning..." : "Assign"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

