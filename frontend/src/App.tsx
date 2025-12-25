import { useCallback, useEffect, useMemo, useState } from 'react';
import FundSelector from './components/FundSelector';
import FundCard from './components/FundCard';
import PerformanceChart from './components/PerformanceChart';
import { fetchFundDetails, fetchFunds } from './api';
import { FundKind, FundOverview, FundSummary, HistoricalPoint } from './types';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';

const timeFilters = [
  { label: '1D', days: 1 },
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: 'YBB', days: 'ybb' },
  { label: '1Y', days: 365 },
  { label: '3Y', days: 365 * 3 },
  { label: '5Y', days: 365 * 5 },
];

const metricFilters = [
  { label: 'Price', key: 'priceHistory' },
  { label: 'Investors', key: 'investorHistory' },
  { label: 'Market Cap', key: 'marketCapHistory' },
];

const fundKinds: { label: string; value: FundKind }[] = [
  { label: 'Yatırım Fonları (YAT)', value: 'YAT' },
  { label: 'Emeklilik Fonları (EMK)', value: 'EMK' },
  { label: 'Borsa Yatırım Fonları (BYF)', value: 'BYF' },
];

const App = () => {
  const [fundKind, setFundKind] = useState<FundKind>('YAT');
  const [isNormalized, setIsNormalized] = useState(false);
  const [showMA, setShowMA] = useState(false);
  const [funds, setFunds] = useState<FundSummary[]>([]);
  const [selectedFunds, setSelectedFunds] = useState<FundOverview[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<{ code: string; kind: FundKind }[]>([]);
  const [activeTimeFilter, setActiveTimeFilter] = useState(timeFilters[3]); // 3M default
  const [activeMetric, setActiveMetric] = useState(metricFilters[0]); // Price default
  const [loadingFunds, setLoadingFunds] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, signInWithGithub, signOut } = useAuth();

  // Save current selection to Supabase
  const savePortfolio = async () => {
    if (!user || selectedCodes.length === 0) return;
    try {
      const { error } = await supabase.from('portfolios').upsert({
        user_id: user.id,
        name: 'My Portfolio',
        fund_list: selectedCodes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (error) throw error;
      alert('Portföy kaydedildi!');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Portföy kaydedilemedi.');
    }
  };

  // Load portfolio from Supabase on login
  useEffect(() => {
    if (!user) return;
    const loadPortfolio = async () => {
      const { data } = await supabase
        .from('portfolios')
        .select('fund_list')
        .eq('user_id', user.id)
        .single();
      if (data?.fund_list && Array.isArray(data.fund_list)) {
        setSelectedCodes(data.fund_list);
      }
    };
    loadPortfolio();
  }, [user]);

  // Fetch fund list on mount or when kind changes
  useEffect(() => {
    const loadFunds = async () => {
      try {
        setLoadingFunds(true);
        setError(null);
        const data = await fetchFunds(fundKind);
        setFunds(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load funds');
      } finally {
        setLoadingFunds(false);
      }
    };
    loadFunds();
  }, [fundKind]);

  // Load fund details when selection changes or range changes
  useEffect(() => {
    const loadNewDetails = async () => {
      // Determine the actual number of days for 'YBB'
      const daysParam = activeTimeFilter.days === 'ybb' ? getDaysForYBB() : (activeTimeFilter.days as number);

      // Find codes that don't have details yet or need updating due to range change
      const toFetch = selectedCodes.filter(
        ({ code }) => {
          const existingFund = selectedFunds.find((f) => f.code === code);
          if (!existingFund) return true;
          const history = existingFund[activeMetric.key as keyof FundOverview] as HistoricalPoint[];
          return !history || history.length < daysParam;
        }
      );

      if (toFetch.length === 0) {
        setSelectedFunds((prev) => prev.filter((f) => selectedCodes.some(s => s.code === f.code)));
        return;
      }

      try {
        setLoadingDetails(true);
        const newFunds = await Promise.all(
          toFetch.map(({ code, kind }) => fetchFundDetails(code, kind, daysParam))
        );
        setSelectedFunds((prev) => {
          const codesToReplace = toFetch.map(f => f.code);
          const currentCodes = selectedCodes.map(s => s.code);
          const updatedFunds = prev.filter((f) => !codesToReplace.includes(f.code) && currentCodes.includes(f.code));
          return [...updatedFunds, ...newFunds];
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fund details');
        setSelectedCodes(prev => prev.filter(c => !toFetch.some(f => f.code === c.code)));
      } finally {
        setLoadingDetails(false);
      }
    };

    loadNewDetails();
    setSelectedFunds((prev) => prev.filter((f) => selectedCodes.some(s => s.code === f.code)));
  }, [selectedCodes, activeTimeFilter.days, activeMetric.key, refreshKey]);

  const handleFundSelect = useCallback((fund: FundSummary) => {
    setSelectedCodes((prev) =>
      prev.some(s => s.code === fund.code)
        ? prev.filter((s) => s.code !== fund.code)
        : prev.length < 5
          ? [...prev, { code: fund.code, kind: fund.kind }]
          : prev
    );
  }, []);

  const handleRemoveFund = useCallback((code: string) => {
    setSelectedCodes(prev => prev.filter(s => s.code !== code));
  }, []);

  const handleRefresh = useCallback(() => {
    setSelectedFunds([]); // Clear cached fund data to force refetch
    setRefreshKey(k => k + 1); // Trigger useEffect
  }, []);

  const getDaysForYBB = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - startOfYear.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const chartData = useMemo(() => {
    if (selectedFunds.length === 0) return [];

    const days = activeTimeFilter.days === 'ybb' ? getDaysForYBB() : (activeTimeFilter.days as number);
    const dateMap: Record<string, Record<string, number>> = {};

    // Helper to calculate Simple Moving Average on FULL data
    const calculateSMA = (data: HistoricalPoint[], period: number): Map<string, number> => {
      const result = new Map<string, number>();
      for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, p) => acc + p.value, 0);
        result.set(data[i].date, sum / period);
      }
      return result;
    };

    selectedFunds.forEach(fund => {
      const history = fund[activeMetric.key as keyof FundOverview] as HistoricalPoint[];
      if (!history || history.length === 0) return;

      // Calculate MAs on FULL history data (not sliced)
      const ma50Map = showMA ? calculateSMA(history, 50) : null;
      const ma200Map = showMA ? calculateSMA(history, 200) : null;

      // Now slice for display
      const startIndex = Math.max(history.length - (days || 1), 0);
      const slice = history.slice(startIndex);
      const baseValue = slice[0]?.value;

      // For normalized MA, we need the base MA value at the start of the slice
      const baseMa50 = ma50Map?.get(slice[0]?.date) ?? null;
      const baseMa200 = ma200Map?.get(slice[0]?.date) ?? null;

      slice.forEach((point) => {
        const dateStr = point.date;
        if (!dateMap[dateStr]) dateMap[dateStr] = {};

        if (isNormalized && baseValue !== 0) {
          dateMap[dateStr][fund.code] = ((point.value / baseValue) - 1) * 100;
        } else {
          dateMap[dateStr][fund.code] = point.value;
        }

        // Add MA values if enabled (from full history calculation)
        if (showMA && ma50Map) {
          const ma50Value = ma50Map.get(dateStr);
          if (ma50Value !== undefined) {
            if (isNormalized && baseMa50 !== null && baseMa50 !== 0) {
              dateMap[dateStr][`${fund.code}_MA50`] = ((ma50Value / baseMa50) - 1) * 100;
            } else if (!isNormalized) {
              dateMap[dateStr][`${fund.code}_MA50`] = ma50Value;
            }
          }
        }
        if (showMA && ma200Map) {
          const ma200Value = ma200Map.get(dateStr);
          if (ma200Value !== undefined) {
            if (isNormalized && baseMa200 !== null && baseMa200 !== 0) {
              dateMap[dateStr][`${fund.code}_MA200`] = ((ma200Value / baseMa200) - 1) * 100;
            } else if (!isNormalized) {
              dateMap[dateStr][`${fund.code}_MA200`] = ma200Value;
            }
          }
        }
      });
    });

    return Object.entries(dateMap)
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedFunds, activeTimeFilter, activeMetric, isNormalized, showMA]);

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <p className="title">TEFAS Fund Dashboard</p>
          <p className="subtitle">Interactive performance tracking for multiple investment funds</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <span style={{ fontSize: 14, color: '#64748b' }}>{user.email || user.user_metadata?.user_name}</span>
              <button className="chip active" onClick={savePortfolio} disabled={selectedCodes.length === 0}>
                💾 Kaydet
              </button>
              <button className="chip" onClick={signOut}>Çıkış</button>
            </>
          ) : (
            <button className="chip active" onClick={signInWithGithub}>🔑 GitHub ile Giriş</button>
          )}
          <div className="badge">Tefas Crawler Engine</div>
        </div>
      </header>

      {error && (
        <div className="card" style={{ background: '#fef2f2', borderColor: '#fecaca', marginBottom: 16 }}>
          <p style={{ color: '#dc2626', margin: 0 }}>Error: {error}</p>
        </div>
      )}

      <div className="filter-group">
        <div className="filter-row" style={{ marginBottom: 16 }}>
          <span className="filter-label">Fund Type:</span>
          <div className="chip-group">
            {fundKinds.map((kind) => (
              <button
                key={kind.value}
                className={`chip ${fundKind === kind.value ? 'active' : ''}`}
                onClick={() => setFundKind(kind.value)}
              >
                {kind.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-row">
          <FundSelector
            funds={funds}
            selectedCodes={selectedCodes.map(s => s.code)}
            onSelect={handleFundSelect}
            loading={loadingFunds}
          />
        </div>

        <div className="selected-funds-grid">
          {selectedFunds.map(fund => (
            <FundCard key={fund.code} fund={fund} onRemove={() => handleRemoveFund(fund.code)} />
          ))}
        </div>

        <div className="card">
          <div className="filter-row" style={{ marginBottom: 16 }}>
            <span className="filter-label">Time Period:</span>
            <div className="chip-group">
              {timeFilters.map((filter) => (
                <button
                  key={filter.label}
                  className={`chip ${filter.label === activeTimeFilter.label ? 'active' : ''}`}
                  onClick={() => setActiveTimeFilter(filter)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-row" style={{ marginBottom: 16 }}>
            <span className="filter-label">Metric:</span>
            <div className="chip-group">
              {metricFilters.map((filter) => (
                <button
                  key={filter.label}
                  className={`chip ${filter.label === activeMetric.label ? 'active' : ''}`}
                  onClick={() => setActiveMetric(filter)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-row">
            <span className="filter-label">Chart Mode:</span>
            <div className="chip-group">
              <button
                className={`chip ${isNormalized ? 'active' : ''}`}
                onClick={() => setIsNormalized(!isNormalized)}
              >
                Percentage Change (%)
              </button>
              <button
                className={`chip ${showMA ? 'active' : ''}`}
                onClick={() => setShowMA(!showMA)}
              >
                Moving Averages (MA50/MA200)
              </button>
              <button
                className="chip"
                onClick={handleRefresh}
                disabled={loadingDetails || selectedCodes.length === 0}
                style={{ marginLeft: 'auto' }}
              >
                🔄 {loadingDetails ? 'Yükleniyor...' : 'Yenile'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedFunds.length > 0 ? (
        <PerformanceChart
          data={chartData}
          metricLabel={activeMetric.label}
          selectedCodes={selectedCodes.map(s => s.code)}
          isNormalized={isNormalized}
          showMA={showMA}
        />
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px', background: '#f8fafc' }}>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
            Select up to 5 funds to start tracking their performance.
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
