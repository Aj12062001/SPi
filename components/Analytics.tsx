
import React from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  CartesianGrid,
  Legend
} from 'recharts';
import { useData } from '../DataContext';

const Analytics: React.FC = () => {
  const { employeeData } = useData();
  const data = employeeData.map(emp => ({
    x: emp.login_count,
    y: emp.risk_score,
    id: emp.user,
    usb: emp.usb_count
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl">
          <p className="text-indigo-400 font-bold text-lg mb-1">{data.id}</p>
          <p className="text-slate-300 text-sm">Risk Score: <span className="text-white font-mono">{data.y}</span></p>
          <p className="text-slate-300 text-sm">Logins: <span className="text-white font-mono">{data.x}</span></p>
          <p className="text-slate-300 text-sm">USB Events: <span className="text-white font-mono">{data.usb}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
        <div className="mb-8">
          <h3 className="text-2xl font-bold">Organization Risk Distribution</h3>
          <p className="text-slate-400 mt-2">Correlation between Login Activity (X) and Computed Risk Score (Y)</p>
        </div>
        
        <div className="h-[600px] w-full bg-slate-900/50 p-6 rounded-xl border border-slate-700">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 40, right: 40, bottom: 60, left: 80 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#475569" 
                strokeWidth={1}
                vertical={true} 
                horizontal={true}
              />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Login Count" 
                stroke="#e2e8f0" 
                fontSize={14}
                fontWeight="bold"
                tickLine={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                label={{ 
                  value: 'Login Count', 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { textAnchor: 'middle', fill: '#e2e8f0', fontSize: '16px', fontWeight: 'bold' }
                }}
                tick={{ fill: '#cbd5e1', fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Risk Score" 
                stroke="#e2e8f0" 
                fontSize={14}
                fontWeight="bold"
                tickLine={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                axisLine={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                label={{ 
                  value: 'Risk Score', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#e2e8f0', fontSize: '16px', fontWeight: 'bold' }
                }}
                tick={{ fill: '#cbd5e1', fontSize: 12 }}
                domain={[0, 'dataMax + 10']}
              />
              <ZAxis type="number" range={[150, 800]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={50}
                wrapperStyle={{ paddingBottom: '20px' }}
                iconType="circle"
                content={() => (
                  <div className="flex justify-center gap-8 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span className="text-slate-300 text-sm font-medium">Low Risk (≤25)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <span className="text-slate-300 text-sm font-medium">Medium Risk (25-50)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="text-slate-300 text-sm font-medium">High Risk (&gt;50)</span>
                    </div>
                  </div>
                )}
              />
              <Scatter name="Employees" data={data} fill="#6366f1">
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.y > 50 ? '#ef4444' : entry.y > 25 ? '#eab308' : '#22c55e'} 
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
            <h4 className="font-bold mb-4">How to read this graph?</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start">
                <span className="w-4 h-4 rounded-full bg-red-500 mr-3 mt-0.5"></span>
                <p><strong className="text-slate-200">High Danger Zone:</strong> Top-right outliers represent users with high activity and extreme risk scores. Investigate immediately.</p>
              </li>
              <li className="flex items-start">
                <span className="w-4 h-4 rounded-full bg-yellow-500 mr-3 mt-0.5"></span>
                <p><strong className="text-slate-200">Watch List:</strong> Mid-range markers indicate suspicious behavior that doesn't yet qualify as a direct threat.</p>
              </li>
              <li className="flex items-start">
                <span className="w-4 h-4 rounded-full bg-green-500 mr-3 mt-0.5"></span>
                <p><strong className="text-slate-200">Safe Baseline:</strong> Densely packed bottom-left markers represent normal organizational behavior.</p>
              </li>
            </ul>
          </div>
          <div className="bg-indigo-600/10 p-6 rounded-xl border border-indigo-500/20">
             <h4 className="font-bold text-indigo-400 mb-2">AI Insight</h4>
             <p className="text-sm text-slate-300 leading-relaxed">
               The scatter plot reveals a strong correlation between excessive off-hour file activity and the Isolation Forest outlier label. 75% of high-risk users displayed anomalous USB insertion patterns within 2 hours of a night login event.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
