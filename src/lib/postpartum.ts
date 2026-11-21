/* ============================================
   Postpartum & Baby Utilities
   Vaccination schedule generation, growth references,
   milestones, and recovery helpers.
   ============================================ */

import type { VaccinationRecord } from './types';
import { generateId, now } from './utils';

export interface StandardVaccineDefinition {
  name: string;
  dose: string;
  targetDisease: string;
  recommendedAgeStr: string;
  recommendedAgeDays: number;
}

/**
 * Standard IAP (Indian Academy of Pediatrics) & WHO childhood immunization schedule.
 */
export const STANDARD_VACCINE_SCHEDULE: StandardVaccineDefinition[] = [
  // Birth
  { name: 'BCG', dose: 'Single Dose', targetDisease: 'Tuberculosis', recommendedAgeStr: 'At Birth', recommendedAgeDays: 0 },
  { name: 'OPV-0', dose: 'Birth Dose', targetDisease: 'Polio (Oral)', recommendedAgeStr: 'At Birth', recommendedAgeDays: 0 },
  { name: 'Hepatitis B-1', dose: 'Dose 1', targetDisease: 'Hepatitis B', recommendedAgeStr: 'At Birth', recommendedAgeDays: 0 },

  // 6 Weeks
  { name: 'DTPw / DTPa-1', dose: 'Dose 1', targetDisease: 'Diphtheria, Tetanus, Pertussis', recommendedAgeStr: '6 Weeks', recommendedAgeDays: 42 },
  { name: 'IPV-1', dose: 'Dose 1', targetDisease: 'Polio (Injectable)', recommendedAgeStr: '6 Weeks', recommendedAgeDays: 42 },
  { name: 'Hib-1', dose: 'Dose 1', targetDisease: 'Haemophilus Influenzae type b', recommendedAgeStr: '6 Weeks', recommendedAgeDays: 42 },
  { name: 'Hepatitis B-2', dose: 'Dose 2', targetDisease: 'Hepatitis B', recommendedAgeStr: '6 Weeks', recommendedAgeDays: 42 },
  { name: 'Rotavirus-1', dose: 'Dose 1', targetDisease: 'Rotavirus Diarrhea', recommendedAgeStr: '6 Weeks', recommendedAgeDays: 42 },
  { name: 'PCV-1', dose: 'Dose 1', targetDisease: 'Pneumococcal Pneumonia', recommendedAgeStr: '6 Weeks', recommendedAgeDays: 42 },

  // 10 Weeks
  { name: 'DTPw / DTPa-2', dose: 'Dose 2', targetDisease: 'Diphtheria, Tetanus, Pertussis', recommendedAgeStr: '10 Weeks', recommendedAgeDays: 70 },
  { name: 'IPV-2', dose: 'Dose 2', targetDisease: 'Polio (Injectable)', recommendedAgeStr: '10 Weeks', recommendedAgeDays: 70 },
  { name: 'Hib-2', dose: 'Dose 2', targetDisease: 'Haemophilus Influenzae type b', recommendedAgeStr: '10 Weeks', recommendedAgeDays: 70 },
  { name: 'Hepatitis B-3', dose: 'Dose 3', targetDisease: 'Hepatitis B', recommendedAgeStr: '10 Weeks', recommendedAgeDays: 70 },
  { name: 'Rotavirus-2', dose: 'Dose 2', targetDisease: 'Rotavirus Diarrhea', recommendedAgeStr: '10 Weeks', recommendedAgeDays: 70 },
  { name: 'PCV-2', dose: 'Dose 2', targetDisease: 'Pneumococcal Pneumonia', recommendedAgeStr: '10 Weeks', recommendedAgeDays: 70 },

  // 14 Weeks
  { name: 'DTPw / DTPa-3', dose: 'Dose 3', targetDisease: 'Diphtheria, Tetanus, Pertussis', recommendedAgeStr: '14 Weeks', recommendedAgeDays: 98 },
  { name: 'IPV-3', dose: 'Dose 3', targetDisease: 'Polio (Injectable)', recommendedAgeStr: '14 Weeks', recommendedAgeDays: 98 },
  { name: 'Hib-3', dose: 'Dose 3', targetDisease: 'Haemophilus Influenzae type b', recommendedAgeStr: '14 Weeks', recommendedAgeDays: 98 },
  { name: 'Hepatitis B-4', dose: 'Dose 4', targetDisease: 'Hepatitis B', recommendedAgeStr: '14 Weeks', recommendedAgeDays: 98 },
  { name: 'Rotavirus-3', dose: 'Dose 3', targetDisease: 'Rotavirus Diarrhea', recommendedAgeStr: '14 Weeks', recommendedAgeDays: 98 },
  { name: 'PCV-3', dose: 'Dose 3', targetDisease: 'Pneumococcal Pneumonia', recommendedAgeStr: '14 Weeks', recommendedAgeDays: 98 },

  // 6 Months
  { name: 'Influenza-1', dose: 'Dose 1', targetDisease: 'Influenza (Flu)', recommendedAgeStr: '6 Months', recommendedAgeDays: 182 },
  { name: 'Typhoid Conjugate (TCV)', dose: 'Single Dose', targetDisease: 'Typhoid Fever', recommendedAgeStr: '6 Months', recommendedAgeDays: 182 },

  // 7 Months
  { name: 'Influenza-2', dose: 'Dose 2', targetDisease: 'Influenza (Flu)', recommendedAgeStr: '7 Months', recommendedAgeDays: 212 },

  // 9 Months
  { name: 'MMR-1 (or MR)', dose: 'Dose 1', targetDisease: 'Measles, Mumps, Rubella', recommendedAgeStr: '9 Months', recommendedAgeDays: 273 },
  { name: 'OPV Booster', dose: 'Booster 1', targetDisease: 'Polio (Oral)', recommendedAgeStr: '9 Months', recommendedAgeDays: 273 },

  // 12 Months
  { name: 'Hepatitis A-1', dose: 'Dose 1', targetDisease: 'Hepatitis A', recommendedAgeStr: '12 Months', recommendedAgeDays: 365 },
  { name: 'Japanese Encephalitis-1', dose: 'Dose 1 (Endemic)', targetDisease: 'Japanese Encephalitis', recommendedAgeStr: '12 Months', recommendedAgeDays: 365 },

  // 15 Months
  { name: 'MMR-2', dose: 'Dose 2', targetDisease: 'Measles, Mumps, Rubella', recommendedAgeStr: '15 Months', recommendedAgeDays: 456 },
  { name: 'Varicella-1', dose: 'Dose 1', targetDisease: 'Chickenpox', recommendedAgeStr: '15 Months', recommendedAgeDays: 456 },
  { name: 'PCV Booster', dose: 'Booster Dose', targetDisease: 'Pneumococcal Pneumonia', recommendedAgeStr: '15 Months', recommendedAgeDays: 456 },

  // 16–18 Months
  { name: 'DTP Booster-1', dose: 'Booster 1', targetDisease: 'Diphtheria, Tetanus, Pertussis', recommendedAgeStr: '16–18 Months', recommendedAgeDays: 510 },
  { name: 'IPV Booster-1', dose: 'Booster 1', targetDisease: 'Polio (Injectable)', recommendedAgeStr: '16–18 Months', recommendedAgeDays: 510 },
  { name: 'Hib Booster', dose: 'Booster 1', targetDisease: 'Haemophilus Influenzae type b', recommendedAgeStr: '16–18 Months', recommendedAgeDays: 510 },
  { name: 'Hepatitis A-2', dose: 'Dose 2', targetDisease: 'Hepatitis A', recommendedAgeStr: '18 Months', recommendedAgeDays: 545 },

  // 2 Years
  { name: 'Typhoid Booster', dose: 'Booster 1', targetDisease: 'Typhoid Fever', recommendedAgeStr: '2 Years', recommendedAgeDays: 730 },
  { name: 'Annual Flu', dose: 'Annual Dose', targetDisease: 'Influenza (Flu)', recommendedAgeStr: '2 Years', recommendedAgeDays: 730 },

  // 4–6 Years
  { name: 'DTP Booster-2', dose: 'Booster 2', targetDisease: 'Diphtheria, Tetanus, Pertussis', recommendedAgeStr: '4–6 Years', recommendedAgeDays: 1640 },
  { name: 'OPV Booster-2', dose: 'Booster 2', targetDisease: 'Polio (Oral)', recommendedAgeStr: '4–6 Years', recommendedAgeDays: 1640 },
  { name: 'MMR-3', dose: 'Dose 3', targetDisease: 'Measles, Mumps, Rubella', recommendedAgeStr: '4–6 Years', recommendedAgeDays: 1640 },
  { name: 'Varicella-2', dose: 'Dose 2', targetDisease: 'Chickenpox', recommendedAgeStr: '4–6 Years', recommendedAgeDays: 1640 },
];

