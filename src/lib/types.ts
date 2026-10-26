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

// ─── Baby Profile ───
export interface BabyProfile {
  id: string;
  babyName: string;
  gender: 'Boy' | 'Girl' | 'Other' | 'Unknown';
  birthDate: string; // ISO date
  birthTime?: string;
  birthWeightGrams?: number | null;
  birthLengthCm?: number | null;
  birthHeadCircumferenceCm?: number | null;
  deliveryType?: 'Vaginal' | 'Assisted Vaginal' | 'Planned C-Section' | 'Emergency C-Section';
  bloodGroup?: string;
  pediatricianName?: string;
  hospitalName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Baby Milestone Catalog & Interface ───
export interface BabyMilestoneItem {
  key: string;
  title: string;
  category: 'Birth & Newborn' | 'Motor & Physical' | 'Speech & Social' | 'Teething & Food' | 'Sleep & Habits' | 'Custom';
  icon: string;
  expectedAgeDays: number;
  expectedAgeDisplay: string;
  description: string;
}

export const BABY_MILESTONE_CATALOG: BabyMilestoneItem[] = [
  { key: 'first_cry', title: 'First Cry', category: 'Birth & Newborn', icon: '😢', expectedAgeDays: 0, expectedAgeDisplay: 'At Birth', description: 'The precious, life-affirming sound of baby’s first cry at birth.' },
  { key: 'first_latch', title: 'First Latch / Feed', category: 'Birth & Newborn', icon: '🤱', expectedAgeDays: 0, expectedAgeDisplay: 'Day 1', description: 'Baby’s first successful nursing or bottle feed session.' },
  { key: 'cord_stump_off', title: 'Cord Stump Fell Off', category: 'Birth & Newborn', icon: '🩹', expectedAgeDays: 10, expectedAgeDisplay: '1–2 weeks', description: 'Umbilical cord stump naturally separated and belly button healed.' },
  { key: 'first_sponge_bath', title: 'First Sponge Bath', category: 'Birth & Newborn', icon: '🛁', expectedAgeDays: 7, expectedAgeDisplay: '1 week', description: 'Baby’s first refreshing warm bath experience.' },
  { key: 'coming_home', title: 'Coming Home from Hospital', category: 'Birth & Newborn', icon: '🏡', expectedAgeDays: 3, expectedAgeDisplay: 'Day 3', description: 'Leaving the hospital and entering baby’s cozy home nursery.' },
  { key: 'first_social_smile', title: 'First Social Smile', category: 'Speech & Social', icon: '😊', expectedAgeDays: 45, expectedAgeDisplay: '6–8 weeks', description: 'A real, deliberate smile in response to mum or dad’s face and voice!' },
  { key: 'first_coo', title: 'First Coos & Gurgles', category: 'Speech & Social', icon: '🕊️', expectedAgeDays: 60, expectedAgeDisplay: '2 months', description: 'Sweet musical cooing sounds and conversation turn-taking.' },
  { key: 'tummy_head_lift', title: 'Holding Head Up (Tummy Time)', category: 'Motor & Physical', icon: '🦁', expectedAgeDays: 60, expectedAgeDisplay: '2–3 months', description: 'Lifting head and chest stably while lying on the tummy.' },
  { key: 'first_laugh', title: 'First Giggle & Belly Laugh', category: 'Speech & Social', icon: '😄', expectedAgeDays: 105, expectedAgeDisplay: '3–4 months', description: 'The heartwarming sound of baby’s first genuine laugh.' },
  { key: 'rolling_tummy_back', title: 'Rolling Tummy to Back', category: 'Motor & Physical', icon: '🔄', expectedAgeDays: 120, expectedAgeDisplay: '4 months', description: 'First roll from tummy onto back.' },
  { key: 'rolling_back_tummy', title: 'Rolling Back to Tummy', category: 'Motor & Physical', icon: '🔄', expectedAgeDays: 150, expectedAgeDisplay: '5 months', description: 'Rolling both ways with coordination.' },
  { key: 'sitting_support', title: 'Sitting with Support', category: 'Motor & Physical', icon: '🛋️', expectedAgeDays: 150, expectedAgeDisplay: '5 months', description: 'Sitting upright with cushions or highchair support.' },
  { key: 'first_tooth', title: 'First Tooth Cut', category: 'Teething & Food', icon: '🦷', expectedAgeDays: 180, expectedAgeDisplay: '6 months', description: 'First tiny white tooth breaking through the gums!' },
  { key: 'first_solid_food', title: 'First Taste of Solids', category: 'Teething & Food', icon: '🥣', expectedAgeDays: 180, expectedAgeDisplay: '6 months', description: 'First taste of purees, cereal, or mashed fruit.' },
  { key: 'sitting_unassisted', title: 'Sitting Independently', category: 'Motor & Physical', icon: '🧘', expectedAgeDays: 210, expectedAgeDisplay: '7 months', description: 'Sitting steady on the floor without any props or support.' },
  { key: 'crawled', title: 'First Crawl', category: 'Motor & Physical', icon: '🐾', expectedAgeDays: 240, expectedAgeDisplay: '8 months', description: 'Moving forward on hands and knees to explore the room!' },
  { key: 'responded_to_name', title: 'Responding to Their Name', category: 'Speech & Social', icon: '👂', expectedAgeDays: 240, expectedAgeDisplay: '8 months', description: 'Turning head promptly when their name is called.' },
  { key: 'first_babble', title: 'First Babble (Ba-ba, Da-da, Ma-ma)', category: 'Speech & Social', icon: '🗣️', expectedAgeDays: 240, expectedAgeDisplay: '8 months', description: 'Rhythmic syllable chains like ba-ba, da-da, and ma-ma.' },
  { key: 'pulling_to_stand', title: 'Pulling Up to Stand', category: 'Motor & Physical', icon: '🧍', expectedAgeDays: 270, expectedAgeDisplay: '9 months', description: 'Pulling themselves up to standing holding onto a table or crib.' },
  { key: 'waving_bye', title: 'Waving Bye-Bye', category: 'Speech & Social', icon: '👋', expectedAgeDays: 270, expectedAgeDisplay: '9 months', description: 'Imitating gestures and waving hello or goodbye.' },
  { key: 'pointing', title: 'Pointing with Index Finger', category: 'Speech & Social', icon: '👉', expectedAgeDays: 300, expectedAgeDisplay: '10 months', description: 'Pointing at objects or people of interest to show parents.' },
  { key: 'cruising', title: 'Cruising Along Furniture', category: 'Motor & Physical', icon: '🪑', expectedAgeDays: 300, expectedAgeDisplay: '10 months', description: 'Sidestepping and walking while holding onto couches or tables.' },
  { key: 'first_word', title: 'First Meaningful Word', category: 'Speech & Social', icon: '💬', expectedAgeDays: 330, expectedAgeDisplay: '11–12 months', description: 'First real word spoken with intent and clear meaning.' },
  { key: 'first_steps', title: 'First Independent Steps / Walking', category: 'Motor & Physical', icon: '🚶', expectedAgeDays: 365, expectedAgeDisplay: '12 months', description: 'Taking brave independent steps without holding on to anything!' },
  { key: 'sleeping_through_night', title: 'First Night Sleeping Through', category: 'Sleep & Habits', icon: '😴', expectedAgeDays: 120, expectedAgeDisplay: '4–6 months', description: 'Sleeping a full continuous 6–8 hours stretch at night.' },
  { key: 'custom', title: 'Custom Memory or Ceremony', category: 'Custom', icon: '✨', expectedAgeDays: 0, expectedAgeDisplay: 'Any time', description: 'Special family, cultural or personal celebration.' },
];

export interface BabyMilestone {
  id: string;
  milestoneKey: string;
  title: string;
  category: string;
  achievedDate: string; // ISO date
  babyAgeDays: number;
  babyAgeDisplay?: string;
  notes: string;
  driveFileId?: string;
  driveLink?: string;
  createdAt: string;
}

// ─── Child Vaccination / Immunization ───
export type VaccineStatus = 'Scheduled' | 'Given' | 'Delayed' | 'Skipped';

export interface VaccinationRecord {
  id: string;
  vaccineName: string;
  doseNumber: string;
  targetDisease: string;
  recommendedAgeStr: string;
  recommendedAgeDays: number;
  dueDate: string; // ISO date (deliveryDate + recommendedAgeDays)
  status: VaccineStatus;
  givenDate: string; // ISO date
  doctorName: string;
  hospital: string;
  batchNo: string;
  reactions: string;
  cost?: number | string | null;
  notes: string;
  createdAt: string;
}

// ─── Child Growth Measurement ───
export interface ChildGrowth {
  id: string;
  recordedDate: string; // ISO date
  babyAgeDays: number;
  weightKg: number | null;
  lengthCm: number | null;
  headCircumferenceCm: number | null;
  notes: string;
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
  | 'note'
  // Postpartum additions:
  | 'baby-milestone'
  | 'vaccination'
  | 'child-growth'
  | 'baby-profile';

export interface RecordTypeConfig {
  key: RecordType;
  label: string;
  icon: string;       // emoji for now
  sheetTab: string;    // Google Sheets tab name
  color: string;       // CSS custom property name
  phase?: 'pregnancy' | 'postpartum' | 'both';
  category?: 'Mother' | 'Baby' | 'General';
}

export const RECORD_TYPES: RecordTypeConfig[] = [
  { key: 'doctor-visit',   label: 'Doctor Visit',       icon: '🩺', sheetTab: 'DoctorVisits',   color: 'var(--color-cat-doctor)', phase: 'both', category: 'Mother' },
  { key: 'medicine',       label: 'Medicine',           icon: '💊', sheetTab: 'Medicines',      color: 'var(--color-cat-medicine)', phase: 'both', category: 'Mother' },
  { key: 'test',           label: 'Test / Report',      icon: '🧪', sheetTab: 'Tests',          color: 'var(--color-cat-test)', phase: 'both', category: 'Mother' },
  { key: 'health-stats',   label: 'Health Measurement', icon: '❤️', sheetTab: 'HealthStats',    color: 'var(--color-cat-health)', phase: 'both', category: 'Mother' },
  { key: 'baby-stats',     label: 'Fetal Measurement',  icon: '👶', sheetTab: 'BabyStats',      color: 'var(--color-cat-baby)', phase: 'pregnancy', category: 'Baby' },
  { key: 'note',           label: 'Note',               icon: '📝', sheetTab: 'Notes',          color: 'var(--color-cat-note)', phase: 'both', category: 'General' },
  { key: 'appointment',    label: 'Appointment',        icon: '📅', sheetTab: 'Appointments',   color: 'var(--color-cat-appointment)', phase: 'both', category: 'General' },
  { key: 'milestone',      label: 'Pregnancy Milestone',icon: '🏆', sheetTab: 'Milestones',     color: 'var(--color-cat-milestone)', phase: 'pregnancy', category: 'Mother' },
  // Postpartum:
  { key: 'child-growth',   label: 'Baby Growth Log',    icon: '📏', sheetTab: 'ChildGrowth',    color: 'var(--color-cat-baby)', phase: 'postpartum', category: 'Baby' },
  { key: 'vaccination',    label: 'Vaccine / Immunization', icon: '💉', sheetTab: 'Vaccinations', color: 'var(--color-cat-test)', phase: 'postpartum', category: 'Baby' },
  { key: 'baby-milestone', label: 'Baby Firsts & Milestone', icon: '🌟', sheetTab: 'BabyMilestones', color: 'var(--color-cat-milestone)', phase: 'postpartum', category: 'Baby' },
  { key: 'baby-profile',   label: 'Baby Profile',       icon: '🍼', sheetTab: 'BabyProfile',    color: 'var(--color-cat-baby)', phase: 'postpartum', category: 'Baby' },
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
  babyProfile?: BabyProfile | null;
  latestGrowth?: ChildGrowth | null;
  upcomingVaccinations?: VaccinationRecord[];
  recentBabyMilestones?: BabyMilestone[];
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
  postpartumWeek?: number;
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
  // Postpartum:
  babyProfile: 'BabyProfile',
  babyMilestones: 'BabyMilestones',
  vaccinations: 'Vaccinations',
  childGrowth: 'ChildGrowth',
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
  // Postpartum headers:
  [SHEET_TABS.babyProfile]: [
    'id', 'baby_name', 'gender', 'birth_date', 'birth_time',
    'birth_weight_grams', 'birth_length_cm', 'birth_head_circumference_cm',
    'delivery_type', 'blood_group', 'pediatrician_name', 'hospital_name',
    'notes', 'created_at', 'updated_at',
  ],
  [SHEET_TABS.babyMilestones]: [
    'id', 'milestone_key', 'title', 'category', 'achieved_date',
    'baby_age_days', 'baby_age_display', 'notes', 'drive_file_id',
    'drive_link', 'created_at',
  ],
  [SHEET_TABS.vaccinations]: [
    'id', 'vaccine_name', 'dose_number', 'target_disease',
    'recommended_age_str', 'recommended_age_days', 'due_date',
    'status', 'given_date', 'doctor_name', 'hospital', 'batch_no',
    'reactions', 'cost', 'notes', 'created_at',
  ],
  [SHEET_TABS.childGrowth]: [
    'id', 'recorded_date', 'baby_age_days', 'weight_kg',
    'length_cm', 'head_circumference_cm', 'notes', 'created_at',
  ],
};

