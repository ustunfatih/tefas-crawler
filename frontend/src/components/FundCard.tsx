import { FundOverview } from '../types';

interface Props {
  fund: FundOverview;
  onRemove: (code: string) => void;
}

const FundCard = ({ fund, onRemove }: Props) => {
  return (
    <div className="card fund-card">
      <div className="fund-card-header">
        <span className="fund-card-code">{fund.code}</span>
        <button className="remove-btn" onClick={() => onRemove(fund.code)}>×</button>
      </div>
      <div className="fund-card-title">{fund.title}</div>
      <div className="fund-card-kind">{fund.kind === 'YAT' ? 'Investment Fund' : fund.kind}</div>
    </div>
  );
};

export default FundCard;
