/* ============================================
   Pregnancy Calculator & Utility Functions
   ============================================ */

import type { PregnancyInfo } from './types';

/**
 * Calculate pregnancy information from LMP date and optional delivery date.
 * If delivery has occurred (e.g. before expected due date), calculates gestation
 * up to delivery date and postpartum duration.
 */
export function getPregnancyInfo(
  lmpDateStr: string,
  deliveryDateStr?: string | null
): PregnancyInfo {
  const lmpDate = new Date(lmpDateStr);
  const now = new Date();
  const dueDate = new Date(lmpDate);
  dueDate.setDate(dueDate.getDate() + 280); // 40 weeks

  const isDelivered = Boolean(deliveryDateStr && deliveryDateStr.trim() !== '');
  const deliveryDate = isDelivered ? new Date(deliveryDateStr!) : null;

  if (isDelivered && deliveryDate && !isNaN(deliveryDate.getTime())) {
    // Gestation duration up to the moment of delivery
    const totalDaysToDelivery = Math.max(
      0,
      Math.floor((deliveryDate.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const deliveryWeek = Math.floor(totalDaysToDelivery / 7);
    const deliveryDay = totalDaysToDelivery % 7;

    // Difference between delivery date and expected due date (in days)
    // Negative = delivered early (e.g. -21 is 21 days early)
    // Positive = delivered late / post-dates
    const daysEarlyOrLate = Math.floor(
      (deliveryDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Baby's age today
    const babyAgeDays = Math.max(
      0,
      Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const babyAgeWeeks = Math.floor(babyAgeDays / 7);
    const babyAgeRemainingDays = babyAgeDays % 7;

    let trimester: 1 | 2 | 3;
    if (deliveryWeek < 13) {
      trimester = 1;
    } else if (deliveryWeek < 27) {
      trimester = 2;
    } else {
      trimester = 3;
    }

    return {
      currentWeek: deliveryWeek,
      currentDay: deliveryDay,
      totalDays: totalDaysToDelivery,
      daysRemaining: 0,
      trimester,
      progressPercent: 100, // Delivered = complete journey
      dueDate,
      isDelivered: true,
      deliveryDate,
      deliveryWeek,
      deliveryDay,
      daysEarlyOrLate,
      babyAgeDays,
      babyAgeWeeks,
      babyAgeRemainingDays,
      postpartumWeek: Math.floor(babyAgeDays / 7) + 1,
    };
  }

  const totalDays = Math.floor(
    (now.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const currentWeek = Math.floor(totalDays / 7);
  const currentDay = totalDays % 7;

  const daysRemaining = Math.max(
    0,
    Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const progressPercent = Math.min(100, Math.max(0, (totalDays / 280) * 100));

  let trimester: 1 | 2 | 3;
  if (currentWeek < 13) {
    trimester = 1;
  } else if (currentWeek < 27) {
    trimester = 2;
  } else {
    trimester = 3;
  }

  return {
    currentWeek,
    currentDay,
    totalDays,
    daysRemaining,
    trimester,
    progressPercent,
    dueDate,
    isDelivered: false,
    deliveryDate: null,
  };
}

/**
 * Calculate due date from LMP date.
 * Naegele's rule: LMP + 280 days
 */
export function calculateDueDate(lmpDateStr: string): string {
  const lmpDate = new Date(lmpDateStr);
  const dueDate = new Date(lmpDate);
  dueDate.setDate(dueDate.getDate() + 280);
  return dueDate.toISOString().split('T')[0];
}

/**
 * Get the pregnancy week for a given date relative to LMP.
 */
export function getWeekForDate(lmpDateStr: string, dateStr: string): number {
  const lmpDate = new Date(lmpDateStr);
  const date = new Date(dateStr);
  const days = Math.floor(
    (date.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.floor(days / 7);
}

/**
 * Format pregnancy week as human-readable string.
 */
export function formatPregnancyWeek(week: number, day: number): string {
  if (day === 0) return `Week ${week}`;
  return `Week ${week} + ${day} day${day !== 1 ? 's' : ''}`;
}

/**
 * Get trimester label.
 */
export function getTrimesterLabel(trimester: 1 | 2 | 3): string {
  const labels = {
    1: 'First Trimester',
    2: 'Second Trimester',
    3: 'Third Trimester',
  };
  return labels[trimester];
}

export interface BabyMilestone {
  week: number;
  fruit: string;
  fruitEmoji: string;
  lengthCm: string;
  weightGrams: string;
  headline: string;
  detail: string;
}

const BABY_MILESTONES: Record<number, Omit<BabyMilestone, 'week'>> = {
  1: { fruit: 'Tiny Spark', fruitEmoji: '✨', lengthCm: '< 0.1 cm', weightGrams: '< 1 g', headline: 'Beginning of the Journey', detail: 'Conception and implantation preparations are underway.' },
  2: { fruit: 'Tiny Spark', fruitEmoji: '✨', lengthCm: '< 0.1 cm', weightGrams: '< 1 g', headline: 'Conception Window', detail: 'The miracle begins as the fertilized egg starts dividing.' },
  3: { fruit: 'Microscopic Gem', fruitEmoji: '💎', lengthCm: '0.1 cm', weightGrams: '< 1 g', headline: 'Implantation', detail: 'The blastocyst implants securely into the uterine lining.' },
  4: { fruit: 'Poppy Seed', fruitEmoji: '🌱', lengthCm: '0.1 cm', weightGrams: '< 1 g', headline: 'A Heart in the Making', detail: 'Amniotic sac and placenta are forming rapidly.' },
  5: { fruit: 'Apple Seed', fruitEmoji: '🍎', lengthCm: '0.3 cm', weightGrams: '< 1 g', headline: 'First Heartbeats', detail: 'Neural tube and cardiovascular system are developing.' },
  6: { fruit: 'Sweet Pea', fruitEmoji: '🫛', lengthCm: '0.6 cm', weightGrams: '< 1 g', headline: 'Tiny Heart Pumping', detail: 'Facial features and limb buds are emerging.' },
  7: { fruit: 'Blueberry', fruitEmoji: '🫐', lengthCm: '1.3 cm', weightGrams: '~1 g', headline: 'Hands and Feet Budding', detail: 'Brain is generating about 100 new nerve cells each minute.' },
  8: { fruit: 'Raspberry', fruitEmoji: '🍓', lengthCm: '1.6 cm', weightGrams: '~1 g', headline: 'Little Fingers Forming', detail: 'Baby moves continuously, though too small to feel yet.' },
  9: { fruit: 'Green Olive', fruitEmoji: '🫒', lengthCm: '2.3 cm', weightGrams: '~2 g', headline: 'Major Organs in Place', detail: 'Muscles are starting to respond and contract.' },
  10: { fruit: 'Prune', fruitEmoji: '🫐', lengthCm: '3.1 cm', weightGrams: '~4 g', headline: 'Officially a Fetus', detail: 'Tiny joints can bend and fingernails are starting to form.' },
  11: { fruit: 'Lime', fruitEmoji: '🍋', lengthCm: '4.1 cm', weightGrams: '~7 g', headline: 'Active and Stretching', detail: 'Bones begin to harden and hair follicles are appearing.' },
  12: { fruit: 'Plum', fruitEmoji: '🍑', lengthCm: '5.4 cm', weightGrams: '~14 g', headline: 'Reflexes Awakening', detail: 'Baby can open and close fingers and curl tiny toes.' },
  13: { fruit: 'Peach', fruitEmoji: '🍑', lengthCm: '7.4 cm', weightGrams: '~23 g', headline: 'Vocal Cords Developing', detail: 'Unique fingerprints have formed on tiny fingertips.' },
  14: { fruit: 'Lemon', fruitEmoji: '🍋', lengthCm: '8.7 cm', weightGrams: '~43 g', headline: 'Welcome to 2nd Trimester!', detail: 'Baby can make facial expressions and suck thumb.' },
  15: { fruit: 'Apple', fruitEmoji: '🍎', lengthCm: '10.1 cm', weightGrams: '~70 g', headline: 'Sense of Light', detail: 'Baby can perceive light filtering through the abdomen.' },
  16: { fruit: 'Avocado', fruitEmoji: '🥑', lengthCm: '11.6 cm', weightGrams: '~100 g', headline: 'Heart Pumping 25 Quarts Daily', detail: 'Eyes can make small movements and eyelashes are growing.' },
  17: { fruit: 'Pomegranate', fruitEmoji: '🪴', lengthCm: '13.0 cm', weightGrams: '~140 g', headline: 'Skeleton Hardening', detail: 'Adipose fat tissue is starting to develop to stay warm.' },
  18: { fruit: 'Bell Pepper', fruitEmoji: '🫑', lengthCm: '14.2 cm', weightGrams: '~190 g', headline: 'Ears Can Hear You!', detail: 'Baby can hear your voice, breathing, and heartbeat.' },
  19: { fruit: 'Mango', fruitEmoji: '🥭', lengthCm: '15.3 cm', weightGrams: '~240 g', headline: 'Vernix Protective Shield', detail: 'A silky protective layer forms to protect delicate skin.' },
  20: { fruit: 'Banana', fruitEmoji: '🍌', lengthCm: '25.0 cm', weightGrams: '~300 g', headline: 'Halfway Milestone! 🎉', detail: 'You may start feeling wonderful flutters and kicks.' },
  21: { fruit: 'Carrot', fruitEmoji: '🥕', lengthCm: '26.7 cm', weightGrams: '~360 g', headline: 'Tasting Flavors', detail: 'Taste buds are active and baby swallows amniotic fluid.' },
  22: { fruit: 'Papaya', fruitEmoji: '🍈', lengthCm: '27.8 cm', weightGrams: '~430 g', headline: 'Miniature Newborn Look', detail: 'Eyebrows and eyelashes are now clearly defined.' },
  23: { fruit: 'Grapefruit', fruitEmoji: '🍊', lengthCm: '28.9 cm', weightGrams: '~500 g', headline: 'Dancing and Moving', detail: 'Sense of balance is honed as baby floats and somersaults.' },
  24: { fruit: 'Cantaloupe', fruitEmoji: '🍈', lengthCm: '30.0 cm', weightGrams: '~600 g', headline: 'Viability Milestone', detail: 'Lungs begin producing surfactant for breathing practice.' },
  25: { fruit: 'Acorn Squash', fruitEmoji: '🌰', lengthCm: '34.6 cm', weightGrams: '~660 g', headline: 'Recognizing Your Voice', detail: 'Baby may respond with a kick when hearing soothing sounds.' },
  26: { fruit: 'Lettuce Head', fruitEmoji: '🥬', lengthCm: '35.6 cm', weightGrams: '~760 g', headline: 'Eyes Open for First Time', detail: 'Baby can blink and has regular sleeping patterns.' },
  27: { fruit: 'Cauliflower', fruitEmoji: '🥦', lengthCm: '36.6 cm', weightGrams: '~875 g', headline: 'Dreaming and Hiccups', detail: 'Brain wave activity shows baby may be having dreams!' },
  28: { fruit: 'Eggplant', fruitEmoji: '🍆', lengthCm: '37.6 cm', weightGrams: '~1,000 g', headline: 'Welcome to 3rd Trimester!', detail: 'Baby weighs around 1 kg and eyes can track light.' },
  29: { fruit: 'Butternut Squash', fruitEmoji: '🎃', lengthCm: '38.6 cm', weightGrams: '~1,150 g', headline: 'Stronger Kicks & Stretches', detail: 'Bones are fully developed, absorbing plenty of calcium.' },
  30: { fruit: 'Cabbage', fruitEmoji: '🥬', lengthCm: '39.9 cm', weightGrams: '~1,300 g', headline: 'Brain Surface Grooving', detail: 'Brain tissue develops its characteristic deep folds.' },
  31: { fruit: 'Coconut', fruitEmoji: '🥥', lengthCm: '41.1 cm', weightGrams: '~1,500 g', headline: 'All 5 Senses Engaged', detail: 'Pupils can constrict and dilate in response to light.' },
  32: { fruit: 'Jicama', fruitEmoji: '🥔', lengthCm: '42.4 cm', weightGrams: '~1,700 g', headline: 'Practicing Breathing', detail: 'Rhythmic diaphragm contractions practice breathing air.' },
  33: { fruit: 'Pineapple', fruitEmoji: '🍍', lengthCm: '43.7 cm', weightGrams: '~1,900 g', headline: 'Immunity Transfer', detail: 'Receiving vital antibodies from mom for protection after birth.' },
  34: { fruit: 'Butternut Squash', fruitEmoji: '🎃', lengthCm: '45.0 cm', weightGrams: '~2,150 g', headline: 'Lungs Maturing Rapidly', detail: 'Central nervous system is fine-tuning for life outside.' },
  35: { fruit: 'Honeydew Melon', fruitEmoji: '🍈', lengthCm: '46.2 cm', weightGrams: '~2,400 g', headline: 'Snug in the Nursery', detail: 'Baby is plumping up, gaining about 200-250 grams per week.' },
  36: { fruit: 'Romaine Lettuce', fruitEmoji: '🥗', lengthCm: '47.4 cm', weightGrams: '~2,600 g', headline: 'Settling into Position', detail: 'Baby often drops head-first into the pelvis (lightening).' },
  37: { fruit: 'Winter Melon', fruitEmoji: '🍈', lengthCm: '48.6 cm', weightGrams: '~2,850 g', headline: 'Early Term Reached! 🌟', detail: 'Firm grasp reflex is developed; ready to hold your finger.' },
  38: { fruit: 'Leek', fruitEmoji: '🌱', lengthCm: '49.8 cm', weightGrams: '~3,100 g', headline: 'Ready to Breathe Air', detail: 'All organ systems are fully mature and waiting for launch.' },
  39: { fruit: 'Watermelon', fruitEmoji: '🍉', lengthCm: '50.7 cm', weightGrams: '~3,300 g', headline: 'Full Term Champion', detail: 'Baby has shed most lanugo hair and is ready to arrive.' },
  40: { fruit: 'Sweet Pumpkin', fruitEmoji: '🎃', lengthCm: '51.2 cm', weightGrams: '~3,500 g', headline: 'Graduation Week! 🎂', detail: 'Happy Due Date! Baby will arrive whenever they are ready.' },
  41: { fruit: 'Cherished Baby', fruitEmoji: '👶', lengthCm: '51.5 cm', weightGrams: '~3,600 g', headline: 'Cozy and Full Term', detail: 'Relax and rest as your birth day approaches any moment.' },
  42: { fruit: 'Cherished Baby', fruitEmoji: '👶', lengthCm: '51.5 cm', weightGrams: '~3,650 g', headline: 'Meeting Time Very Soon', detail: 'Your healthcare team is monitoring closely for baby delivery.' },
};

/**
 * Get baby milestone information for a given week.
 */
export function getBabyMilestone(week: number): BabyMilestone {
  const clampedWeek = Math.max(1, Math.min(42, week));
  const data = BABY_MILESTONES[clampedWeek] || BABY_MILESTONES[40];
  return {
    week: clampedWeek,
    ...data,
  };
}
