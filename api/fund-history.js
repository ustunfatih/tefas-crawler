const { bootstrapSession, fetchAllocation, fetchInfo, formatDate, toISO } = require('./_lib/tefas');

const FIVE_YEARS_IN_DAYS = 365 * 5;

const buildHistoricalSeries = (rows, field) =>
  rows
    .filter((row) => row[field] !== undefined && row[field] !== null)
    .sort((a, b) => Number(a.TARIH) - Number(b.TARIH))
    .map((row) => ({
      date: toISO(row.TARIH),
      value: Number(row[field]) || 0,
    }));

const buildAllocation = (row = {}) => {
  const mapping = [
    ['stock', 'HS', 'Stocks'],
    ['government_bond', 'DT', 'Government Bonds'],
    ['precious_metals', 'KM', 'Precious Metals'],
    ['term_deposit', 'VM', 'Term Deposits'],
    ['repo', 'R', 'Repo'],
    ['participation_account', 'KH', 'Participation Accounts'],
  ];

  return mapping
    .map(([_, key, label]) => ({ label, value: Number(row[key]) || 0 }))
    .filter((slice) => slice.value > 0)
    .sort((a, b) => b.value - a.value);
};

module.exports = async function handler(req, res) {
  try {
    const code = (req.query.code || '').toString().trim().toUpperCase();
    const kind = (req.query.kind || 'YAT').toString().toUpperCase();
    if (!code) {
      return res.status(400).json({ error: 'Missing code parameter' });
    }

    const days = Number(req.query.days) || FIVE_YEARS_IN_DAYS;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    const start = formatDate(startDate);
    const end = formatDate(endDate);

    const cookie = await bootstrapSession();
    const [info, allocation] = await Promise.all([
      fetchInfo({ start, end, code, kind, cookie }),
      fetchAllocation({ start, end, code, kind, cookie }),
    ]);

    if (!info.length) {
      return res.status(404).json({ error: 'Fund not found' });
    }

    const priceHistory = buildHistoricalSeries(info, 'FIYAT');
    const marketCapHistory = buildHistoricalSeries(info, 'PORTFOYBUYUKLUK');
    const investorHistory = buildHistoricalSeries(info, 'KISISAYISI');
    const latest = info.reduce((acc, curr) => (Number(curr.TARIH) > Number(acc.TARIH) ? curr : acc), info[0]);
    const lastAllocation = allocation.reduce(
      (acc, curr) => (Number(curr.TARIH) > Number(acc.TARIH) ? curr : acc),
      allocation[0] || {},
    );

    const fund = {
      code,
      title: latest.FONUNVAN,
      kind,
      priceHistory,
      marketCapHistory,
      investorHistory,
      allocation: buildAllocation(lastAllocation),
      latestPrice: Number(latest.FIYAT) || 0,
      latestDate: toISO(latest.TARIH),
    };

    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).json({ fund });
  } catch (error) {
    console.error('[fund-history] failed', error);
    return res.status(500).json({ error: 'Failed to load fund', detail: error.message });
  }
};
