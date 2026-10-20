/* ============================================
   Dynamic Indian Demo Data Generator
   Anchored dynamically to today so the demo is
   always in Week 24 + 3d (2nd Trimester)
   ============================================ */

import { SHEET_TABS } from './types';

// Helper to format Date as YYYY-MM-DD
function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

// Helper to offset days from a base date
function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Generates all demo data anchored relative to the current timestamp.
 * Target gestational age: 24 weeks + 3 days (171 days past LMP).
 */
function getRawDemoSheetRows(tabName: string): Record<string, string>[] {
  const today = new Date();
  
  // LMP is 171 days ago (Week 24, Day 3)
  const lmpDate = addDays(today, -171);
  const lmpStr = formatDate(lmpDate);
  
  // Due date is LMP + 280 days (~109 days from today)
  const dueDate = addDays(lmpDate, 280);
  const dueStr = formatDate(dueDate);

  // Key pregnancy milestone dates
  const w4 = formatDate(addDays(lmpDate, 28));   // Week 4
  const w6 = formatDate(addDays(lmpDate, 42));   // Week 6
  const w7 = formatDate(addDays(lmpDate, 49));   // Week 7
  const w8 = formatDate(addDays(lmpDate, 56));   // Week 8
  const w10 = formatDate(addDays(lmpDate, 70));  // Week 10
  const w12 = formatDate(addDays(lmpDate, 84));  // Week 12
  const w13 = formatDate(addDays(lmpDate, 91));  // Week 13
  const w14 = formatDate(addDays(lmpDate, 98));  // Week 14
  const w15 = formatDate(addDays(lmpDate, 105)); // Week 15
  const w16 = formatDate(addDays(lmpDate, 112)); // Week 16
  const w17 = formatDate(addDays(lmpDate, 119)); // Week 17
  const w18 = formatDate(addDays(lmpDate, 126)); // Week 18
  const w20 = formatDate(addDays(lmpDate, 140)); // Week 20
  const w21 = formatDate(addDays(lmpDate, 147)); // Week 21
  const w22 = formatDate(addDays(lmpDate, 154)); // Week 22
  const w23 = formatDate(addDays(lmpDate, 161)); // Week 23
  const w24 = formatDate(today);                 // Week 24 + 3d (Today)
  const upcomingIn4Days = formatDate(addDays(today, 4));
  const upcomingIn21Days = formatDate(addDays(today, 21));

  switch (tabName) {
    case SHEET_TABS.pregnancy:
      return [
        {
          id: 'demo-preg-001',
          lmp_date: lmpStr,
          due_date: dueStr,
          blood_group: 'B',
          rh_factor: 'Positive',
          pregnancy_type: 'Singleton',
          previous_pregnancies: '0',
          previous_deliveries: '0',
          allergies: 'None reported',
          medical_conditions: 'None (Low-risk pregnancy)',
          primary_doctor: 'Dr. Sunita Kulkarni, MS (OBG)',
          primary_hospital: 'Cloudnine Maternity Hospital, Whitefield',
          created_at: `${w4}T10:00:00.000Z`,
          updated_at: `${w24}T09:30:00.000Z`,
          delivery_date: '',
        },
      ];

    case SHEET_TABS.doctorVisits:
      return [
        {
          id: 'demo-visit-001',
          visit_date: w6,
          doctor_name: 'Dr. Sunita Kulkarni',
          hospital: 'Cloudnine Hospital, Whitefield',
          reason: 'Initial Prenatal Consultation & Confirmation',
          symptoms_discussed: 'Mild fatigue, heightened sense of smell, breast tenderness',
          examination_notes: 'Per-abdomen soft, non-tender. BP 110/70. Confirmation dating scan performed.',
          tests_ordered: 'CBC, Blood Group & Rh, Thyroid Profile (TSH), Rubella IgG, Urine Routine',
          doctor_observations: 'Intrauterine gestational sac confirmed. Cardiac flicker seen. Advised wholesome home-cooked Indian diet.',
          medicines_prescribed: 'Folvite 5mg once daily after breakfast',
          restrictions: 'Avoid unpasteurized foods, raw papaya, and lifting heavy weights',
          diet_advice: 'Fresh tender coconut water, roasted makhana, stay well hydrated with 2.5L water daily',
          next_appointment: w10,
          questions_for_doctor: 'Is safe to travel by cab? (Yes, smooth roads only)',
          cost: '1200',
          notes: 'Dr. Sunita was very reassuring and explained the entire first trimester roadmap.',
          created_at: `${w6}T11:00:00.000Z`,
        },
        {
          id: 'demo-visit-002',
          visit_date: w10,
          doctor_name: 'Dr. Sunita Kulkarni',
          hospital: 'Cloudnine Hospital, Whitefield',
          reason: 'First Trimester Follow-up & Lab Review',
          symptoms_discussed: 'Evening nausea and food aversions (tea and garlic)',
          examination_notes: 'BP 112/72. Weight 57 kg. FHR heard via Doppler at 164 bpm.',
          tests_ordered: 'NT Scan & Dual Marker scheduled for Week 12',
          doctor_observations: 'All routine blood panels normal. Hemoglobin 12.8 g/dL, TSH 1.92 mIU/L (normal).',
          medicines_prescribed: 'Continue Folvite 5mg; Doxinate 1 tab before bed as needed for nausea',
          restrictions: 'Avoid strenuous floor workouts; brisk walking allowed',
          diet_advice: 'Small frequent meals every 2 hours. Ginger & cardamom warm water, dry toast.',
          next_appointment: w13,
          questions_for_doctor: 'Can I continue working on laptop? (Yes, take frequent posture breaks)',
          cost: '1000',
          notes: 'Felt emotional hearing the rapid little heartbeat through the Doppler monitor!',
          created_at: `${w10}T10:45:00.000Z`,
        },
        {
          id: 'demo-visit-003',
          visit_date: w13,
          doctor_name: 'Dr. Sunita Kulkarni',
          hospital: 'Cloudnine Hospital, Whitefield',
          reason: 'NT Scan & Dual Marker Test Review',
          symptoms_discussed: 'Energy gradually improving, nausea subsided significantly',
          examination_notes: 'BP 110/68. Weight 58.2 kg. Abdomen soft. Baby active.',
          tests_ordered: 'Quadruple Marker scheduled for Week 16',
          doctor_observations: 'NT thickness 1.3mm (well within safe limits < 2.5mm). Low risk on Dual Marker algorithm.',
          medicines_prescribed: 'Switch from Folvite to Pregnacare Multivitamin + DHA; start Shelcal-500',
          restrictions: 'No forward bending or sudden jerks',
          diet_advice: 'Include almonds, walnuts, paneer, and lentils for rich protein intake',
          next_appointment: w17,
          questions_for_doctor: 'Can I start prenatal yoga? (Yes, from certified prenatal instructor)',
          cost: '1200',
          notes: 'Dr. Sunita was thrilled with the NT scan report. First trimester completed successfully!',
          created_at: `${w13}T11:15:00.000Z`,
        },
        {
          id: 'demo-visit-004',
          visit_date: w17,
          doctor_name: 'Dr. Sunita Kulkarni',
          hospital: 'Cloudnine Hospital, Whitefield',
          reason: 'Second Trimester Checkup & Quadruple Marker Review',
          symptoms_discussed: 'Mild lower back stiffness after long sitting, slight calf tightness',
          examination_notes: 'BP 114/74. Weight 59.8 kg. Fundal height 16 weeks matching dates. FHR 150 bpm.',
          tests_ordered: 'Book Level-II TIFFA Scan for Week 20',
          doctor_observations: 'Quadruple marker screen normal. Low risk for neural tube defects. Added iron supplement.',
          medicines_prescribed: 'Orofer-XT 1 tab after lunch with lemon water (avoid milk/tea near iron)',
          restrictions: 'Avoid sleeping flat on back; use pregnancy pillow for left-lateral sleep',
          diet_advice: 'Include spinach, pomegranate, beetroot, and green leafy vegetables',
          next_appointment: w21,
          questions_for_doctor: 'Is slight fluttering normal? (Doctor confirmed it is early quickening!)',
          cost: '1000',
          notes: 'Doctor confirmed the butterfly flutters I felt are indeed baby movements!',
          created_at: `${w17}T10:30:00.000Z`,
        },
        {
          id: 'demo-visit-005',
          visit_date: w21,
          doctor_name: 'Dr. Sunita Kulkarni',
          hospital: 'Cloudnine Hospital, Whitefield',
          reason: 'Level-II TIFFA Scan Detailed Review',
          symptoms_discussed: 'Feeling distinct rhythmic kicks every evening, especially after dinner',
          examination_notes: 'BP 115/72. Weight 61.2 kg. Fundal height 21 cm. FHR 146 bpm.',
          tests_ordered: '75g Oral Glucose Tolerance Test (OGTT) & Repeat CBC for Week 24',
          doctor_observations: 'TIFFA scan shows completely normal anatomy. Fetal weight 350g. Placenta posterior, liquor adequate.',
          medicines_prescribed: 'Continue Shelcal-500, Orofer-XT, and Pregnacare DHA',
          restrictions: 'Stay hydrated during warm afternoons; avoid dehydration',
          diet_advice: 'Healthy homemade snacks: sprouts chaat, roasted chana, curd with fruit',
          next_appointment: upcomingIn4Days,
          questions_for_doctor: 'Preparation for glucose test (Fast overnight for 8 hours before fasting sample)',
          cost: '1500',
          notes: 'Wonderful consultation! Relieved that all baby organs are developing perfectly.',
          created_at: `${w21}T12:00:00.000Z`,
        },
      ];

    case SHEET_TABS.medicines:
      return [
        {
          id: 'demo-med-001',
          medicine_name: 'Folvite (Folic Acid)',
          dosage: '5 mg',
          frequency: 'Once daily after breakfast',
          start_date: w4,
          end_date: w13,
          prescribed_by: 'Dr. Sunita Kulkarni',
          reason: 'Neural tube development in 1st trimester',
          cost: '85',
          is_active: 'FALSE',
          notes: 'Completed full course as advised.',
          created_at: `${w4}T10:30:00.000Z`,
        },
        {
          id: 'demo-med-002',
          medicine_name: 'Doxinate (Doxylamine + Pyridoxine)',
          dosage: '10mg / 10mg',
          frequency: '1 tablet before bed',
          start_date: w7,
          end_date: w12,
          prescribed_by: 'Dr. Sunita Kulkarni',
          reason: 'Morning and evening nausea relief',
          cost: '120',
          is_active: 'FALSE',
          notes: 'Taken only on days with uncomfortable nausea.',
          created_at: `${w8}T10:30:00.000Z`,
        },
        {
          id: 'demo-med-003',
          medicine_name: 'Shelcal-500 (Calcium + Vit D3)',
          dosage: '500 mg + 250 IU',
          frequency: 'Once daily at bedtime',
          start_date: w13,
          end_date: dueStr,
          prescribed_by: 'Dr. Sunita Kulkarni',
          reason: 'Fetal skeletal & maternal bone health',
          cost: '145',
          is_active: 'TRUE',
          notes: 'Take at night, kept at least 2 hours apart from iron tablet.',
          created_at: `${w13}T11:30:00.000Z`,
        },
        {
          id: 'demo-med-004',
          medicine_name: 'Orofer-XT (Ferrous Ascorbate + Folic Acid)',
          dosage: '100 mg elemental iron',
          frequency: 'Once daily post-lunch with lemon water',
          start_date: w17,
          end_date: dueStr,
          prescribed_by: 'Dr. Sunita Kulkarni',
          reason: 'Hemoglobin support & fetal blood volume increase',
          cost: '210',
          is_active: 'TRUE',
          notes: 'Vitamin C in lemon water aids optimal iron absorption.',
          created_at: `${w17}T11:00:00.000Z`,
        },
        {
          id: 'demo-med-005',
          medicine_name: 'Pregnacare Plus Prenatal DHA',
          dosage: '1 multivitamin tablet + 1 omega-3 capsule',
          frequency: 'Once daily after breakfast',
          start_date: w13,
          end_date: dueStr,
          prescribed_by: 'Dr. Sunita Kulkarni',
          reason: 'Fetal brain & eye development, micronutrients',
          cost: '480',
          is_active: 'TRUE',
          notes: 'Comprehensive prenatal multivitamin with pure omega-3 fish oil.',
          created_at: `${w13}T11:30:00.000Z`,
        },
      ];

    case SHEET_TABS.tests:
      return [
        {
          id: 'demo-test-001',
          test_name: 'Dating Ultrasound Scan (Viability)',
          test_date: w6,
          reason: 'Confirm intrauterine pregnancy & determine accurate gestational age',
          status: 'Completed',
          result_summary: 'Single live intrauterine gestational sac. CRL 5.2 mm. Fetal pole seen. Cardiac activity present. LMP correlated.',
          report_link: '',
          ordered_by: 'Dr. Sunita Kulkarni',
          cost: '1800',
          notes: 'Performed at Cloudnine Diagnostics. Everything on track.',
          created_at: `${w6}T12:00:00.000Z`,
        },
        {
          id: 'demo-test-002',
          test_name: 'First Trimester Combined Screening (NT Scan + Dual Marker)',
          test_date: w12,
          reason: 'Chromosomal risk screening (Trisomy 21, 18, 13)',
          status: 'Completed',
          result_summary: 'Nuchal Translucency (NT) 1.3 mm. Nasal bone visualized. PAPP-A 1.12 MoM, Free β-hCG 0.95 MoM. Low risk screen: Down syndrome risk < 1:10,000.',
          report_link: '',
          ordered_by: 'Dr. Sunita Kulkarni',
          cost: '3800',
          notes: 'Excellent scan report. Both sonographer and doctor very pleased.',
          created_at: `${w12}T15:00:00.000Z`,
        },
        {
          id: 'demo-test-003',
          test_name: 'First Trimester Blood Profile & Thyroid Panel',
          test_date: w8,
          reason: 'Baseline maternal health evaluation',
          status: 'Completed',
          result_summary: 'Hb: 12.8 g/dL, Blood Group: B Positive, TSH: 1.92 mIU/L, Fasting Blood Sugar: 86 mg/dL, Rubella IgG: 45 IU/mL (Immune), VDRL: Non-reactive, HIV/HBsAg/HCV: Negative.',
          report_link: '',
          ordered_by: 'Dr. Sunita Kulkarni',
          cost: '1400',
          notes: 'All baseline laboratory values are in healthy optimal reference range.',
          created_at: `${w8}T14:30:00.000Z`,
        },
        {
          id: 'demo-test-004',
          test_name: 'Quadruple Marker Blood Test',
          test_date: w16,
          reason: 'Second trimester neural tube & genetic screening',
          status: 'Completed',
          result_summary: 'AFP, hCG, uE3, and Inhibin-A all normal. Screen negative for open neural tube defects and chromosomal anomalies.',
          report_link: '',
          ordered_by: 'Dr. Sunita Kulkarni',
          cost: '2600',
          notes: 'Normal risk cutoff.',
          created_at: `${w16}T16:00:00.000Z`,
        },
        {
          id: 'demo-test-005',
          test_name: 'Level-II TIFFA Scan (Targeted Imaging for Fetal Anomalies)',
          test_date: w20,
          reason: 'Detailed anatomical survey of all fetal organ systems',
          status: 'Completed',
          result_summary: 'Fetal brain, 4-chamber heart, stomach bubble, bilateral kidneys, urinary bladder, intact spine, and 3-vessel umbilical cord visualized normal. Posterior placenta Grade-1. AFI 14.2 cm. Est. fetal weight 350g.',
          report_link: '',
          ordered_by: 'Dr. Sunita Kulkarni',
          cost: '4200',
          notes: 'Comprehensive 45-minute sonogram. Doctor showed us baby sucking thumb!',
          created_at: `${w20}T14:00:00.000Z`,
        },
        {
          id: 'demo-test-006',
          test_name: '75g Oral Glucose Tolerance Test (OGTT)',
          test_date: upcomingIn4Days,
          reason: 'Gestational Diabetes Mellitus (GDM) screening at 24 weeks',
          status: 'Ordered',
          result_summary: 'Awaiting appointment test. Will take fasting, 1-hr, and 2-hr blood samples.',
          report_link: '',
          ordered_by: 'Dr. Sunita Kulkarni',
          cost: '850',
          notes: 'Fast 8-10 hours prior to the test.',
          created_at: `${w22}T10:00:00.000Z`,
        },
      ];

    case SHEET_TABS.healthStats:
      return [
        {
          id: 'demo-health-001',
          recorded_date: w6,
          weight_kg: '56.5',
          bp_systolic: '110',
          bp_diastolic: '70',
          blood_sugar: '88',
          temperature: '36.6',
          hemoglobin: '12.8',
          notes: 'Pre-pregnancy baseline check at Cloudnine OPD.',
          created_at: `${w6}T10:00:00.000Z`,
        },
        {
          id: 'demo-health-002',
          recorded_date: w10,
          weight_kg: '57.0',
          bp_systolic: '112',
          bp_diastolic: '72',
          blood_sugar: '86',
          temperature: '36.5',
          hemoglobin: '12.6',
          notes: 'Weight steady, mild nausea managed with dry crackers and lemon water.',
          created_at: `${w10}T10:00:00.000Z`,
        },
        {
          id: 'demo-health-003',
          recorded_date: w14,
          weight_kg: '58.2',
          bp_systolic: '110',
          bp_diastolic: '68',
          blood_sugar: '90',
          temperature: '36.6',
          hemoglobin: '12.4',
          notes: 'Entered second trimester feeling energetic. Appetite returning.',
          created_at: `${w14}T10:00:00.000Z`,
        },
        {
          id: 'demo-health-004',
          recorded_date: w18,
          weight_kg: '59.8',
          bp_systolic: '114',
          bp_diastolic: '74',
          blood_sugar: '92',
          temperature: '36.7',
          hemoglobin: '12.2',
          notes: 'Healthy steady gestational weight gain. Blood pressure optimal.',
          created_at: `${w18}T10:00:00.000Z`,
        },
        {
          id: 'demo-health-005',
          recorded_date: w22,
          weight_kg: '61.2',
          bp_systolic: '115',
          bp_diastolic: '72',
          blood_sugar: '91',
          temperature: '36.6',
          hemoglobin: '12.0',
          notes: 'Hydration 3L/day. Walking 30 mins in the society garden every morning.',
          created_at: `${w22}T10:00:00.000Z`,
        },
        {
          id: 'demo-health-006',
          recorded_date: w24,
          weight_kg: '62.0',
          bp_systolic: '116',
          bp_diastolic: '74',
          blood_sugar: '92',
          temperature: '36.6',
          hemoglobin: '12.1',
          notes: 'Latest vitals. Feeling calm and energized. Baby kicks very active.',
          created_at: `${w24}T09:00:00.000Z`,
        },
      ];

    case SHEET_TABS.babyStats:
      return [
        {
          id: 'demo-baby-001',
          recorded_date: w8,
          baby_weight_grams: '',
          fhr_bpm: '164',
          bpd_mm: '',
          fl_mm: '',
          ac_mm: '',
          hc_mm: '',
          movement_felt: 'FALSE',
          movement_count: '',
          notes: 'Dating ultrasound. Tiny embryo with strong steady cardiac rhythm.',
          created_at: `${w8}T11:00:00.000Z`,
        },
        {
          id: 'demo-baby-002',
          recorded_date: w12,
          baby_weight_grams: '55',
          fhr_bpm: '158',
          bpd_mm: '21',
          fl_mm: '10',
          ac_mm: '60',
          hc_mm: '76',
          movement_felt: 'FALSE',
          movement_count: '',
          notes: 'NT Scan. Crown-Rump Length 5.6 cm. Little arms and legs moving vigorously.',
          created_at: `${w12}T11:00:00.000Z`,
        },
        {
          id: 'demo-baby-003',
          recorded_date: w16,
          baby_weight_grams: '145',
          fhr_bpm: '150',
          bpd_mm: '35',
          fl_mm: '22',
          ac_mm: '108',
          hc_mm: '128',
          movement_felt: 'FALSE',
          movement_count: '',
          notes: 'Routine checkup Doppler. Heart sound clear and rhythmic like galloping horse.',
          created_at: `${w16}T11:00:00.000Z`,
        },
        {
          id: 'demo-baby-004',
          recorded_date: w20,
          baby_weight_grams: '350',
          fhr_bpm: '146',
          bpd_mm: '48',
          fl_mm: '33',
          ac_mm: '154',
          hc_mm: '178',
          movement_felt: 'TRUE',
          movement_count: '',
          notes: 'Level-II TIFFA Scan. Est. weight 350 grams. Baby sucking thumb during ultrasound!',
          created_at: `${w20}T11:00:00.000Z`,
        },
        {
          id: 'demo-baby-005',
          recorded_date: w24,
          baby_weight_grams: '660',
          fhr_bpm: '144',
          bpd_mm: '59',
          fl_mm: '43',
          ac_mm: '198',
          hc_mm: '224',
          movement_felt: 'TRUE',
          movement_count: '8',
          notes: 'Week 24 milestone. Baby is the size of a cantaloupe / corn (~30 cm). Strong evening kicks!',
          created_at: `${w24}T09:30:00.000Z`,
        },
      ];

    case SHEET_TABS.appointments:
      return [
        {
          id: 'demo-appt-001',
          appointment_date: w6,
          appointment_time: '10:30 AM',
          doctor_name: 'Dr. Sunita Kulkarni',
          hospital: 'Cloudnine Hospital, Whitefield',
          purpose: 'First Prenatal Consultation & Confirmation Dating Scan',
          status: 'Completed',
          cost: '1200',
          notes: 'Initial checkup completed smoothly.',
          created_at: `${w4}T10:00:00.000Z`,
        },
        {
          id: 'demo-appt-002',
          appointment_date: w12,
          appointment_time: '02:00 PM',
          doctor_name: 'Dr. Sunita Kulkarni',
          hospital: 'Cloudnine Hospital, Whitefield',
          purpose: 'First Trimester NT Scan & Dual Marker Screening',
          status: 'Completed',
          cost: '3800',
          notes: 'All results normal low risk.',
          created_at: `${w10}T10:00:00.000Z`,
        },
        {
          id: 'demo-appt-003',
          appointment_date: w20,
          appointment_time: '11:15 AM',
          doctor_name: 'Dr. Sunita Kulkarni',
          hospital: 'Cloudnine Hospital, Whitefield',
          purpose: 'Level-II TIFFA Scan (Target Scan)',
          status: 'Completed',
          cost: '4200',
          notes: 'Complete anatomical scan clear.',
          created_at: `${w17}T10:00:00.000Z`,
        },
        {
          id: 'demo-appt-004',
          appointment_date: upcomingIn4Days,
          appointment_time: '09:00 AM',
          doctor_name: 'Dr. Sunita Kulkarni',
          hospital: 'Cloudnine Hospital, Whitefield',
          purpose: '24-Week Routine Checkup & 75g Glucose Screening (OGTT)',
          status: 'Upcoming',
          cost: '2050',
          notes: 'Remember overnight fasting for 8-10 hours prior to the morning test.',
          created_at: `${w22}T10:00:00.000Z`,
        },
        {
          id: 'demo-appt-005',
          appointment_date: upcomingIn21Days,
          appointment_time: '10:30 AM',
          doctor_name: 'Dr. Sunita Kulkarni',
          hospital: 'Cloudnine Hospital, Whitefield',
          purpose: '27-Week Third Trimester Growth Scan & Anti-D review',
          status: 'Upcoming',
          cost: '2500',
          notes: 'Entering the third trimester milestone!',
          created_at: `${w22}T10:00:00.000Z`,
        },
      ];

    case SHEET_TABS.milestones:
      return [
        {
          id: 'demo-ms-001',
          milestone_type: 'First Positive Test',
          milestone_date: w4,
          pregnancy_week: '4',
          description: 'Two bright pink lines on the home pregnancy test! Pure joy, happy tears, and heartfelt gratitude.',
          notes: 'Shared the news with Rohan first thing in the morning. A sacred new chapter begins.',
          created_at: `${w4}T08:00:00.000Z`,
        },
        {
          id: 'demo-ms-002',
          milestone_type: 'First Heartbeat',
          milestone_date: w8,
          pregnancy_week: '8',
          description: 'Heard our baby’s heartbeat for the very first time at Cloudnine: 164 bpm! Sounds like gentle galloping hooves.',
          notes: 'Both of us couldn’t stop smiling. The most magical audio we have ever heard.',
          created_at: `${w8}T12:00:00.000Z`,
        },
        {
          id: 'demo-ms-003',
          milestone_type: 'NT Scan',
          milestone_date: w12,
          pregnancy_week: '12',
          description: 'Saw baby waving tiny hands on the high-resolution ultrasound screen! NT scan 1.3 mm, perfectly healthy.',
          notes: 'Doctor printed out our first baby ultrasound keepsake photograph.',
          created_at: `${w12}T16:00:00.000Z`,
        },
        {
          id: 'demo-ms-004',
          milestone_type: 'Custom',
          milestone_date: w14,
          pregnancy_week: '14',
          description: 'Welcome Second Trimester! The nauseous fog of trimester 1 has officially lifted.',
          notes: 'Celebrated with sweet tender coconut water and mom’s homemade sooji kheer.',
          created_at: `${w14}T18:00:00.000Z`,
        },
        {
          id: 'demo-ms-005',
          milestone_type: 'First Baby Movement',
          milestone_date: w18,
          pregnancy_week: '18',
          description: 'Felt the very first flutter (quickening)! Like tiny butterfly wings brushing from the inside.',
          notes: 'Happened at 8:45 PM while relaxing on the balcony listening to classical flute.',
          created_at: `${w18}T21:00:00.000Z`,
        },
        {
          id: 'demo-ms-006',
          milestone_type: 'Anatomy Scan',
          milestone_date: w20,
          pregnancy_week: '20',
          description: 'Level-II TIFFA Scan Cleared! 20 Weeks Milestone — Halfway through our journey!',
          notes: 'Every organ and little finger checked. Baby is thriving at 350 grams.',
          created_at: `${w20}T15:00:00.000Z`,
        },
      ];

    case SHEET_TABS.notes:
      return [
        {
          id: 'demo-note-001',
          note_date: w6,
          title: 'Morning Nausea Remedies & Hydration',
          content: 'Tender coconut water in the morning works wonders. Keeping roasted makhana and dry whole-wheat toast by the bedside table to nibble on before getting out of bed.',
          category: 'Symptom',
          created_at: `${w6}T08:30:00.000Z`,
        },
        {
          id: 'demo-note-002',
          note_date: w10,
          title: 'Doctor Questions for Next Visit',
          content: '1. Can I practice seated yoga asanas? (Dr. Sunita approved gentle butterfly pose and cat-cow).\n2. Safe sleep posture: starting to train sleeping on left side with bolster.\n3. Saffron in warm milk: 1-2 strands occasionally is fine.',
          category: 'Question',
          created_at: `${w10}T19:00:00.000Z`,
        },
        {
          id: 'demo-note-003',
          note_date: w15,
          title: 'Food Cravings & Indian Prenatal Nutrition',
          content: 'Craving warm moong dal khichdi with a dash of homemade ghee, crunchy cucumber chaat with lemon, and sweet seasonal pomegranates. Avoiding street chaat; making everything fresh at home.',
          category: 'Diet',
          created_at: `${w15}T13:00:00.000Z`,
        },
        {
          id: 'demo-note-004',
          note_date: w21,
          title: 'Evening Kick Activity & Music Sessions',
          content: 'Baby responds noticeably whenever we play soft instrumental music or sitar in the evening between 8:30 PM and 9:30 PM. Rohan placed his hand on the belly and felt a distinct gentle kick for the first time!',
          category: 'Mood',
          created_at: `${w21}T21:30:00.000Z`,
        },
        {
          id: 'demo-note-005',
          note_date: w23,
          title: 'Godh Bharai (Seemant) Planning & Nursery Checklist',
          content: 'Mummy and Di called to discuss the traditional Godh Bharai ceremony planned for the 7th month (Week 30). Shortlisted pure organic cotton jhablas, muslin swaddles, mustard seed baby pillow, and soft wooden crib.',
          category: 'General',
          created_at: `${w23}T17:00:00.000Z`,
        },
      ];

    case SHEET_TABS.reports:
      return [
        {
          id: 'demo-rep-001',
          report_type: 'Level-II TIFFA Scan',
          report_date: w20,
          file_name: 'TIFFA_Anomaly_Scan_Week20_Cloudnine.pdf',
          drive_file_id: 'demo-drive-file-001',
          drive_link: '#',
          observations: 'Normal anatomy survey. Four-chamber heart, kidneys, spine intact. AFI 14.2cm. Placenta posterior.',
          notes: 'Verified by Dr. Sunita Kulkarni.',
          created_at: `${w20}T15:00:00.000Z`,
        },
        {
          id: 'demo-rep-002',
          report_type: 'First Trimester NT Scan & Dual Marker',
          report_date: w12,
          file_name: 'NT_Scan_Dual_Marker_Week12.pdf',
          drive_file_id: 'demo-drive-file-002',
          drive_link: '#',
          observations: 'NT 1.3mm, nasal bone present. Down syndrome risk < 1:10000.',
          notes: 'Low risk screen.',
          created_at: `${w12}T15:00:00.000Z`,
        },
      ];

    case SHEET_TABS.config:
      return [
        { key: 'initialized', value: 'TRUE' },
        { key: 'mother_name', value: 'Priya Sharma' },
        { key: 'partner_name', value: 'Rohan Sharma' },
        { key: 'created_at', value: `${w4}T08:00:00.000Z` },
      ];

    default:
      return [];
  }
}

// In-memory overrides for interactive testing in Demo mode
const demoOverrides = new Map<string, Record<string, string>>();

export function updateDemoSheetRow(tabName: string, id: string, data: Record<string, string>): void {
  const existing = getDemoSheetRowById(tabName, id) || {};
  demoOverrides.set(`${tabName}:${id}`, { ...existing, ...data });
}

export function getDemoSheetRows(tabName: string): Record<string, string>[] {
  const rows = getRawDemoSheetRows(tabName);
  return rows.map((row) => {
    const key = row.id ? `${tabName}:${row.id}` : (row.key ? `${tabName}:${row.key}` : null);
    if (key && demoOverrides.has(key)) {
      return { ...row, ...demoOverrides.get(key) };
    }
    return row;
  });
}

export function getDemoSheetRowById(tabName: string, id: string): Record<string, string> | null {
  const rows = getDemoSheetRows(tabName);
  return rows.find((r) => r.id === id) || null;
}


