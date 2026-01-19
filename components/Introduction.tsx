
import React from 'react';

const Introduction: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <section className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
          <h3 className="text-2xl font-bold mb-4 text-indigo-400">System Overview</h3>
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

        <section className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
          <h3 className="text-2xl font-bold mb-4">Execution Steps</h3>
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
        <div className="bg-indigo-900/20 p-6 rounded-2xl border border-indigo-500/30">
          <h4 className="text-lg font-bold text-indigo-400 mb-4">Technical Requirements</h4>
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
          <h4 className="text-lg font-bold text-white mb-2">Notice</h4>
          <p className="text-xs text-slate-400 italic">
            All data processed is encrypted in-transit. Anomaly labels are probabilistic indicators and should be verified by HR/Security teams before action.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Introduction;
