'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { use, useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  ChevronRight,
} from 'lucide-react';
import { RECORD_TYPES } from '@/lib/types';
import { formatDateShort } from '@/lib/utils';
import styles from '../records.module.css';

export default function RecordTypeListPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);
  const { data: session } = useSession();
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const recordType = RECORD_TYPES.find((r) => r.key === type);

  useEffect(() => {
    async function loadData() {
      if (!session?.accessToken || !recordType) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/sheets/${recordType.sheetTab}`);
        const data = await res.json();
        if (data.data) {
          // Sort descending by date or created_at
          const sorted = [...data.data].reverse();
          setRecords(sorted);
        }
      } catch (err) {
        console.error('Error fetching records:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [session, recordType]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter((r) =>
      Object.values(r).some((val) =>
        String(val || '').toLowerCase().includes(q)
      )
    );
  }, [records, searchQuery]);

  if (!recordType) {
    return (
      <div className={styles.recordsPage}>
        <p>Record type not found.</p>
        <Link href="/dashboard" className={styles.backButton}>
          <ArrowLeft size={16} /> Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.recordsPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.breadcrumb}>
          <Link href="/dashboard">Dashboard</Link>
          <span>/</span>
          <Link href="/timeline">Timeline</Link>
          <span>/</span>
          <span>{recordType.label}</span>
        </div>

        <div className={styles.titleRow}>
          <div className={styles.titleWithIcon}>
            <div className={styles.titleIcon}>{recordType.icon}</div>
            <div>
              <h1 className={styles.title}>{recordType.label}</h1>
              <p className={styles.countSubtitle}>
                {records.length} {records.length === 1 ? 'entry' : 'entries'}{' '}
                recorded
              </p>
            </div>
          </div>

          <Link href={`/add/${type}`} className={styles.addButton}>
            <Plus size={16} />
            Add New
          </Link>
        </div>

        {/* Search */}
        {records.length > 0 && (
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={`Search in ${recordType.label}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.emptyState}>
          <p style={{ color: 'var(--color-text-tertiary)' }}>
            Loading {recordType.label}...
          </p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyEmoji}>{recordType.icon}</span>
          <h2 className={styles.emptyTitle}>
            {searchQuery ? 'No matching records' : `No ${recordType.label} yet`}
          </h2>
          <p className={styles.emptyText}>
            {searchQuery
              ? 'Try modifying your search keywords.'
              : `Start logging your ${recordType.label.toLowerCase()} to keep a complete record.`}
          </p>
          <Link href={`/add/${type}`} className={styles.addButton}>
            <Plus size={16} />
            Add First {recordType.label}
          </Link>
        </div>
      ) : (
        <div className={styles.cardsList}>
          {filteredRecords.map((r) => {
            const dateStr =
              r.visit_date ||
              r.test_date ||
              r.recorded_date ||
              r.appointment_date ||
              r.milestone_date ||
              r.note_date ||
              r.start_date ||
              '';

            const title =
              r.medicine_name ||
              r.test_name ||
              (r.doctor_name ? `Dr. ${r.doctor_name}` : null) ||
              r.purpose ||
              r.milestone_type ||
              r.title ||
              recordType.label;

            return (
              <Link
                key={r.id}
                href={`/records/${type}/${r.id}`}
                className={styles.recordCard}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{title}</h3>
                  {dateStr && (
                    <span className={styles.cardDate}>
                      {formatDateShort(dateStr)}
                    </span>
                  )}
                </div>

                <div className={styles.cardDetailsGrid}>
                  {renderCardSummary(type, r)}
                </div>

                <div className={styles.cardFooter}>
                  <span>Click to view details & edit</span>
                  <span className={styles.viewMore}>
                    Details <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function renderCardSummary(type: string, r: Record<string, string>) {
  switch (type) {
    case 'doctor-visit':
      return (
        <>
          {r.hospital && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Hospital</span>
              <span className={styles.detailValue}>{r.hospital}</span>
            </div>
          )}
          {r.reason && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Reason</span>
              <span className={styles.detailValue}>{r.reason}</span>
            </div>
          )}
          {r.medicines_prescribed && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Medicines</span>
              <span className={styles.detailValue}>
                {r.medicines_prescribed}
              </span>
            </div>
          )}
          {r.next_appointment && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Next Visit</span>
              <span className={styles.detailValue}>
                {formatDateShort(r.next_appointment)}
              </span>
            </div>
          )}
        </>
      );

    case 'medicine':
      return (
        <>
          {r.dosage && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Dosage</span>
              <span className={styles.detailValue}>{r.dosage}</span>
            </div>
          )}
          {r.frequency && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Frequency</span>
              <span className={styles.detailValue}>{r.frequency}</span>
            </div>
          )}
          {r.is_active && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Status</span>
              <span
                className={`${styles.badge} ${
                  r.is_active === 'TRUE'
                    ? styles.badgeSuccess
                    : styles.badgeWarning
                }`}
              >
                {r.is_active === 'TRUE' ? 'Active' : 'Stopped'}
              </span>
            </div>
          )}
        </>
      );

    case 'test':
      return (
        <>
          {r.status && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Status</span>
              <span className={styles.detailValue}>{r.status}</span>
            </div>
          )}
          {r.result_summary && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Findings</span>
              <span className={styles.detailValue}>{r.result_summary}</span>
            </div>
          )}
          {r.report_link && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Report File</span>
              <span
                className={styles.detailValue}
                style={{ color: 'var(--color-primary)' }}
              >
                Attached in Drive 📄
              </span>
            </div>
          )}
        </>
      );

    case 'health-stats':
      return (
        <>
          {r.bp_systolic && r.bp_diastolic && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Blood Pressure</span>
              <span className={styles.detailValue}>
                {r.bp_systolic} / {r.bp_diastolic} mmHg
              </span>
            </div>
          )}
          {r.weight_kg && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Weight</span>
              <span className={styles.detailValue}>{r.weight_kg} kg</span>
            </div>
          )}
          {r.blood_sugar && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Blood Sugar</span>
              <span className={styles.detailValue}>
                {r.blood_sugar} mg/dL
              </span>
            </div>
          )}
        </>
      );

    case 'baby-stats':
      return (
        <>
          {r.fhr_bpm && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Heart Rate (FHR)</span>
              <span className={styles.detailValue}>{r.fhr_bpm} bpm</span>
            </div>
          )}
          {r.baby_weight_grams && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Baby Weight</span>
              <span className={styles.detailValue}>
                {r.baby_weight_grams} grams
              </span>
            </div>
          )}
          {r.movement_count && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Kick Count</span>
              <span className={styles.detailValue}>{r.movement_count}</span>
            </div>
          )}
        </>
      );

    case 'appointment':
      return (
        <>
          {r.appointment_time && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Time</span>
              <span className={styles.detailValue}>{r.appointment_time}</span>
            </div>
          )}
          {r.doctor_name && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Doctor</span>
              <span className={styles.detailValue}>Dr. {r.doctor_name}</span>
            </div>
          )}
          {r.status && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Status</span>
              <span className={styles.detailValue}>{r.status}</span>
            </div>
          )}
        </>
      );

    case 'milestone':
      return (
        <>
          {r.description && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Note</span>
              <span className={styles.detailValue}>{r.description}</span>
            </div>
          )}
        </>
      );

    case 'note':
      return (
        <>
          {r.category && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Category</span>
              <span className={styles.detailValue}>{r.category}</span>
            </div>
          )}
          {r.content && (
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Content</span>
              <span className={styles.detailValue}>
                {r.content.slice(0, 80)}
                {r.content.length > 80 ? '...' : ''}
              </span>
            </div>
          )}
        </>
      );

    default:
      return null;
  }
}
