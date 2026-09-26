'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import styles from './JourneyLoader.module.css';

const DEFAULT_MESSAGES = [
  'Listening for baby’s heartbeat...',
  'Gathering your journey memories...',
  'Preparing your timeline...',
  'Organizing your health records...',
];

interface JourneyLoaderProps {
  message?: string;
  subMessage?: string;
  size?: 'compact' | 'card' | 'fullPage';
  cycle?: boolean;
}

export default function JourneyLoader({
  message,
  subMessage,
  size = 'card',
  cycle = false,
}: JourneyLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!cycle && message) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [cycle, message]);

  const displayMessage = message || DEFAULT_MESSAGES[msgIndex];

  return (
    <div
      className={`${styles.loaderWrapper} ${
        size === 'fullPage' ? styles.fullPage : size === 'compact' ? styles.compact : ''
      }`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.pulseContainer}>
        <div className={styles.rippleRing1} />
        <div className={styles.rippleRing2} />
        <div className={styles.heartBubble}>
          <div className={styles.heartIcon}>
            <Heart size={size === 'compact' ? 16 : 22} fill="currentColor" />
          </div>
        </div>
      </div>

      <div className={styles.textContainer}>
        <p className={styles.message}>{displayMessage}</p>
        {subMessage && <p className={styles.subMessage}>{subMessage}</p>}
      </div>
    </div>
  );
}
