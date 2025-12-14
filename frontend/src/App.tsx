import { useMemo, useState } from 'react';
import AllocationChart from './components/AllocationChart';
import FundInsights from './components/FundInsights';
import FundSelector from './components/FundSelector';
import MetricCard from './components/MetricCard';
import PerformanceChart from './components/PerformanceChart';
import { mockFunds } from './data/mockFunds';
import { FundOverview, HistoricalPoint } from './types';

const ranges = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'TRY' }).format(value);

const App = () => {
  const [selectedFund, setSelectedFund] = useState<FundOverview>(mockFunds[0]);
  const [activeRange, setActiveRange] = useState(ranges[3]);

  const performanceSlice = useMemo(() => {
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

  const latestMarketCap = selectedFund.marketCapHistory.at(-1)?.value ?? 0;
  const latestInvestors = selectedFund.investorHistory.at(-1)?.value ?? 0;

  const lastUpdate = new Date(selectedFund.latestDate).toLocaleDateString();

  const compactNumber = (value: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

  const mergeRange = (data: HistoricalPoint[]) => {
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

      <div className="grid grid-2">
        <FundSelector funds={mockFunds} selected={selectedFund} onChange={setSelectedFund} />
        <div className="card">
          <h2 className="section-title">Data freshness</h2>
          <div className="metric-value">{lastUpdate}</div>
          <div className="metric-label">Latest TEFAS close</div>
          <div style={{ marginTop: 10, color: '#475569' }}>
            Swap the mock data provider with your API layer when wiring to production.
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

      <PerformanceChart data={performanceSlice} label={performanceLabel} />

      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <MetricCard label="Latest price" value={formatCurrency(selectedFund.latestPrice)} helper={`As of ${lastUpdate}`} />
        <MetricCard label="Fund size" value={`${formatCurrency(latestMarketCap)}`} helper="Total market cap" />
        <MetricCard label="Investors" value={compactNumber(latestInvestors)} helper="Participant count" />
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <FundInsights marketCap={mergeRange(selectedFund.marketCapHistory)} investors={mergeRange(selectedFund.investorHistory)} />
        <AllocationChart data={selectedFund.allocation} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title" style={{ marginBottom: 6 }}>
          Implementation notes
        </div>
        <ul style={{ color: '#475569', paddingLeft: 18, margin: 0 }}>
          <li>Replace the mock data in <code>mockFunds.ts</code> with live data from your TEFAS-backed API.</li>
          <li>Wire the selector to your search endpoint to handle thousands of funds without shipping them to the client.</li>
          <li>Add authentication or rate limits as needed before exposing the dashboard publicly.</li>
        </ul>
      </div>
    </div>
  );
};

export default App;
