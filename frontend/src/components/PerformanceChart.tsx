import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { HistoricalPoint } from '../types';

interface Props {
  data: HistoricalPoint[];
  label: string;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const PerformanceChart = ({ data, label }: Props) => (
  <div className="card">
    <div className="section-title" style={{ marginBottom: 8 }}>
      Performance
    </div>
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" minTickGap={32} tickMargin={8} tick={{ fill: '#475569', fontSize: 12 }} />
          <YAxis
            tickFormatter={(value) => currencyFormatter.format(value).replace('$', '')}
            tick={{ fill: '#475569', fontSize: 12 }}
            width={72}
          />
          <Tooltip
            formatter={(value: number) => currencyFormatter.format(value)}
            labelFormatter={(value) => `Date: ${value}`}
            contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0' }}
          />
          <Area type="monotone" dataKey="value" stroke="#1d4ed8" strokeWidth={2.2} fill="url(#priceGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <div className="metric-label" style={{ marginTop: 10 }}>{label}</div>
  </div>
);

export default PerformanceChart;
