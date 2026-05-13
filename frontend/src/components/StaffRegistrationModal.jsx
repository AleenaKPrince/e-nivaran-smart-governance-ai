import { useState } from "react";
import { registerStaff } from "../services/api";

const DEPARTMENTS = [
  "Health",
  "Electricity",
  "Local Self Government",
  "Public Works",
  "Transport",
  "Fire and Rescue",
  "Police",
];

export default function StaffRegistrationModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ================================================================
  // VALIDATION FUNCTIONS
  // ================================================================
  const validateForm = () => {
    // Check required fields
    if (!form.name.trim()) {
      setError("Name is required");
      return false;
    }

    if (!form.email.trim()) {
      setError("Email is required");
      return false;
    }

    // Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(form.email)) {
      setError("Invalid email format");
      return false;
    }

    if (!form.password) {
      setError("Password is required");
      return false;
    }

    // Password strength validation
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (!/[A-Z]/.test(form.password)) {
      setError("Password must contain at least one uppercase letter");
      return false;
    }

    if (!/\d/.test(form.password)) {
      setError("Password must contain at least one number");
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (!form.department) {
      setError("Department is required");
      return false;
    }

    return true;
  };

  // ================================================================
  // HANDLE SUBMIT
  // ================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Check if user has token
      const userData = localStorage.getItem("user");
      if (!userData) {
        setError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await registerStaff({
        name: form.name,
        email: form.email,
        password: form.password,
        department: form.department,
      });

      setSuccess(true);
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        department: "",
      });

      // Show success message for 2 seconds then close
      setTimeout(() => {
        onSuccess?.(response.data);
        handleClose();
      }, 2000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Failed to register staff";
      setError(errorMessage);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // HANDLE CLOSE
  // ================================================================
  const handleClose = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      department: "",
    });
    setError("");
    setSuccess(false);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-blue-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">Register New Staff</h2>
        </div>

        {/* Body */}
        <div className="p-6">
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold">✓ Staff registered successfully!</p>
              <p className="text-green-700 text-sm mt-1">
                They can now log in with their email and password.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">✗ Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g., John Doe"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading || success}
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g., john@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading || success}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Min 6 chars, 1 uppercase, 1 number"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading || success}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must contain: uppercase letter, number, 6+ characters
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading || success}
              />
            </div>

            {/* Department Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department
              </label>
              <select
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                disabled={loading || success}
              >
                <option value="">-- Select Department --</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Registering..." : "Register Staff"}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          <p className="text-xs text-gray-600">
            ℹ️ Staff members will receive an email with login instructions.
            They can immediately log in with their email and password.
          </p>
        </div>
      </div>
    </div>
  );
}

