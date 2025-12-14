import type { FundKind, FundOverview, FundResponse, FundSummary, FundsResponse } from './types';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }
  return response.json() as Promise<T>;
};

export const fetchFunds = async (kind: FundKind = 'YAT'): Promise<FundSummary[]> => {
  const response = await fetch(`${API_BASE}/api/funds?kind=${kind}`);
  const payload = await handleResponse<FundsResponse>(response);
  return payload.funds;
};

export const fetchFundDetails = async (code: string, kind: FundKind = 'YAT'): Promise<FundOverview> => {
  const response = await fetch(`${API_BASE}/api/fund-history?code=${encodeURIComponent(code)}&kind=${kind}`);
  const payload = await handleResponse<FundResponse>(response);
  return payload.fund;
};
