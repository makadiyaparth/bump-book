'use client';

import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, UploadCloud, Paperclip, X } from 'lucide-react';
import { generateId, now, today } from '@/lib/utils';
import { RECORD_TYPES, MILESTONE_TYPES } from '@/lib/types';
import type { RecordType } from '@/lib/types';
import formStyles from '@/styles/forms.module.css';

export default function AddRecordFormPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  const recordType = RECORD_TYPES.find((r) => r.key === type);
  if (!recordType) {
    return <p>Invalid record type.</p>;
  }

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showError('File size exceeds 10MB limit.');
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('folderType', type === 'test' ? 'Reports' : 'Other');

      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const result = await res.json();
      updateField('report_link', result.webViewLink);
      setUploadedFileName(file.name);
    } catch (err: unknown) {
      console.error('File upload error:', err);
      showError('Failed to upload file to Google Drive. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const data: Record<string, string> = {
        id: generateId(),
        ...formData,
        created_at: now(),
      };

      const res = await fetch(`/api/sheets/${recordType.sheetTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to save');

      setShowToast(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch (error) {
      console.error('Error saving record:', error);
      showError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={formStyles.formPage}>
      <div className={formStyles.formHeader}>
        <Link href="/add" className={formStyles.backLink}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className={formStyles.formTitle}>
          {recordType.icon} {recordType.label}
        </h1>
      </div>

      <div className={formStyles.formCard}>
        <div className={formStyles.fieldGroup}>
          {renderFields(type as RecordType, formData, updateField, {
            uploading,
            uploadedFileName,
            handleFileUpload,
            removeFile: () => {
              updateField('report_link', '');
              setUploadedFileName('');
            },
          })}
        </div>

        <div className={formStyles.formActions}>
          <button
            className={formStyles.cancelButton}
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button
            className={formStyles.saveButton}
            onClick={handleSave}
            disabled={saving || uploading}
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <Check size={16} />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {showToast && (
        <div className={formStyles.toast}>
          <Check size={16} />
          Record saved successfully
        </div>
      )}

      {errorMessage && (
        <div className={`${formStyles.toast} ${formStyles.toastError}`}>
          {errorMessage}
        </div>
      )}
    </div>
  );
}

interface UploadProps {
  uploading: boolean;
  uploadedFileName: string;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeFile: () => void;
}

/**
 * Render form fields based on record type.
 */
function renderFields(
  type: RecordType,
  data: Record<string, string>,
  update: (key: string, value: string) => void,
  uploadProps: UploadProps
) {
  const todayStr = today();

  switch (type) {
    case 'doctor-visit':
      return (
        <>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="visit-date">Visit Date *</label>
              <input
                id="visit-date"
                type="date"
                value={data.visit_date || todayStr}
                onChange={(e) => update('visit_date', e.target.value)}
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="doctor-name">Doctor Name</label>
              <input
                id="doctor-name"
                type="text"
                value={data.doctor_name || ''}
                onChange={(e) => update('doctor_name', e.target.value)}
                placeholder="Dr. ..."
              />
            </div>
          </div>
          <div className={formStyles.field}>
            <label htmlFor="hospital">Hospital / Clinic</label>
            <input
              id="hospital"
              type="text"
              value={data.hospital || ''}
              onChange={(e) => update('hospital', e.target.value)}
            />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="reason">Reason for Visit</label>
            <input
              id="reason"
              type="text"
              value={data.reason || ''}
              onChange={(e) => update('reason', e.target.value)}
              placeholder="Routine checkup, concern, follow-up..."
            />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="symptoms">Symptoms Discussed</label>
            <input
              id="symptoms"
              type="text"
              value={data.symptoms_discussed || ''}
              onChange={(e) => update('symptoms_discussed', e.target.value)}
              placeholder="e.g., Back pain, nausea"
            />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="observations">Doctor&apos;s Observations</label>
            <textarea
              id="observations"
              value={data.doctor_observations || ''}
              onChange={(e) => update('doctor_observations', e.target.value)}
              placeholder="What did the doctor say?"
            />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="medicines-prescribed">Medicines Prescribed</label>
            <input
              id="medicines-prescribed"
              type="text"
              value={data.medicines_prescribed || ''}
              onChange={(e) => update('medicines_prescribed', e.target.value)}
              placeholder="e.g., Iron, Calcium"
            />
          </div>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="tests-ordered">Tests Ordered</label>
              <input
                id="tests-ordered"
                type="text"
                value={data.tests_ordered || ''}
                onChange={(e) => update('tests_ordered', e.target.value)}
                placeholder="e.g., CBC, Ultrasound"
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="next-appt">Next Appointment</label>
              <input
                id="next-appt"
                type="date"
                value={data.next_appointment || ''}
                onChange={(e) => update('next_appointment', e.target.value)}
              />
            </div>
          </div>
          <div className={formStyles.field}>
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              value={data.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Any other notes..."
            />
          </div>
        </>
      );

    case 'medicine':
      return (
        <>
          <div className={formStyles.field}>
            <label htmlFor="medicine-name">Medicine Name *</label>
            <input
              id="medicine-name"
              type="text"
              value={data.medicine_name || ''}
              onChange={(e) => update('medicine_name', e.target.value)}
              placeholder="e.g., Iron supplement"
            />
          </div>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="dosage">Dosage</label>
              <input
                id="dosage"
                type="text"
                value={data.dosage || ''}
                onChange={(e) => update('dosage', e.target.value)}
                placeholder="e.g., 500mg"
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="frequency">Frequency</label>
              <select
                id="frequency"
                value={data.frequency || ''}
                onChange={(e) => update('frequency', e.target.value)}
              >
                <option value="">Select</option>
                <option value="Once daily">Once daily</option>
                <option value="Twice daily">Twice daily</option>
                <option value="Three times daily">Three times daily</option>
                <option value="Once weekly">Once weekly</option>
                <option value="As needed">As needed</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="start-date">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={data.start_date || todayStr}
                onChange={(e) => update('start_date', e.target.value)}
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="end-date">
                End Date <span className={formStyles.fieldOptional}>(optional)</span>
              </label>
              <input
                id="end-date"
                type="date"
                value={data.end_date || ''}
                onChange={(e) => update('end_date', e.target.value)}
              />
            </div>
          </div>
          <div className={formStyles.field}>
            <label htmlFor="prescribed-by">Prescribed By</label>
            <input
              id="prescribed-by"
              type="text"
              value={data.prescribed_by || ''}
              onChange={(e) => update('prescribed_by', e.target.value)}
              placeholder="Doctor name"
            />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="reason">Reason</label>
            <input
              id="reason"
              type="text"
              value={data.reason || ''}
              onChange={(e) => update('reason', e.target.value)}
              placeholder="Why was this prescribed?"
            />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="is-active">Status</label>
            <select
              id="is-active"
              value={data.is_active || 'TRUE'}
              onChange={(e) => update('is_active', e.target.value)}
            >
              <option value="TRUE">Currently taking</option>
              <option value="FALSE">Stopped</option>
            </select>
          </div>
          <div className={formStyles.field}>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={data.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </>
      );

    case 'test':
      return (
        <>
          <div className={formStyles.field}>
            <label htmlFor="test-name">Test Name *</label>
            <input
              id="test-name"
              type="text"
              value={data.test_name || ''}
              onChange={(e) => update('test_name', e.target.value)}
              placeholder="e.g., CBC, Glucose, Ultrasound"
            />
          </div>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="test-date">Test Date</label>
              <input
                id="test-date"
                type="date"
                value={data.test_date || todayStr}
                onChange={(e) => update('test_date', e.target.value)}
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={data.status || 'Completed'}
                onChange={(e) => update('status', e.target.value)}
              >
                <option value="Ordered">Ordered</option>
                <option value="Pending Results">Pending Results</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <div className={formStyles.field}>
            <label htmlFor="reason">Reason</label>
            <input
              id="reason"
              type="text"
              value={data.reason || ''}
              onChange={(e) => update('reason', e.target.value)}
              placeholder="Why was this test done?"
            />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="result-summary">Result Summary</label>
            <textarea
              id="result-summary"
              value={data.result_summary || ''}
              onChange={(e) => update('result_summary', e.target.value)}
              placeholder="Key results or findings..."
            />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="ordered-by">Ordered By</label>
            <input
              id="ordered-by"
              type="text"
              value={data.ordered_by || ''}
              onChange={(e) => update('ordered_by', e.target.value)}
              placeholder="Doctor name"
            />
          </div>
          <div className={formStyles.field}>
            <label>
              Report / Scan File{' '}
              <span className={formStyles.fieldOptional}>
                (optional, PDF/Image up to 10MB)
              </span>
            </label>
            {data.report_link ? (
              <div className={formStyles.filePreview}>
                <div className={formStyles.fileInfo}>
                  <Paperclip size={16} />
                  <a
                    href={data.report_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--color-primary)',
                      textDecoration: 'underline',
                    }}
                  >
                    {uploadProps.uploadedFileName || 'View Uploaded Document'}
                  </a>
                </div>
                <button
                  type="button"
                  className={formStyles.removeFileBtn}
                  onClick={uploadProps.removeFile}
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className={formStyles.uploadArea}>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  style={{ display: 'none' }}
                  onChange={uploadProps.handleFileUpload}
                  disabled={uploadProps.uploading}
                />
                <UploadCloud size={24} className={formStyles.uploadIcon} />
                <span className={formStyles.uploadText}>
                  {uploadProps.uploading
                    ? 'Uploading file to Drive...'
                    : 'Click to upload report or scan'}
                </span>
                <span className={formStyles.uploadHint}>
                  Files are saved privately to your Google Drive
                </span>
              </label>
            )}
          </div>
          <div className={formStyles.field}>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={data.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </>
      );

    case 'health-stats':
      return (
        <>
          <div className={formStyles.field}>
            <label htmlFor="recorded-date">Date *</label>
            <input
              id="recorded-date"
              type="date"
              value={data.recorded_date || todayStr}
              onChange={(e) => update('recorded_date', e.target.value)}
            />
          </div>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="bp-systolic">BP Systolic</label>
              <input
                id="bp-systolic"
                type="number"
                value={data.bp_systolic || ''}
                onChange={(e) => update('bp_systolic', e.target.value)}
                placeholder="e.g., 120"
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="bp-diastolic">BP Diastolic</label>
              <input
                id="bp-diastolic"
                type="number"
                value={data.bp_diastolic || ''}
                onChange={(e) => update('bp_diastolic', e.target.value)}
                placeholder="e.g., 80"
              />
            </div>
          </div>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="weight">Weight (kg)</label>
              <input
                id="weight"
                type="number"
                step="0.1"
                value={data.weight_kg || ''}
                onChange={(e) => update('weight_kg', e.target.value)}
                placeholder="e.g., 64.5"
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="blood-sugar">Blood Sugar (mg/dL)</label>
              <input
                id="blood-sugar"
                type="number"
                value={data.blood_sugar || ''}
                onChange={(e) => update('blood_sugar', e.target.value)}
                placeholder="e.g., 96"
              />
            </div>
          </div>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="temperature">Temperature (°F)</label>
              <input
                id="temperature"
                type="number"
                step="0.1"
                value={data.temperature || ''}
                onChange={(e) => update('temperature', e.target.value)}
                placeholder="e.g., 98.6"
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="hemoglobin">Hemoglobin (g/dL)</label>
              <input
                id="hemoglobin"
                type="number"
                step="0.1"
                value={data.hemoglobin || ''}
                onChange={(e) => update('hemoglobin', e.target.value)}
                placeholder="e.g., 12.0"
              />
            </div>
          </div>
          <div className={formStyles.field}>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={data.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </>
      );

    case 'baby-stats':
      return (
        <>
          <div className={formStyles.field}>
            <label htmlFor="recorded-date">Date *</label>
            <input
              id="recorded-date"
              type="date"
              value={data.recorded_date || todayStr}
              onChange={(e) => update('recorded_date', e.target.value)}
            />
          </div>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="fhr">Heart Rate (bpm)</label>
              <input
                id="fhr"
                type="number"
                value={data.fhr_bpm || ''}
                onChange={(e) => update('fhr_bpm', e.target.value)}
                placeholder="e.g., 145"
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="baby-weight">Weight (grams)</label>
              <input
                id="baby-weight"
                type="number"
                value={data.baby_weight_grams || ''}
                onChange={(e) => update('baby_weight_grams', e.target.value)}
                placeholder="e.g., 800"
              />
            </div>
          </div>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="bpd">BPD (mm)</label>
              <input
                id="bpd"
                type="number"
                step="0.1"
                value={data.bpd_mm || ''}
                onChange={(e) => update('bpd_mm', e.target.value)}
              />
              <span className={formStyles.fieldHint}>Biparietal diameter</span>
            </div>
            <div className={formStyles.field}>
              <label htmlFor="fl">FL (mm)</label>
              <input
                id="fl"
                type="number"
                step="0.1"
                value={data.fl_mm || ''}
                onChange={(e) => update('fl_mm', e.target.value)}
              />
              <span className={formStyles.fieldHint}>Femur length</span>
            </div>
          </div>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="ac">AC (mm)</label>
              <input
                id="ac"
                type="number"
                step="0.1"
                value={data.ac_mm || ''}
                onChange={(e) => update('ac_mm', e.target.value)}
              />
              <span className={formStyles.fieldHint}>Abdominal circumference</span>
            </div>
            <div className={formStyles.field}>
              <label htmlFor="hc">HC (mm)</label>
              <input
                id="hc"
                type="number"
                step="0.1"
                value={data.hc_mm || ''}
                onChange={(e) => update('hc_mm', e.target.value)}
              />
              <span className={formStyles.fieldHint}>Head circumference</span>
            </div>
          </div>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="movement">Movement Felt?</label>
              <select
                id="movement"
                value={data.movement_felt || 'FALSE'}
                onChange={(e) => update('movement_felt', e.target.value)}
              >
                <option value="FALSE">No</option>
                <option value="TRUE">Yes</option>
              </select>
            </div>
            <div className={formStyles.field}>
              <label htmlFor="movement-count">Movement Count</label>
              <input
                id="movement-count"
                type="number"
                value={data.movement_count || ''}
                onChange={(e) => update('movement_count', e.target.value)}
              />
            </div>
          </div>
          <div className={formStyles.field}>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={data.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </>
      );

    case 'note':
      return (
        <>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="note-date">Date</label>
              <input
                id="note-date"
                type="date"
                value={data.note_date || todayStr}
                onChange={(e) => update('note_date', e.target.value)}
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={data.category || 'General'}
                onChange={(e) => update('category', e.target.value)}
              >
                <option value="General">General</option>
                <option value="Symptom">Symptom</option>
                <option value="Question">Question</option>
                <option value="Mood">Mood</option>
                <option value="Diet">Diet</option>
              </select>
            </div>
          </div>
          <div className={formStyles.field}>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={data.title || ''}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Brief title..."
            />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              value={data.content || ''}
              onChange={(e) => update('content', e.target.value)}
              placeholder="Write your note..."
              style={{ minHeight: '150px' }}
            />
          </div>
        </>
      );

    case 'appointment':
      return (
        <>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="appt-date">Appointment Date *</label>
              <input
                id="appt-date"
                type="date"
                value={data.appointment_date || ''}
                onChange={(e) => update('appointment_date', e.target.value)}
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="appt-time">Time</label>
              <input
                id="appt-time"
                type="time"
                value={data.appointment_time || ''}
                onChange={(e) => update('appointment_time', e.target.value)}
              />
            </div>
          </div>
          <div className={formStyles.field}>
            <label htmlFor="purpose">Purpose *</label>
            <input
              id="purpose"
              type="text"
              value={data.purpose || ''}
              onChange={(e) => update('purpose', e.target.value)}
              placeholder="e.g., Routine checkup, Growth scan"
            />
          </div>
          <div className={formStyles.fieldRow}>
            <div className={formStyles.field}>
              <label htmlFor="doctor-name">Doctor</label>
              <input
                id="doctor-name"
                type="text"
                value={data.doctor_name || ''}
                onChange={(e) => update('doctor_name', e.target.value)}
              />
            </div>
            <div className={formStyles.field}>
              <label htmlFor="hospital">Hospital</label>
              <input
                id="hospital"
                type="text"
                value={data.hospital || ''}
                onChange={(e) => update('hospital', e.target.value)}
              />
            </div>
          </div>
          <div className={formStyles.field}>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={data.status || 'Upcoming'}
              onChange={(e) => update('status', e.target.value)}
            >
              <option value="Upcoming">Upcoming</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className={formStyles.field}>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={data.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </>
      );

    case 'milestone':
      return (
        <>
          <div className={formStyles.field}>
            <label htmlFor="milestone-type">Milestone *</label>
            <select
              id="milestone-type"
              value={data.milestone_type || ''}
              onChange={(e) => update('milestone_type', e.target.value)}
            >
              <option value="">Select a milestone</option>
              {MILESTONE_TYPES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className={formStyles.field}>
            <label htmlFor="milestone-date">Date *</label>
            <input
              id="milestone-date"
              type="date"
              value={data.milestone_date || todayStr}
              onChange={(e) => update('milestone_date', e.target.value)}
            />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={data.description || ''}
              onChange={(e) => update('description', e.target.value)}
              placeholder="How did it feel? Any special moment?"
            />
          </div>
          <div className={formStyles.field}>
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={data.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
            />
          </div>
        </>
      );

    default:
      return <p>Unknown record type.</p>;
  }
}
