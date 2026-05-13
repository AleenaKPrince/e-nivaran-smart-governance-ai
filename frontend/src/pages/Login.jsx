import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";

function Login() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  const [citizenForm, setCitizenForm] = useState({ email: "", password: "" });
  const [staffForm, setStaffForm] = useState({ email: "", password: "" });
  const [adminForm, setAdminForm] = useState({ email: "", password: "" });

  const [citizenLoading, setCitizenLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const [citizenError, setCitizenError] = useState("");
  const [staffError, setStaffError] = useState("");
  const [adminError, setAdminError] = useState("");

  const handleCitizenLogin = async () => {
    const email = citizenForm.email.trim().toLowerCase();
    const password = citizenForm.password;

    if (!email || !password) {
      setCitizenError(t("citizen_login_missing_fields"));
      return;
    }

    setCitizenLoading(true);
    setCitizenError("");

    try {
      const res = await api.post("/auth/citizen/login", { email, password });

      localStorage.removeItem("user");
      localStorage.removeItem("token");

      localStorage.setItem("citizen_email", res.data.email || email);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          token: res.data.token,
          role: "citizen",
          email: res.data.email || email,
          name: res.data.name,
        })
      );

      navigate("/complaint");
    } catch (err) {
      setCitizenError(err.response?.data?.error || t("citizen_login_failed"));
    } finally {
      setCitizenLoading(false);
    }
  };

  const handleRoleLogin = async ({ role, email, password, setLoading, setError }) => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/login", { email, password });

      if (res.data.role !== role) {
        setError(`Invalid credentials for ${role} login`);
        return;
      }

      localStorage.removeItem("citizen_email");
      localStorage.setItem(
        "user",
        JSON.stringify({
          token: res.data.token,
          user_id: res.data.user_id,
          role: res.data.role,
          department: res.data.department,
        })
      );

      if (role === "staff") {
        navigate("/staff/dashboard");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60";

  const btnCls =
    "w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-blue-700 to-blue-500 p-4">
      <div className="flex w-full max-w-[920px] overflow-hidden rounded-2xl shadow-2xl flex-col md:flex-row">
        <aside className="order-first md:order-last flex w-full md:w-[40%] flex-col items-center justify-center bg-gradient-to-b from-blue-600 to-blue-800 px-8 py-12 text-white">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/25 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-white">
              <path
                fillRule="evenodd"
                d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h1 className="text-center text-3xl font-extrabold tracking-tight">Smart Governance</h1>
          <p className="mt-2 text-center text-sm font-medium text-blue-200">AI-powered civic grievance system</p>
          <div className="my-6 h-px w-16 bg-white/30" />
          <p className="text-center text-sm leading-relaxed text-blue-100">
            Submit complaints, track progress, and access dashboards securely.
          </p>
        </aside>

        <main className="order-last md:order-first flex w-full md:w-[60%] flex-col bg-gray-50">
          <div className="border-b border-gray-200 bg-white px-8 py-5">
            <h2 className="text-xl font-bold text-gray-800">Secure Access Portal</h2>
            <p className="mt-0.5 text-sm text-gray-500">Select your access level to continue</p>
          </div>

          <div className="scroll-smooth overflow-y-auto max-h-[560px] px-8 py-6 space-y-5">
            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-shadow duration-200 hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-800">{t("citizen_login_title")}</h3>
                  <p className="text-xs text-gray-500">{t("citizen_login_subtitle")}</p>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="email"
                  value={citizenForm.email}
                  onChange={(e) => setCitizenForm((prev) => ({ ...prev, email: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleCitizenLogin()}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t("citizen_email_placeholder")}
                  style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}
                  disabled={citizenLoading}
                />

                <input
                  type="password"
                  value={citizenForm.password}
                  onChange={(e) => setCitizenForm((prev) => ({ ...prev, password: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleCitizenLogin()}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t("citizen_password_placeholder")}
                  style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}
                  disabled={citizenLoading}
                />

                {citizenError && <p className="text-xs text-red-600">{citizenError}</p>}

                <button
                  onClick={handleCitizenLogin}
                  disabled={citizenLoading}
                  className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {citizenLoading ? t("please_wait") : t("login_as_citizen")}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/citizen/register")}
                  className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  {t("register_new_citizen")}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/citizen/forgot-password")}
                  className="text-sm text-blue-700 hover:underline"
                >
                  {t("forgot_password")}
                </button>
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-shadow duration-200 hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-800">Staff Login</h3>
                  <p className="text-xs text-gray-500">Access your assigned dashboard and complaint workflow</p>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={inputCls}
                  placeholder="staff@example.com"
                  disabled={staffLoading}
                />

                <input
                  type="password"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, password: e.target.value }))}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    handleRoleLogin({
                      role: "staff",
                      email: staffForm.email,
                      password: staffForm.password,
                      setLoading: setStaffLoading,
                      setError: setStaffError,
                    })
                  }
                  className={inputCls}
                  placeholder="Enter password"
                  disabled={staffLoading}
                />

                {staffError && <p className="text-xs text-red-600">{staffError}</p>}

                <button
                  onClick={() =>
                    handleRoleLogin({
                      role: "staff",
                      email: staffForm.email,
                      password: staffForm.password,
                      setLoading: setStaffLoading,
                      setError: setStaffError,
                    })
                  }
                  disabled={staffLoading}
                  className={btnCls}
                >
                  {staffLoading ? "Logging in..." : "Login as Staff"}
                </button>
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition-shadow duration-200 hover:shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-gray-800">Admin Login</h3>
                  <p className="text-xs text-gray-500">Manage dashboards, reports, and governance settings</p>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={inputCls}
                  placeholder="admin@example.com"
                  disabled={adminLoading}
                />

                <input
                  type="password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm((prev) => ({ ...prev, password: e.target.value }))}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    handleRoleLogin({
                      role: "admin",
                      email: adminForm.email,
                      password: adminForm.password,
                      setLoading: setAdminLoading,
                      setError: setAdminError,
                    })
                  }
                  className={inputCls}
                  placeholder="Enter password"
                  disabled={adminLoading}
                />

                {adminError && <p className="text-xs text-red-600">{adminError}</p>}

                <button
                  onClick={() =>
                    handleRoleLogin({
                      role: "admin",
                      email: adminForm.email,
                      password: adminForm.password,
                      setLoading: setAdminLoading,
                      setError: setAdminError,
                    })
                  }
                  disabled={adminLoading}
                  className={btnCls}
                >
                  {adminLoading ? "Logging in..." : "Login as Admin"}
                </button>
              </div>
            </section>
          </div>

          <div className="border-t border-gray-200 bg-white px-8 py-3 text-center text-xs text-gray-400">
            {new Date().getFullYear()} Smart Governance Platform
          </div>
        </main>
      </div>
    </div>
  );
}

export default Login;
