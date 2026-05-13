import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Layout from "../components/Layout";
import api from "../services/api";
import "./MyComplaints.css";
import { useLanguage } from "../context/LanguageContext";

const PAGE_SIZE = 10;

const formatDate = (rawDate) => {
  if (!rawDate) return "N/A";
  const dt = new Date(rawDate);
  if (Number.isNaN(dt.getTime())) return "N/A";
  return dt.toLocaleDateString();
};

const toStatusClass = (status) => {
  if (!status) return "Submitted";
  return String(status).replace(/\s+/g, "");
};

const shortenDescription = (text) => {
  const value = text || "No description available";
  return value.length > 80 ? `${value.substring(0, 80)}...` : value;
};

const localizeStatus = (value, t) => {
  if (value === "Submitted") return t("submitted");
  if (value === "In Progress") return t("in_progress");
  if (value === "Resolved") return t("resolved");
  if (value === "Pending") return t("pending");
  return value || t("submitted");
};

const localizePriority = (value, t) => {
  if (value === "Critical") return t("critical");
  if (value === "High") return t("high");
  if (value === "Medium") return t("medium");
  if (value === "Low") return t("low");
  return value || t("medium");
};

function MyComplaints() {
  const { language, t } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;

    const fetchComplaints = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/complaints/my");
        if (!mounted) return;
        setComplaints(Array.isArray(res.data?.complaints) ? res.data.complaints : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data?.error || t("failed_load_complaints"));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchComplaints();
    return () => {
      mounted = false;
    };
  }, [t]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return complaints;
    return complaints.filter((c) => (c.complaint_id || "").toLowerCase().includes(term));
  }, [complaints, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  if (loading) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl px-6 py-10 text-gray-600">{t("loading_my_complaints")}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{t("my_complaints_title")}</h1>
              <p className="text-gray-600">{t("my_complaints_subtitle")}</p>
            </div>
            <div className="w-full md:w-80">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_by_complaint_id")}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!error && filtered.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <p className="mb-4 text-lg font-semibold text-gray-700">
                {t("no_complaints_yet")}
              </p>
              <Link
                to="/complaint"
                className="inline-block rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700"
              >
                {t("submit_complaint")}
              </Link>
            </div>
          )}

          {!error && filtered.length > 0 && (
            <div className="table-wrapper">
              <table className="complaints-table">
                <thead>
                  <tr>
                    <th>{t("complaint_id_column")}</th>
                    <th>{t("department")}</th>
                    <th>{t("priority")}</th>
                    <th>{t("status")}</th>
                    <th>{t("date_submitted")}</th>
                    <th>{t("description")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((complaint, index) => {
                    const description =
                      complaint.description_original ||
                      complaint.description ||
                      complaint.description_english ||
                      t("no_description_available");

                    return (
                      <tr key={complaint.complaint_id || `${currentPage}-${index}`}>
                        <td className="font-mono">{complaint.complaint_id || t("na")}</td>
                        <td>{complaint.department || t("unclassified")}</td>
                        <td>{localizePriority(complaint.priority, t)}</td>
                        <td>
                          <span className={`status-badge ${toStatusClass(complaint.status)}`}>
                            {localizeStatus(complaint.status, t)}
                          </span>
                        </td>
                        <td>{formatDate(complaint.created_at)}</td>
                        <td>{shortenDescription(description)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > PAGE_SIZE && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("previous")}
              </button>
              <span className="text-sm text-gray-700">
                {t("page_of", { current: currentPage, total: totalPages })}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("next")}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default MyComplaints;
