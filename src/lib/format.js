/** Presentation helpers shared across pages. */

export const LANGUAGE_LABELS = {
  english: 'English',
  hindi: 'Hindi',
  tamil: 'Tamil',
  telugu: 'Telugu',
  kannada: 'Kannada',
  malayalam: 'Malayalam',
  marathi: 'Marathi',
  bengali: 'Bengali',
  gujarati: 'Gujarati',
  punjabi: 'Punjabi',
  odia: 'Odia',
  urdu: 'Urdu',
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
];

export const COURSE_OPTIONS = [
  'Full Stack Development',
  'Data Science',
  'Digital Marketing',
  'UI/UX Design',
  'Cloud Computing',
  'Cybersecurity',
  'Other',
];

export const languageLabel = (code) => LANGUAGE_LABELS[code] ?? code;

export const OUTCOME_LABELS = {
  connected: 'Connected',
  converted: 'Converted',
  not_interested: 'Not interested',
  no_answer: 'No answer',
  language_barrier: 'Language barrier',
};

export const STATUS_LABELS = {
  new: 'Waiting',
  assigned: 'Assigned',
  contacted: 'Contacted',
  unroutable: 'No BD available',
};

/** Declared beats inferred; English is the last-resort fallback. */
export function effectiveLanguages(lead) {
  if (lead?.effectiveLanguages?.length) return lead.effectiveLanguages;
  if (lead?.preferredLanguages?.length) return lead.preferredLanguages;
  if (lead?.inferredLanguages?.length) return lead.inferredLanguages;
  return ['english'];
}

export function titleCase(value) {
  if (!value) return '';
  return String(value).replace(/\b\w/g, (c) => c.toUpperCase());
}

export function relativeTime(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.round(hours / 24);
  return days + 'd ago';
}
