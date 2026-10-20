'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Plus, X, Check, Sparkles } from 'lucide-react';
import { getPregnancyInfo, getTrimesterLabel, getBabyMilestone } from '@/lib/pregnancy';
import { formatDate, formatDateShort, formatRelativeDate, getGreeting } from '@/lib/utils';
import JourneyLoader from '@/components/JourneyLoader';
import { useSheetData, invalidateSheetTab } from '@/lib/useSheetData';
import type {
  PregnancyProfile,
  HealthStats,
  BabyStats,
  Appointment,
  Medicine,
  TimelineEntry,
} from '@/lib/types';
import styles from './page.module.css';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const { data: pregRows, isLoading: pregLoading } = useSheetData('Pregnancy');
  const { data: healthRows } = useSheetData('HealthStats');
  const { data: babyRows } = useSheetData('BabyStats');
  const { data: apptRows } = useSheetData('Appointments');
  const { data: medRows } = useSheetData('Medicines');
  const { data: visitRows } = useSheetData('DoctorVisits');

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryDateInput, setDeliveryDateInput] = useState('');
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

  const openDeliveryModal = () => {
    setDeliveryDateInput(
      pregnancy?.deliveryDate || new Date().toISOString().split('T')[0]
    );
    setShowDeliveryModal(true);
  };

  const handleSaveDeliveryDate = async (newDate: string) => {
    if (!pregnancy?.id) return;
    setModalSaving(true);
    try {
      const res = await fetch(`/api/sheets/Pregnancy/${pregnancy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_date: newDate,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to update delivery date');
      await invalidateSheetTab('Pregnancy');
      setShowDeliveryModal(false);
    } catch (err) {
      console.error('Error saving delivery date:', err);
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

  const loading = (status === 'loading') || (pregLoading && !pregRows);

  const greeting = getGreeting();
  const firstName = session?.user?.name?.split(' ')[0] || '';

  // No pregnancy profile set up yet — show onboarding prompt
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
            Get Started
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <JourneyLoader
          message="Loading your journey..."
          subMessage="Fetching your latest updates & health records"
          cycle
          size="fullPage"
        />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* ─── Greeting ─── */}
      <div className={styles.greeting}>
        <p className={styles.greetingDiaryTag}>
          {pregnancyInfo?.isDelivered
            ? 'our postpartum journey & sweet memories 🍼'
            : 'our personal motherhood diary ✨'}
        </p>
        <h1 className={styles.greetingText}>
          {greeting}, <span className={styles.greetingName}>{firstName}</span>{' '}
          <span className={styles.greetingEmoji}>
            {pregnancyInfo?.isDelivered ? '🍼' : '👋'}
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
                  {pregnancyInfo.daysEarlyOrLate && pregnancyInfo.daysEarlyOrLate < 0
                    ? `Arrived ${Math.abs(pregnancyInfo.daysEarlyOrLate)} days early (Week ${pregnancyInfo.deliveryWeek} + ${pregnancyInfo.deliveryDay}d)! Welcome baby! 🍼🎉`
                    : pregnancyInfo.daysEarlyOrLate && pregnancyInfo.daysEarlyOrLate > 0
                    ? `Arrived ${pregnancyInfo.daysEarlyOrLate} days past due date (Week ${pregnancyInfo.deliveryWeek} + ${pregnancyInfo.deliveryDay}d)! Welcome baby! 🍼🎉`
                    : `Arrived on expected due date! Welcome baby! 🍼🎉`}
                </span>
                <span className={styles.greetingDuePill}>
                  Baby is {pregnancyInfo.babyAgeDays === 0
                    ? 'newborn today'
                    : pregnancyInfo.babyAgeDays === 1
                    ? '1 day old'
                    : `${pregnancyInfo.babyAgeDays} days old (${pregnancyInfo.babyAgeWeeks}w ${pregnancyInfo.babyAgeRemainingDays}d)`} 💕
                </span>
                <button
                  type="button"
                  onClick={openDeliveryModal}
                  className={styles.deliveryMetaAction}
                  title="Edit delivery date"
                >
                  ✏️ Edit Delivery Date
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

      {/* ─── Progress Card (Minimal, High Contrast, Playful Scale) ─── */}
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
                    <span className={styles.deliveredBadge}>
                      Delivered 🎉
                    </span>
                    <span className={styles.babyAgeBadge}>
                      Baby: {pregnancyInfo.babyAgeDays}d old 👶
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
                  className={pregnancyInfo.isDelivered ? styles.deliveredProgressBarFill : styles.progressBarFill}
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
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-tertiary)',
                  textAlign: 'right',
                  marginTop: '4px',
                }}>
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
                    ? `Congratulations on your little one's safe arrival on ${formatDate(pregnancyInfo.deliveryDate!)}! At ${pregnancyInfo.deliveryWeek} weeks + ${pregnancyInfo.deliveryDay} days, your little miracle is here.`
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

        {/* Recent Timeline */}
        <div className={`${styles.section} ${styles.recentSection}`}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <span className={styles.sectionIcon}>🕘</span>
              <h2 className={styles.sectionTitle}>Recent Journey</h2>
            </div>
            <div className={styles.sectionActions}>
              <Link href="/add" className={styles.headerAddBtn} title="Add Any Record">
                <Plus size={15} />
              </Link>
              <Link href="/timeline" className={styles.headerViewAll}>
                Full timeline →
              </Link>
            </div>
          </div>
          {recentTimeline.length > 0 ? (
            <div className={styles.timelineList}>
              {recentTimeline.map((entry) => (
                <div key={entry.id} className={styles.timelineItem}>
                  <div
                    className={styles.timelineIcon}
                    style={{
                      backgroundColor: `color-mix(in srgb, ${entry.color} 15%, transparent)`,
                    }}
                  >
                    {entry.icon}
                  </div>
                  <div className={styles.timelineContent}>
                    <p className={styles.timelineTitle}>{entry.title}</p>
                    {entry.subtitle && (
                      <p className={styles.timelineSubtitle}>
                        {entry.subtitle}
                      </p>
                    )}
                  </div>
                  <span className={styles.timelineDate}>
                    {formatRelativeDate(entry.date)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyEmoji}>📝</span>
              <p className={styles.emptyText}>
                Your journey timeline will appear here as you add records
              </p>
              <Link href="/add" className={styles.emptyAction}>
                <Plus size={14} />
                Add Your First Record
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ─── Record / Edit Delivery Date Modal ─── */}
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
                  {pregnancy?.deliveryDate ? 'Edit Delivery Date' : 'Record Delivery Date'}
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
              If baby arrived early (or on birth day), record the date here. Your gestational progress, postpartum milestone cards, and journey timeline will update accordingly.
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
                      <strong>Gestation at delivery:</strong> Week {previewGestation.w} + {previewGestation.d} day{previewGestation.d !== 1 ? 's' : ''}
                    </div>
                    {previewDiffDays !== null && (
                      <div style={{ marginTop: '2px' }}>
                        {previewDiffDays < 0
                          ? `🎉 Early arrival: ${Math.abs(previewDiffDays)} day${Math.abs(previewDiffDays) !== 1 ? 's' : ''} before expected due date`
                          : previewDiffDays === 0
                          ? `🎯 Arrived right on your expected due date!`
                          : `🎉 Arrived ${previewDiffDays} day${previewDiffDays !== 1 ? 's' : ''} past expected due date`}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                {modalSaving ? 'Saving...' : 'Save Delivery Date'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
