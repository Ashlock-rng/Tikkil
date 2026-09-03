import { useState } from "react";
import { Globe, Check, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function LanguageSelector() {
  const { lang, setLang, languages, t } = useI18n();
  const [open, setOpen] = useState(false);

  const current = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
      >
        <Globe size={15} />
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.name}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 max-h-72 overflow-y-auto bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl z-50 scrollbar-hide">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-sm font-semibold text-white">{t("language")}</span>
              <button onClick={() => setOpen(false)}>
                <X size={16} className="text-gray-400" />
              </button>
            </div>
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors ${
                  l.code === lang ? "bg-white/5" : ""
                }`}
              >
                <span className="text-lg">{l.flag}</span>
                <span className="flex-1 text-sm text-gray-200">{l.name}</span>
                {l.code === lang && <Check size={16} className="text-[#00d9a3]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
