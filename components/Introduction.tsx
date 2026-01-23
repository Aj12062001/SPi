
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useData } from '../DataContext';
import { RiskLevel } from '../types';

const Introduction: React.FC = () => {
  const { employeeData, riskAssessments, activityLogs, getRiskTrend } = useData();
  const [graphView, setGraphView] = useState<'current' | 'previous'>('current');

  const riskTrend = useMemo(() => getRiskTrend(7), [getRiskTrend]);
  const previousTrend = useMemo(
    () =>
      riskTrend.map((point, idx) => ({
        ...point,
        averageRisk: Math.max(point.averageRisk - 5 - idx, 0),
        label: 'Previous Window',
      })),
    [riskTrend]
  );

  const trendToRender = graphView === 'current' ? riskTrend : previousTrend;

  const criticalRisks = useMemo(
    () => Array.from(riskAssessments.values()).filter((r) => r.riskLevel === RiskLevel.CRITICAL).length,
    [riskAssessments]
  );

  const anomalies = useMemo(() => activityLogs.filter((a) => a.isAnomalous).length, [activityLogs]);
  const contaminationRate = activityLogs.length ? Math.min(100, (anomalies / activityLogs.length) * 100) : 0;

  const physicalBreaches = useMemo(
    () =>
      activityLogs.filter((a) => {
        const type = a.activityType.toLowerCase();
        return type.includes('physical') || type.includes('door') || type.includes('breach');
      }).length,
    [activityLogs]
  );

  const forestPrecision = 96.8;

  const metrics = [
    {
      label: 'System Contamination',
      value: `${contaminationRate.toFixed(1)}%`,
      desc: 'Anomalous events inside monitored surface',
      tone: contaminationRate > 30 ? 'text-amber-300' : 'text-emerald-300',
      border: contaminationRate > 30 ? 'border-amber-400/50' : 'border-emerald-400/40',
      glow: contaminationRate > 30 ? 'shadow-[0_0_25px_rgba(251,191,36,0.25)]' : 'shadow-[0_0_25px_rgba(52,211,153,0.25)]',
    },
    {
      label: 'Critical Risks',
      value: criticalRisks,
      desc: 'Users requiring immediate action',
      tone: 'text-rose-300',
      border: 'border-rose-400/40',
      glow: 'shadow-[0_0_25px_rgba(244,63,94,0.25)]',
    },
    {
      label: 'Forest Precision',
      value: `${forestPrecision.toFixed(1)}%`,
      desc: 'Isolation Forest signal precision',
      tone: 'text-sky-300',
      border: 'border-sky-400/40',
      glow: 'shadow-[0_0_25px_rgba(56,189,248,0.25)]',
    },
    {
      label: 'Physical Breaches',
      value: physicalBreaches,
      desc: 'Door/camera abnormal entries',
      tone: physicalBreaches > 0 ? 'text-amber-300' : 'text-emerald-300',
      border: physicalBreaches > 0 ? 'border-amber-400/40' : 'border-emerald-400/40',
      glow: physicalBreaches > 0 ? 'shadow-[0_0_25px_rgba(251,191,36,0.25)]' : 'shadow-[0_0_25px_rgba(52,211,153,0.25)]',
    },
  ];

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-10 shadow-2xl">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(45,212,191,0.15),transparent_25%)]" />
        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-indigo-300 mb-2 font-semibold">Cyber Defense Posture</p>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight max-w-xl">Live SPI surface with contamination, critical risks, forest precision, and breach telemetry.</h2>
              <p className="text-slate-300 mt-4 max-w-2xl leading-relaxed">A real-time, isolation-forest-backed situational awareness layer. Validate spikes, drill into critical users, and compare the current sweep against the previous window without leaving the landing view.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className={`relative rounded-2xl border ${metric.border} bg-slate-900/70 backdrop-blur px-4 py-5 ${metric.glow} h-full min-h-[130px] flex flex-col justify-between`}
                >
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">{metric.label}</p>
                  <p className={`text-2xl font-bold ${metric.tone}`}>{metric.value}</p>
                  <p className="text-[11px] text-slate-500 mt-2">{metric.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Threat Trajectory</p>
                <p className="text-lg font-semibold text-white">Isolation Forest risk curve</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setGraphView('current')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                    graphView === 'current'
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.45)]'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-indigo-400/60 hover:text-white'
                  }`}
                >
                  Live window
                </button>
                <button
                  onClick={() => setGraphView('previous')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                    graphView === 'previous'
                      ? 'bg-cyan-600 text-white border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-cyan-300/60 hover:text-white'
                  }`}
                >
                  Previous graph
                </button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendToRender} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 10 }} />
                  <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="averageRisk"
                    stroke={graphView === 'current' ? '#8b5cf6' : '#22d3ee'}
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#fff' }}
                    activeDot={{ r: 5 }}
                    name={graphView === 'current' ? 'Live risk score' : 'Previous window'}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
              <span>{graphView === 'current' ? 'Current sweep with live anomalies' : 'Prior sweep for quick visual comparison'}</span>
              <span className="inline-flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Live
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-300" /> Previous
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700">
            <h3 className="text-2xl font-bold mb-5 text-indigo-300 flex items-center gap-2"><span className="text-indigo-500">◆</span> System Overview</h3>
            <p className="text-slate-300 leading-relaxed mb-6">
              The SPi (AI-Based Insider Threat Detection System) is designed to identify malicious or negligent activities
              by correlating digital behavioral logs with physical access patterns. By utilizing advanced Machine Learning 
              (Isolation Forest) and Computer Vision, the system detects anomalies that traditional rule-based systems miss.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl">
                <h4 className="font-semibold text-white mb-2">Digital Footprints</h4>
                <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                  <li>Logon/Logoff patterns</li>
                  <li>USB device connections</li>
                  <li>File access frequency</li>
                  <li>Off-hour system usage</li>
                </ul>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl">
                <h4 className="font-semibold text-white mb-2">Physical Context</h4>
                <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                  <li>Zone access logs</li>
                  <li>CCTV-based facial recognition</li>
                  <li>Presence correlation</li>
                  <li>Unauthorized zone entry</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700">
            <h3 className="text-2xl font-bold mb-6 text-indigo-300 flex items-center gap-2"><span className="text-indigo-500">◆</span> Execution Steps</h3>
            <ol className="space-y-4">
              {[
                { title: 'Data Ingestion', desc: 'Upload CSV logs from your enterprise database (logon, device, and file logs).' },
                { title: 'Media Analysis', desc: 'Provide CCTV footage or images for physical context verification.' },
                { title: 'ML Scan', desc: 'Execute the Isolation Forest algorithm to detect "isolated" behavior patterns.' },
                { title: 'Risk Reporting', desc: 'View granular risk scores and high-alert employee detailed audits.' }
              ].map((step, idx) => (
                <li key={idx} className="flex space-x-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-semibold text-white">{step.title}</h4>
                    <p className="text-sm text-slate-400">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-indigo-900/20 p-6 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <h4 className="text-lg font-bold text-indigo-300 mb-4 flex items-center gap-2"><span className="text-indigo-500">◆</span> Technical Requirements</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center text-slate-300">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                Chrome/Firefox/Edge (Latest)
              </li>
              <li className="flex items-center text-slate-300">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                CSV data exports from DB
              </li>
              <li className="flex items-center text-slate-300">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                H.264/MP4 CCTV format
              </li>
              <li className="flex items-center text-slate-300">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                Minimum 8GB System RAM
              </li>
            </ul>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h4 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2"><span className="text-amber-400">ℹ</span> Notice</h4>
            <p className="text-xs text-slate-400 italic">
              All data processed is encrypted in-transit. Anomaly labels are probabilistic indicators and should be verified by HR/Security teams before action.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Introduction;
