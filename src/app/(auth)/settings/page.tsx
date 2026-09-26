'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import {
  User,
  FileSpreadsheet,
  FolderSync,
  LogOut,
  ExternalLink,
  Check,
  ShieldCheck,
  Heart,
} from 'lucide-react';
import { calculateDueDate } from '@/lib/pregnancy';
import { formatDate } from '@/lib/utils';
import styles from './page.module.css';
import formStyles from '@/styles/forms.module.css';

export default function SettingsPage() {
  const { data: session } = useSession();

  const [profileId, setProfileId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({
    lmp_date: '',
    due_date: '',
    blood_group: '',
    rh_factor: '',
    pregnancy_type: 'Singleton',
    allergies: '',
    medical_conditions: '',
    primary_doctor: '',
    primary_hospital: '',
  });

  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      if (!session?.accessToken || !session?.spreadsheetId) {
        setLoading(false);
        return;
      }

      try {
        // Load Pregnancy Profile
        const pregRes = await fetch('/api/sheets/Pregnancy');
        const pregJson = await pregRes.json();
        if (pregJson.data?.[0]) {
          const row = pregJson.data[0];
          setProfileId(row.id);
          setFormData({
            lmp_date: row.lmp_date || '',
            due_date: row.due_date || '',
            blood_group: row.blood_group || '',
            rh_factor: row.rh_factor || '',
            pregnancy_type: row.pregnancy_type || 'Singleton',
            allergies: row.allergies || '',
            medical_conditions: row.medical_conditions || '',
            primary_doctor: row.primary_doctor || '',
            primary_hospital: row.primary_hospital || '',
          });
        }

        // Load Config tab for Drive Folder ID
        try {
          const configRes = await fetch('/api/sheets/_Config');
          const configJson = await configRes.json();
          if (configJson.data) {
            const folderRow = configJson.data.find(
              (r: Record<string, string>) => r.key === 'drive_folder_id'
            );
            if (folderRow?.value) {
              setDriveFolderId(folderRow.value);
            }
          }
        } catch {}
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [session]);

  const updateField = (key: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      // Auto-calculate due date if LMP changes
      if (key === 'lmp_date' && value) {
        updated.due_date = calculateDueDate(value);
      }
      return updated;
    });
  };

  const handleSaveProfile = async () => {
    if (saving || !profileId) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/sheets/Pregnancy/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Failed to update pregnancy profile');

      setToastMessage('Pregnancy profile updated successfully');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const spreadsheetUrl = session?.spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${session.spreadsheetId}`
    : null;

  const driveFolderUrl = driveFolderId
    ? `https://drive.google.com/drive/folders/${driveFolderId}`
    : 'https://drive.google.com/drive/my-drive';

  return (
    <div className={styles.settingsPage}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Manage your pregnancy details, cloud integrations, and account
        </p>
      </div>

      <div className={styles.sectionList}>
        {/* Section 1: Account */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <User size={18} color="var(--color-primary)" />
              <h2 className={styles.cardTitle}>Google Account</h2>
            </div>
          </div>

          <div className={styles.accountRow}>
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className={styles.avatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={styles.avatar}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  backgroundColor: 'var(--color-bg-alt)',
                }}
              >
                🤰
              </div>
            )}

            <div className={styles.accountInfo}>
              <div className={styles.accountName}>
                {session?.user?.name || 'User'}
              </div>
              <div className={styles.accountEmail}>
                {session?.user?.email || '—'}
              </div>
            </div>

            <button
              className={styles.signOutBtn}
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Section 2: Pregnancy Profile */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <Heart size={18} color="var(--color-primary)" />
              <h2 className={styles.cardTitle}>Pregnancy Details</h2>
            </div>
          </div>

          {loading ? (
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>
              Loading profile details...
            </p>
          ) : (
            <div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="lmp-date">Last Menstrual Period (LMP)</label>
                  <input
                    id="lmp-date"
                    type="date"
                    value={formData.lmp_date}
                    onChange={(e) => updateField('lmp_date', e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="due-date">Estimated Due Date (EDD)</label>
                  <input
                    id="due-date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => updateField('due_date', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="pregnancy-type">Pregnancy Type</label>
                  <select
                    id="pregnancy-type"
                    value={formData.pregnancy_type}
                    onChange={(e) =>
                      updateField('pregnancy_type', e.target.value)
                    }
                  >
                    <option value="Singleton">Singleton</option>
                    <option value="Twins">Twins</option>
                    <option value="Triplets">Triplets</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="blood-group">Blood Group</label>
                  <select
                    id="blood-group"
                    value={formData.blood_group}
                    onChange={(e) =>
                      updateField('blood_group', e.target.value)
                    }
                  >
                    <option value="">Select blood group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="primary-doctor">Primary Doctor</label>
                  <input
                    id="primary-doctor"
                    type="text"
                    value={formData.primary_doctor}
                    onChange={(e) =>
                      updateField('primary_doctor', e.target.value)
                    }
                    placeholder="Dr. ..."
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="primary-hospital">Hospital / Clinic</label>
                  <input
                    id="primary-hospital"
                    type="text"
                    value={formData.primary_hospital}
                    onChange={(e) =>
                      updateField('primary_hospital', e.target.value)
                    }
                    placeholder="Hospital name"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="allergies">Known Allergies</label>
                <input
                  id="allergies"
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => updateField('allergies', e.target.value)}
                  placeholder="e.g., Penicillin, Peanuts"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="medical-conditions">
                  Pre-existing Conditions
                </label>
                <input
                  id="medical-conditions"
                  type="text"
                  value={formData.medical_conditions}
                  onChange={(e) =>
                    updateField('medical_conditions', e.target.value)
                  }
                  placeholder="e.g., Thyroid, Asthma"
                />
              </div>

              <button
                className={styles.saveBtn}
                onClick={handleSaveProfile}
                disabled={saving}
              >
                <Check size={16} />
                {saving ? 'Saving changes...' : 'Save Profile Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Section 3: Google Cloud Integration */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <FolderSync size={18} color="var(--color-primary)" />
              <h2 className={styles.cardTitle}>Cloud Data Storage</h2>
            </div>
          </div>

          <div className={styles.linkRow}>
            <div className={styles.linkInfo}>
              <div className={styles.linkIcon}>📊</div>
              <div>
                <div className={styles.linkTitle}>Google Spreadsheet</div>
                <div className={styles.linkDesc}>
                  All visits, medicines, and vitals are saved in your personal Sheet
                </div>
              </div>
            </div>

            {spreadsheetUrl ? (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.openLinkBtn}
              >
                <ExternalLink size={14} /> Open Sheet
              </a>
            ) : (
              <span className={styles.linkDesc}>Not initialized</span>
            )}
          </div>

          <div className={styles.linkRow}>
            <div className={styles.linkInfo}>
              <div className={styles.linkIcon}>📁</div>
              <div>
                <div className={styles.linkTitle}>Google Drive Folder</div>
                <div className={styles.linkDesc}>
                  Ultrasounds, lab test PDFs, and prescriptions folder
                </div>
              </div>
            </div>

            <a
              href={driveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.openLinkBtn}
            >
              <ExternalLink size={14} /> Open Drive
            </a>
          </div>
        </div>

        {/* Section 4: Privacy & App Information */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <ShieldCheck size={18} color="var(--color-success)" />
              <h2 className={styles.cardTitle}>Privacy & Data Ownership</h2>
            </div>
          </div>

          <p className={styles.infoText}>
            Pregnancy Journey Tracker does not run a central database. All health
            records and uploaded documents reside completely inside your personal
            Google account (Google Sheets & Google Drive). You maintain 100%
            ownership and control over your medical data at all times.
          </p>
        </div>
      </div>

      {/* Success Toast */}
      {toastMessage && (
        <div className={formStyles.toast}>
          <Check size={16} />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
