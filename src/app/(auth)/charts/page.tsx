'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useMemo, useCallback } from 'react';
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
import { useSheetData } from '@/lib/useSheetData';
import { WHO_GROWTH_PERCENTILES_50TH } from '@/lib/postpartum';
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

// Configure Chart.js global typography to match the design system (Inter)
ChartJS.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
ChartJS.defaults.font.size = 11;
ChartJS.defaults.color = 'hsl(240, 6%, 42%)';

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

interface ChildGrowthRecord {
  id: string;
  date: string;
  ageDays: number;
  weight: number | null;
  length: number | null;
  headCirc: number | null;
  notes: string;
}

export default function ChartsPage() {
  const { data: session, status } = useSession();
  const [timeRange, setTimeRange] = useState<'all' | 't1' | 't2' | 't3'>('all');

  const { data: pregRows } = useSheetData('Pregnancy');
  const { data: healthRows, isLoading: healthLoading } = useSheetData('HealthStats');
  const { data: babyRows, isLoading: babyLoading } = useSheetData('BabyStats');
  const { data: growthRows } = useSheetData('ChildGrowth');
  const { data: babyProfileRows } = useSheetData('BabyProfile');

  const pregProfile = useMemo(() => pregRows?.[0] || null, [pregRows]);
  const lmpDate = pregProfile?.lmp_date || null;
  const deliveryDate = pregProfile?.delivery_date || null;

  const isDelivered = Boolean(deliveryDate && deliveryDate.trim() !== '');

  const [activeTab, setActiveTab] = useState<'baby-growth' | 'mother-health' | 'pregnancy'>(
    isDelivered ? 'baby-growth' : 'pregnancy'
  );

  const babyProfile = useMemo(() => {
    if (!babyProfileRows || babyProfileRows.length === 0) return null;
    const r = babyProfileRows[0];
    return {
      name: r.baby_name || 'Baby',
      gender: r.gender || 'Boy',
      birthWeight: r.birth_weight_grams ? Number(r.birth_weight_grams) : 3200,
      birthLength: r.birth_length_cm ? Number(r.birth_length_cm) : 50,
    };
  }, [babyProfileRows]);

  // Child Growth records
  const childGrowthData = useMemo<ChildGrowthRecord[]>(() => {
    if (!growthRows) return [];
    return growthRows
      .map((r) => ({
        id: r.id,
        date: r.recorded_date,
        ageDays: Number(r.baby_age_days) || 0,
        weight: r.weight_kg ? parseFloat(r.weight_kg) : null,
        length: r.length_cm ? parseFloat(r.length_cm) : null,
        headCirc: r.head_circumference_cm ? parseFloat(r.head_circumference_cm) : null,
        notes: r.notes || '',
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [growthRows]);

  const healthData = useMemo<HealthRecord[]>(() => {
    if (!healthRows) return [];
    return healthRows
      .map((r) => ({
        id: r.id,
        date: r.recorded_date,
        weight: r.weight_kg ? parseFloat(r.weight_kg) : null,
        bpSystolic: r.bp_systolic ? parseFloat(r.bp_systolic) : null,
        bpDiastolic: r.bp_diastolic ? parseFloat(r.bp_diastolic) : null,
        bloodSugar: r.blood_sugar ? parseFloat(r.blood_sugar) : null,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [healthRows]);

  const babyData = useMemo<BabyRecord[]>(() => {
    if (!babyRows) return [];
    return babyRows
      .map((r) => ({
        id: r.id,
        date: r.recorded_date,
        fhr: r.fhr_bpm ? parseFloat(r.fhr_bpm) : null,
        weight: r.baby_weight_grams ? parseFloat(r.baby_weight_grams) : null,
        bpd: r.bpd_mm ? parseFloat(r.bpd_mm) : null,
        fl: r.fl_mm ? parseFloat(r.fl_mm) : null,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [babyRows]);

  const loading = status === 'loading' || (healthLoading && !healthRows && babyLoading && !babyRows);

  // Filter records by trimester for prenatal tab
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

  // Growth Chart: Weight vs WHO 50th Percentile
  const babyWeightChartData = useMemo(() => {
    const valid = childGrowthData.filter((g) => g.weight !== null);
    const labels = valid.map((g) => formatDateShort(g.date));
    const actualWeights = valid.map((g) => g.weight);

    // Approximate WHO 50th percentile for these ages
    const whoReferenceWeights = valid.map((g) => {
      const match = WHO_GROWTH_PERCENTILES_50TH.find((w) => Math.abs(w.ageDays - g.ageDays) <= 25);
      return match ? match.weightKg : null;
    });

    return {
      labels,
      datasets: [
        {
          label: `${babyProfile?.name || 'Baby'} Weight (kg)`,
          data: actualWeights,
          borderColor: 'hsl(15, 80%, 55%)',
          backgroundColor: 'hsla(15, 80%, 55%, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: 'hsl(15, 80%, 55%)',
        },
        {
          label: 'WHO 50th Percentile Standard (kg)',
          data: whoReferenceWeights,
          borderColor: 'hsl(205, 70%, 55%)',
          backgroundColor: 'transparent',
          borderDash: [6, 4],
          fill: false,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: 'hsl(205, 70%, 55%)',
        },
      ],
    };
  }, [childGrowthData, babyProfile?.name]);

  // Growth Chart: Length vs WHO
  const babyLengthChartData = useMemo(() => {
    const valid = childGrowthData.filter((g) => g.length !== null);
    const labels = valid.map((g) => formatDateShort(g.date));
    const actualLengths = valid.map((g) => g.length);
    const whoReferenceLengths = valid.map((g) => {
      const match = WHO_GROWTH_PERCENTILES_50TH.find((w) => Math.abs(w.ageDays - g.ageDays) <= 25);
      return match ? match.lengthCm : null;
    });

    return {
      labels,
      datasets: [
        {
          label: `${babyProfile?.name || 'Baby'} Length (cm)`,
          data: actualLengths,
          borderColor: 'hsl(145, 65%, 45%)',
          backgroundColor: 'hsla(145, 65%, 45%, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 5,
        },
        {
          label: 'WHO 50th Percentile Standard (cm)',
          data: whoReferenceLengths,
          borderColor: 'hsl(205, 70%, 55%)',
          borderDash: [6, 4],
          fill: false,
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    };
  }, [childGrowthData, babyProfile?.name]);

  // Maternal Weight Chart
  const weightRecords = useMemo(
    () => filteredHealth.filter((r) => r.weight !== null),
    [filteredHealth]
  );
  const weightChartData = useMemo(
    () => ({
      labels: weightRecords.map((r) => formatDateShort(r.date)),
      datasets: [
        {
          label: 'Maternal Weight (kg)',
          data: weightRecords.map((r) => r.weight),
          borderColor: 'hsl(340, 65%, 55%)',
          backgroundColor: 'hsla(340, 65%, 55%, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'hsl(340, 65%, 55%)',
        },
      ],
    }),
    [weightRecords]
  );

  // Blood Pressure Chart
  const bpRecords = useMemo(
    () => filteredHealth.filter((r) => r.bpSystolic !== null && r.bpDiastolic !== null),
    [filteredHealth]
  );
  const bpChartData = useMemo(
    () => ({
      labels: bpRecords.map((r) => formatDateShort(r.date)),
      datasets: [
        {
          label: 'Systolic (Target < 120)',
          data: bpRecords.map((r) => r.bpSystolic),
          borderColor: 'hsl(10, 75%, 60%)',
          backgroundColor: 'transparent',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'hsl(10, 75%, 60%)',
        },
        {
          label: 'Diastolic (Target < 80)',
          data: bpRecords.map((r) => r.bpDiastolic),
          borderColor: 'hsl(200, 70%, 55%)',
          backgroundColor: 'transparent',
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'hsl(200, 70%, 55%)',
        },
      ],
    }),
    [bpRecords]
  );

  // Prenatal Fetal Heart Rate
  const fhrRecords = useMemo(() => filteredBaby.filter((r) => r.fhr !== null), [filteredBaby]);
  const fhrChartData = useMemo(
    () => ({
      labels: fhrRecords.map((r) => formatDateShort(r.date)),
      datasets: [
        {
          label: 'Fetal Heart Rate (bpm)',
          data: fhrRecords.map((r) => r.fhr),
          borderColor: 'hsl(350, 75%, 60%)',
          backgroundColor: 'hsla(350, 75%, 60%, 0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: 'hsl(350, 75%, 60%)',
        },
      ],
    }),
    [fhrRecords]
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          padding: 12,
          font: {
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            size: 10.5,
            weight: 500,
          },
          color: 'hsl(25, 10%, 35%)',
        },
      },
      tooltip: {
        backgroundColor: 'hsl(25, 20%, 98%)',
        titleColor: 'hsl(25, 20%, 20%)',
        titleFont: {
          family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          size: 11,
          weight: 600,
        },
        bodyColor: 'hsl(25, 15%, 40%)',
        bodyFont: {
          family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          size: 11,
        },
        borderColor: 'hsl(25, 15%, 85%)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: {
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            size: 10.5,
          },
          color: 'hsl(25, 10%, 50%)',
        },
      },
      y: {
        grid: { color: 'hsl(25, 10%, 92%)' },
        ticks: {
          font: {
            family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            size: 10.5,
          },
          color: 'hsl(25, 10%, 50%)',
        },
      },
    },
  };

  const latestChildGrowth = childGrowthData[childGrowthData.length - 1];

  if (loading) {
    return (
      <div className={styles.chartsPage}>
        <JourneyLoader
          message="Loading health insights & growth charts..."
          subMessage="Plotting maternal vitals, infant growth, and WHO percentiles"
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
            <p className={styles.chartsDiaryTag}>watching you grow day by day 🌱</p>
            <h1 className={styles.title}>Health & Growth Insights</h1>
            <p className={styles.subtitle}>
              Monitor maternal recovery trends and baby growth curves against WHO benchmarks
            </p>
          </div>
          {session?.spreadsheetId && (
            <Link
              href="/settings"
              className={styles.rangePill}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                alignSelf: 'flex-start',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-primary)',
              }}
              title="View or share live charts sheet in Google Sheets"
            >
              <span>📊 Google Sheets Live Tab</span>
            </Link>
          )}
        </div>

        {/* Category Tabs */}
        <div className={styles.categoryTabBar}>
          <button
            type="button"
            className={`${styles.categoryTabBtn} ${activeTab === 'baby-growth' ? styles.categoryTabBtnActive : ''}`}
            onClick={() => setActiveTab('baby-growth')}
          >
            <span>👶 Baby Growth (WHO)</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryTabBtn} ${activeTab === 'mother-health' ? styles.categoryTabBtnActive : ''}`}
            onClick={() => setActiveTab('mother-health')}
          >
            <span>👩 Mum’s Vitals & BP</span>
          </button>
          <button
            type="button"
            className={`${styles.categoryTabBtn} ${activeTab === 'pregnancy' ? styles.categoryTabBtnActive : ''}`}
            onClick={() => setActiveTab('pregnancy')}
          >
            <span>🤰 Prenatal Scans & FHR</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 1: BABY GROWTH (WHO Standard Curves)
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'baby-growth' && (
        <>
          {/* Summary KPIs */}
          <div className={styles.statsSummaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>⚖️</div>
              <div className={styles.summaryInfo}>
                <span className={styles.summaryLabel}>Latest Baby Weight</span>
                <span className={styles.summaryValue}>
                  {latestChildGrowth?.weight ? `${latestChildGrowth.weight} kg` : '—'}
                </span>
                {latestChildGrowth?.weight && babyProfile?.birthWeight && (
                  <span className={styles.summaryDiff} style={{ color: 'hsl(145, 65%, 35%)', fontWeight: 600 }}>
                    +{(latestChildGrowth.weight - babyProfile.birthWeight / 1000).toFixed(2)} kg since birth
                  </span>
                )}
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>📏</div>
              <div className={styles.summaryInfo}>
                <span className={styles.summaryLabel}>Length / Height</span>
                <span className={styles.summaryValue}>
                  {latestChildGrowth?.length ? `${latestChildGrowth.length} cm` : '—'}
                </span>
                <span className={styles.summaryDiff}>
                  {latestChildGrowth ? `${latestChildGrowth.length} cm tall` : 'No logs yet'}
                </span>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>🧠</div>
              <div className={styles.summaryInfo}>
                <span className={styles.summaryLabel}>Head Circumference</span>
                <span className={styles.summaryValue}>
                  {latestChildGrowth?.headCirc ? `${latestChildGrowth.headCirc} cm` : '—'}
                </span>
                <span className={styles.summaryDiff}>Normal neurological growth</span>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>🌟</div>
              <div className={styles.summaryInfo}>
                <span className={styles.summaryLabel}>Growth Checkups</span>
                <span className={styles.summaryValue}>{childGrowthData.length}</span>
                <span className={styles.summaryDiff}>Measured data points</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className={styles.chartsGrid}>
            {/* Chart 1: Baby Weight vs WHO */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div className={styles.chartTitleRow}>
                  <TrendingUp size={18} color="hsl(15, 80%, 55%)" />
                  <h2 className={styles.chartTitle}>Baby Weight-for-Age vs WHO Standard</h2>
                </div>
                <span className={styles.chartBadge}>kg</span>
              </div>
              <div className={styles.chartCanvasWrapper}>
                {childGrowthData.filter((g) => g.weight !== null).length >= 2 ? (
                  <Line data={babyWeightChartData} options={chartOptions} />
                ) : (
                  <div className={styles.emptyChart}>
                    <p>Log at least 2 baby growth measurements to view weight curve.</p>
                    <Link href="/add/child-growth" className={styles.addLink}>
                      + Log Baby Measurement
                    </Link>
                  </div>
                )}
              </div>
              <div className={styles.chartFooter}>
                <span>Solid orange line: Baby’s measured weight • Dashed blue: WHO 50th percentile median</span>
              </div>
            </div>

            {/* Chart 2: Baby Length vs WHO */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div className={styles.chartTitleRow}>
                  <Baby size={18} color="hsl(145, 65%, 45%)" />
                  <h2 className={styles.chartTitle}>Baby Length-for-Age vs WHO Standard</h2>
                </div>
                <span className={styles.chartBadge}>cm</span>
              </div>
              <div className={styles.chartCanvasWrapper}>
                {childGrowthData.filter((g) => g.length !== null).length >= 2 ? (
                  <Line data={babyLengthChartData} options={chartOptions} />
                ) : (
                  <div className={styles.emptyChart}>
                    <p>Log at least 2 length measurements to plot length curve.</p>
                    <Link href="/add/child-growth" className={styles.addLink}>
                      + Log Baby Measurement
                    </Link>
                  </div>
                )}
              </div>
              <div className={styles.chartFooter}>
                <span>Solid green line: Baby’s measured length • Dashed blue: WHO 50th percentile median</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 2: MOTHER’S HEALTH & VITALS
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'mother-health' && (
        <>
          <div className={styles.statsSummaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>⚖️</div>
              <div className={styles.summaryInfo}>
                <span className={styles.summaryLabel}>Maternal Weight</span>
                <span className={styles.summaryValue}>
                  {weightRecords[weightRecords.length - 1]?.weight
                    ? `${weightRecords[weightRecords.length - 1].weight} kg`
                    : '—'}
                </span>
                <span className={styles.summaryDiff}>Latest health check</span>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryIcon}>❤️</div>
              <div className={styles.summaryInfo}>
                <span className={styles.summaryLabel}>Blood Pressure</span>
                <span className={styles.summaryValue}>
                  {bpRecords[bpRecords.length - 1]
                    ? `${bpRecords[bpRecords.length - 1].bpSystolic}/${bpRecords[bpRecords.length - 1].bpDiastolic}`
                    : '—'}
                </span>
                <span className={styles.summaryDiff}>Normal target: &lt; 120/80</span>
              </div>
            </div>
          </div>

          <div className={styles.chartsGrid}>
            {/* Maternal Weight */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div className={styles.chartTitleRow}>
                  <TrendingUp size={18} color="hsl(340, 65%, 55%)" />
                  <h2 className={styles.chartTitle}>Maternal Weight Recovery Trajectory</h2>
                </div>
                <span className={styles.chartBadge}>kg</span>
              </div>
              <div className={styles.chartCanvasWrapper}>
                {weightRecords.length >= 2 ? (
                  <Line data={weightChartData} options={chartOptions} />
                ) : (
                  <div className={styles.emptyChart}>
                    <p>Need at least 2 recorded measurements to graph weight trajectory.</p>
                    <Link href="/add/health-stats" className={styles.addLink}>
                      + Record Health Stats
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Blood Pressure */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div className={styles.chartTitleRow}>
                  <Heart size={18} color="hsl(10, 75%, 60%)" />
                  <h2 className={styles.chartTitle}>Blood Pressure Monitoring</h2>
                </div>
                <span className={styles.chartBadge}>mmHg</span>
              </div>
              <div className={styles.chartCanvasWrapper}>
                {bpRecords.length >= 2 ? (
                  <Line data={bpChartData} options={chartOptions} />
                ) : (
                  <div className={styles.emptyChart}>
                    <p>Need at least 2 blood pressure logs to graph trends.</p>
                    <Link href="/add/health-stats" className={styles.addLink}>
                      + Record Blood Pressure
                    </Link>
                  </div>
                )}
              </div>
              <div className={styles.chartFooter}>
                <span>Red: Systolic (target &lt; 120) • Blue: Diastolic (target &lt; 80)</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 3: PRENATAL SCANS & ARCHIVES
         ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pregnancy' && (
        <>
          <div className={styles.rangeFilter}>
            <button
              className={`${styles.rangePill} ${timeRange === 'all' ? styles.rangePillActive : ''}`}
              onClick={() => setTimeRange('all')}
            >
              All Pregnancy
            </button>
            <button
              className={`${styles.rangePill} ${timeRange === 't1' ? styles.rangePillActive : ''}`}
              onClick={() => setTimeRange('t1')}
            >
              1st Trimester (W1–13)
            </button>
            <button
              className={`${styles.rangePill} ${timeRange === 't2' ? styles.rangePillActive : ''}`}
              onClick={() => setTimeRange('t2')}
            >
              2nd Trimester (W14–27)
            </button>
            <button
              className={`${styles.rangePill} ${timeRange === 't3' ? styles.rangePillActive : ''}`}
              onClick={() => setTimeRange('t3')}
            >
              3rd Trimester (W28+)
            </button>
          </div>

          <div className={styles.chartsGrid} style={{ marginTop: 'var(--space-5)' }}>
            {/* Fetal Heart Rate */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <div className={styles.chartTitleRow}>
                  <Activity size={18} color="hsl(350, 75%, 60%)" />
                  <h2 className={styles.chartTitle}>Fetal Heart Rate (FHR)</h2>
                </div>
                <span className={styles.chartBadge}>bpm</span>
              </div>
              <div className={styles.chartCanvasWrapper}>
                {fhrRecords.length >= 2 ? (
                  <Line data={fhrChartData} options={chartOptions} />
                ) : (
                  <div className={styles.emptyChart}>
                    <p>Need at least 2 FHR readings from checkups to graph.</p>
                    <Link href="/add/baby-stats" className={styles.addLink}>
                      + Record Baby Scan
                    </Link>
                  </div>
                )}
              </div>
              <div className={styles.chartFooter}>
                <span>Normal baseline range: 110–160 bpm</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
