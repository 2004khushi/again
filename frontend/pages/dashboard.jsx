import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [timeseries, setTimeseries] = useState([]);

  const shop = new URLSearchParams(window.location.search).get('shop') || 'xeno-intern-test.myshopify.com';
  const token = localStorage.getItem('token'); // from owner login

  useEffect(() => {
    fetch(`/api/metrics?shop=${shop}`, { headers: { Authorization: `Bearer ${token}` }})
      .then(r => r.json()).then(setMetrics);

    fetch(`/api/orders-by-date?shop=${shop}`)
      .then(r => r.json()).then(d => {
        // adapt raw to Chart.js format
        const labels = d.data.map(x => new Date(x.day).toISOString().slice(0, 10));
        const data = d.data.map(x => parseFloat(x.total));
        setTimeseries({ labels, datasets: [{ label: 'Revenue', data }]});
      });
  }, []);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard - {shop}</h1>
      <div style={{ display: 'flex', gap: 20 }}>
        <div>Total Customers: {metrics.totals.customers}</div>
        <div>Total Orders: {metrics.totals.orders}</div>
        <div>Revenue: ₹{metrics.totals.revenue}</div>
      </div>

      <div style={{ width: '80%', marginTop: 30 }}>
        {timeseries && <Line data={timeseries} />}
      </div>
    </div>
  );
}
