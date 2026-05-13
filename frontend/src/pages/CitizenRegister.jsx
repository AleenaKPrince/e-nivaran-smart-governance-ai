import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

function CitizenRegister() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError(t("fill_all_fields"));
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(t("passwords_mismatch"));
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/citizen/register", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || t("registration_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-700 to-blue-500 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-gray-800">{t("citizen_register_title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("citizen_register_subtitle")}</p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
          style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}
        >
          <input
            type="text"
            placeholder={t("full_name")}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />

          <input
            type="email"
            placeholder={t("citizen_email_placeholder")}
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />

          <input
            type="password"
            placeholder={t("password")}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />

          <input
            type="password"
            placeholder={t("confirm_password")}
            value={form.confirmPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? t("registering") : t("register")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CitizenRegister;
