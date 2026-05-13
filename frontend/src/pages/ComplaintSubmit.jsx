import { useState } from "react";
import { Activity, Building2, Check, CheckCircle2, Copy, Zap } from "lucide-react";
import api from "../services/api";
import Layout from "../components/Layout";
import { getCitizenEmail, getUser } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";

function ComplaintSubmit() {
  const { language, t } = useLanguage();
  const [description, setDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const submitComplaint = async () => {
    if (!description.trim()) {
      setError(t("complaint_missing_description"));
      return;
    }

    try {
      setLoading(true);
      setError("");

      const citizenEmail = getCitizenEmail();
      const user = getUser();
      const userId = citizenEmail || user?.user_id;
      if (!userId) {
        setError(t("complaint_login_required"));
        setLoading(false);
        return;
      }

      const res = await api.post("/complaint", {
        user_id: userId,
        description,
      });

      setResult(res.data);
      setDescription("");
    } catch (err) {
      setError(err.response?.data?.error || t("complaint_submit_failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      submitComplaint();
    }
  };

  const copyComplaintId = async () => {
    try {
      await navigator.clipboard.writeText(result.complaint_id);
      setCopied(true);
      setCopyError("");
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      setCopyError(t("copy_failed"));
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="max-w-3xl mx-auto px-6 mb-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
            <div className="mb-8" style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}>
              <h1 className="text-4xl font-bold text-gray-800 mb-3">{t("complaint_submit_title")}</h1>
              <p className="text-gray-600 text-lg">{t("complaint_submit_subtitle")}</p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {!result ? (
              <div className="space-y-6" style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">{t("describe_complaint")}</label>
                  <textarea
                    className="w-full border-2 border-gray-200 p-4 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 resize-none bg-gray-50"
                    rows="8"
                    placeholder={t("complaint_textarea_placeholder")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-2">{t("complaint_tip")}</p>
                </div>

                <button
                  className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition transform hover:scale-105 ${
                    loading
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl"
                  }`}
                  onClick={submitComplaint}
                  disabled={loading || !description.trim()}
                >
                  {loading ? t("submitting_complaint") : t("submit_complaint")}
                </button>
              </div>
            ) : (
              <div className="space-y-6" style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}>
                <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-8 shadow-sm">
                  <div className="text-center mb-6">
                    <div className="mb-4 inline-flex items-center justify-center rounded-full bg-green-100 p-3">
                      <CheckCircle2 className="text-green-700" size={44} />
                    </div>
                    <h2 className="text-3xl font-bold text-green-700 mb-2">{t("complaint_submitted_success")}</h2>
                    <p className="text-gray-600">{t("complaint_registered_message")}</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 space-y-4 mb-6 border border-green-100">
                    <div className="border-l-4 border-green-600 pl-4">
                      <p className="text-sm text-gray-600">{t("complaint_id")}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-2xl font-bold text-gray-800 font-mono">{result.complaint_id}</p>
                        <button
                          onClick={copyComplaintId}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all duration-300 ${
                            copied
                              ? "bg-green-100 text-green-700 border border-green-400"
                              : "bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 active:scale-95"
                          }`}
                          title={t("copy")}
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          <span className="text-sm">{copied ? t("copied") : t("copy")}</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{t("save_id_note")}</p>
                      {copyError && <p className="mt-2 text-xs text-red-600">{copyError}</p>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">{t("department")}</p>
                        <p className="text-xl font-bold text-blue-700">{result.department}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">{t("priority_level")}</p>
                        <p
                          className={`text-xl font-bold ${
                            result.priority === "Critical"
                              ? "text-red-700"
                              : result.priority === "High"
                              ? "text-orange-700"
                              : result.priority === "Medium"
                              ? "text-blue-700"
                              : "text-green-700"
                          }`}
                        >
                          {result.priority}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setResult(null);
                        setDescription("");
                      }}
                      className="py-3 px-6 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow"
                    >
                      {t("submit_another_complaint")}
                    </button>
                    <a
                      href={`/status?id=${result.complaint_id}`}
                      className="py-3 px-6 rounded-lg font-bold bg-gray-700 text-white hover:bg-gray-800 transition text-center shadow"
                    >
                      {t("track_this_complaint")}
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 py-16 px-6 border-t border-gray-100">
          <div className="max-w-6xl mx-auto" style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}>
            <h2 className="text-4xl font-bold text-center text-gray-800 mb-16">{t("how_complaint_handled")}</h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition transform hover:-translate-y-2 border border-blue-100">
                <div className="feature-icon mb-4">
                  <Activity className="text-blue-600" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{t("feature_realtime_tracking")}</h3>
                <p className="text-gray-600 leading-relaxed">{t("feature_realtime_tracking_desc")}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition transform hover:-translate-y-2 border border-blue-100">
                <div className="feature-icon mb-4">
                  <Zap className="text-blue-600" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{t("feature_priority_routing")}</h3>
                <p className="text-gray-600 leading-relaxed">{t("feature_priority_routing_desc")}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition transform hover:-translate-y-2 border border-blue-100">
                <div className="feature-icon mb-4">
                  <Building2 className="text-blue-600" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{t("feature_department_handling")}</h3>
                <p className="text-gray-600 leading-relaxed">{t("feature_department_handling_desc")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-16" style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}>
          <div className="bg-blue-50 rounded-2xl p-8 border-2 border-blue-200 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{t("what_happens_next")}</h3>
            <div className="space-y-4 text-gray-700">
              <div className="flex gap-4">
                <span className="font-bold text-blue-600 text-xl flex-shrink-0">1.</span>
                <p>
                  <strong>{t("step_submission")}</strong> {t("step_submission_desc")}
                </p>
              </div>
              <div className="flex gap-4">
                <span className="font-bold text-blue-600 text-xl flex-shrink-0">2.</span>
                <p>
                  <strong>{t("step_classification")}</strong> {t("step_classification_desc")}
                </p>
              </div>
              <div className="flex gap-4">
                <span className="font-bold text-blue-600 text-xl flex-shrink-0">3.</span>
                <p>
                  <strong>{t("step_routing")}</strong> {t("step_routing_desc")}
                </p>
              </div>
              <div className="flex gap-4">
                <span className="font-bold text-blue-600 text-xl flex-shrink-0">4.</span>
                <p>
                  <strong>{t("step_resolution")}</strong> {t("step_resolution_desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ComplaintSubmit;
