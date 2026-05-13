import { useState } from "react";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

function ForgotPassword() {
  const { language, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError(t("email_required"));
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/citizen/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setMessage(res.data.message || t("reset_link_request_submitted"));
    } catch (err) {
      setError(err.response?.data?.error || t("reset_link_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-700 to-blue-500 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-gray-800">{t("forgot_password_title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("forgot_password_subtitle")}</p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
          style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}
        >
          <input
            type="email"
            placeholder={t("citizen_email_placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}

          <button
            type="submit"
            className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? t("sending") : t("send_reset_link")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