/**
 * Generate a complete vaccination schedule pre-computed for a baby's birth date.
 */
export function generateVaccineSchedule(birthDateStr: string): VaccinationRecord[] {
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return [];

  return STANDARD_VACCINE_SCHEDULE.map((item) => {
    const due = new Date(birthDate);
    due.setDate(due.getDate() + item.recommendedAgeDays);
    const dueDateStr = due.toISOString().split('T')[0];

    return {
      id: generateId(),
      vaccineName: item.name,
      doseNumber: item.dose,
      targetDisease: item.targetDisease,
      recommendedAgeStr: item.recommendedAgeStr,
      recommendedAgeDays: item.recommendedAgeDays,
      dueDate: dueDateStr,
      status: 'Scheduled',
      givenDate: '',
      doctorName: '',
      hospital: '',
      batchNo: '',
      reactions: '',
      cost: null,
      notes: '',
      createdAt: now(),
    };
  });
}

/**
 * WHO Child Growth Standards (50th percentile reference values)
 * Format: ageDays: { weightKg, lengthCm, headCircumferenceCm }
 */
export const WHO_GROWTH_PERCENTILES_50TH = [
  { ageDays: 0, ageMonth: 0, weightKg: 3.3, lengthCm: 49.5, headCircCm: 34.5 },
  { ageDays: 30, ageMonth: 1, weightKg: 4.4, lengthCm: 54.0, headCircCm: 37.0 },
  { ageDays: 60, ageMonth: 2, weightKg: 5.4, lengthCm: 57.5, headCircCm: 39.0 },
  { ageDays: 90, ageMonth: 3, weightKg: 6.2, lengthCm: 60.5, headCircCm: 40.5 },
  { ageDays: 120, ageMonth: 4, weightKg: 6.8, lengthCm: 63.0, headCircCm: 41.8 },
  { ageDays: 150, ageMonth: 5, weightKg: 7.4, lengthCm: 65.0, headCircCm: 42.8 },
  { ageDays: 180, ageMonth: 6, weightKg: 7.9, lengthCm: 67.0, headCircCm: 43.6 },
  { ageDays: 240, ageMonth: 8, weightKg: 8.6, lengthCm: 70.0, headCircCm: 44.8 },
  { ageDays: 300, ageMonth: 10, weightKg: 9.2, lengthCm: 73.0, headCircCm: 45.6 },
  { ageDays: 365, ageMonth: 12, weightKg: 9.7, lengthCm: 75.5, headCircCm: 46.2 },
];

