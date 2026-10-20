'use client';

import { useSession, signOut, signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  FolderSync,
  LogOut,
  ExternalLink,
  Check,
  ShieldCheck,
  Heart,
  RefreshCw,
  BarChart3,
  Share2,
} from 'lucide-react';
import { calculateDueDate } from '@/lib/pregnancy';
import JourneyLoader from '@/components/JourneyLoader';
import { invalidateSheetTab, syncAllSheets } from '@/lib/useSheetData';
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
  const [overviewSheetId, setOverviewSheetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generatingCharts, setGeneratingCharts] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      if (!session?.accessToken) {
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

            const overviewRow = configJson.data.find(
              (r: Record<string, string>) => r.key === 'overview_sheet_id'
            );
            if (overviewRow?.value) {
              setOverviewSheetId(overviewRow.value);
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

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const ok = await syncAllSheets();
      if (ok) {
        setToastMessage('Successfully synchronized with your Google Sheet!');
      } else {
        setToastMessage('Sync failed. Please check your connection.');
      }
    } finally {
      setSyncing(false);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleSetupCharts = async () => {
    if (generatingCharts) return;

    if (session?.isDemo) {
      setToastMessage('In Demo mode. Real Google Sheet charts generate when connected with Google.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    setGeneratingCharts(true);
    try {
      const res = await fetch('/api/sheets/setup-charts', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        if (json.sheetId !== undefined) {
          setOverviewSheetId(String(json.sheetId));
        }
        setToastMessage('Overview & Charts sheet created in your Google Spreadsheet!');
      } else {
        setToastMessage(json.error || 'Failed to generate charts sheet.');
      }
    } catch (err) {
      console.error('Error generating charts sheet:', err);
      setToastMessage('Error connecting to Google Sheets.');
    } finally {
      setGeneratingCharts(false);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleSaveProfile = async () => {
    if (saving || !profileId) return;

    if (session?.isDemo) {
      setToastMessage('Demo mode is read-only. Sign in with Google to edit your profile.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

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

      // Invalidate Pregnancy cache so Dashboard and Timeline show fresh data
      invalidateSheetTab('Pregnancy');

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

  const chartsSheetUrl = session?.spreadsheetId
    ? overviewSheetId !== null
      ? `https://docs.google.com/spreadsheets/d/${session.spreadsheetId}/edit#gid=${overviewSheetId}`
      : `https://docs.google.com/spreadsheets/d/${session.spreadsheetId}/edit`
    : null;

  const driveFolderUrl = driveFolderId
    ? `https://drive.google.com/drive/folders/${driveFolderId}`
    : 'https://drive.google.com/drive/my-drive';

  return (
    <div className={styles.settingsPage}>
      {/* Header */}
      <div className={styles.header}>
        <p className={styles.settingsDiaryTag}>preferences & privacy ⚙️</p>
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
              <Image
                src="/bump-book-icon.png"
                alt="User"
                width={52}
                height={52}
                className={styles.avatar}
              />
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
            <JourneyLoader
              message="Loading profile details..."
              subMessage="Retrieving your profile from Google Sheets"
              cycle
              size="compact"
            />
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
                title={session?.isDemo ? 'Read-only in Demo Mode' : 'Save Profile Changes'}
              >
                <Check size={16} />
                {saving
                  ? 'Saving changes...'
                  : session?.isDemo
                  ? 'Save Profile (Read-Only Demo)'
                  : 'Save Profile Changes'}
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

          {session?.isDemo ? (
            <div style={{
              padding: 'var(--space-4)',
              background: 'linear-gradient(135deg, hsl(348 85% 97%), hsl(280 70% 97%))',
              borderRadius: 'var(--radius-lg)',
              border: '1.5px solid hsl(348 70% 88%)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'hsl(348 60% 28%)', margin: 0, lineHeight: 'var(--line-height-relaxed)' }}>
                🌟 <strong>Demo Mode Active (No Google Connection Required)</strong>: You are viewing pre-filled sample Indian pregnancy records. When you sign in with your real Google account, Bump Book automatically connects directly to your private Google Sheet and Google Drive. No health records are ever stored on external servers.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => signIn('google')}
                  className={styles.saveBtn}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Connect Your Google Account
                </button>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className={styles.signOutBtn}
                  style={{ alignSelf: 'flex-start', background: 'white' }}
                >
                  Exit Demo
                </button>
              </div>
            </div>
          ) : (
            <>
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

              <div className={styles.linkRow}>
                <div className={styles.linkInfo}>
                  <div className={styles.linkIcon}>🔄</div>
                  <div>
                    <div className={styles.linkTitle}>Sync with Google Sheets</div>
                    <div className={styles.linkDesc}>
                      Fetch any rows updated or added directly in your Google Spreadsheet
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncing}
                  className={styles.openLinkBtn}
                  style={{
                    cursor: syncing ? 'wait' : 'pointer',
                    background: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <RefreshCw
                    size={14}
                    style={{
                      animation: syncing ? 'spin 1s linear infinite' : 'none',
                    }}
                  />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>

              <div className={styles.linkRow}>
                <div className={styles.linkInfo}>
                  <div className={styles.linkIcon}>📈</div>
                  <div>
                    <div className={styles.linkTitle}>Overview & Charts Sheet (Shareable)</div>
                    <div className={styles.linkDesc}>
                      Live visual dashboard tab in your Google Spreadsheet — includes maternal vitals, baby growth charts, and clinical queries
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                  {chartsSheetUrl && (
                    <a
                      href={chartsSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.openLinkBtn}
                    >
                      <ExternalLink size={14} /> Open Charts
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleSetupCharts}
                    disabled={generatingCharts}
                    className={styles.openLinkBtn}
                    style={{
                      cursor: generatingCharts ? 'wait' : 'pointer',
                      background: 'hsl(340 65% 96%)',
                      borderColor: 'hsl(340 65% 82%)',
                      color: 'hsl(340 70% 38%)',
                      fontWeight: 600,
                    }}
                  >
                    <BarChart3
                      size={14}
                      style={{
                        animation: generatingCharts ? 'spin 1s linear infinite' : 'none',
                      }}
                    />
                    {generatingCharts ? 'Generating...' : overviewSheetId ? 'Update Charts Sheet' : 'Generate Charts Sheet'}
                  </button>
                </div>
              </div>

              {/* Sharing instructions callout */}
              <div style={{
                marginTop: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--color-border)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-relaxed)',
              }}>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Share2 size={13} color="var(--color-primary)" />
                  How to share your stats or charts with someone:
                </div>
                <span>
                  Open the spreadsheet and click Google&apos;s <strong>Share</strong> button to invite a partner or doctor with <em>Viewer</em> access. To share <strong>only</strong> the charts and keep notes private, go to <em>File → Share → Publish to web</em> in Google Sheets and select only the <strong>Overview & Charts</strong> tab.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Section 4: About Bump Book & Privacy */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <ShieldCheck size={18} color="var(--color-success)" />
              <h2 className={styles.cardTitle}>About Bump Book & Privacy</h2>
            </div>
          </div>

          <div className={styles.aboutRow}>
            <Image
              src="/bump-book.png"
              alt="Bump Book"
              width={76}
              height={76}
              className={styles.aboutLogo}
            />
            <div>
              <h3 className={styles.aboutAppName}>Bump Book</h3>
              <p className={styles.aboutTagline}>Your Pregnancy Journey, Beautifully Recorded</p>
              <p className={styles.infoText} style={{ marginTop: 'var(--space-2)' }}>
                Bump Book does not run an external database. All your pregnancy health records, doctor visits, and scans reside directly and securely inside your personal Google account (Google Drive & Sheets). You maintain 100% ownership and control over your data at all times.
              </p>
            </div>
          </div>

          <div className={styles.aboutLegalLinks}>
            <Link href="/privacy" className={styles.legalLink}>Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className={styles.legalLink}>Terms of Service</Link>
          </div>
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
