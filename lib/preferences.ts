/**
 * Utility functions for user preferences (language, timezone)
 */

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
];

export interface Timezone {
  value: string;
  label: string;
  offset: string;
}

/**
 * Common timezones organized by region
 */
export const TIMEZONES: Timezone[] = [
  // North America
  { value: "America/New_York", label: "Eastern Time (ET)", offset: "UTC-5" },
  { value: "America/Chicago", label: "Central Time (CT)", offset: "UTC-6" },
  { value: "America/Denver", label: "Mountain Time (MT)", offset: "UTC-7" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", offset: "UTC-8" },
  { value: "America/Phoenix", label: "Arizona Time (MST)", offset: "UTC-7" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)", offset: "UTC-9" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)", offset: "UTC-10" },
  
  // Europe
  { value: "Europe/London", label: "London (GMT)", offset: "UTC+0" },
  { value: "Europe/Paris", label: "Paris (CET)", offset: "UTC+1" },
  { value: "Europe/Berlin", label: "Berlin (CET)", offset: "UTC+1" },
  { value: "Europe/Rome", label: "Rome (CET)", offset: "UTC+1" },
  { value: "Europe/Madrid", label: "Madrid (CET)", offset: "UTC+1" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET)", offset: "UTC+1" },
  { value: "Europe/Stockholm", label: "Stockholm (CET)", offset: "UTC+1" },
  { value: "Europe/Zurich", label: "Zurich (CET)", offset: "UTC+1" },
  { value: "Europe/Vienna", label: "Vienna (CET)", offset: "UTC+1" },
  { value: "Europe/Athens", label: "Athens (EET)", offset: "UTC+2" },
  { value: "Europe/Moscow", label: "Moscow (MSK)", offset: "UTC+3" },
  
  // Asia
  { value: "Asia/Dubai", label: "Dubai (GST)", offset: "UTC+4" },
  { value: "Asia/Karachi", label: "Karachi (PKT)", offset: "UTC+5" },
  { value: "Asia/Kolkata", label: "Mumbai, Delhi (IST)", offset: "UTC+5:30" },
  { value: "Asia/Dhaka", label: "Dhaka (BST)", offset: "UTC+6" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT)", offset: "UTC+7" },
  { value: "Asia/Singapore", label: "Singapore (SGT)", offset: "UTC+8" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)", offset: "UTC+8" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)", offset: "UTC+8" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)", offset: "UTC+9" },
  { value: "Asia/Seoul", label: "Seoul (KST)", offset: "UTC+9" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)", offset: "UTC+10" },
  { value: "Australia/Melbourne", label: "Melbourne (AEDT)", offset: "UTC+10" },
  { value: "Pacific/Auckland", label: "Auckland (NZDT)", offset: "UTC+12" },
  
  // South America
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)", offset: "UTC-3" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (ART)", offset: "UTC-3" },
  { value: "America/Lima", label: "Lima (PET)", offset: "UTC-5" },
  { value: "America/Bogota", label: "Bogotá (COT)", offset: "UTC-5" },
  { value: "America/Mexico_City", label: "Mexico City (CST)", offset: "UTC-6" },
  { value: "America/Santiago", label: "Santiago (CLT)", offset: "UTC-3" },
  
  // Africa
  { value: "Africa/Cairo", label: "Cairo (EET)", offset: "UTC+2" },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST)", offset: "UTC+2" },
  { value: "Africa/Lagos", label: "Lagos (WAT)", offset: "UTC+1" },
];

/**
 * Get language by code
 */
export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
}

/**
 * Get timezone by value
 */
export function getTimezoneByValue(value: string): Timezone | undefined {
  return TIMEZONES.find((tz) => tz.value === value);
}

/**
 * Get user's browser timezone
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York"; // fallback
  }
}

/**
 * Get user's browser language
 */
export function getBrowserLanguage(): string {
  try {
    const lang = navigator.language || (navigator as any).userLanguage;
    return lang.split("-")[0]; // Extract language code (e.g., "en" from "en-US")
  } catch {
    return "en"; // fallback
  }
}
