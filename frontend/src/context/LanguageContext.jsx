import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { translations } from "../i18n/translations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const location = useLocation();
  const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem("language") || "en"
  );

  const isEnglishOnlyPath =
    location.pathname.startsWith("/staff") || location.pathname.startsWith("/admin");

  const language = isEnglishOnlyPath ? "en" : selectedLanguage;

  useEffect(() => {
    localStorage.setItem("language", selectedLanguage);
  }, [selectedLanguage]);

  const value = useMemo(() => {
    const t = (key, params = {}) => {
      const langDict = translations[language] || translations.en;
      const fallback = translations.en[key] || key;
      const template = langDict[key] || fallback;
      return Object.keys(params).reduce(
        (acc, pKey) => acc.replaceAll(`{${pKey}}`, String(params[pKey])),
        template
      );
    };

    return {
      language,
      selectedLanguage,
      setLanguage: setSelectedLanguage,
      t,
    };
  }, [language, selectedLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}