/**
 * Human-friendly baby age formatting.
 */
export function formatBabyAge(babyAgeDays: number): string {
  if (babyAgeDays === 0) return 'Newborn today 🍼';
  if (babyAgeDays === 1) return '1 day old';
  if (babyAgeDays < 14) return `${babyAgeDays} days old`;

  const weeks = Math.floor(babyAgeDays / 7);
  const remainingDays = babyAgeDays % 7;

  if (weeks < 12) {
    if (remainingDays === 0) return `${weeks} weeks old`;
    return `${weeks}w ${remainingDays}d old`;
  }

  const months = Math.floor(babyAgeDays / 30.4375);
  const daysInMonth = Math.floor(babyAgeDays % 30.4375);

  if (months < 24) {
    if (daysInMonth === 0) return `${months} months old`;
    return `${months}m ${daysInMonth}d old`;
  }

  const years = Math.floor(babyAgeDays / 365.25);
  const remainingMonths = Math.floor((babyAgeDays % 365.25) / 30.4375);
  return `${years} yr ${remainingMonths}m old`;
}

/**
 * Postpartum stage guidance and recovery pearls by postpartum week.
 */
export function getPostpartumGuide(postpartumWeek: number): {
  headline: string;
  motherFocus: string;
  babyFocus: string;
  keyAction: string;
} {
  if (postpartumWeek === 1) {
    return {
      headline: 'The Golden Week • Rest & Gentle Recovery',
      motherFocus: 'Prioritize horizontal rest, hydration, perineal/incision care, and establishing comfort while nursing.',
      babyFocus: 'Frequent feeds on demand, skin-to-skin snuggles, passing meconium, and adjusting to the world.',
      keyAction: 'Pediatrician newborn checkup within 3–5 days of discharge.',
    };
  }
  if (postpartumWeek === 2) {
    return {
      headline: 'Settling into Rhythms',
      motherFocus: 'Lochia naturally lightens in color. Nap whenever baby sleeps, stay hydrated, and take iron/calcium.',
      babyFocus: 'Umbilical cord stump usually falls off around now. Sponge baths transition to gentle tub dips once healed.',
      keyAction: 'Check baby’s weight gain against birth weight (should regain birth weight by 10–14 days).',
    };
  }
  if (postpartumWeek <= 4) {
    return {
      headline: 'Month 1 Bonding & Growth Spurts',
      motherFocus: 'Emotional check-in: baby blues should taper. If feeling overwhelmed, speak with your partner or doctor.',
      babyFocus: 'Short bursts of alert awake time, tracking high-contrast patterns, and 2–3 minute tummy time sessions.',
      keyAction: 'Prepare for 6-week immunization appointment.',
    };
  }
  if (postpartumWeek <= 6) {
    return {
      headline: '6-Week Milestone & Checkups',
      motherFocus: 'Your crucial 6-week OB/GYN postnatal checkup: pelvic healing, BP check, and emotional wellbeing.',
      babyFocus: 'Watch out for that magical first social smile! Baby recognizes your voice and tracks your smile.',
      keyAction: '6-Week Vaccination Series (Hexavalent + Rota + PCV).',
    };
  }
  if (postpartumWeek <= 12) {
    return {
      headline: 'Fourth Trimester Completion 🎉',
      motherFocus: 'Pelvic floor gentle strengthening, balanced nutrition, and celebrating getting through the fourth trimester!',
      babyFocus: 'Coos, giggles, rolling attempts, and longer stretches of nighttime sleep.',
      keyAction: '10-Week and 14-Week vaccination visits.',
    };
  }
  return {
    headline: `Week ${postpartumWeek} Postpartum Journey`,
    motherFocus: 'Continuing physical vitality, staying mindful of postpartum hair shedding or nutrition, and self-care.',
    babyFocus: 'Motor discovery, babbling, sitting development, and curiosity for solids around 6 months.',
    keyAction: 'Track milestone memories and keep vaccination records up to date.',
  };
}
