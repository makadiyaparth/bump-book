'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState, useEffect } from 'react';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { RECORD_TYPES } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import JourneyLoader from '@/components/JourneyLoader';
import styles from '../../records.module.css';
import formStyles from '@/styles/forms.module.css';

export default function RecordDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  const [record, setRecord] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isToastError, setIsToastError] = useState(false);

  const recordType = RECORD_TYPES.find((r) => r.key === type);

  useEffect(() => {
    async function loadRecord() {
      if (!session?.accessToken || !recordType) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/sheets/${recordType.sheetTab}`);
        const data = await res.json();
        if (data.data) {
          const match = data.data.find((r: Record<string, string>) => r.id === id);
          if (match) {
            setRecord(match);
            setEditFormData(match);
          }
        }
      } catch (err) {
        console.error('Error fetching record:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRecord();
  }, [session, recordType, id]);

  const showToast = (msg: string, isError = false) => {
    setToastMessage(msg);
    setIsToastError(isError);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdate = async () => {
    if (isSaving || !recordType) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/sheets/${recordType.sheetTab}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (!res.ok) throw new Error('Failed to update record');

      setRecord(editFormData);
      setIsEditing(false);
      showToast('Record updated successfully');
    } catch (err) {
      console.error('Error updating record:', err);
      showToast('Failed to update record. Please try again.', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting || !recordType) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/sheets/${recordType.sheetTab}/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete record');

      router.push(`/records/${type}`);
    } catch (err) {
      console.error('Error deleting record:', err);
      showToast('Failed to delete record. Please try again.', true);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const updateEditField = (key: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (!recordType) {
    return (
      <div className={styles.detailPage}>
        <p>Record type not found.</p>
        <Link href="/dashboard" className={styles.backButton}>
          <ArrowLeft size={16} /> Return to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.detailPage}>
        <JourneyLoader
          message="Loading record details..."
          subMessage="Fetching observations, clinical notes, and files"
          cycle
          size="card"
        />
      </div>
    );
  }

  if (!record) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.emptyState}>
          <span className={styles.emptyEmoji}>🔍</span>
          <h2>Record Not Found</h2>
          <p className={styles.emptyText}>
            This record may have been deleted or moved.
          </p>
          <Link href={`/records/${type}`} className={styles.addButton}>
            <ArrowLeft size={16} /> Back to {recordType.label}
          </Link>
        </div>
      </div>
    );
  }

  const dateValue =
    record.visit_date ||
    record.test_date ||
    record.recorded_date ||
    record.appointment_date ||
    record.milestone_date ||
    record.note_date ||
    record.start_date;

  return (
    <div className={styles.detailPage}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <Link href={`/records/${type}`} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back to {recordType.label}
        </Link>

        <div className={styles.detailActions}>
          {!isEditing ? (
            <>
              <button
                className={styles.actionBtn}
                onClick={() => setIsEditing(true)}
              >
                <Edit2 size={15} /> Edit
              </button>
              <button
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 size={15} /> Delete
              </button>
            </>
          ) : (
            <>
              <button
                className={styles.actionBtn}
                onClick={() => {
                  setEditFormData(record);
                  setIsEditing(false);
                }}
              >
                <X size={15} /> Cancel
              </button>
              <button
                className={`${styles.actionBtn}`}
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  borderColor: 'var(--color-primary)',
                }}
                onClick={handleUpdate}
                disabled={isSaving}
              >
                <Check size={15} /> {isSaving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.detailCard}>
        <div className={styles.titleRow}>
          <div className={styles.titleWithIcon}>
            <div className={styles.titleIcon}>{recordType.icon}</div>
            <div>
              <h1 className={styles.title}>
                {record.medicine_name ||
                  record.test_name ||
                  (record.doctor_name ? `Dr. ${record.doctor_name}` : null) ||
                  record.purpose ||
                  record.milestone_type ||
                  record.title ||
                  recordType.label}
              </h1>
              {dateValue && (
                <p className={styles.countSubtitle}>{formatDate(dateValue)}</p>
              )}
            </div>
          </div>

          {record.report_link && (
            <a
              href={record.report_link}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.addButton}
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary)',
                boxShadow: 'none',
              }}
            >
              <ExternalLink size={14} />
              Open Drive File
            </a>
          )}
        </div>

        {isEditing ? (
          /* Editable Form Fields */
          <div className={formStyles.fieldGroup}>
            {Object.keys(record)
              .filter(
                (k) => !['id', 'created_at', 'updated_at'].includes(k)
              )
              .map((key) => {
                const label = key
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                const isLongText = [
                  'doctor_observations',
                  'result_summary',
                  'examination_notes',
                  'content',
                  'notes',
                  'diet_advice',
                  'restrictions',
                ].includes(key);

                return (
                  <div key={key} className={formStyles.field}>
                    <label>{label}</label>
                    {isLongText ? (
                      <textarea
                        value={editFormData[key] || ''}
                        onChange={(e) => updateEditField(key, e.target.value)}
                        rows={3}
                      />
                    ) : key.includes('date') ? (
                      <input
                        type="date"
                        value={editFormData[key] || ''}
                        onChange={(e) => updateEditField(key, e.target.value)}
                      />
                    ) : (
                      <input
                        type="text"
                        value={editFormData[key] || ''}
                        onChange={(e) => updateEditField(key, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          /* Read-only Detailed View */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            {Object.entries(record)
              .filter(
                ([k, v]) =>
                  !['id', 'created_at', 'updated_at', 'report_link'].includes(
                    k
                  ) && v
              )
              .map(([key, value]) => {
                const label = key
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                const isLong = String(value).length > 60 || key.includes('notes') || key.includes('content') || key.includes('observations');

                return (
                  <div
                    key={key}
                    style={{
                      borderBottom: '1px solid var(--color-border-light)',
                      paddingBottom: 'var(--space-3)',
                    }}
                  >
                    <div className={styles.detailLabel}>{label}</div>
                    {isLong ? (
                      <div className={styles.fullText}>{value}</div>
                    ) : (
                      <div
                        className={styles.detailValue}
                        style={{ fontSize: 'var(--font-size-base)', fontWeight: 500 }}
                      >
                        {key.includes('date') ? formatDate(value) : value}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <AlertTriangle
              size={40}
              color="var(--color-danger)"
              style={{ marginBottom: 'var(--space-3)' }}
            />
            <h3 className={styles.modalTitle}>Delete Record?</h3>
            <p className={styles.modalText}>
              Are you sure you want to delete this record? This action will permanently remove it from your Google Sheet.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelModalBtn}
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.confirmDeleteBtn}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`${formStyles.toast} ${isToastError ? formStyles.toastError : ''}`}>
          {!isToastError && <Check size={16} />}
          {toastMessage}
        </div>
      )}
    </div>
  );
}
