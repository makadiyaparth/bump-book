/* ============================================
   Pregnancy Calculator & Utility Functions
   ============================================ */

import type { PregnancyInfo } from './types';

/**
 * Calculate pregnancy information from LMP date.
 * Standard pregnancy is 280 days (40 weeks) from LMP.
 */
export function getPregnancyInfo(lmpDateStr: string): PregnancyInfo {
  const lmpDate = new Date(lmpDateStr);
  const now = new Date();
  const dueDate = new Date(lmpDate);
  dueDate.setDate(dueDate.getDate() + 280); // 40 weeks

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
