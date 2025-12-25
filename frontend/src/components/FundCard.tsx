import { FundOverview } from '../types';

interface Props {
  fund: FundOverview;
  onRemove: (code: string) => void;
}

const FundCard = ({ fund, onRemove }: Props) => {
  // Get latest price from priceHistory
  const latestPrice = fund.priceHistory && fund.priceHistory.length > 0
    ? fund.priceHistory[fund.priceHistory.length - 1].value
    : null;

  // Format price with up to 6 decimals, remove trailing zeros
  const formatPrice = (price: number) => {
    return price.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  return (
    <div className="card fund-card">
      <div className="fund-card-header">
        <span className="fund-card-code">{fund.code}</span>
        <button className="remove-btn" onClick={() => onRemove(fund.code)}>×</button>
      </div>

      {latestPrice !== null && (
        <div className="fund-card-price">{formatPrice(latestPrice)} ₺</div>
      )}

      <div className="fund-card-title">{fund.title}</div>
    </div>
  );
};

export default FundCard;
