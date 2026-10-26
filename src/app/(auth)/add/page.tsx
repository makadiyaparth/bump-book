'use client';

import Link from 'next/link';
import { RECORD_TYPES } from '@/lib/types';
import styles from './page.module.css';

export default function AddRecordPage() {
  const babyTypes = RECORD_TYPES.filter((t) => t.category === 'Baby');
  const motherTypes = RECORD_TYPES.filter((t) => t.category === 'Mother');
  const generalTypes = RECORD_TYPES.filter((t) => t.category === 'General');

  return (
    <div className={styles.chooser}>
      <div className={styles.chooserHeader}>
        <p className={styles.chooserDiaryTag}>pen down a new memory ✍️</p>
        <h1 className={styles.chooserTitle}>Add Record</h1>
        <p className={styles.chooserSubtitle}>
          What would you like to record today?
        </p>
      </div>

      {/* Baby Category */}
      <div className={styles.categoryGroup}>
        <h2 className={styles.categoryTitle}>
          <span>👶</span>
          <span>Baby’s Growth & Milestones</span>
        </h2>
        <div className={styles.grid}>
          {babyTypes.map((type) => (
            <Link
              key={type.key}
              href={`/add/${type.key}`}
              className={styles.typeCard}
            >
              <span className={styles.typeIcon}>{type.icon}</span>
              <span className={styles.typeLabel}>{type.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mother Category */}
      <div className={styles.categoryGroup}>
        <h2 className={styles.categoryTitle}>
          <span>👩</span>
          <span>Mum’s Health & Care</span>
        </h2>
        <div className={styles.grid}>
          {motherTypes.map((type) => (
            <Link
              key={type.key}
              href={`/add/${type.key}`}
              className={styles.typeCard}
            >
              <span className={styles.typeIcon}>{type.icon}</span>
              <span className={styles.typeLabel}>{type.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* General Category */}
      <div className={styles.categoryGroup}>
        <h2 className={styles.categoryTitle}>
          <span>📝</span>
          <span>Everyday Notes & Visits</span>
        </h2>
        <div className={styles.grid}>
          {generalTypes.map((type) => (
            <Link
              key={type.key}
              href={`/add/${type.key}`}
              className={styles.typeCard}
            >
              <span className={styles.typeIcon}>{type.icon}</span>
              <span className={styles.typeLabel}>{type.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
