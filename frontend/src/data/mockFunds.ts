import { FundOverview } from '../types';

const today = new Date();

const createHistory = (days: number, startValue: number, volatility = 0.8): { date: string; value: number }[] => {
  const points: { date: string; value: number }[] = [];
  let current = startValue;

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const drift = (Math.sin(i / 12) + Math.cos(i / 7)) * volatility;
    const noise = (Math.random() - 0.5) * volatility;
    current = Math.max(0.01, current + drift + noise);
    points.push({ date: date.toISOString().slice(0, 10), value: parseFloat(current.toFixed(2)) });
  }

  return points;
};

export const mockFunds: FundOverview[] = [
  {
    code: 'YAC',
    title: 'Yapı Kredi Altın Fon',
    kind: 'YAT',
    priceHistory: createHistory(365, 18.5, 0.4),
    marketCapHistory: createHistory(365, 250_000_000, 1_500_000),
    investorHistory: createHistory(365, 120_000, 750),
    allocation: [
      { label: 'Precious Metals', value: 58 },
      { label: 'Government Bonds', value: 16 },
      { label: 'Repo', value: 10 },
      { label: 'Term Deposit', value: 8 },
      { label: 'Other', value: 8 },
    ],
    latestPrice: 23.8,
    latestDate: today.toISOString().slice(0, 10),
  },
  {
    code: 'TCD',
    title: 'TEB Değer Fon',
    kind: 'YAT',
    priceHistory: createHistory(365, 14.2, 0.35),
    marketCapHistory: createHistory(365, 150_000_000, 900_000),
    investorHistory: createHistory(365, 75_000, 450),
    allocation: [
      { label: 'Equities', value: 46 },
      { label: 'Government Bonds', value: 22 },
      { label: 'FX Bonds', value: 12 },
      { label: 'Derivatives', value: 10 },
      { label: 'Cash & Repo', value: 10 },
    ],
    latestPrice: 17.6,
    latestDate: today.toISOString().slice(0, 10),
  },
  {
    code: 'ISB',
    title: 'İş Portföy Teknoloji Fon',
    kind: 'YAT',
    priceHistory: createHistory(365, 9.4, 0.55),
    marketCapHistory: createHistory(365, 340_000_000, 1_800_000),
    investorHistory: createHistory(365, 210_000, 1_100),
    allocation: [
      { label: 'Equities', value: 72 },
      { label: 'FX Equities', value: 12 },
      { label: 'Repo', value: 8 },
      { label: 'Cash', value: 8 },
    ],
    latestPrice: 13.1,
    latestDate: today.toISOString().slice(0, 10),
  },
];
