import { useCallback, useEffect, useMemo, useState } from 'react';
import AllocationChart from './components/AllocationChart';
import FundInsights from './components/FundInsights';
import FundSelector from './components/FundSelector';
import MetricCard from './components/MetricCard';
import PerformanceChart from './components/PerformanceChart';
import { fetchFundDetails, fetchFunds } from './api';
import { FundKind, FundOverview, FundSummary, HistoricalPoint } from './types';

const ranges = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TRY' }).format(value);

const compactNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

const App = () => {
  const [fundKind] = useState<FundKind>('YAT');
  const [funds, setFunds] = useState<FundSummary[]>([]);
  const [selectedFund, setSelectedFund] = useState<FundOverview | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [activeRange, setActiveRange] = useState(ranges[3]);
  const [loadingFunds, setLoadingFunds] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch fund list on mount
  useEffect(() => {
    const loadFunds = async () => {
      try {
        setLoadingFunds(true);
        setError(null);
        const data = await fetchFunds(fundKind);
        setFunds(data);
        // Auto-select first fund if available
        if (data.length > 0 && !selectedCode) {
          setSelectedCode(data[0].code);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load funds');
      } finally {
        setLoadingFunds(false);
      }
    };
    loadFunds();
  }, [fundKind]);

  // Load fund details when selection changes
  useEffect(() => {
    if (!selectedCode) return;

    const loadDetails = async () => {
      try {
        setLoadingDetails(true);
        setError(null);
        const details = await fetchFundDetails(selectedCode, fundKind);
        setSelectedFund(details);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fund details');
      } finally {
        setLoadingDetails(false);
      }
    };
    loadDetails();
  }, [selectedCode, fundKind]);

  const handleFundSelect = useCallback((fund: FundSummary) => {
    setSelectedCode(fund.code);
  }, []);

  const performanceSlice = useMemo(() => {
    if (!selectedFund) return [];
    const { priceHistory } = selectedFund;
    const startIndex = Math.max(priceHistory.length - activeRange.days, 0);
    return priceHistory.slice(startIndex);
  }, [activeRange.days, selectedFund]);

  const performanceLabel = useMemo(() => {
    if (performanceSlice.length < 2) {
      return 'Not enough data to calculate change.';
    }
    const start = performanceSlice[0].value;
    const end = performanceSlice[performanceSlice.length - 1].value;
    const change = ((end - start) / start) * 100;
    const direction = change >= 0 ? '▲' : '▼';
    return `${direction} ${change.toFixed(2)}% over the last ${activeRange.label}`;
  }, [activeRange.label, performanceSlice]);

  const mergeRange = useCallback(
    (data: HistoricalPoint[]) => {
      const startIndex = Math.max(data.length - activeRange.days, 0);
      return data.slice(startIndex);
    },
    [activeRange.days]
  );

  const latestMarketCap = selectedFund?.marketCapHistory.at(-1)?.value ?? 0;
  const latestInvestors = selectedFund?.investorHistory.at(-1)?.value ?? 0;
  const lastUpdate = selectedFund ? new Date(selectedFund.latestDate).toLocaleDateString() : '-';

  const isLoading = loadingFunds || loadingDetails;

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <p className="title">TEFAS Fund Dashboard</p>
          <p className="subtitle">Live data from Turkey Electronic Fund Trading Platform</p>
        </div>
        <div className="badge">Live Data · Vite + React</div>
      </header>

      {error && (
        <div className="card" style={{ background: '#fef2f2', borderColor: '#fecaca', marginBottom: 16 }}>
          <p style={{ color: '#dc2626', margin: 0 }}>Error: {error}</p>
        </div>
      )}

      <div className="grid grid-2">
        <FundSelector
          funds={funds}
          selectedCode={selectedCode}
          onSelect={handleFundSelect}
          loading={loadingFunds}
        />
        <div className="card">
          <h2 className="section-title">Data freshness</h2>
          <div className="metric-value">{isLoading ? 'Loading...' : lastUpdate}</div>
          <div className="metric-label">Latest TEFAS close</div>
          <div style={{ marginTop: 10, color: '#475569' }}>
            {funds.length > 0 ? `${funds.length} funds available` : 'Loading fund list...'}
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
      </div>

      {loadingDetails ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading fund data...</p>
        </div>
      ) : selectedFund ? (
        <>
          <PerformanceChart data={performanceSlice} label={performanceLabel} />

          <div className="grid grid-3" style={{ marginTop: 16 }}>
            <MetricCard
              label="Latest price"
              value={formatCurrency(selectedFund.latestPrice)}
              helper={`As of ${lastUpdate}`}
            />
            <MetricCard label="Fund size" value={formatCurrency(latestMarketCap)} helper="Total market cap" />
            <MetricCard label="Investors" value={compactNumber(latestInvestors)} helper="Participant count" />
          </div>

          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <FundInsights
              marketCap={mergeRange(selectedFund.marketCapHistory)}
              investors={mergeRange(selectedFund.investorHistory)}
            />
            <AllocationChart data={selectedFund.allocation} />
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Select a fund to view details</p>
        </div>
      )}
    </div>
  );
};

export default App;
