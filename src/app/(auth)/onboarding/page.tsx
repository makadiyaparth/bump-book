'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { calculateDueDate } from '@/lib/pregnancy';
import { generateId, now, today } from '@/lib/utils';
import styles from './page.module.css';

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (session?.isDemo) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  // Step 1: Basics
  const [lmpDate, setLmpDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueDateManual, setDueDateManual] = useState(false);
  const [pregnancyType, setPregnancyType] = useState('Singleton');

  // Step 2: Medical
  const [bloodGroup, setBloodGroup] = useState('');
  const [rhFactor, setRhFactor] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');

  // Step 3: Doctor
  const [primaryDoctor, setPrimaryDoctor] = useState('');
  const [primaryHospital, setPrimaryHospital] = useState('');

  const handleLmpChange = (value: string) => {
    setLmpDate(value);
    if (!dueDateManual && value) {
      setDueDate(calculateDueDate(value));
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      // First, initialize the spreadsheet and Drive folder
      const initRes = await fetch('/api/sheets/init', { method: 'POST' });
      const initData = await initRes.json();

      if (!initRes.ok) {
        throw new Error(initData.error || 'Failed to initialize');
      }

      if (update && initData.spreadsheetId) {
        await update({ spreadsheetId: initData.spreadsheetId });
      }

      // Save pregnancy profile
      const profileData: Record<string, string> = {
        id: generateId(),
        lmp_date: lmpDate,
        due_date: dueDate || calculateDueDate(lmpDate),
        blood_group: bloodGroup,
        rh_factor: rhFactor,
        pregnancy_type: pregnancyType,
        previous_pregnancies: '0',
        previous_deliveries: '0',
        allergies: allergies,
        medical_conditions: medicalConditions,
        primary_doctor: primaryDoctor,
        primary_hospital: primaryHospital,
        created_at: now(),
        updated_at: now(),
      };

      const saveRes = await fetch('/api/sheets/Pregnancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save profile');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMsg('Something went wrong. Please check your connection and try again.');
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return lmpDate.trim() !== '';
    return true; // Steps 2 and 3 are optional
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleSave();
    }
  };

  return (
    <div className={styles.onboarding}>
      <div className={styles.header}>
        <div className={styles.headerLogoWrapper}>
          <Image
            src="/bump-book-icon.png"
            alt="Bump Book"
            width={68}
            height={68}
            priority
            className={styles.headerLogoImg}
          />
        </div>
        <p className={styles.onboardingDiaryTag}>your beautiful new chapter begins ✨</p>
        <h1 className={styles.headerTitle}>Set Up Your Journey</h1>
        <p className={styles.headerSubtitle}>
          Just a few details to get your pregnancy tracker ready.
        </p>
      </div>

      {/* Step indicator */}
      <div className={styles.steps}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className={`${styles.stepDot} ${
              i + 1 === step ? styles.stepDotActive : ''
            } ${i + 1 < step ? styles.stepDotCompleted : ''}`}
          />
        ))}
      </div>

      <div className={styles.formCard}>
        {/* Step 1: Basics */}
        {step === 1 && (
          <>
            <h2 className={styles.stepTitle}>
              <span className={styles.stepIcon}>📋</span>
              Pregnancy Basics
            </h2>
            <div className={styles.fieldGroup}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="lmp-date">Last Menstrual Period (LMP) *</label>
                  <input
                    id="lmp-date"
                    type="date"
                    value={lmpDate}
                    onChange={(e) => handleLmpChange(e.target.value)}
                    max={today()}
                    required
                  />
                  <span className={styles.fieldHint}>
                    First day of your last period
                  </span>
                </div>
                <div className={styles.field}>
                  <label htmlFor="due-date">Expected Due Date</label>
                  <input
                    id="due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      setDueDateManual(true);
                    }}
                  />
                  <span className={styles.fieldHint}>
                    {dueDateManual ? 'Manually set' : 'Auto-calculated from LMP'}
                  </span>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="pregnancy-type">Pregnancy Type</label>
                <select
                  id="pregnancy-type"
                  value={pregnancyType}
                  onChange={(e) => setPregnancyType(e.target.value)}
                >
                  <option value="Singleton">Singleton</option>
                  <option value="Twins">Twins</option>
                  <option value="Triplets">Triplets</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Medical */}
        {step === 2 && (
          <>
            <h2 className={styles.stepTitle}>
              <span className={styles.stepIcon}>🏥</span>
              Medical Information
            </h2>
            <div className={styles.fieldGroup}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="blood-group">Blood Group</label>
                  <select
                    id="blood-group"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    <option value="">Select</option>
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
                <div className={styles.field}>
                  <label htmlFor="rh-factor">Rh Factor</label>
                  <select
                    id="rh-factor"
                    value={rhFactor}
                    onChange={(e) => setRhFactor(e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Positive">Positive</option>
                    <option value="Negative">Negative</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="allergies">Known Allergies</label>
                <input
                  id="allergies"
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g., Penicillin, Sulfa drugs"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="medical-conditions">Existing Medical Conditions</label>
                <input
                  id="medical-conditions"
                  type="text"
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="e.g., Hypothyroidism, Diabetes"
                />
              </div>
            </div>
          </>
        )}

        {/* Step 3: Doctor */}
        {step === 3 && (
          <>
            <h2 className={styles.stepTitle}>
              <span className={styles.stepIcon}>👩‍⚕️</span>
              Your Doctor
            </h2>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label htmlFor="doctor-name">Primary Doctor</label>
                <input
                  id="doctor-name"
                  type="text"
                  value={primaryDoctor}
                  onChange={(e) => setPrimaryDoctor(e.target.value)}
                  placeholder="e.g., Dr. Patel"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="hospital">Hospital / Clinic</label>
                <input
                  id="hospital"
                  type="text"
                  value={primaryHospital}
                  onChange={(e) => setPrimaryHospital(e.target.value)}
                  placeholder="e.g., City Hospital"
                />
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {step > 1 ? (
            <button
              className={styles.backButton}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : (
            <div className={styles.spacer} />
          )}
          <button
            className={styles.nextButton}
            onClick={handleNext}
            disabled={!canProceed() || saving}
          >
            {step < TOTAL_STEPS ? (
              <>
                Next
                <ArrowRight size={16} />
              </>
            ) : saving ? (
              'Saving...'
            ) : (
              <>
                <Check size={16} />
                Complete Setup
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className={styles.toastError}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
