import { useState } from 'react';
import { FundSummary } from '../types';
import { useFundSearch } from '../hooks/useFundSearch';

interface Props {
  funds: FundSummary[];
  selectedCode: string | null;
  onSelect: (fund: FundSummary) => void;
  loading?: boolean;
}

const FundSelector = ({ funds, selectedCode, onSelect, loading }: Props) => {
  const { matches, query, setQuery } = useFundSearch({ funds });
  const [isOpen, setIsOpen] = useState(false);

  const selectedFund = funds.find((f) => f.code === selectedCode);
  const dropdownLabel = selectedFund ? `${selectedFund.title} (${selectedFund.code})` : 'No fund selected';

  return (
    <div className="card">
      <h2 className="section-title">Select a fund</h2>
      <div className="selector-dropdown">
        <input
          className="input"
          placeholder={loading ? 'Loading funds...' : 'Start typing a fund code or name...'}
          value={query}
          disabled={loading}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 120)}
          onChange={(event) => setQuery(event.target.value)}
        />
        {isOpen && !loading && (
          <ul>
            {matches.map((fund) => (
              <li
                key={fund.code}
                onMouseDown={() => {
                  onSelect(fund);
                  setIsOpen(false);
                  setQuery('');
                }}
              >
                <strong>{fund.code}</strong>
                <span>{fund.title}</span>
                <span className="badge">{fund.kind}</span>
              </li>
            ))}
            {!matches.length && <li>No matches</li>}
          </ul>
        )}
        <div style={{ marginTop: 10, color: '#475569' }}>
          {loading ? 'Loading...' : `Current selection: ${dropdownLabel}`}
        </div>
      </div>
    </div>
  );
};

export default FundSelector;
