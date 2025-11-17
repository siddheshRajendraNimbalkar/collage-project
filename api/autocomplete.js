export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prefix = '', limit = 8 } = req.query;

  if (!prefix.trim()) {
    return res.json({ query: prefix, items: [] });
  }

  // Return mock data - Redis is not connected
  const items = [
    { id: '1', title: `${prefix} Art`, name: `${prefix} Art`, category: 'Art' },
    { id: '2', title: `${prefix} Design`, name: `${prefix} Design`, category: 'Design' }
  ];

  res.json({ query: prefix, items });
}