import en from "@/locales/en/translation.json";
import pt from "@/locales/pt/translation.json";
import sp from "@/locales/sp/translation.json";

i18n.init({
  fallbackLng: "en",
  resources: {
    en: { translation: en },
    pt: { translation: pt },
    sp: { translation: sp },
  },
});
