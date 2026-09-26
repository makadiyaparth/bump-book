'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { getPregnancyInfo, formatPregnancyWeek, getTrimesterLabel, getBabyMilestone } from '@/lib/pregnancy';
import { formatDate, formatDateShort, formatRelativeDate, getGreeting } from '@/lib/utils';
import JourneyLoader from '@/components/JourneyLoader';
import type {
  PregnancyProfile,
  PregnancyInfo,
  HealthStats,
  BabyStats,
  Appointment,
  Medicine,
  TimelineEntry,
} from '@/lib/types';
import styles from './page.module.css';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [pregnancy, setPregnancy] = useState<PregnancyProfile | null>(null);
  const [pregnancyInfo, setPregnancyInfo] = useState<PregnancyInfo | null>(null);
  const [latestHealth, setLatestHealth] = useState<HealthStats | null>(null);
  const [latestBaby, setLatestBaby] = useState<BabyStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [activeMedicines, setActiveMedicines] = useState<Medicine[]>([]);
  const [recentTimeline, setRecentTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }

    try {
      // Fetch pregnancy profile
      const pregRes = await fetch('/api/sheets/Pregnancy');
      const pregData = await pregRes.json();

      if (pregData.data && pregData.data.length > 0) {
        const row = pregData.data[0];
        const profile: PregnancyProfile = {
          id: row.id,
          lmpDate: row.lmp_date,
          dueDate: row.due_date,
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
        setPregnancy(profile);
        setPregnancyInfo(getPregnancyInfo(profile.lmpDate));
      }

      // Fetch latest health stats
      const healthRes = await fetch('/api/sheets/HealthStats');
      const healthData = await healthRes.json();
      if (healthData.data && healthData.data.length > 0) {
        const latest = healthData.data[healthData.data.length - 1];
        setLatestHealth({
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
        });
      }

      // Fetch latest baby stats
      const babyRes = await fetch('/api/sheets/BabyStats');
      const babyData = await babyRes.json();
      if (babyData.data && babyData.data.length > 0) {
        const latest = babyData.data[babyData.data.length - 1];
        setLatestBaby({
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
        });
      }

      // Fetch upcoming appointments
      const apptRes = await fetch('/api/sheets/Appointments');
      const apptData = await apptRes.json();
      if (apptData.data) {
        const today = new Date().toISOString().split('T')[0];
        const upcoming = apptData.data
          .filter(
            (a: Record<string, string>) =>
              a.status === 'Upcoming' && a.appointment_date >= today
          )
          .sort(
            (a: Record<string, string>, b: Record<string, string>) =>
              a.appointment_date.localeCompare(b.appointment_date)
          )
          .slice(0, 3)
          .map(
            (a: Record<string, string>): Appointment => ({
              id: a.id,
              appointmentDate: a.appointment_date,
              appointmentTime: a.appointment_time,
              doctorName: a.doctor_name,
              hospital: a.hospital,
              purpose: a.purpose,
              status: a.status as Appointment['status'],
              notes: a.notes,
              createdAt: a.created_at,
            })
          );
        setUpcomingAppointments(upcoming);
      }

      // Fetch active medicines
      const medRes = await fetch('/api/sheets/Medicines');
      const medData = await medRes.json();
      if (medData.data) {
        const active = medData.data
          .filter((m: Record<string, string>) => m.is_active === 'TRUE')
          .map(
            (m: Record<string, string>): Medicine => ({
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
            })
          );
        setActiveMedicines(active);
      }

      // Build recent timeline from multiple sources
      const timelineEntries: TimelineEntry[] = [];

      // Doctor visits
      const visitRes = await fetch('/api/sheets/DoctorVisits');
      const visitData = await visitRes.json();
      if (visitData.data) {
        visitData.data.forEach((v: Record<string, string>) => {
          timelineEntries.push({
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

      // Add health stats to timeline
      if (healthData.data) {
        healthData.data.forEach((h: Record<string, string>) => {
          const parts: string[] = [];
          if (h.bp_systolic && h.bp_diastolic) parts.push(`BP ${h.bp_systolic}/${h.bp_diastolic}`);
          if (h.weight_kg) parts.push(`Weight ${h.weight_kg} kg`);
          timelineEntries.push({
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

      // Sort and take latest 5
      timelineEntries.sort((a, b) => b.date.localeCompare(a.date));
      setRecentTimeline(timelineEntries.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  fetchData();
}, [session?.accessToken, session?.spreadsheetId]);

  const greeting = getGreeting();
  const firstName = session?.user?.name?.split(' ')[0] || '';

  // No pregnancy profile set up yet — show onboarding prompt
  if (!loading && !pregnancy) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.setupPrompt}>
          <span className={styles.setupEmoji}>🤰</span>
          <h1 className={styles.setupTitle}>Welcome to Your Journey!</h1>
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
        <h1 className={styles.greetingText}>
          {greeting}, {firstName} <span className={styles.greetingEmoji}>👋</span>
        </h1>
        {pregnancyInfo && (
          <>
            <p className={styles.greetingWeek}>
              <span className={styles.greetingWeekBold}>
                {formatPregnancyWeek(pregnancyInfo.currentWeek, pregnancyInfo.currentDay)}
              </span>
            </p>
            <p className={styles.greetingDue}>
              Due {formatDate(pregnancy!.dueDate)} • {pregnancyInfo.daysRemaining} days remaining
            </p>
          </>
        )}
      </div>

      {/* ─── Progress Card (Minimal, High Contrast, Baby Milestone) ─── */}
      {pregnancyInfo && (() => {
        const milestone = getBabyMilestone(pregnancyInfo.currentWeek);
        return (
          <div className={styles.progressCard}>
            <div className={styles.progressHeader}>
              <div className={styles.progressWeekGroup}>
                <span className={styles.progressOverline}>Current Stage</span>
                <div className={styles.progressWeekRow}>
                  <p className={styles.progressWeek}>Week {pregnancyInfo.currentWeek}</p>
                  <span className={styles.progressDayBadge}>
                    +{pregnancyInfo.currentDay} day{pregnancyInfo.currentDay !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className={styles.progressBadges}>
                <span className={styles.progressTrimester}>
                  {getTrimesterLabel(pregnancyInfo.trimester)}
                </span>
                <span className={styles.progressCountdown}>
                  {pregnancyInfo.daysRemaining} days to go
                </span>
              </div>
            </div>

            <div className={styles.progressBarWrapper}>
              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${pregnancyInfo.progressPercent}%` }}
                />
              </div>
              <div className={styles.progressFooter}>
                <span>Conception</span>
                <span className={styles.progressPercentText}>
                  {Math.round(pregnancyInfo.progressPercent)}% completed
                </span>
                <span>Delivery ({formatDateShort(pregnancy!.dueDate)})</span>
              </div>
            </div>

            {/* Baby Development Box */}
            <div className={styles.milestoneBox}>
              <div className={styles.milestoneIcon}>{milestone.fruitEmoji}</div>
              <div className={styles.milestoneContent}>
                <p className={styles.milestoneHeading}>
                  Baby is the size of a <span className={styles.milestoneFruit}>{milestone.fruit}</span>
                  <span className={styles.milestoneStats}> • {milestone.lengthCm} • {milestone.weightGrams}</span>
                </p>
                <p className={styles.milestoneDetail}>{milestone.detail}</p>
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
    </div>
  );
}
