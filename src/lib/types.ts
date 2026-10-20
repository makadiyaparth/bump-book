/* ============================================
   TypeScript Interfaces — Data Models
   Maps 1:1 to Google Sheets tabs
   ============================================ */

// ─── Pregnancy Profile ───
export interface PregnancyProfile {
  id: string;
  lmpDate: string;          // ISO date
  dueDate: string;          // ISO date
  deliveryDate?: string;    // ISO date (if baby has arrived)
  bloodGroup: string;
  rhFactor: string;
  pregnancyType: 'Singleton' | 'Twins' | 'Triplets' | 'Other';
  previousPregnancies: number;
  previousDeliveries: number;
  allergies: string;
  medicalConditions: string;
  primaryDoctor: string;
  primaryHospital: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Doctor Visit ───
export interface DoctorVisit {
  id: string;
  visitDate: string;
  doctorName: string;
  hospital: string;
  reason: string;
  symptomsDiscussed: string;
  examinationNotes: string;
  testsOrdered: string;
  doctorObservations: string;
  medicinesPrescribed: string;
  restrictions: string;
  dietAdvice: string;
  nextAppointment: string;
  questionsForDoctor: string;
  cost?: number | string | null;
  notes: string;
  createdAt: string;
}

// ─── Medicine ───
export interface Medicine {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  prescribedBy: string;
  reason: string;
  cost?: number | string | null;
  isActive: boolean;
  notes: string;
  createdAt: string;
}

// ─── Test ───
export interface Test {
  id: string;
  testName: string;
  testDate: string;
  reason: string;
  status: 'Ordered' | 'Completed' | 'Pending Results';
  resultSummary: string;
  reportLink: string;
  orderedBy: string;
  cost?: number | string | null;
  notes: string;
  createdAt: string;
}

// ─── Report ───
export interface Report {
  id: string;
  reportType: string;
  reportDate: string;
  fileName: string;
  driveFileId: string;
  driveLink: string;
  observations: string;
  notes: string;
  createdAt: string;
}

// ─── Health Stats ───
export interface HealthStats {
  id: string;
  recordedDate: string;
  weightKg: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  bloodSugar: number | null;
  temperature: number | null; // in °C
  hemoglobin: number | null;
  notes: string;
  createdAt: string;
}

// ─── Baby Stats ───
export interface BabyStats {
  id: string;
  recordedDate: string;
  babyWeightGrams: number | null;
  fhrBpm: number | null;
  bpdMm: number | null;
  flMm: number | null;
  acMm: number | null;
  hcMm: number | null;
  movementFelt: boolean;
  movementCount: number | null;
  notes: string;
  createdAt: string;
}

// ─── Appointment ───
export interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  hospital: string;
  purpose: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  cost?: number | string | null;
  notes: string;
  createdAt: string;
}

// ─── Milestone ───
export const MILESTONE_TYPES = [
  'First Positive Test',
  'First Doctor Visit',
  'First Ultrasound',
  'First Heartbeat',
  'NT Scan',
  'Anatomy Scan',
  'First Baby Movement',
  'Glucose Test',
  'Growth Scan',
  'Hospital Registration',
  'Third Trimester',
  'Due Date',
  'Delivery',
  'Custom',
] as const;

export type MilestoneType = typeof MILESTONE_TYPES[number];

export interface Milestone {
  id: string;
  milestoneType: MilestoneType;
  milestoneDate: string;
  pregnancyWeek: number;
  description: string;
  notes: string;
  createdAt: string;
}

// ─── Note ───
export type NoteCategory = 'General' | 'Symptom' | 'Question' | 'Mood' | 'Diet';

export interface Note {
  id: string;
  noteDate: string;
  title: string;
  content: string;
  category: NoteCategory;
  createdAt: string;
}

// ─── Record Type Union ───
export type RecordType =
  | 'doctor-visit'
  | 'medicine'
  | 'test'
  | 'report'
  | 'health-stats'
  | 'baby-stats'
  | 'appointment'
  | 'milestone'
  | 'note';

export interface RecordTypeConfig {
  key: RecordType;
  label: string;
  icon: string;       // emoji for now
  sheetTab: string;    // Google Sheets tab name
  color: string;       // CSS custom property name
}

export const RECORD_TYPES: RecordTypeConfig[] = [
  { key: 'doctor-visit',  label: 'Doctor Visit',       icon: '🩺', sheetTab: 'DoctorVisits',  color: 'var(--color-cat-doctor)' },
  { key: 'medicine',      label: 'Medicine',           icon: '💊', sheetTab: 'Medicines',     color: 'var(--color-cat-medicine)' },
  { key: 'test',          label: 'Test / Report',      icon: '🧪', sheetTab: 'Tests',         color: 'var(--color-cat-test)' },
  { key: 'health-stats',  label: 'Health Measurement', icon: '❤️', sheetTab: 'HealthStats',   color: 'var(--color-cat-health)' },
  { key: 'baby-stats',    label: 'Baby Measurement',   icon: '👶', sheetTab: 'BabyStats',     color: 'var(--color-cat-baby)' },
  { key: 'note',          label: 'Note',               icon: '📝', sheetTab: 'Notes',         color: 'var(--color-cat-note)' },
  { key: 'appointment',   label: 'Appointment',        icon: '📅', sheetTab: 'Appointments',  color: 'var(--color-cat-appointment)' },
  { key: 'milestone',     label: 'Milestone',          icon: '🏆', sheetTab: 'Milestones',    color: 'var(--color-cat-milestone)' },
];

