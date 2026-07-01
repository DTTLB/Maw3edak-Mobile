import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";
import fr from "@/locales/fr.json";

// Per-screen translation modules. Each file has the shape
// { en: {...}, ar: {...}, fr: {...} } and is merged under its namespace.
import appointments from "@/locales/modules/appointments.json";
import auth from "@/locales/modules/auth.json";
import authRegister from "@/locales/modules/authRegister.json";
import bookAppointment from "@/locales/modules/bookAppointment.json";
import components from "@/locales/modules/components.json";
import doctorAppointments from "@/locales/modules/doctorAppointments.json";
import doctorDental from "@/locales/modules/doctorDental.json";
import doctorHome from "@/locales/modules/doctorHome.json";
import doctorNotifications from "@/locales/modules/doctorNotifications.json";
import doctorNutrition from "@/locales/modules/doctorNutrition.json";
import doctorOrders from "@/locales/modules/doctorOrders.json";
import doctorPatientAppointments from "@/locales/modules/doctorPatientAppointments.json";
import doctorResponses from "@/locales/modules/doctorResponses.json";
import doctorVision from "@/locales/modules/doctorVision.json";
import doctors from "@/locales/modules/doctors.json";
import editProfile from "@/locales/modules/editProfile.json";
import finance from "@/locales/modules/finance.json";
import forgotPassword from "@/locales/modules/forgotPassword.json";
import helpCenter from "@/locales/modules/helpCenter.json";
import home from "@/locales/modules/home.json";
import invoices from "@/locales/modules/invoices.json";
import linkProvider from "@/locales/modules/linkProvider.json";
import medicalRecords from "@/locales/modules/medicalRecords.json";
import medications from "@/locales/modules/medications.json";
import notifications from "@/locales/modules/notifications.json";
import otpVerify from "@/locales/modules/otpVerify.json";
import packageDetail from "@/locales/modules/packageDetail.json";
import packages from "@/locales/modules/packages.json";
import patientAnswers from "@/locales/modules/patientAnswers.json";
import patientDental from "@/locales/modules/patientDental.json";
import patientNutrition from "@/locales/modules/patientNutrition.json";
import patientOrders from "@/locales/modules/patientOrders.json";
import patientVision from "@/locales/modules/patientVision.json";
import patients from "@/locales/modules/patients.json";
import paymentMethods from "@/locales/modules/paymentMethods.json";
import prescriptions from "@/locales/modules/prescriptions.json";
import profile from "@/locales/modules/profile.json";
import questions from "@/locales/modules/questions.json";
import reception from "@/locales/modules/reception.json";
import resetPassword from "@/locales/modules/resetPassword.json";
import statement from "@/locales/modules/statement.json";
import tabs from "@/locales/modules/tabs.json";
import timeManagement from "@/locales/modules/timeManagement.json";
import visitHistory from "@/locales/modules/visitHistory.json";

export type LanguageCode = "en" | "ar" | "fr";

export const LANGUAGES: { code: LanguageCode; label: string; isRTL: boolean }[] = [
  { code: "en", label: "English", isRTL: false },
  { code: "ar", label: "العربية", isRTL: true },
  { code: "fr", label: "Français", isRTL: false },
];

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export function isSupportedLanguage(code?: string | null): code is LanguageCode {
  return !!code && LANGUAGES.some((l) => l.code === code);
}

// Each module contributes one namespace keyed by its variable name.
const modules: Record<string, Record<LanguageCode, Record<string, unknown>>> = {
  appointments,
  auth,
  authRegister,
  bookAppointment,
  components,
  doctorAppointments,
  doctorDental,
  doctorHome,
  doctorNotifications,
  doctorNutrition,
  doctorOrders,
  doctorPatientAppointments,
  doctorResponses,
  doctorVision,
  doctors,
  editProfile,
  finance,
  forgotPassword,
  helpCenter,
  home,
  invoices,
  linkProvider,
  medicalRecords,
  medications,
  notifications,
  otpVerify,
  packageDetail,
  packages,
  patientAnswers,
  patientDental,
  patientNutrition,
  patientOrders,
  patientVision,
  patients,
  paymentMethods,
  prescriptions,
  profile,
  questions,
  reception,
  resetPassword,
  statement,
  tabs,
  timeManagement,
  visitHistory,
};

const base = { en, ar, fr } as Record<LanguageCode, Record<string, unknown>>;

function buildResources(lang: LanguageCode) {
  const merged: Record<string, unknown> = { ...base[lang] };
  for (const [namespace, mod] of Object.entries(modules)) {
    merged[namespace] = mod[lang];
  }
  return merged;
}

const ALL_LANGS: LanguageCode[] = ["en", "ar", "fr"];

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    compatibilityJSON: "v3",
    resources: {
      en: { translation: buildResources("en") },
      ar: { translation: buildResources("ar") },
      fr: { translation: buildResources("fr") },
    },
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
} else {
  // The i18next singleton survives Metro Fast Refresh, so a cold init only
  // happens once. When this module re-runs (e.g. after adding namespaces),
  // push the latest bundles into the live instance so new keys resolve.
  ALL_LANGS.forEach((lng) => {
    i18n.addResourceBundle(lng, "translation", buildResources(lng), true, true);
  });
}

export default i18n;
