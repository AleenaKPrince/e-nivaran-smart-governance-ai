import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import { useLanguage } from "../context/LanguageContext";

const prettyIntent = (intent) => {
  if (!intent) return "";
  return intent.replaceAll("_", " ");
};

function Chatbot() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const sessionIdRef = useRef(
    (() => {
      const existing = localStorage.getItem("chatbot_session_id");
      if (existing) return existing;
      const created = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem("chatbot_session_id", created);
      return created;
    })()
  );

  const defaultSuggestions = [t("submit_complaint"), t("check_status"), t("help")];

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      text: t("chatbot_welcome"),
      sender: "bot",
      timestamp: new Date(),
      intent: "GREETING",
      language: "en",
    },
  ]);
  const [input, setInput] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState(() => localStorage.getItem("chatbot_language") || "auto");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState(defaultSuggestions);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages((prev) => {
      if (!prev.length || prev[0].id !== "welcome") return prev;
      const next = [...prev];
      next[0] = { ...next[0], text: t("chatbot_welcome") };
      return next;
    });
    setSuggestions((prev) => (prev.length ? prev : defaultSuggestions));
  }, [t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageOverride = null) => {
    const userMessage = (messageOverride ?? input).trim();
    if (!userMessage) return;

    const userMsg = {
      id: Date.now(),
      text: userMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/chatbot", {
        message: userMessage,
        session_id: sessionIdRef.current,
        language: preferredLanguage === "auto" ? undefined : preferredLanguage,
      });

      const botMsg = {
        id: Date.now() + 1,
        text: res.data.response || t("chatbot_no_response"),
        sender: "bot",
        timestamp: new Date(),
        intent: res.data.intent || "UNKNOWN",
        language: res.data.language || preferredLanguage,
      };

      setMessages((prev) => [...prev, botMsg]);
      setSuggestions(res.data.suggestions?.length ? res.data.suggestions : defaultSuggestions);
    } catch (_err) {
      setError(t("chatbot_error"));
      const errorMsg = {
        id: Date.now() + 1,
        text: t("chatbot_fallback_error"),
        sender: "bot",
        timestamp: new Date(),
        intent: "ERROR",
        language: "en",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) {
        sendMessage();
      }
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleLanguage = (lang) => {
    setPreferredLanguage(lang);
    localStorage.setItem("chatbot_language", lang);
  };

  const handleSuggestionClick = (suggestion) => {
    if ([t("submit_complaint"), "Submit Complaint"].includes(suggestion)) {
      navigate("/complaint");
      return;
    }

    if ([t("check_status"), "Check Status"].includes(suggestion)) {
      navigate("/status");
      return;
    }

    if ([t("help"), "Help"].includes(suggestion)) {
      sendMessage(preferredLanguage === "ml" ? t("help") : "help");
      return;
    }

    if ([t("cancel"), "Cancel"].includes(suggestion)) {
      sendMessage(preferredLanguage === "ml" ? t("cancel") : "cancel");
      return;
    }

    if ([t("confirm"), "Confirm"].includes(suggestion)) {
      sendMessage(preferredLanguage === "ml" ? t("confirm") : "confirm");
      return;
    }

    if ([t("enter_complaint_id_suggestion"), "Enter Complaint ID"].includes(suggestion)) {
      sendMessage(preferredLanguage === "ml" ? t("check_status") : "check status");
      return;
    }

    if ([t("call_emergency"), "Call Emergency"].includes(suggestion)) {
      sendMessage(preferredLanguage === "ml" ? t("call_emergency") : "emergency");
      return;
    }

    setInput(suggestion);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
        <div className="max-w-2xl mx-auto px-6 h-screen flex flex-col">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">{t("chatbot_title")}</h1>
            <p className="text-gray-600">{t("chatbot_subtitle")}</p>
            <div className="mt-3 inline-flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleLanguage("auto")}
                className={`px-3 py-1 text-sm ${preferredLanguage === "auto" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
              >
                {t("auto")}
              </button>
              <button
                type="button"
                onClick={() => toggleLanguage("en")}
                className={`px-3 py-1 text-sm ${preferredLanguage === "en" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
              >
                {t("english")}
              </button>
              <button
                type="button"
                onClick={() => toggleLanguage("ml")}
                className={`px-3 py-1 text-sm ${preferredLanguage === "ml" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
              >
                {t("malayalam")}
              </button>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-lg shadow-lg p-6 overflow-y-auto mb-6 flex flex-col">
            <div className="flex-1 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-800 rounded-bl-none"
                    }`}
                    style={msg.language === "ml" ? { fontFamily: "'Noto Sans Malayalam', 'Nirmala UI', sans-serif" } : undefined}
                  >
                    {msg.sender === "bot" && msg.intent && (
                      <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 opacity-75">{prettyIntent(msg.intent)}</p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                    <span className={`text-xs block mt-2 ${msg.sender === "user" ? "text-blue-100" : "text-gray-500"}`}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-lg rounded-bl-none">
                    <div className="flex gap-2 items-center">
                      <span className="animate-pulse">...</span>
                      <span className="text-xs text-gray-500">{t("assistant_typing")}</span>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-3">
              <div className="flex gap-3">
                <textarea
                  className="flex-1 border-2 border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 resize-none"
                  placeholder={t("chatbot_placeholder")}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  rows="3"
                />
                <button
                  className={`px-6 py-3 rounded-lg font-bold transition flex-shrink-0 h-fit ${
                    loading || !input.trim()
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl"
                  }`}
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                >
                  {loading ? <span className="animate-spin">...</span> : <span>{t("send")}</span>}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-500">{t("press_enter_hint")}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Chatbot;