// ─── Timeline Entry (merged view) ───
export interface TimelineEntry {
  id: string;
  date: string;
  type: RecordType;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  data: Record<string, unknown>;
}

// ─── Dashboard Data ───
export interface DashboardData {
  pregnancy: PregnancyProfile | null;
  pregnancyInfo: PregnancyInfo | null;
  latestHealth: HealthStats | null;
  latestBaby: BabyStats | null;
  upcomingAppointments: Appointment[];
  recentTimeline: TimelineEntry[];
  activeMedicines: Medicine[];
}

// ─── Pregnancy Info (calculated) ───
export interface PregnancyInfo {
  currentWeek: number;
  currentDay: number;
  totalDays: number;
  daysRemaining: number;
  trimester: 1 | 2 | 3;
  progressPercent: number;
  dueDate: Date;
  isDelivered: boolean;
  deliveryDate: Date | null;
  deliveryWeek?: number;
  deliveryDay?: number;
  daysEarlyOrLate?: number; // negative: early, positive: late, 0: on due date
  babyAgeDays?: number;
  babyAgeWeeks?: number;
  babyAgeRemainingDays?: number;
}

// ─── Sheet Tab Names ───
export const SHEET_TABS = {
  overview: 'Overview & Charts',
  config: '_Config',
  pregnancy: 'Pregnancy',
  doctorVisits: 'DoctorVisits',
  medicines: 'Medicines',
  tests: 'Tests',
  reports: 'Reports',
  healthStats: 'HealthStats',
  babyStats: 'BabyStats',
  appointments: 'Appointments',
  milestones: 'Milestones',
  notes: 'Notes',
} as const;

// ─── Sheet tab headers (column order) ───
export const SHEET_HEADERS: Record<string, string[]> = {
  [SHEET_TABS.config]: ['key', 'value'],
  [SHEET_TABS.pregnancy]: [
    'id', 'lmp_date', 'due_date', 'blood_group', 'rh_factor',
    'pregnancy_type', 'previous_pregnancies', 'previous_deliveries',
    'allergies', 'medical_conditions', 'primary_doctor', 'primary_hospital',
    'created_at', 'updated_at', 'delivery_date',
  ],
  [SHEET_TABS.doctorVisits]: [
    'id', 'visit_date', 'doctor_name', 'hospital', 'reason',
    'symptoms_discussed', 'examination_notes', 'tests_ordered',
    'doctor_observations', 'medicines_prescribed', 'restrictions',
    'diet_advice', 'next_appointment', 'questions_for_doctor', 'cost', 'notes', 'created_at',
  ],
  [SHEET_TABS.medicines]: [
    'id', 'medicine_name', 'dosage', 'frequency', 'start_date',
    'end_date', 'prescribed_by', 'reason', 'cost', 'is_active', 'notes', 'created_at',
  ],
  [SHEET_TABS.tests]: [
    'id', 'test_name', 'test_date', 'reason', 'status',
    'result_summary', 'report_link', 'ordered_by', 'cost', 'notes', 'created_at',
  ],
  [SHEET_TABS.reports]: [
    'id', 'report_type', 'report_date', 'file_name',
    'drive_file_id', 'drive_link', 'observations', 'notes', 'created_at',
  ],
  [SHEET_TABS.healthStats]: [
    'id', 'recorded_date', 'weight_kg', 'bp_systolic', 'bp_diastolic',
    'blood_sugar', 'temperature', 'hemoglobin', 'notes', 'created_at',
  ],
  [SHEET_TABS.babyStats]: [
    'id', 'recorded_date', 'baby_weight_grams', 'fhr_bpm',
    'bpd_mm', 'fl_mm', 'ac_mm', 'hc_mm', 'movement_felt',
    'movement_count', 'notes', 'created_at',
  ],
  [SHEET_TABS.appointments]: [
    'id', 'appointment_date', 'appointment_time', 'doctor_name',
    'hospital', 'purpose', 'status', 'cost', 'notes', 'created_at',
  ],
  [SHEET_TABS.milestones]: [
    'id', 'milestone_type', 'milestone_date', 'pregnancy_week',
    'description', 'notes', 'created_at',
  ],
  [SHEET_TABS.notes]: [
    'id', 'note_date', 'title', 'content', 'category', 'created_at',
  ],
};
