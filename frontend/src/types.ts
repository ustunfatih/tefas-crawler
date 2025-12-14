export type FundKind = 'YAT' | 'EMK' | 'BYF';

export interface HistoricalPoint {
  date: string; // ISO date string
  value: number;
}

export interface AllocationSlice {
  label: string;
  value: number;
}

export interface FundOverview {
  code: string;
  title: string;
  kind: FundKind;
  priceHistory: HistoricalPoint[];
  marketCapHistory: HistoricalPoint[];
  investorHistory: HistoricalPoint[];
  allocation: AllocationSlice[];
  latestPrice: number;
  latestDate: string;
}
