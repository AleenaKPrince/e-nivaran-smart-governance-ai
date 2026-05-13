import { useState } from "react";
import { Bot, UserCog, Wrench } from "lucide-react";
import api from "../services/api";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";

const localizeStatus = (value, t) => {
  if (value === "Submitted") return t("submitted");
  if (value === "In Progress") return t("in_progress");
  if (value === "Resolved") return t("resolved");
  if (value === "Pending") return t("pending");
  return value || t("na");
};

const localizePriority = (value, t) => {
  if (value === "Critical") return t("critical");
  if (value === "High") return t("high");
  if (value === "Medium") return t("medium");
  if (value === "Low") return t("low");
  return value || t("na");
};

function TrackComplaint() {
  const { language, t } = useLanguage();
  const badgeClass = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const [id, setId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkStatus = async () => {
    if (!id.trim()) {
      setError(t("enter_complaint_id_error"));
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/complaint/${id}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || t("complaint_not_found"));
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      checkStatus();
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

  const getRoutingColor = (mode) => {
    switch (mode) {
      case "MANUAL":
        return "bg-purple-100 text-purple-800";
      case "RULE":
        return "bg-orange-100 text-orange-800";
      case "AI":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoutingIcon = (mode) => {
    switch (mode) {
      case "MANUAL":
        return <UserCog size={14} />;
      case "RULE":
        return <Wrench size={14} />;
      case "AI":
        return <Bot size={14} />;
      default:
        return <Bot size={14} />;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-8" style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">{t("track_title")}</h1>
            <p className="text-gray-600 text-lg">{t("track_subtitle")}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-blue-100" style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">{t("complaint_id")}</label>
                <input
                  className="w-full border-2 border-gray-200 p-4 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 bg-gray-50"
                  placeholder={t("enter_complaint_id")}
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
              </div>

              {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

              <button
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition ${
                  loading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl"
                }`}
                onClick={checkStatus}
                disabled={loading || !id.trim()}
              >
                {loading ? t("fetching_status") : t("track_complaint")}
              </button>
            </div>
          </div>

          {data && (
            <div className="space-y-6" style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}>
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">{t("complaint_details")}</h2>
                  <p className="text-xs text-gray-500 font-mono">
                    {t("complaint_id")}: {data.complaint_id}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <p className="text-sm font-bold text-gray-600 mb-2">{t("status")}</p>
                    <span className={`${badgeClass} ${getStatusColor(data.status)}`}>
                      {localizeStatus(data.status, t)}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <p className="text-sm font-bold text-gray-600 mb-2">{t("priority")}</p>
                    <span className={`${badgeClass} ${getPriorityColor(data.priority)}`}>
                      {localizePriority(data.priority, t)}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <p className="text-sm font-bold text-gray-600 mb-2">{t("department")}</p>
                    <p className="text-lg font-bold text-gray-800">{data.department}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <p className="text-sm font-bold text-gray-600 mb-2">{t("routing_mode")}</p>
                    <span className={`${badgeClass} ${getRoutingColor(data.routing_mode || "AI")}`}>
                      {getRoutingIcon(data.routing_mode || "AI")}
                      <span className="ml-1">{data.routing_mode || "AI"}</span>
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  {(() => {
                    const steps = ["Submitted", "In Progress", "Resolved"];
                    const idx = Math.max(0, steps.indexOf(data.status));
                    return (
                      <div className="flex items-center justify-between gap-2">
                        {steps.map((s, i) => (
                          <div key={s} className="flex-1 flex items-center">
                            <div className={`h-2 rounded-full w-full ${i <= idx ? "bg-blue-600" : "bg-gray-200"}`}></div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>{t("submitted")}</span>
                    <span>{t("in_progress")}</span>
                    <span>{t("resolved")}</span>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <p className="text-sm font-bold text-gray-600 mb-3">{t("description")}</p>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed">{data.description}</p>
                </div>
              </div>

              {data.history && data.history.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">{t("status_timeline")}</h3>

                  <div className="space-y-4">
                    {data.history.map((entry, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-4 h-4 bg-blue-600 rounded-full mt-2"></div>
                          {idx !== data.history.length - 1 && <div className="w-0.5 h-12 bg-gray-300"></div>}
                        </div>

                        <div className="pb-4 flex-1">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-bold text-gray-800">
                                {entry.new_status ? localizeStatus(entry.new_status, t) : entry.action || t("update")}
                              </p>
                              <span className="text-xs text-gray-500">
                                {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : t("na")}
                              </span>
                            </div>
                            {entry.old_status && (
                              <p className="text-sm text-gray-600">
                                {t("changed_from_to", {
                                  old: localizeStatus(entry.old_status, t),
                                  new: localizeStatus(entry.new_status, t),
                                })}
                              </p>
                            )}
                            {entry.action && <p className="text-sm text-gray-600">{entry.action}</p>}
                            {entry.updated_by && (
                              <p className="text-xs text-gray-500 mt-2">
                                {t("updated_by")}: {entry.updated_by}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
                <p className="text-xs text-gray-600">
                  <strong>{t("created")}:</strong> {data.created_at ? new Date(data.created_at).toLocaleString() : t("na")}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <strong>{t("last_updated")}:</strong> {data.updated_at ? new Date(data.updated_at).toLocaleString() : t("na")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default TrackComplaint;
