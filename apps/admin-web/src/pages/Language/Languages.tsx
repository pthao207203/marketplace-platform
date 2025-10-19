// src/pages/Language/Languages.tsx
import React from "react";
import { useLanguage } from "../../i18n/language";

const Languages: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="p-6">
      <div className="mt-6">
        <button
          className={`px-4 py-2 rounded ${
            language === "vi" ? "bg-orange-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setLanguage("vi")}
        >
          Việt Nam
        </button>
        <button
          className={`px-4 py-2 rounded ml-4 ${
            language === "en" ? "bg-orange-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setLanguage("en")}
        >
          English
        </button>
      </div>
    </div>
  );
};

export default Languages;
