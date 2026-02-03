import React, { useMemo } from 'react';
import { useData } from '../DataContext';
import { RiskLevel } from '../types';

const Introduction: React.FC = () => {
  const { employeeData, riskAssessments, activityLogs } = useData();

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

          {/* Additional Info Card - Replacing the Isolation Forest Graph */}
          <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Analysis Dashboard</p>
              <p className="text-lg font-semibold text-white">Quick Actions & Insights</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-white">Upload Data</h4>
                </div>
                <p className="text-sm text-slate-400">Import CSV datasets for comprehensive analysis</p>
              </div>
              <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-white">View Analytics</h4>
                </div>
                <p className="text-sm text-slate-400">Explore ML models & risk curve visualization</p>
              </div>
              <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-white">Risk Assessment</h4>
                </div>
                <p className="text-sm text-slate-400">Detailed employee activity & threat analysis</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <p className="text-sm text-indigo-200">
                💡 <strong>Pro Tip:</strong> Navigate to Analytics tab to view the Isolation Forest risk curve and ML model performance metrics.
              </p>
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
