'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, Heart, Activity, Baby } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import JourneyLoader from '@/components/JourneyLoader';
import styles from './page.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HealthRecord {
  id: string;
  date: string;
  weight: number | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  bloodSugar: number | null;
}

interface BabyRecord {
  id: string;
  date: string;
  fhr: number | null;
  weight: number | null;
  bpd: number | null;
  fl: number | null;
}

export default function ChartsPage() {
  const { data: session } = useSession();
  const [healthData, setHealthData] = useState<HealthRecord[]>([]);
  const [babyData, setBabyData] = useState<BabyRecord[]>([]);
  const [lmpDate, setLmpDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'all' | 't1' | 't2' | 't3'>('all');

  useEffect(() => {
    async function loadData() {
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        // Fetch LMP for trimester calculations
        try {
          const pregRes = await fetch('/api/sheets/Pregnancy');
          const pregJson = await pregRes.json();
          if (pregJson.data?.[0]?.lmp_date) {
            setLmpDate(pregJson.data[0].lmp_date);
          }
        } catch {}

        // Fetch HealthStats
        const healthRes = await fetch('/api/sheets/HealthStats');
        const healthJson = await healthRes.json();
        if (healthJson.data) {
          const parsed: HealthRecord[] = healthJson.data
            .map((r: Record<string, string>) => ({
              id: r.id,
              date: r.recorded_date,
              weight: r.weight_kg ? parseFloat(r.weight_kg) : null,
              bpSystolic: r.bp_systolic ? parseFloat(r.bp_systolic) : null,
              bpDiastolic: r.bp_diastolic ? parseFloat(r.bp_diastolic) : null,
              bloodSugar: r.blood_sugar ? parseFloat(r.blood_sugar) : null,
            }))
            .sort(
              (a: HealthRecord, b: HealthRecord) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );
          setHealthData(parsed);
        }

        // Fetch BabyStats
        const babyRes = await fetch('/api/sheets/BabyStats');
        const babyJson = await babyRes.json();
        if (babyJson.data) {
          const parsedBaby: BabyRecord[] = babyJson.data
            .map((r: Record<string, string>) => ({
              id: r.id,
              date: r.recorded_date,
              fhr: r.fhr_bpm ? parseFloat(r.fhr_bpm) : null,
              weight: r.baby_weight_grams
                ? parseFloat(r.baby_weight_grams)
                : null,
              bpd: r.bpd_mm ? parseFloat(r.bpd_mm) : null,
              fl: r.fl_mm ? parseFloat(r.fl_mm) : null,
            }))
            .sort(
              (a: BabyRecord, b: BabyRecord) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );
          setBabyData(parsedBaby);
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [session]);

  // Filter records by trimester
  const filterByTrimester = useCallback(
    (recordsDate: string) => {
      if (timeRange === 'all' || !lmpDate) return true;
      const diffWeeks =
        (new Date(recordsDate).getTime() - new Date(lmpDate).getTime()) /
        (7 * 24 * 60 * 60 * 1000);

      if (timeRange === 't1') return diffWeeks <= 13;
      if (timeRange === 't2') return diffWeeks > 13 && diffWeeks <= 27;
      if (timeRange === 't3') return diffWeeks > 27;
      return true;
    },
    [timeRange, lmpDate]
  );

  const filteredHealth = useMemo(
    () => healthData.filter((r) => filterByTrimester(r.date)),
    [healthData, filterByTrimester]
  );

  const filteredBaby = useMemo(
    () => babyData.filter((r) => filterByTrimester(r.date)),
    [babyData, filterByTrimester]
  );

  // Latest stats calculations
  const latestWeight = healthData.filter((h) => h.weight !== null).slice(-1)[0];
  const initialWeight = healthData.filter((h) => h.weight !== null)[0];
  const weightDiff =
    latestWeight?.weight && initialWeight?.weight
      ? (latestWeight.weight - initialWeight.weight).toFixed(1)
      : null;

  const latestBP = healthData
    .filter((h) => h.bpSystolic !== null && h.bpDiastolic !== null)
    .slice(-1)[0];
  const latestFHR = babyData.filter((b) => b.fhr !== null).slice(-1)[0];
  const latestBabyWeight = babyData
    .filter((b) => b.weight !== null)
    .slice(-1)[0];

  // 1. Weight Chart Data
  const weightRecords = filteredHealth.filter((r) => r.weight !== null);
  const weightChartData = {
    labels: weightRecords.map((r) => formatDateShort(r.date)),
    datasets: [
      {
        label: 'Weight (kg)',
        data: weightRecords.map((r) => r.weight),
        borderColor: 'hsl(340, 65%, 55%)',
        backgroundColor: 'hsla(340, 65%, 55%, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: 'hsl(340, 65%, 55%)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // 2. Blood Pressure Chart Data
  const bpRecords = filteredHealth.filter(
    (r) => r.bpSystolic !== null && r.bpDiastolic !== null
  );
  const bpChartData = {
    labels: bpRecords.map((r) => formatDateShort(r.date)),
    datasets: [
      {
        label: 'Systolic (mmHg)',
        data: bpRecords.map((r) => r.bpSystolic),
        borderColor: 'hsl(0, 70%, 55%)',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointBackgroundColor: 'hsl(0, 70%, 55%)',
        pointRadius: 4,
      },
      {
        label: 'Diastolic (mmHg)',
        data: bpRecords.map((r) => r.bpDiastolic),
        borderColor: 'hsl(210, 70%, 55%)',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointBackgroundColor: 'hsl(210, 70%, 55%)',
        pointRadius: 4,
      },
    ],
  };

  // 3. FHR Chart Data
  const fhrRecords = filteredBaby.filter((r) => r.fhr !== null);
  const fhrChartData = {
    labels: fhrRecords.map((r) => formatDateShort(r.date)),
    datasets: [
      {
        label: 'Heart Rate (bpm)',
        data: fhrRecords.map((r) => r.fhr),
        borderColor: 'hsl(260, 50%, 60%)',
        backgroundColor: 'hsla(260, 50%, 60%, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: 'hsl(260, 50%, 60%)',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  // 4. Baby Growth Chart Data
  const babyWeightRecords = filteredBaby.filter((r) => r.weight !== null);
  const babyWeightChartData = {
    labels: babyWeightRecords.map((r) => formatDateShort(r.date)),
    datasets: [
      {
        label: 'Baby Weight (grams)',
        data: babyWeightRecords.map((r) => r.weight),
        borderColor: 'hsl(30, 80%, 55%)',
        backgroundColor: 'hsla(30, 80%, 55%, 0.12)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: 'hsl(30, 80%, 55%)',
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: { family: 'Inter', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'hsl(240, 10%, 15%)',
        titleFont: { family: 'Inter', size: 12 },
        bodyFont: { family: 'Inter', size: 13, weight: 'bold' as const },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid: { color: 'hsl(240, 10%, 94%)' },
        ticks: { font: { family: 'Inter', size: 11 } },
      },
    },
  };

  if (loading) {
    return (
      <div className={styles.chartsPage}>
        <JourneyLoader
          message="Loading health insights & charts..."
          subMessage="Plotting blood pressure, maternal weight, and baby growth"
          cycle
          size="fullPage"
        />
      </div>
    );
  }

  return (
    <div className={styles.chartsPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Health & Growth Insights</h1>
            <p className={styles.subtitle}>
              Monitor maternal health trends and baby development milestones
            </p>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className={styles.rangeFilter}>
          <button
            className={`${styles.rangePill} ${
              timeRange === 'all' ? styles.rangePillActive : ''
            }`}
            onClick={() => setTimeRange('all')}
          >
            All Journey
          </button>
          <button
            className={`${styles.rangePill} ${
              timeRange === 't1' ? styles.rangePillActive : ''
            }`}
            onClick={() => setTimeRange('t1')}
          >
            1st Trimester (W1-13)
          </button>
          <button
            className={`${styles.rangePill} ${
              timeRange === 't2' ? styles.rangePillActive : ''
            }`}
            onClick={() => setTimeRange('t2')}
          >
            2nd Trimester (W14-27)
          </button>
          <button
            className={`${styles.rangePill} ${
              timeRange === 't3' ? styles.rangePillActive : ''
            }`}
            onClick={() => setTimeRange('t3')}
          >
            3rd Trimester (W28+)
          </button>
        </div>
      </div>

      {/* Summary Highlight Cards */}
      <div className={styles.statsSummaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>⚖️</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Maternal Weight</span>
            <span className={styles.summaryValue}>
              {latestWeight?.weight ? `${latestWeight.weight} kg` : '—'}
            </span>
            {weightDiff !== null && (
              <span className={styles.summaryDiff}>
                {Number(weightDiff) >= 0 ? `+${weightDiff}` : weightDiff} kg net change
              </span>
            )}
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>❤️</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Blood Pressure</span>
            <span className={styles.summaryValue}>
              {latestBP
                ? `${latestBP.bpSystolic}/${latestBP.bpDiastolic}`
                : '—'}
            </span>
            <span className={styles.summaryDiff}>
              {latestBP ? 'mmHg' : 'No readings yet'}
            </span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>💓</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Fetal Heart Rate</span>
            <span className={styles.summaryValue}>
              {latestFHR?.fhr ? `${latestFHR.fhr} bpm` : '—'}
            </span>
            <span className={styles.summaryDiff}>Normal: 110–160 bpm</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>👶</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Baby Weight</span>
            <span className={styles.summaryValue}>
              {latestBabyWeight?.weight
                ? `${latestBabyWeight.weight} g`
                : '—'}
            </span>
            <span className={styles.summaryDiff}>Latest estimated scan</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Chart 1: Weight Trend */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleRow}>
              <TrendingUp size={18} color="hsl(340, 65%, 55%)" />
              <h2 className={styles.chartTitle}>Maternal Weight Trend</h2>
            </div>
            <span className={styles.chartBadge}>kg</span>
          </div>
          <div className={styles.chartCanvasWrapper}>
            {weightRecords.length >= 2 ? (
              <Line data={weightChartData} options={chartOptions} />
            ) : (
              <div className={styles.emptyChart}>
                <p>Need at least 2 recorded measurements to graph trends.</p>
                <Link href="/add/health-stats" className={styles.addLink}>
                  + Record Health Measurement
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Blood Pressure */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleRow}>
              <Activity size={18} color="hsl(0, 70%, 55%)" />
              <h2 className={styles.chartTitle}>Blood Pressure Trend</h2>
            </div>
            <span className={styles.chartBadge}>mmHg</span>
          </div>
          <div className={styles.chartCanvasWrapper}>
            {bpRecords.length >= 2 ? (
              <Line data={bpChartData} options={chartOptions} />
            ) : (
              <div className={styles.emptyChart}>
                <p>Record your BP to see systolic/diastolic tracking.</p>
                <Link href="/add/health-stats" className={styles.addLink}>
                  + Record Health Measurement
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Fetal Heart Rate */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleRow}>
              <Heart size={18} color="hsl(260, 50%, 60%)" />
              <h2 className={styles.chartTitle}>Fetal Heart Rate (FHR)</h2>
            </div>
            <span className={styles.chartBadge}>bpm</span>
          </div>
          <div className={styles.chartCanvasWrapper}>
            {fhrRecords.length >= 2 ? (
              <Line data={fhrChartData} options={chartOptions} />
            ) : (
              <div className={styles.emptyChart}>
                <p>Track your baby&apos;s heartbeat over scan visits.</p>
                <Link href="/add/baby-stats" className={styles.addLink}>
                  + Record Baby Measurement
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Baby Growth */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleRow}>
              <Baby size={18} color="hsl(30, 80%, 55%)" />
              <h2 className={styles.chartTitle}>Estimated Baby Weight</h2>
            </div>
            <span className={styles.chartBadge}>grams</span>
          </div>
          <div className={styles.chartCanvasWrapper}>
            {babyWeightRecords.length >= 2 ? (
              <Line data={babyWeightChartData} options={chartOptions} />
            ) : (
              <div className={styles.emptyChart}>
                <p>Log ultrasound measurements to visualize growth.</p>
                <Link href="/add/baby-stats" className={styles.addLink}>
                  + Record Baby Measurement
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
