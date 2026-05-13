import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

function ResetPassword() {
  const { language, t } = useLanguage();
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasToken = useMemo(() => Boolean(token && token.trim()), [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!hasToken) {
      setError(t("invalid_reset_link"));
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError(t("both_passwords_required"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("passwords_mismatch"));
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error || t("reset_failed"));
        return;
      }

      setSuccess(data.message || t("password_reset_success"));
      setTimeout(() => navigate("/login"), 1500);
    } catch (_err) {
      setError(t("unable_reach_server"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-700 to-blue-500 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-gray-800">{t("reset_password_title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("reset_password_subtitle")}</p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
          style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}
        >
          <input
            type="password"
            placeholder={t("new_password")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500"
            disabled={loading || !hasToken}
          />

          <input
            type="password"
            placeholder={t("confirm_password")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-blue-500"
            disabled={loading || !hasToken}
          />

          {!hasToken && <p className="text-sm text-red-600">{t("invalid_reset_link")}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success} {t("redirecting_login")}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 p-3 text-white transition hover:bg-blue-700 disabled:opacity-60"
            disabled={loading || !hasToken}
          >
            {loading ? t("resetting") : t("reset_password")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
