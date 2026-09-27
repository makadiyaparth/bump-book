'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { formatDateShort, formatCurrency, groupBy } from '@/lib/utils';
import { RECORD_TYPES } from '@/lib/types';
import type { RecordType } from '@/lib/types';
import JourneyLoader from '@/components/JourneyLoader';
import styles from './page.module.css';

interface TimelineItem {
  id: string;
  date: string;
  type: RecordType;
  typeLabel: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  driveLink?: string;
  pregnancyWeek?: string;
  cost?: string;
}

export default function TimelinePage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadTimelineData() {
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        // Fetch pregnancy info to compute weeks
        let userLmp: string | null = null;
        try {
          const pregRes = await fetch('/api/sheets/Pregnancy');
          const pregData = await pregRes.json();
          if (pregData.data?.[0]?.lmp_date) {
            userLmp = pregData.data[0].lmp_date;
          }
        } catch {
          // ignore
        }

        const calcWeek = (dateStr: string): string | undefined => {
          if (!userLmp || !dateStr) return undefined;
          const diffMs = new Date(dateStr).getTime() - new Date(userLmp).getTime();
          const totalDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
          if (totalDays < 0 || totalDays > 300) return undefined;
          const weeks = Math.floor(totalDays / 7);
          const days = totalDays % 7;
          return days > 0 ? `Week ${weeks} + ${days}d` : `Week ${weeks}`;
        };

        const timelineList: TimelineItem[] = [];

        // Fetch DoctorVisits
        try {
          const res = await fetch('/api/sheets/DoctorVisits');
          const resData = await res.json();
          if (resData.data) {
            for (const r of resData.data) {
              timelineList.push({
                id: r.id,
                date: r.visit_date,
                type: 'doctor-visit',
                typeLabel: 'Doctor Visit',
                title: r.doctor_name ? `Dr. ${r.doctor_name}` : 'Doctor Visit',
                subtitle: [r.hospital, r.reason, r.symptoms_discussed]
                  .filter(Boolean)
                  .join(' • '),
                icon: '🩺',
                color: 'var(--color-cat-doctor)',
                pregnancyWeek: calcWeek(r.visit_date),
                cost: r.cost,
              });
            }
          }
        } catch {}

        // Fetch Medicines
        try {
          const res = await fetch('/api/sheets/Medicines');
          const resData = await res.json();
          if (resData.data) {
            for (const r of resData.data) {
              timelineList.push({
                id: r.id,
                date: r.start_date,
                type: 'medicine',
                typeLabel: 'Medicine',
                title: r.medicine_name || 'Prescription',
                subtitle: [
                  r.dosage,
                  r.frequency,
                  r.is_active === 'FALSE' ? 'Stopped' : 'Active',
                ]
                  .filter(Boolean)
                  .join(' • '),
                icon: '💊',
                color: 'var(--color-cat-medicine)',
                pregnancyWeek: calcWeek(r.start_date),
                cost: r.cost,
              });
            }
          }
        } catch {}

        // Fetch Tests
        try {
          const res = await fetch('/api/sheets/Tests');
          const resData = await res.json();
          if (resData.data) {
            for (const r of resData.data) {
              timelineList.push({
                id: r.id,
                date: r.test_date,
                type: 'test',
                typeLabel: 'Test & Lab',
                title: r.test_name || 'Lab Test',
                subtitle: [r.status, r.result_summary, r.reason]
                  .filter(Boolean)
                  .join(' • '),
                icon: '🧪',
                color: 'var(--color-cat-test)',
                driveLink: r.report_link,
                pregnancyWeek: calcWeek(r.test_date),
                cost: r.cost,
              });
            }
          }
        } catch {}

        // Fetch HealthStats
        try {
          const res = await fetch('/api/sheets/HealthStats');
          const resData = await res.json();
          if (resData.data) {
            for (const r of resData.data) {
              const details = [];
              if (r.bp_systolic && r.bp_diastolic)
                details.push(`BP ${r.bp_systolic}/${r.bp_diastolic}`);
              if (r.weight_kg) details.push(`${r.weight_kg} kg`);
              if (r.blood_sugar) details.push(`Sugar ${r.blood_sugar} mg/dL`);
              if (r.temperature) details.push(`Temp ${r.temperature} °C`);
              if (r.hemoglobin) details.push(`Hb ${r.hemoglobin} g/dL`);

              timelineList.push({
                id: r.id,
                date: r.recorded_date,
                type: 'health-stats',
                typeLabel: 'Health Measurement',
                title: 'Health Measurement',
                subtitle: details.join(' • ') || r.notes || 'Recorded vitals',
                icon: '❤️',
                color: 'var(--color-cat-health)',
                pregnancyWeek: calcWeek(r.recorded_date),
              });
            }
          }
        } catch {}

        // Fetch BabyStats
        try {
          const res = await fetch('/api/sheets/BabyStats');
          const resData = await res.json();
          if (resData.data) {
            for (const r of resData.data) {
              const details = [];
              if (r.fhr_bpm) details.push(`FHR ${r.fhr_bpm} bpm`);
              if (r.baby_weight_grams) details.push(`${r.baby_weight_grams} g`);
              if (r.movement_felt === 'TRUE') details.push('Movement felt');
              if (r.movement_count) details.push(`${r.movement_count} kicks`);

              timelineList.push({
                id: r.id,
                date: r.recorded_date,
                type: 'baby-stats',
                typeLabel: 'Baby Measurement',
                title: 'Baby Measurement',
                subtitle: details.join(' • ') || r.notes || 'Growth measurement',
                icon: '👶',
                color: 'var(--color-cat-baby)',
                pregnancyWeek: calcWeek(r.recorded_date),
              });
            }
          }
        } catch {}

        // Fetch Appointments
        try {
          const res = await fetch('/api/sheets/Appointments');
          const resData = await res.json();
          if (resData.data) {
            for (const r of resData.data) {
              timelineList.push({
                id: r.id,
                date: r.appointment_date,
                type: 'appointment',
                typeLabel: 'Appointment',
                title: r.purpose || 'Appointment',
                subtitle: [
                  r.appointment_time,
                  r.doctor_name ? `Dr. ${r.doctor_name}` : null,
                  r.hospital,
                  r.status,
                ]
                  .filter(Boolean)
                  .join(' • '),
                icon: '📅',
                color: 'var(--color-cat-appointment)',
                pregnancyWeek: calcWeek(r.appointment_date),
                cost: r.cost,
              });
            }
          }
        } catch {}

        // Fetch Milestones
        try {
          const res = await fetch('/api/sheets/Milestones');
          const resData = await res.json();
          if (resData.data) {
            for (const r of resData.data) {
              timelineList.push({
                id: r.id,
                date: r.milestone_date,
                type: 'milestone',
                typeLabel: 'Milestone',
                title: r.milestone_type || 'Milestone',
                subtitle: r.description || r.notes || 'Special moment reached',
                icon: '🏆',
                color: 'var(--color-cat-milestone)',
                pregnancyWeek: calcWeek(r.milestone_date),
              });
            }
          }
        } catch {}

        // Fetch Notes
        try {
          const res = await fetch('/api/sheets/Notes');
          const resData = await res.json();
          if (resData.data) {
            for (const r of resData.data) {
              timelineList.push({
                id: r.id,
                date: r.note_date,
                type: 'note',
                typeLabel: `${r.category || 'General'} Note`,
                title: r.title || `${r.category || 'General'} Note`,
                subtitle: r.content || '',
                icon: '📝',
                color: 'var(--color-cat-note)',
                pregnancyWeek: calcWeek(r.note_date),
              });
            }
          }
        } catch {}

        // Sort descending by date
        timelineList.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });

        setItems(timelineList);
      } catch (err) {
        console.error('Error fetching timeline data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTimelineData();
  }, [session]);

  // Filtered and searched items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesFilter =
        selectedFilter === 'all' || item.type === selectedFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.typeLabel.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [items, selectedFilter, searchQuery]);

  // Group by Month Year
  const groupedByMonth = useMemo(() => {
    return groupBy(filteredItems, (item) => {
      if (!item.date) return 'Undated';
      const d = new Date(item.date);
      return isNaN(d.getTime())
        ? 'Undated'
        : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    });
  }, [filteredItems]);

  return (
    <div className={styles.timelinePage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <p className={styles.timelineDiaryTag}>every little memory counts 📖</p>
            <h1 className={styles.title}>Journey Timeline</h1>
            <p className={styles.subtitle}>
              <span className={styles.countNumber}>{items.length}</span> precious moments recorded along the way
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/add" className={styles.addButton}>
              <Plus size={16} />
              Add Record
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search appointments, medicines, notes, tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterScroll}>
            <button
              className={`${styles.filterPill} ${
                selectedFilter === 'all' ? styles.filterPillActive : ''
              }`}
              onClick={() => setSelectedFilter('all')}
            >
              All Records ({items.length})
            </button>
            {RECORD_TYPES.map((rt) => {
              const count = items.filter((i) => i.type === rt.key).length;
              return (
                <button
                  key={rt.key}
                  className={`${styles.filterPill} ${
                    selectedFilter === rt.key ? styles.filterPillActive : ''
                  }`}
                  onClick={() => setSelectedFilter(rt.key)}
                >
                  <span>{rt.icon}</span>
                  <span>{rt.label}</span>
                  {count > 0 && <span>({count})</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <JourneyLoader
          message="Loading your journey timeline..."
          subMessage="Organizing your visits, tests, and baby milestones"
          cycle
          size="card"
        />
      ) : filteredItems.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyEmoji}>📖</span>
          <h2 className={styles.emptyTitle}>
            {searchQuery
              ? 'No matching records found'
              : 'No records in this category yet'}
          </h2>
          <p className={styles.emptyText}>
            {searchQuery
              ? 'Try changing your search terms or clearing the filter.'
              : 'Capture important moments, visits, and vitals to see them in your chronological timeline.'}
          </p>
          <Link href="/add" className={styles.addButton}>
            <Plus size={16} />
            Add First Entry
          </Link>
        </div>
      ) : (
        Object.entries(groupedByMonth).map(([monthYear, groupItems]) => (
          <div key={monthYear} className={styles.monthGroup}>
            <div className={styles.monthHeader}>
              <h2 className={styles.monthTitle}>{monthYear}</h2>
              <span className={styles.monthBadge}>
                {groupItems.length} {groupItems.length === 1 ? 'event' : 'events'}
              </span>
              <div className={styles.monthDivider} />
            </div>

            <div className={styles.timelineList}>
              {groupItems.map((item) => (
                <div key={item.id} className={styles.entryWrapper}>
                  <div
                    className={styles.timelineDot}
                    style={{ backgroundColor: item.color }}
                  />
                  <Link
                    href={`/records/${item.type}/${item.id}`}
                    className={styles.entryCard}
                  >
                    <div className={styles.entryMain}>
                      <div className={styles.iconWrapper}>{item.icon}</div>
                      <div className={styles.entryContent}>
                        <div className={styles.metaRow}>
                          <span className={styles.typeBadge}>
                            {item.typeLabel}
                          </span>
                          <span className={styles.dateText}>
                            {item.date ? formatDateShort(item.date) : 'Undated'}
                          </span>
                          {item.pregnancyWeek && (
                            <span className={styles.weekTag}>
                              {item.pregnancyWeek}
                            </span>
                          )}
                          {item.cost && (
                            <span className={styles.costTag}>
                              {formatCurrency(item.cost)}
                            </span>
                          )}
                        </div>
                        <h3 className={styles.entryTitle}>{item.title}</h3>
                        {item.subtitle && (
                          <p className={styles.entrySubtitle}>{item.subtitle}</p>
                        )}
                      </div>
                    </div>

                    <div className={styles.entryActions}>
                      {item.driveLink && (
                        <a
                          href={item.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.driveLinkBtn}
                          onClick={(e) => e.stopPropagation()}
                          title="View uploaded document in Google Drive"
                        >
                          <ExternalLink size={12} />
                          Report
                        </a>
                      )}
                      <ChevronRight size={18} className={styles.chevronIcon} />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
