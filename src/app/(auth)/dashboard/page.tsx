'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Plus, X, Check, Sparkles, TrendingUp, ShieldCheck, Heart, Award } from 'lucide-react';
import { getPregnancyInfo, getTrimesterLabel, getBabyMilestone } from '@/lib/pregnancy';
import { getPostpartumGuide, formatBabyAge } from '@/lib/postpartum';
import { formatDate, formatDateShort, formatRelativeDate, getGreeting, generateId, now } from '@/lib/utils';
import JourneyLoader from '@/components/JourneyLoader';
import { useSheetData, invalidateSheetTab } from '@/lib/useSheetData';
import { BABY_MILESTONE_CATALOG } from '@/lib/types';
import type {
  PregnancyProfile,
  HealthStats,
  BabyStats,
  Appointment,
  Medicine,
  TimelineEntry,
  BabyProfile,
  ChildGrowth,
  VaccinationRecord,
  BabyMilestone,
  VaccineStatus,
} from '@/lib/types';
import styles from './page.module.css';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  // Pregnancy & core sheets
  const { data: pregRows, isLoading: pregLoading } = useSheetData('Pregnancy');
  const { data: healthRows } = useSheetData('HealthStats');
  const { data: babyRows } = useSheetData('BabyStats');
  const { data: apptRows } = useSheetData('Appointments');
  const { data: medRows } = useSheetData('Medicines');
  const { data: visitRows } = useSheetData('DoctorVisits');

  // Postpartum sheets
  const { data: babyProfileRows } = useSheetData('BabyProfile');
  const { data: babyMilestoneRows } = useSheetData('BabyMilestones');
  const { data: vaccineRows } = useSheetData('Vaccinations');
  const { data: growthRows } = useSheetData('ChildGrowth');

  const [activeView, setActiveView] = useState<'postpartum' | 'pregnancy'>('postpartum');

  // Delivery & baby edit modal state
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryDateInput, setDeliveryDateInput] = useState('');
  const [babyNameInput, setBabyNameInput] = useState('');
  const [babyGenderInput, setBabyGenderInput] = useState<'Boy' | 'Girl' | 'Other' | 'Unknown'>('Boy');
  const [birthWeightInput, setBirthWeightInput] = useState('');
  const [birthLengthInput, setBirthLengthInput] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  const { pregnancy, pregnancyInfo } = useMemo(() => {
    if (!pregRows || pregRows.length === 0) {
      return { pregnancy: null, pregnancyInfo: null };
    }
    const row = pregRows[0];
    const profile: PregnancyProfile = {
      id: row.id,
      lmpDate: row.lmp_date,
      dueDate: row.due_date,
      deliveryDate: row.delivery_date || undefined,
      bloodGroup: row.blood_group,
      rhFactor: row.rh_factor,
      pregnancyType: row.pregnancy_type as PregnancyProfile['pregnancyType'],
      previousPregnancies: Number(row.previous_pregnancies) || 0,
      previousDeliveries: Number(row.previous_deliveries) || 0,
      allergies: row.allergies,
      medicalConditions: row.medical_conditions,
      primaryDoctor: row.primary_doctor,
      primaryHospital: row.primary_hospital,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return {
      pregnancy: profile,
      pregnancyInfo: getPregnancyInfo(profile.lmpDate, profile.deliveryDate),
    };
  }, [pregRows]);

  const babyProfile = useMemo<BabyProfile | null>(() => {
    if (!babyProfileRows || babyProfileRows.length === 0) return null;
    const row = babyProfileRows[0];
    return {
      id: row.id,
      babyName: row.baby_name || '',
      gender: (row.gender as BabyProfile['gender']) || 'Unknown',
      birthDate: row.birth_date || '',
      birthTime: row.birth_time || '',
      birthWeightGrams: row.birth_weight_grams ? Number(row.birth_weight_grams) : null,
      birthLengthCm: row.birth_length_cm ? Number(row.birth_length_cm) : null,
      birthHeadCircumferenceCm: row.birth_head_circumference_cm ? Number(row.birth_head_circumference_cm) : null,
      deliveryType: row.delivery_type as BabyProfile['deliveryType'],
      bloodGroup: row.blood_group || '',
      pediatricianName: row.pediatrician_name || '',
      hospitalName: row.hospital_name || '',
      notes: row.notes || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }, [babyProfileRows]);

  const latestGrowth = useMemo<ChildGrowth | null>(() => {
    if (!growthRows || growthRows.length === 0) return null;
    const sorted = [...growthRows].sort(
      (a, b) => new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime()
    );
    const latest = sorted[sorted.length - 1];
    return {
      id: latest.id,
      recordedDate: latest.recorded_date,
      babyAgeDays: Number(latest.baby_age_days) || 0,
      weightKg: latest.weight_kg ? Number(latest.weight_kg) : null,
      lengthCm: latest.length_cm ? Number(latest.length_cm) : null,
      headCircumferenceCm: latest.head_circumference_cm ? Number(latest.head_circumference_cm) : null,
      notes: latest.notes,
      createdAt: latest.created_at,
    };
  }, [growthRows]);

  const vaccineSummary = useMemo(() => {
    if (!vaccineRows || vaccineRows.length === 0) {
      return { upcoming: [], givenCount: 0, totalCount: 0, nextDue: null };
    }
    const parsed: VaccinationRecord[] = vaccineRows.map((r) => ({
      id: r.id,
      vaccineName: r.vaccine_name,
      doseNumber: r.dose_number,
      targetDisease: r.target_disease,
      recommendedAgeStr: r.recommended_age_str,
      recommendedAgeDays: Number(r.recommended_age_days) || 0,
      dueDate: r.due_date,
      status: (r.status as VaccineStatus) || 'Scheduled',
      givenDate: r.given_date,
      doctorName: r.doctor_name,
      hospital: r.hospital,
      batchNo: r.batch_no,
      reactions: r.reactions,
      cost: r.cost,
      notes: r.notes,
      createdAt: r.created_at,
    }));

    const givenCount = parsed.filter((v) => v.status === 'Given').length;
    const pending = parsed
      .filter((v) => v.status !== 'Given')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const nextDue = pending[0] || null;

    return {
      upcoming: pending.slice(0, 3),
      givenCount,
      totalCount: parsed.length,
      nextDue,
    };
  }, [vaccineRows]);

  const babyMilestones = useMemo<BabyMilestone[]>(() => {
    if (!babyMilestoneRows) return [];
    return babyMilestoneRows
      .map((r) => ({
        id: r.id,
        milestoneKey: r.milestone_key,
        title: r.title,
        category: r.category,
        achievedDate: r.achieved_date,
        babyAgeDays: Number(r.baby_age_days) || 0,
        babyAgeDisplay: r.baby_age_display,
        notes: r.notes,
        driveFileId: r.drive_file_id,
        driveLink: r.drive_link,
        createdAt: r.created_at,
      }))
      .sort((a, b) => new Date(b.achievedDate).getTime() - new Date(a.achievedDate).getTime());
  }, [babyMilestoneRows]);

  const nextExpectedMilestone = useMemo(() => {
    const achievedKeys = new Set(babyMilestones.map((m) => m.milestoneKey));
    const unachieved = BABY_MILESTONE_CATALOG.filter(
      (item) => item.key !== 'custom' && !achievedKeys.has(item.key)
    );
    if (unachieved.length === 0) return null;
    const sorted = [...unachieved].sort((a, b) => a.expectedAgeDays - b.expectedAgeDays);
    return sorted[0];
  }, [babyMilestones]);

  const postpartumGuide = useMemo(() => {
    if (!pregnancyInfo?.postpartumWeek) return null;
    return getPostpartumGuide(pregnancyInfo.postpartumWeek);
  }, [pregnancyInfo?.postpartumWeek]);

  const openDeliveryModal = () => {
    setDeliveryDateInput(
      pregnancy?.deliveryDate || new Date().toISOString().split('T')[0]
    );
    setBabyNameInput(babyProfile?.babyName || '');
    setBabyGenderInput(babyProfile?.gender || 'Boy');
    setBirthWeightInput(babyProfile?.birthWeightGrams ? String(babyProfile.birthWeightGrams) : '3200');
    setBirthLengthInput(babyProfile?.birthLengthCm ? String(babyProfile.birthLengthCm) : '50');
    setShowDeliveryModal(true);
  };

  const handleSaveDeliveryDate = async (newDate: string) => {
    if (!pregnancy?.id) return;
    setModalSaving(true);
    try {
      // 1. Update Pregnancy table
      const res = await fetch(`/api/sheets/Pregnancy/${pregnancy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_date: newDate,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to update delivery date');

      // 2. Save or update BabyProfile if newDate is set
      if (newDate && newDate.trim() !== '') {
        const babyPayload = {
          baby_name: babyNameInput.trim() || 'Baby',
          gender: babyGenderInput,
          birth_date: newDate,
          birth_weight_grams: birthWeightInput.trim() || '3200',
          birth_length_cm: birthLengthInput.trim() || '50',
          updated_at: new Date().toISOString(),
        };

        if (babyProfile?.id) {
          await fetch(`/api/sheets/BabyProfile/${babyProfile.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(babyPayload),
          });
        } else {
          await fetch('/api/sheets/BabyProfile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: generateId(),
              ...babyPayload,
              created_at: now(),
            }),
          });
        }

        // If no growth entries exist, seed birth growth measurement
        if (!growthRows || growthRows.length === 0) {
          await fetch('/api/sheets/ChildGrowth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: generateId(),
              recorded_date: newDate,
              baby_age_days: '0',
              weight_kg: birthWeightInput ? String(Number(birthWeightInput) / 1000) : '3.2',
              length_cm: birthLengthInput || '50',
              head_circumference_cm: '34.5',
              notes: 'Birth measurement recorded at delivery.',
              created_at: now(),
            }),
          });
          await invalidateSheetTab('ChildGrowth');
        }
      }

      await invalidateSheetTab('Pregnancy');
      await invalidateSheetTab('BabyProfile');
      await invalidateSheetTab('Vaccinations');
      setShowDeliveryModal(false);
    } catch (err) {
      console.error('Error saving delivery date & baby details:', err);
      alert('Failed to save delivery date. Please try again.');
    } finally {
      setModalSaving(false);
    }
  };

  const previewDiffDays = useMemo(() => {
    if (!pregnancy?.dueDate || !deliveryDateInput) return null;
    const due = new Date(pregnancy.dueDate);
    const deliv = new Date(deliveryDateInput);
    if (isNaN(deliv.getTime()) || isNaN(due.getTime())) return null;
    return Math.floor((deliv.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  }, [pregnancy?.dueDate, deliveryDateInput]);

  const previewGestation = useMemo(() => {
    if (!pregnancy?.lmpDate || !deliveryDateInput) return null;
    const lmp = new Date(pregnancy.lmpDate);
    const deliv = new Date(deliveryDateInput);
    if (isNaN(deliv.getTime()) || isNaN(lmp.getTime())) return null;
    const totalDays = Math.max(0, Math.floor((deliv.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24)));
    const w = Math.floor(totalDays / 7);
    const d = totalDays % 7;
    return { w, d, totalDays };
  }, [pregnancy?.lmpDate, deliveryDateInput]);

  const latestHealth = useMemo<HealthStats | null>(() => {
    if (!healthRows || healthRows.length === 0) return null;
    const latest = healthRows[healthRows.length - 1];
    return {
      id: latest.id,
      recordedDate: latest.recorded_date,
      weightKg: latest.weight_kg ? Number(latest.weight_kg) : null,
      bpSystolic: latest.bp_systolic ? Number(latest.bp_systolic) : null,
      bpDiastolic: latest.bp_diastolic ? Number(latest.bp_diastolic) : null,
      bloodSugar: latest.blood_sugar ? Number(latest.blood_sugar) : null,
      temperature: latest.temperature ? Number(latest.temperature) : null,
      hemoglobin: latest.hemoglobin ? Number(latest.hemoglobin) : null,
      notes: latest.notes,
      createdAt: latest.created_at,
    };
  }, [healthRows]);

  const latestBaby = useMemo<BabyStats | null>(() => {
    if (!babyRows || babyRows.length === 0) return null;
    const latest = babyRows[babyRows.length - 1];
    return {
      id: latest.id,
      recordedDate: latest.recorded_date,
      babyWeightGrams: latest.baby_weight_grams ? Number(latest.baby_weight_grams) : null,
      fhrBpm: latest.fhr_bpm ? Number(latest.fhr_bpm) : null,
      bpdMm: latest.bpd_mm ? Number(latest.bpd_mm) : null,
      flMm: latest.fl_mm ? Number(latest.fl_mm) : null,
      acMm: latest.ac_mm ? Number(latest.ac_mm) : null,
      hcMm: latest.hc_mm ? Number(latest.hc_mm) : null,
      movementFelt: latest.movement_felt === 'TRUE',
      movementCount: latest.movement_count ? Number(latest.movement_count) : null,
      notes: latest.notes,
      createdAt: latest.created_at,
    };
  }, [babyRows]);

  const upcomingAppointments = useMemo<Appointment[]>(() => {
    if (!apptRows) return [];
    const today = new Date().toISOString().split('T')[0];
    return apptRows
      .filter((a) => a.status === 'Upcoming' && a.appointment_date >= today)
      .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
      .slice(0, 3)
      .map((a): Appointment => ({
        id: a.id,
        appointmentDate: a.appointment_date,
        appointmentTime: a.appointment_time,
        doctorName: a.doctor_name,
        hospital: a.hospital,
        purpose: a.purpose,
        status: a.status as Appointment['status'],
        notes: a.notes,
        createdAt: a.created_at,
      }));
  }, [apptRows]);

  const activeMedicines = useMemo<Medicine[]>(() => {
    if (!medRows) return [];
    return medRows
      .filter((m) => m.is_active === 'TRUE')
      .map((m): Medicine => ({
        id: m.id,
        medicineName: m.medicine_name,
        dosage: m.dosage,
        frequency: m.frequency,
        startDate: m.start_date,
        endDate: m.end_date,
        prescribedBy: m.prescribed_by,
        reason: m.reason,
        isActive: true,
        notes: m.notes,
        createdAt: m.created_at,
      }));
  }, [medRows]);

  const recentTimeline = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [];
    if (visitRows) {
      visitRows.forEach((v) => {
        entries.push({
          id: v.id,
          date: v.visit_date,
          type: 'doctor-visit',
          title: `Doctor Visit — ${v.doctor_name || 'Doctor'}`,
          subtitle: v.reason || v.doctor_observations || '',
          icon: '🩺',
          color: 'var(--color-cat-doctor)',
          data: v,
        });
      });
    }
    if (healthRows) {
      healthRows.forEach((h) => {
        const parts: string[] = [];
        if (h.bp_systolic && h.bp_diastolic) parts.push(`BP ${h.bp_systolic}/${h.bp_diastolic}`);
        if (h.weight_kg) parts.push(`Weight ${h.weight_kg} kg`);
        if (h.temperature) parts.push(`Temp ${h.temperature} °C`);
        entries.push({
          id: h.id,
          date: h.recorded_date,
          type: 'health-stats',
          title: 'Health Measurement',
          subtitle: parts.join(' • ') || 'Recorded',
          icon: '❤️',
          color: 'var(--color-cat-health)',
          data: h,
        });
      });
    }
    entries.sort((a, b) => b.date.localeCompare(a.date));
    return entries.slice(0, 5);
  }, [visitRows, healthRows]);

  const loading = status === 'loading' || (pregLoading && !pregRows);
  const greeting = getGreeting();
  const firstName = session?.user?.name?.split(' ')[0] || '';

  if (!loading && !pregnancy) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.setupPrompt}>
          <div className={styles.setupLogoWrapper}>
            <Image
              src="/bump-book.png"
              alt="Bump Book"
              width={140}
              height={140}
              priority
              className={styles.setupLogoImage}
            />
          </div>
          <h1 className={styles.setupTitle}>Welcome to Bump Book!</h1>
          <p className={styles.setupSubtitle}>
            Let&apos;s set up your pregnancy profile to get started. This will
            take less than a minute.
          </p>
          <Link href="/onboarding" className={styles.setupButton}>
            Set Up Your Journey
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <JourneyLoader
          message="Loading your dashboard..."
          subMessage="Fetching your latest records and baby milestones"
          cycle
          size="card"
        />
      </div>
    );
  }

  const isPostpartumMode = Boolean(pregnancyInfo?.isDelivered && activeView === 'postpartum');

  return (
    <div className={styles.dashboard}>
      {/* ─── Mode Switcher (When Delivered) ─── */}
      {pregnancyInfo?.isDelivered && (
        <div className={styles.modeSwitcher}>
          <button
            type="button"
            className={`${styles.modeBtn} ${activeView === 'postpartum' ? styles.modeBtnActive : ''}`}
            onClick={() => setActiveView('postpartum')}
          >
            <span>🍼 Baby & Postpartum</span>
            <span className={styles.modeBadge}>Active</span>
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${activeView === 'pregnancy' ? styles.modeBtnActive : ''}`}
            onClick={() => setActiveView('pregnancy')}
          >
            <span>🤰 Pregnancy Archive</span>
          </button>
        </div>
      )}

      {/* ─── Greeting ─── */}
      <div className={styles.greeting}>
        <p className={styles.greetingDiaryTag}>
          {isPostpartumMode
            ? 'our postpartum journey & baby memories 🍼'
            : 'our personal motherhood diary ✨'}
        </p>
        <h1 className={styles.greetingText}>
          {greeting}, <span className={styles.greetingName}>{firstName}</span>{' '}
          <span className={styles.greetingEmoji}>
            {isPostpartumMode ? '🍼' : '👋'}
          </span>
        </h1>
        {pregnancyInfo && (
          <div className={styles.greetingMetaRow}>
            {pregnancyInfo.isDelivered ? (
              <>
                <span className={styles.greetingDuePill}>
                  Delivered {formatDate(pregnancyInfo.deliveryDate!)} 🎉
                </span>
                <span className={styles.deliveredHandwritten}>
                  {babyProfile?.babyName ? `${babyProfile.babyName} arrived safely! ` : 'Welcome baby! '}
                  {pregnancyInfo.daysEarlyOrLate && pregnancyInfo.daysEarlyOrLate < 0
                    ? `(${Math.abs(pregnancyInfo.daysEarlyOrLate)} days early • Wk ${pregnancyInfo.deliveryWeek}+${pregnancyInfo.deliveryDay}d)`
                    : pregnancyInfo.daysEarlyOrLate && pregnancyInfo.daysEarlyOrLate > 0
                    ? `(${pregnancyInfo.daysEarlyOrLate} days past due • Wk ${pregnancyInfo.deliveryWeek}+${pregnancyInfo.deliveryDay}d)`
                    : `(On expected due date!)`} 🍼
                </span>
                <span className={styles.greetingDuePill}>
                  Baby is {formatBabyAge(pregnancyInfo.babyAgeDays || 0)} 💕
                </span>
                <button
                  type="button"
                  onClick={openDeliveryModal}
                  className={styles.deliveryMetaAction}
                  title="Edit delivery and baby details"
                >
                  ✏️ Edit Baby & Delivery
                </button>
              </>
            ) : (
              <>
                <span className={styles.greetingDuePill}>
                  Due {formatDate(pregnancy!.dueDate)}
                </span>
                <span className={styles.handwrittenCountdown}>
                  ~{pregnancyInfo.daysRemaining} sweet days until we meet you! 💕
                </span>
                <button
                  type="button"
                  onClick={openDeliveryModal}
                  className={styles.deliveryMetaAction}
                  title="If delivery happened before expected date (or today), record it here"
                >
                  🍼 Baby arrived? Record delivery date
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          POSTPARTUM VIEW (Mother & Child Dual Dashboard)
         ═══════════════════════════════════════════════════════════════════ */}
      {isPostpartumMode && (
        <>
          {/* ─── Hero Postpartum Banner ─── */}
          <div className={styles.postpartumHero}>
            <div className={styles.postpartumHeroTop}>
              <div className={styles.babyProfileHeader}>
                <div className={styles.babyAvatarBox}>
                  {babyProfile?.gender === 'Girl' ? '🎀' : '👶'}
                </div>
                <div className={styles.babyDetailsCol}>
                  <h2 className={styles.babyNameHeading}>
                    {babyProfile?.babyName || 'Little Miracle'}
                  </h2>
                  <div className={styles.babyAgeTagline}>
                    <span>Age:</span>
                    <span className={styles.babyAgeHighlight}>
                      {formatBabyAge(pregnancyInfo?.babyAgeDays || 0)}
                    </span>
                    <span>•</span>
                    <span>
                      Born {formatDateShort(pregnancyInfo!.deliveryDate!)}
                      {babyProfile?.birthWeightGrams && ` (${(babyProfile.birthWeightGrams / 1000).toFixed(2)} kg)`}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.heroPostpartumWeekBadge}>
                <span>💕</span>
                <span>Week {pregnancyInfo?.postpartumWeek} Postpartum</span>
              </div>
            </div>

            {/* Postpartum Recovery Pearl */}
            {postpartumGuide && (
              <div className={styles.postpartumGuideBox}>
                <div className={styles.guideHeadlineRow}>
                  <p className={styles.guideHeadline}>{postpartumGuide.headline}</p>
                  <span className={styles.guidePillAction}>Tip: {postpartumGuide.keyAction}</span>
                </div>
                <div className={styles.guideGrid}>
                  <div>
                    <p className={styles.guideItemLabel}>👩 Mum’s Recovery</p>
                    <p>{postpartumGuide.motherFocus}</p>
                  </div>
                  <div>
                    <p className={styles.guideItemLabel}>👶 Baby’s Development</p>
                    <p>{postpartumGuide.babyFocus}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Postpartum Cards Grid ─── */}
          <div className={styles.sectionGrid}>
            {/* Card 1: 👶 Baby Growth at a Glance */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionIcon}>📏</span>
                  <h2 className={styles.sectionTitle}>Baby Growth</h2>
                </div>
                <div className={styles.sectionActions}>
                  <Link href="/add/child-growth" className={styles.headerAddBtn} title="Log Measurement">
                    <Plus size={15} />
                  </Link>
                  <Link href="/charts" className={styles.headerViewAll}>
                    Growth Charts
                  </Link>
                </div>
              </div>

              {latestGrowth ? (
                <>
                  <div className={styles.growthKPIsRow}>
                    <div className={styles.growthKPICard}>
                      <span className={styles.growthKPILabel}>Weight</span>
                      <p className={styles.growthKPIValue}>
                        {latestGrowth.weightKg ?? '—'}
                        <span className={styles.growthKPIUnit}>kg</span>
                      </p>
                      {babyProfile?.birthWeightGrams && latestGrowth.weightKg && (
                        <span className={styles.growthKPIDelta}>
                          +{(latestGrowth.weightKg - babyProfile.birthWeightGrams / 1000).toFixed(2)}kg from birth
                        </span>
                      )}
                    </div>
                    <div className={styles.growthKPICard}>
                      <span className={styles.growthKPILabel}>Length</span>
                      <p className={styles.growthKPIValue}>
                        {latestGrowth.lengthCm ?? '—'}
                        <span className={styles.growthKPIUnit}>cm</span>
                      </p>
                      <span className={styles.growthKPIDelta}>
                        {latestGrowth.lengthCm ? `${latestGrowth.lengthCm} cm tall` : '—'}
                      </span>
                    </div>
                    <div className={styles.growthKPICard}>
                      <span className={styles.growthKPILabel}>Head Circ</span>
                      <p className={styles.growthKPIValue}>
                        {latestGrowth.headCircumferenceCm ?? '—'}
                        <span className={styles.growthKPIUnit}>cm</span>
                      </p>
                      <span className={styles.growthKPIDelta}>Healthy brain growth</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textAlign: 'right' }}>
                    Recorded on {formatDateShort(latestGrowth.recordedDate)}
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>No baby growth measurements recorded yet</p>
                  <Link href="/add/child-growth" className={styles.emptyAction}>
                    <Plus size={14} />
                    Log Baby Growth
                  </Link>
                </div>
              )}
            </div>

            {/* Card 2: 💉 Childhood Vaccinations */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionIcon}>💉</span>
                  <h2 className={styles.sectionTitle}>Vaccination Schedule</h2>
                </div>
                <div className={styles.sectionActions}>
                  <Link href="/add/vaccination" className={styles.headerAddBtn} title="Add Vaccine">
                    <Plus size={15} />
                  </Link>
                  <Link href="/records/vaccinations" className={styles.headerViewAll}>
                    View All
                  </Link>
                </div>
              </div>

              {vaccineSummary.nextDue ? (
                <>
                  <div className={styles.vaccineProgressHeader}>
                    <span>Immunization Progress</span>
                    <span className={styles.vaccineCountBadge}>
                      {vaccineSummary.givenCount} of {vaccineSummary.totalCount} doses given
                    </span>
                  </div>

                  <div className={styles.vaccineNextBox}>
                    <div className={styles.vaccineNextTitle}>
                      🔔 Next Due: {vaccineSummary.nextDue.vaccineName} ({vaccineSummary.nextDue.doseNumber})
                    </div>
                    <div className={styles.vaccineNextMeta}>
                      <span>Protects: {vaccineSummary.nextDue.targetDisease}</span>
                      <span className={styles.vaccineDueTag}>
                        Due {formatDateShort(vaccineSummary.nextDue.dueDate)} ({vaccineSummary.nextDue.recommendedAgeStr})
                      </span>
                    </div>
                  </div>

                  {vaccineSummary.upcoming.length > 1 && (
                    <div className={styles.vaccineMiniList}>
                      {vaccineSummary.upcoming.slice(1, 3).map((v) => (
                        <div key={v.id} className={styles.vaccineMiniItem}>
                          <span className={styles.vaccineMiniName}>{v.vaccineName}</span>
                          <span className={styles.vaccineMiniAge}>{v.recommendedAgeStr} • Due {formatDateShort(v.dueDate)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>Vaccination schedule is ready</p>
                  <Link href="/records/vaccinations" className={styles.emptyAction}>
                    <ShieldCheck size={14} />
                    View Vaccine Calendar
                  </Link>
                </div>
              )}
            </div>

            {/* Card 3: 🌟 Baby's Firsts & Milestones */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionIcon}>🌟</span>
                  <h2 className={styles.sectionTitle}>Baby’s Firsts & Milestones</h2>
                </div>
                <div className={styles.sectionActions}>
                  <Link href="/add/baby-milestone" className={styles.headerAddBtn} title="Record Milestone">
                    <Plus size={15} />
                  </Link>
                  <Link href="/records/baby-milestones" className={styles.headerViewAll}>
                    View All
                  </Link>
                </div>
              </div>

              {babyMilestones.length > 0 ? (
                <div className={styles.milestonesGrid}>
                  {babyMilestones.slice(0, 3).map((m) => (
                    <div key={m.id} className={styles.milestoneItemCard}>
                      <span className={styles.milestoneItemIcon}>
                        {m.milestoneKey.includes('cry')
                          ? '😢'
                          : m.milestoneKey.includes('smile')
                          ? '😊'
                          : m.milestoneKey.includes('crawl')
                          ? '🐾'
                          : m.milestoneKey.includes('step')
                          ? '🚶'
                          : m.milestoneKey.includes('laugh')
                          ? '😄'
                          : '🏆'}
                      </span>
                      <div className={styles.milestoneItemInfo}>
                        <p className={styles.milestoneItemTitle}>{m.title}</p>
                        <p className={styles.milestoneItemNotes}>{m.notes || m.category}</p>
                      </div>
                      <span className={styles.milestoneItemDate}>{formatDateShort(m.achievedDate)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>No milestones logged yet (first cry, first smile, crawl...)</p>
                  <Link href="/add/baby-milestone" className={styles.emptyAction}>
                    <Plus size={14} />
                    Record First Memory
                  </Link>
                </div>
              )}

              {nextExpectedMilestone && (
                <div className={styles.milestoneUpcomingBanner}>
                  <span style={{ fontSize: '1.2rem' }}>{nextExpectedMilestone.icon}</span>
                  <div className={styles.milestoneUpcomingText}>
                    <span className={styles.milestoneUpcomingStrong}>
                      Coming up next: {nextExpectedMilestone.title} ({nextExpectedMilestone.expectedAgeDisplay})
                    </span>
                    <span>{nextExpectedMilestone.description}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Card 4: 👩 Mother Postpartum Recovery */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionIcon}>❤️</span>
                  <h2 className={styles.sectionTitle}>Mum’s Recovery & Health</h2>
                </div>
                <div className={styles.sectionActions}>
                  <Link href="/add/health-stats" className={styles.headerAddBtn} title="Log Health Stats">
                    <Plus size={15} />
                  </Link>
                  <Link href="/records/health-stats" className={styles.headerViewAll}>
                    View All
                  </Link>
                </div>
              </div>

              {latestHealth ? (
                <div className={styles.motherHealthGrid}>
                  <div className={styles.motherHealthItem}>
                    <span className={styles.statLabel}>
                      Blood Pressure
                      {latestHealth.bpSystolic && latestHealth.bpDiastolic && latestHealth.bpSystolic < 120 && latestHealth.bpDiastolic < 80 ? (
                        <span className={styles.statBadge}>Normal</span>
                      ) : (
                        <span style={{ fontSize: '10px', color: 'hsl(35 85% 35%)', fontWeight: 600 }}>Postnatal BP</span>
                      )}
                    </span>
                    <p className={styles.statValue}>
                      {latestHealth.bpSystolic && latestHealth.bpDiastolic
                        ? `${latestHealth.bpSystolic}/${latestHealth.bpDiastolic}`
                        : '—'}
                    </p>
                    <span className={styles.statDate}>{formatDateShort(latestHealth.recordedDate)}</span>
                  </div>

                  <div className={styles.motherHealthItem}>
                    <span className={styles.statLabel}>Postpartum Weight</span>
                    <p className={styles.statValue}>
                      {latestHealth.weightKg ?? '—'}
                      <span className={styles.statUnit}>kg</span>
                    </p>
                    <span className={styles.statDate}>
                      {latestHealth.weightKg ? 'Gentle recovery progress' : 'Log your weight'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>No maternal health data recorded yet</p>
                  <Link href="/add/health-stats" className={styles.emptyAction}>
                    <Plus size={14} />
                    Add Health Checkup
                  </Link>
                </div>
              )}
            </div>

            {/* Card 5: 📅 Upcoming Checkups */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionIcon}>📅</span>
                  <h2 className={styles.sectionTitle}>Upcoming Appointments</h2>
                </div>
                <div className={styles.sectionActions}>
                  <Link href="/add/appointment" className={styles.headerAddBtn} title="Add Appointment">
                    <Plus size={15} />
                  </Link>
                  <Link href="/records/appointments" className={styles.headerViewAll}>
                    View all
                  </Link>
                </div>
              </div>
              {upcomingAppointments.length > 0 ? (
                <div className={styles.appointmentList}>
                  {upcomingAppointments.map((appt) => (
                    <div key={appt.id} className={styles.appointmentItem}>
                      <div className={styles.appointmentDot} />
                      <div className={styles.appointmentInfo}>
                        <p className={styles.appointmentPurpose}>{appt.purpose || 'Appointment'}</p>
                        {appt.doctorName && <p className={styles.appointmentDoctor}>{appt.doctorName}</p>}
                      </div>
                      <span className={styles.appointmentDate}>
                        {formatDateShort(appt.appointmentDate)}
                        {appt.appointmentTime && ` • ${appt.appointmentTime}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>No upcoming appointments scheduled</p>
                  <Link href="/add/appointment" className={styles.emptyAction}>
                    <Plus size={14} />
                    Add Checkup
                  </Link>
                </div>
              )}
            </div>

            {/* Card 6: 💊 Postpartum Supplements & Medicines */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionIcon}>💊</span>
                  <h2 className={styles.sectionTitle}>Active Medications & Drops</h2>
                </div>
                <div className={styles.sectionActions}>
                  <Link href="/add/medicine" className={styles.headerAddBtn} title="Add Medicine">
                    <Plus size={15} />
                  </Link>
                  <Link href="/records/medicines" className={styles.headerViewAll}>
                    View all
                  </Link>
                </div>
              </div>
              {activeMedicines.length > 0 ? (
                <div className={styles.medicineList}>
                  {activeMedicines.map((med) => (
                    <div key={med.id} className={styles.medicineItem}>
                      <div className={styles.medicinePill} />
                      <span className={styles.medicineName}>{med.medicineName}</span>
                      <span className={styles.medicineDosage}>
                        {med.dosage} • {med.frequency}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>No active medications or supplements</p>
                  <Link href="/add/medicine" className={styles.emptyAction}>
                    <Plus size={14} />
                    Add Supplement / Drops
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PREGNANCY VIEW (Active prenatal or historical archive)
         ═══════════════════════════════════════════════════════════════════ */}
      {!isPostpartumMode && (
        <>
          {/* ─── Progress Card ─── */}
          {pregnancyInfo && (() => {
            const milestone = getBabyMilestone(pregnancyInfo.currentWeek);
            return (
              <div className={styles.progressCard}>
                <div className={styles.progressHeader}>
                  <div className={styles.progressWeekHero}>
                    <span className={styles.weekNumberGiant}>
                      {pregnancyInfo.currentWeek}
                    </span>
                    <div className={styles.weekLabelStack}>
                      <span className={styles.weekUnit}>
                        {pregnancyInfo.isDelivered ? 'WEEKS AT BIRTH' : 'WEEKS'}
                      </span>
                      <span className={styles.progressDayBadge}>
                        +{pregnancyInfo.currentDay} day{pregnancyInfo.currentDay !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className={styles.progressBadges}>
                    {pregnancyInfo.isDelivered ? (
                      <>
                        <span className={styles.deliveredBadge}>Delivered 🎉</span>
                        <span className={styles.babyAgeBadge}>
                          Baby: {formatBabyAge(pregnancyInfo.babyAgeDays || 0)} 👶
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={styles.progressTrimester}>
                          {getTrimesterLabel(pregnancyInfo.trimester)}
                        </span>
                        <span className={styles.progressCountdown}>
                          {pregnancyInfo.daysRemaining} days to go 🎈
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className={styles.progressBarWrapper}>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={
                        pregnancyInfo.isDelivered
                          ? styles.deliveredProgressBarFill
                          : styles.progressBarFill
                      }
                      style={{ width: `${pregnancyInfo.progressPercent}%` }}
                    />
                  </div>
                  <div className={styles.progressFooter}>
                    <span>Conception</span>
                    <span className={styles.progressPercentText}>
                      {pregnancyInfo.isDelivered
                        ? '100% completed • Journey Complete 🎉'
                        : `${Math.round(pregnancyInfo.progressPercent)}% completed`}
                    </span>
                    <span>
                      {pregnancyInfo.isDelivered
                        ? `Delivered (${formatDateShort(pregnancyInfo.deliveryDate!)})`
                        : `Delivery (${formatDateShort(pregnancy!.dueDate)})`}
                    </span>
                  </div>
                  {pregnancyInfo.isDelivered && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-tertiary)',
                        textAlign: 'right',
                        marginTop: '4px',
                      }}
                    >
                      Expected due date was {formatDateShort(pregnancy!.dueDate)}
                      {pregnancyInfo.daysEarlyOrLate && pregnancyInfo.daysEarlyOrLate < 0
                        ? ` • arrived ${Math.abs(pregnancyInfo.daysEarlyOrLate)} days early`
                        : ''}
                    </div>
                  )}
                </div>

                {/* Baby Development Box */}
                <div className={styles.milestoneBox}>
                  <div className={styles.milestoneIcon}>{milestone.fruitEmoji}</div>
                  <div className={styles.milestoneContent}>
                    <div className={styles.milestoneHeadingRow}>
                      <p className={styles.milestoneHeading}>
                        {pregnancyInfo.isDelivered
                          ? `Baby arrived at Week ${pregnancyInfo.currentWeek}! Size of a `
                          : 'Baby is the size of a '}
                        <span className={styles.milestoneFruit}>{milestone.fruit}</span>
                      </p>
                      <div className={styles.milestoneTagsRow}>
                        <span className={styles.milestoneTag}>📏 {milestone.lengthCm}</span>
                        <span className={styles.milestoneTag}>⚖️ {milestone.weightGrams}</span>
                      </div>
                    </div>
                    <p className={styles.milestoneDetail}>
                      {pregnancyInfo.isDelivered
                        ? `Congratulations on your little one's arrival on ${formatDate(
                            pregnancyInfo.deliveryDate!
                          )}! At ${pregnancyInfo.deliveryWeek} weeks + ${
                            pregnancyInfo.deliveryDay
                          } days, your little miracle is here.`
                        : milestone.detail}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ─── Cards Grid ─── */}
          <div className={styles.sectionGrid}>
            {/* Latest Health */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionIcon}>❤️</span>
                  <h2 className={styles.sectionTitle}>Latest Health</h2>
                </div>
                <div className={styles.sectionActions}>
                  <Link href="/add/health-stats" className={styles.headerAddBtn} title="Log Health Stats">
                    <Plus size={15} />
                  </Link>
                  <Link href="/records/health-stats" className={styles.headerViewAll}>
                    View all
                  </Link>
                </div>
              </div>
              {latestHealth ? (
                <div className={styles.statsGrid}>
                  {latestHealth.bpSystolic && latestHealth.bpDiastolic ? (
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>
                        Blood Pressure
                        {latestHealth.bpSystolic < 120 && latestHealth.bpDiastolic < 80 && (
                          <span className={styles.statBadge}>Normal</span>
                        )}
                      </span>
                      <p className={styles.statValue}>
                        {latestHealth.bpSystolic}/{latestHealth.bpDiastolic}
                      </p>
                      <span className={styles.statDate}>
                        {formatDateShort(latestHealth.recordedDate)}
                      </span>
                    </div>
                  ) : (
                    <Link href="/add/health-stats" className={styles.quickLogSlot}>
                      <Plus size={13} />
                      <span>Log Blood Pressure</span>
                    </Link>
                  )}

                  {latestHealth.weightKg ? (
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Weight</span>
                      <p className={styles.statValue}>
                        {latestHealth.weightKg}
                        <span className={styles.statUnit}>kg</span>
                      </p>
                      <span className={styles.statDate}>
                        {formatDateShort(latestHealth.recordedDate)}
                      </span>
                    </div>
                  ) : (
                    <Link href="/add/health-stats" className={styles.quickLogSlot}>
                      <Plus size={13} />
                      <span>Log Weight</span>
                    </Link>
                  )}

                  {latestHealth.bloodSugar ? (
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Blood Sugar</span>
                      <p className={styles.statValue}>
                        {latestHealth.bloodSugar}
                        <span className={styles.statUnit}>mg/dL</span>
                      </p>
                      <span className={styles.statDate}>
                        {formatDateShort(latestHealth.recordedDate)}
                      </span>
                    </div>
                  ) : (
                    <Link href="/add/health-stats" className={styles.quickLogSlot}>
                      <Plus size={13} />
                      <span>Log Blood Sugar</span>
                    </Link>
                  )}

                  {latestBaby?.fhrBpm ? (
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>Baby Heart Rate</span>
                      <p className={styles.statValue}>
                        {latestBaby.fhrBpm}
                        <span className={styles.statUnit}>bpm</span>
                      </p>
                      <span className={styles.statDate}>
                        {formatDateShort(latestBaby.recordedDate)}
                      </span>
                    </div>
                  ) : (
                    <Link href="/add/baby-stats" className={styles.quickLogSlot}>
                      <Plus size={13} />
                      <span>Log Fetal Heart Rate</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>No health data recorded yet</p>
                  <Link href="/add/health-stats" className={styles.emptyAction}>
                    <Plus size={14} />
                    Add Measurement
                  </Link>
                </div>
              )}
            </div>

            {/* Upcoming Appointments */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionIcon}>📅</span>
                  <h2 className={styles.sectionTitle}>Upcoming</h2>
                </div>
                <div className={styles.sectionActions}>
                  <Link href="/add/appointment" className={styles.headerAddBtn} title="Add Appointment">
                    <Plus size={15} />
                  </Link>
                  <Link href="/records/appointments" className={styles.headerViewAll}>
                    View all
                  </Link>
                </div>
              </div>
              {upcomingAppointments.length > 0 ? (
                <div className={styles.appointmentList}>
                  {upcomingAppointments.map((appt) => (
                    <div key={appt.id} className={styles.appointmentItem}>
                      <div className={styles.appointmentDot} />
                      <div className={styles.appointmentInfo}>
                        <p className={styles.appointmentPurpose}>
                          {appt.purpose || 'Appointment'}
                        </p>
                        {appt.doctorName && (
                          <p className={styles.appointmentDoctor}>
                            {appt.doctorName}
                          </p>
                        )}
                      </div>
                      <span className={styles.appointmentDate}>
                        {formatDateShort(appt.appointmentDate)}
                        {appt.appointmentTime && ` • ${appt.appointmentTime}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>No upcoming appointments</p>
                  <Link href="/add/appointment" className={styles.emptyAction}>
                    <Plus size={14} />
                    Add Appointment
                  </Link>
                </div>
              )}
            </div>

            {/* Active Medicines */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitleGroup}>
                  <span className={styles.sectionIcon}>💊</span>
                  <h2 className={styles.sectionTitle}>Active Medicines</h2>
                </div>
                <div className={styles.sectionActions}>
                  <Link href="/add/medicine" className={styles.headerAddBtn} title="Add Medicine">
                    <Plus size={15} />
                  </Link>
                  <Link href="/records/medicines" className={styles.headerViewAll}>
                    View all
                  </Link>
                </div>
              </div>
              {activeMedicines.length > 0 ? (
                <div className={styles.medicineList}>
                  {activeMedicines.map((med) => (
                    <div key={med.id} className={styles.medicineItem}>
                      <div className={styles.medicinePill} />
                      <span className={styles.medicineName}>
                        {med.medicineName}
                      </span>
                      <span className={styles.medicineDosage}>
                        {med.dosage} • {med.frequency}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p className={styles.emptyText}>No active medicines</p>
                  <Link href="/add/medicine" className={styles.emptyAction}>
                    <Plus size={14} />
                    Add Medicine
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── Recent Timeline (Shared) ─── */}
      <div className={`${styles.section} ${styles.recentSection}`} style={{ marginTop: 'var(--space-6)' }}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <span className={styles.sectionIcon}>🕘</span>
            <h2 className={styles.sectionTitle}>Recent Memories & Activity</h2>
          </div>
          <div className={styles.sectionActions}>
            <Link href="/add" className={styles.headerAddBtn} title="Add Any Record">
              <Plus size={15} />
            </Link>
            <Link href="/timeline" className={styles.headerViewAll}>
              Full Timeline
            </Link>
          </div>
        </div>
        {recentTimeline.length > 0 ? (
          <div className={styles.timelineList}>
            {recentTimeline.map((entry) => (
              <div key={entry.id} className={styles.timelineItem}>
                <span className={styles.timelineIcon} style={{ backgroundColor: entry.color }}>
                  {entry.icon}
                </span>
                <div className={styles.timelineInfo}>
                  <p className={styles.timelineTitle}>{entry.title}</p>
                  {entry.subtitle && <p className={styles.timelineSubtitle}>{entry.subtitle}</p>}
                </div>
                <span className={styles.timelineDate}>{formatRelativeDate(entry.date)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No recent timeline activities</p>
            <Link href="/add" className={styles.emptyAction}>
              <Plus size={14} />
              Add First Entry
            </Link>
          </div>
        )}
      </div>

      {/* ─── Delivery Date & Baby Details Modal ─── */}
      {showDeliveryModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => !modalSaving && setShowDeliveryModal(false)}
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delivery-modal-title"
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleRow}>
                <span style={{ fontSize: '1.5rem' }}>🍼</span>
                <h2 id="delivery-modal-title" className={styles.modalTitle}>
                  {pregnancy?.deliveryDate ? 'Edit Baby & Delivery Info' : 'Welcome Baby! Record Delivery'}
                </h2>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowDeliveryModal(false)}
                disabled={modalSaving}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <p className={styles.modalSubtitle}>
              Record baby’s arrival date and details. The dashboard will automatically transition to your Postpartum Hub with vaccination schedules, milestone tracking, and growth charts.
            </p>

            <div className={styles.modalFieldGroup}>
              <label htmlFor="modal-delivery-date" className={styles.modalLabel}>
                Actual Delivery Date *
              </label>
              <input
                id="modal-delivery-date"
                type="date"
                value={deliveryDateInput}
                onChange={(e) => setDeliveryDateInput(e.target.value)}
                className={styles.modalInput}
                max={new Date().toISOString().split('T')[0]}
              />

              {previewGestation && (
                <div className={styles.modalEarlyPill}>
                  <Sparkles size={16} style={{ flexShrink: 0 }} />
                  <div>
                    <div>
                      <strong>Gestation at delivery:</strong> Week {previewGestation.w} + {previewGestation.d} day
                      {previewGestation.d !== 1 ? 's' : ''}
                    </div>
                    {previewDiffDays !== null && (
                      <div style={{ marginTop: '2px' }}>
                        {previewDiffDays < 0
                          ? `🎉 Early arrival: ${Math.abs(previewDiffDays)} day${
                              Math.abs(previewDiffDays) !== 1 ? 's' : ''
                            } before expected due date`
                          : previewDiffDays === 0
                          ? `🎯 Arrived right on your expected due date!`
                          : `🎉 Arrived ${previewDiffDays} day${previewDiffDays !== 1 ? 's' : ''} past expected due date`}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Baby Details Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <div className={styles.modalFieldGroup}>
                <label htmlFor="modal-baby-name" className={styles.modalLabel}>
                  Baby’s Name / Nickname
                </label>
                <input
                  id="modal-baby-name"
                  type="text"
                  placeholder="e.g. Aarav"
                  value={babyNameInput}
                  onChange={(e) => setBabyNameInput(e.target.value)}
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.modalFieldGroup}>
                <label htmlFor="modal-baby-gender" className={styles.modalLabel}>
                  Gender
                </label>
                <select
                  id="modal-baby-gender"
                  value={babyGenderInput}
                  onChange={(e) => setBabyGenderInput(e.target.value as BabyProfile['gender'])}
                  className={styles.modalInput}
                >
                  <option value="Boy">Boy 👦</option>
                  <option value="Girl">Girl 👧</option>
                  <option value="Other">Other ✨</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
              <div className={styles.modalFieldGroup}>
                <label htmlFor="modal-baby-weight" className={styles.modalLabel}>
                  Birth Weight (grams)
                </label>
                <input
                  id="modal-baby-weight"
                  type="number"
                  placeholder="e.g. 3200"
                  value={birthWeightInput}
                  onChange={(e) => setBirthWeightInput(e.target.value)}
                  className={styles.modalInput}
                />
              </div>

              <div className={styles.modalFieldGroup}>
                <label htmlFor="modal-baby-length" className={styles.modalLabel}>
                  Birth Length (cm)
                </label>
                <input
                  id="modal-baby-length"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 50"
                  value={birthLengthInput}
                  onChange={(e) => setBirthLengthInput(e.target.value)}
                  className={styles.modalInput}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              {pregnancy?.deliveryDate && (
                <button
                  type="button"
                  className={styles.modalClearBtn}
                  onClick={() => handleSaveDeliveryDate('')}
                  disabled={modalSaving}
                >
                  Clear Delivery Date
                </button>
              )}
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setShowDeliveryModal(false)}
                disabled={modalSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalSaveBtn}
                onClick={() => handleSaveDeliveryDate(deliveryDateInput)}
                disabled={modalSaving || !deliveryDateInput}
              >
                <Check size={16} />
                {modalSaving ? 'Saving...' : 'Save & Celebrate 🎉'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
