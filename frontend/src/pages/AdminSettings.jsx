import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      <span className="text-sm font-semibold text-gray-700">{label}</span>
    </label>
  );
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [settings, setSettings] = useState(null);

  const departmentOptions = [
    "Health",
    "Electricity",
    "Local Self Government",
    "Public Works",
    "Transport",
    "Fire and Rescue",
    "Police",
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/admin/settings");
      setSettings(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        ai_confidence_threshold: Number(settings.ai_confidence_threshold),
        enable_ai_routing: Boolean(settings.enable_ai_routing),
        enable_rule_routing: Boolean(settings.enable_rule_routing),
        auto_assign: Boolean(settings.auto_assign),
        default_unclassified_department: settings.default_unclassified_department,
        allow_reassignment: Boolean(settings.allow_reassignment),
      };

      const res = await api.post("/admin/settings", payload);
      setSettings((prev) => ({ ...prev, ...res.data }));
      setMessage("Settings saved successfully");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 text-gray-600">Loading settings...</div>
      </Layout>
    );
  }

  if (!settings) {
    return (
      <Layout>
        <div className="p-8 text-red-600">Unable to load settings.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">System Settings</h1>

        {error && <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}

        <section className="mb-6 rounded-2xl bg-white p-6 shadow border border-blue-100">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Routing Controls</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">AI confidence threshold</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={settings.ai_confidence_threshold}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    ai_confidence_threshold: e.target.value,
                  }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <Toggle
                label="Enable AI routing"
                checked={Boolean(settings.enable_ai_routing)}
                onChange={(value) => setSettings((prev) => ({ ...prev, enable_ai_routing: value }))}
              />
              <Toggle
                label="Enable Rule-based routing"
                checked={Boolean(settings.enable_rule_routing)}
                onChange={(value) => setSettings((prev) => ({ ...prev, enable_rule_routing: value }))}
              />
              <Toggle
                label="Enable Auto-assignment"
                checked={Boolean(settings.auto_assign)}
                onChange={(value) => setSettings((prev) => ({ ...prev, auto_assign: value }))}
              />
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-6 shadow border border-blue-100">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Default Handling</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">Default department for Unclassified</label>
              <select
                value={settings.default_unclassified_department || ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    default_unclassified_department: e.target.value,
                  }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-7">
              <Toggle
                label="Allow manual reassignment"
                checked={Boolean(settings.allow_reassignment)}
                onChange={(value) => setSettings((prev) => ({ ...prev, allow_reassignment: value }))}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow border border-blue-100">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Save Settings</h2>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="rounded bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </section>
      </div>
    </Layout>
  );
}

