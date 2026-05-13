import { useNavigate } from "react-router-dom";
import { Activity, BarChart3, ShieldCheck } from "lucide-react";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";

export default function Landing() {
  const navigate = useNavigate();
  const { language, selectedLanguage, setLanguage, t } = useLanguage();

  const features = [
    {
      icon: <BarChart3 className="text-blue-600" size={28} />,
      title: t("feature_smart_title"),
      description: t("feature_smart_desc"),
    },
    {
      icon: <Activity className="text-blue-600" size={28} />,
      title: t("feature_tracking_title"),
      description: t("feature_tracking_desc"),
    },
    {
      icon: <ShieldCheck className="text-blue-600" size={28} />,
      title: t("feature_transparent_title"),
      description: t("feature_transparent_desc"),
    },
  ];

  const steps = [
    {
      step: "01",
      title: t("how_step1_title"),
      desc: t("how_step1_desc"),
      color: "bg-blue-600",
    },
    {
      step: "02",
      title: t("how_step2_title"),
      desc: t("how_step2_desc"),
      color: "bg-indigo-600",
    },
    {
      step: "03",
      title: t("how_step3_title"),
      desc: t("how_step3_desc"),
      color: "bg-blue-500",
    },
  ];

  return (
    <Layout>
      <main className="bg-white text-gray-800">
        <section className="relative min-h-[85vh] overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white flex items-center justify-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)]" />
          <div className="pointer-events-none absolute top-20 right-20 w-72 h-72 rounded-full bg-blue-400 opacity-20 blur-3xl animate-pulse-glow" />
          <div className="pointer-events-none absolute bottom-20 left-20 w-72 h-72 rounded-full bg-indigo-400 opacity-20 blur-3xl animate-pulse-glow" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-300 opacity-5 blur-3xl" />

          <div className="absolute right-6 top-6 z-20">
            <label className="mr-2 text-sm font-semibold">{t("language")}</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-white/30 bg-white/20 px-3 py-2 text-sm text-white outline-none backdrop-blur-sm"
            >
              <option value="en" className="text-black">{t("english")}</option>
              <option value="ml" className="text-black">{t("malayalam")}</option>
            </select>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto text-center px-6 py-20">
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-5 py-1.5 text-sm font-medium tracking-wide uppercase text-blue-100 shadow-sm">
                <Activity className="animate-float inline-block" size={16} />
                {t("landing_badge")}
              </span>
            </div>

            <h1 className="animate-fade-in-delay mt-6 text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight" style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}>
              {t("landing_title_line1")}
              <br />
              <span className="text-blue-100">{t("landing_title_line2")}</span>
              <br />
              {t("landing_title_line3")}
            </h1>

            <p className="animate-fade-in-delay2 mt-6 text-lg md:text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto" style={language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}>
              {t("landing_subtitle")}
            </p>

            <div className="animate-fade-in-delay3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                {t("get_started")} -&gt;
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("learn-more");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto border border-white/40 text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition-all duration-300"
              >
                {t("learn_more")}
              </button>
            </div>

            <div className="mt-16 flex flex-col items-center gap-1 animate-bounce text-white/70">
              <span className="text-xs tracking-widest uppercase">{t("scroll")}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </section>

        <section id="learn-more" className="bg-gradient-to-b from-blue-50 to-white">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="text-center mb-12">
              <span className="inline-block rounded-full bg-blue-100 px-4 py-1 text-xs font-semibold tracking-widest uppercase text-blue-600 mb-3">
                {t("platform_features")}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">{t("everything_you_need")}</h2>
              <p className="mt-3 text-gray-500 max-w-xl mx-auto text-base leading-relaxed">{t("features_subtitle")}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature, i) => (
                <article
                  key={feature.title}
                  style={{ animationDelay: `${i * 0.15}s` }}
                  className="group rounded-2xl border border-blue-100 bg-white p-8 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl group-hover:bg-blue-100 transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-blue-700">{feature.title}</h3>
                  <p className="mt-3 text-gray-500 leading-relaxed text-sm">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="text-center mb-12">
              <span className="inline-block rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold tracking-widest uppercase text-indigo-600 mb-3">
                {t("how_it_works")}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">{t("simple_fast_transparent")}</h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3 text-center">
              {steps.map((item) => (
                <div key={item.step} className="group flex flex-col items-center gap-4">
                  <div className={`${item.color} flex h-14 w-14 items-center justify-center rounded-full text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.12),transparent)]" />
          <div className="relative mx-auto max-w-4xl px-6 py-16 text-center">
            <h3 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">{t("cta_title")}</h3>
            <p className="mx-auto mt-4 max-w-2xl text-base md:text-lg leading-relaxed text-blue-100">{t("cta_subtitle")}</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-8 inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              {t("get_started_today")} -&gt;
            </button>
          </div>
        </section>

        <footer className="border-t border-blue-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div>
              <p className="font-semibold text-gray-700 text-base">{t("footer_title")}</p>
              <p className="mt-0.5">{t("footer_subtitle")}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              {t("all_systems_operational")}
            </div>
          </div>
        </footer>
      </main>
    </Layout>
  );
}
