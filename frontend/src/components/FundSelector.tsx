import { useMemo, useState } from 'react';
import { FundSummary } from '../types';
import { useFundSearch } from '../hooks/useFundSearch';

interface Props {
  funds: FundSummary[];
  selected?: FundSummary | null;
  loading?: boolean;
  onChange: (fund: FundSummary) => void;
}

const FundSelector = ({ funds, selected, onChange, loading }: Props) => {
  const { matches, query, setQuery } = useFundSearch({ funds });
  const [isOpen, setIsOpen] = useState(false);

  const dropdownLabel = useMemo(() => {
    if (loading) return 'Loading funds...';
    if (!selected) return 'Select a fund to begin';
    return `${selected.title} (${selected.code})`;
  }, [loading, selected]);

  return (
    <div className="card">
      <h2 className="section-title">Select a fund</h2>
      <div className="selector-dropdown">
        <input
          className="input"
          placeholder="Start typing a fund code or name..."
          value={query}
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
                  onChange(fund);
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
        <div style={{ marginTop: 10, color: '#475569' }}>Current selection: {dropdownLabel}</div>
      </div>
    </div>
  );
};

export default FundSelector;
