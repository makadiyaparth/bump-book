'use client';

import Link from 'next/link';
import { RECORD_TYPES } from '@/lib/types';
import styles from './page.module.css';

export default function AddRecordPage() {
  return (
    <div className={styles.chooser}>
      <div className={styles.chooserHeader}>
        <p className={styles.chooserDiaryTag}>pen down a new memory ✍️</p>
        <h1 className={styles.chooserTitle}>Add Record</h1>
        <p className={styles.chooserSubtitle}>
          What would you like to record today?
        </p>
      </div>

      <div className={styles.grid}>
        {RECORD_TYPES.map((type) => (
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
  );
}
