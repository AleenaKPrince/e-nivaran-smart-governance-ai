import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUserRole, logout } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const [role, setRole] = useState(null);

  const syncAuthState = () => {
    setRole(getCurrentUserRole());
  };

  useEffect(() => {
    syncAuthState();
  }, [location.pathname]);

  useEffect(() => {
    const onStorage = () => syncAuthState();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isAuthenticated = Boolean(role);
  const showRoleBadge = role === "admin" || role === "staff";
  const roleLabel = showRoleBadge ? role.charAt(0).toUpperCase() + role.slice(1) : "";

  const navLinksByRole = {
    admin: [
      { to: "/admin/dashboard", label: "Admin Dashboard" },
      { to: "/admin/settings", label: "System Settings" },
    ],
    staff: [{ to: "/staff/dashboard", label: "Staff Dashboard" }],
    citizen: [
      { to: "/complaint", label: t("submit_complaint") },
      { to: "/my-complaints", label: t("my_complaints") },
      { to: "/status", label: t("track_complaint") },
      { to: "/chatbot", label: t("chatbot_assistance") },
    ],
  };

  const activeLinks = role ? navLinksByRole[role] || [] : [];

  return (
    <nav className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold transition duration-300 hover:text-blue-100">
            {t("app_name")}
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {activeLinks.map((link) => (
              <Link key={link.to} to={link.to} className="font-medium transition duration-300 hover:text-blue-100">
                {link.label}
              </Link>
            ))}

            {!isAuthenticated ? (
              <button
                onClick={() => navigate("/login")}
                className="rounded-lg bg-white px-4 py-2 font-bold text-blue-600 transition duration-300 hover:bg-blue-50"
              >
                {t("login")}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {showRoleBadge && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    {roleLabel}
                  </span>
                )}
                <button
                  onClick={logout}
                  className="rounded-lg bg-white px-4 py-2 font-bold text-red-600 transition duration-300 hover:bg-red-50"
                >
                  {t("logout")}
                </button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            {!isAuthenticated ? (
              <button
                onClick={() => navigate("/login")}
                className="rounded bg-white px-3 py-1 text-sm font-bold text-blue-600 transition duration-300 hover:bg-blue-50"
              >
                {t("login")}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {showRoleBadge && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                    {roleLabel}
                  </span>
                )}
                <button
                  onClick={logout}
                  className="rounded bg-white px-3 py-1 text-sm font-bold text-red-600 transition duration-300 hover:bg-red-50"
                >
                  {t("logout")}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 pb-2 md:hidden">
          {activeLinks.map((link) => (
            <Link key={link.to} to={link.to} className="rounded px-4 py-2 text-sm transition duration-300 hover:bg-blue-700">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
