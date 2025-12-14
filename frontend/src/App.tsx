import { useEffect, useMemo, useState } from 'react';
import { fetchFundDetails, fetchFunds } from './api';
import AllocationChart from './components/AllocationChart';
import FundInsights from './components/FundInsights';
import FundSelector from './components/FundSelector';
import MetricCard from './components/MetricCard';
import PerformanceChart from './components/PerformanceChart';
import { FundKind, FundOverview, FundSummary, HistoricalPoint } from './types';

const ranges = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TRY' }).format(value);

const defaultKind: FundKind = 'YAT';

const App = () => {
  const [availableFunds, setAvailableFunds] = useState<FundSummary[]>([]);
  const [selectedFund, setSelectedFund] = useState<FundOverview | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<FundSummary | null>(null);
  const [activeRange, setActiveRange] = useState(ranges[3]);
  const [loadingFunds, setLoadingFunds] = useState(true);
  const [loadingFundDetails, setLoadingFundDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFunds = async () => {
      try {
        setLoadingFunds(true);
        const funds = await fetchFunds(defaultKind);
        setAvailableFunds(funds);
        const first = funds[0];
        if (first) {
          setSelectedSummary(first);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load funds');
      } finally {
        setLoadingFunds(false);
      }
    };

    loadFunds();
  }, []);

  useEffect(() => {
    const loadFund = async (summary: FundSummary | null) => {
      if (!summary) return;
      try {
        setLoadingFundDetails(true);
        const fund = await fetchFundDetails(summary.code, summary.kind);
        setSelectedFund(fund);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fund');
        setSelectedFund(null);
      } finally {
        setLoadingFundDetails(false);
      }
    };

    loadFund(selectedSummary);
  }, [selectedSummary]);

  const performanceSlice = useMemo(() => {
    if (!selectedFund) return [];
    const { priceHistory } = selectedFund;
    const startIndex = Math.max(priceHistory.length - activeRange.days, 0);
    return priceHistory.slice(startIndex);
  }, [activeRange.days, selectedFund]);

  const performanceLabel = useMemo(() => {
    if (!performanceSlice.length) {
      return 'No pricing data available yet.';
    }
    if (performanceSlice.length < 2) {
      return 'Not enough data to calculate change.';
    }
    const start = performanceSlice[0].value;
    const end = performanceSlice[performanceSlice.length - 1].value;
    const change = ((end - start) / start) * 100;
    const direction = change >= 0 ? '▲' : '▼';
    return `${direction} ${change.toFixed(2)}% over the last ${activeRange.label}`;
  }, [activeRange.label, performanceSlice]);

  const latestMarketCap = selectedFund?.marketCapHistory.at(-1)?.value ?? 0;
  const latestInvestors = selectedFund?.investorHistory.at(-1)?.value ?? 0;

  const lastUpdate = selectedFund ? new Date(selectedFund.latestDate).toLocaleDateString() : '—';

  const compactNumber = (value: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

  const mergeRange = (data: HistoricalPoint[] = []) => {
    const startIndex = Math.max(data.length - activeRange.days, 0);
    return data.slice(startIndex);
  };

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <p className="title">TEFAS Fund Dashboard</p>
          <p className="subtitle">Interactive dashboard for pricing, fund size, and participation.</p>
        </div>
        <div className="badge">Vercel-ready · Vite + React</div>
      </header>

      {error && (
        <div className="card" style={{ background: '#fff7ed', border: '1px solid #fdba74' }}>
          <div className="section-title" style={{ color: '#c2410c' }}>Data load issue</div>
          <div style={{ color: '#9a3412' }}>{error}</div>
        </div>
      )}

      <div className="grid grid-2">
        <FundSelector
          funds={availableFunds}
          selected={selectedSummary}
          onChange={setSelectedSummary}
          loading={loadingFunds}
        />
        <div className="card">
          <h2 className="section-title">Data freshness</h2>
          <div className="metric-value">{lastUpdate}</div>
          <div className="metric-label">Latest TEFAS close</div>
          <div style={{ marginTop: 10, color: '#475569' }}>
            Live data is fetched from TEFAS via serverless functions every time you switch a fund.
          </div>
        </div>
      </div>

      <div style={{ margin: '18px 0' }}>
        <div className="chip-group">
          {ranges.map((range) => (
            <button
              key={range.label}
              className={`chip ${range.label === activeRange.label ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveRange(range)}
            >
              {range.label}
            </button>
          ))}
        </div>
        {loadingFundDetails && <span className="badge" style={{ marginLeft: 12 }}>Refreshing fund data…</span>}
      </div>

      <PerformanceChart data={performanceSlice} label={performanceLabel} />

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <MetricCard label="Latest price" value={formatCurrency(selectedFund?.latestPrice || 0)} helper={`As of ${lastUpdate}`} />
        <MetricCard label="Fund size" value={`${formatCurrency(latestMarketCap)}`} helper="Total market cap" />
        <MetricCard label="Investors" value={compactNumber(latestInvestors)} helper="Participant count" />
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <FundInsights marketCap={mergeRange(selectedFund?.marketCapHistory)} investors={mergeRange(selectedFund?.investorHistory)} />
        <AllocationChart data={selectedFund?.allocation || []} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title" style={{ marginBottom: 6 }}>
          Implementation notes
        </div>
        <ul style={{ color: '#475569', paddingLeft: 18, margin: 0 }}>
          <li>Fund search pulls directly from TEFAS (kind defaults to YAT).</li>
          <li>Serverless functions proxy TEFAS to avoid client-side CORS and keep secrets off the client.</li>
          <li>Add authentication or rate limits as needed before exposing the dashboard publicly.</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
