import React, { useMemo, useState } from 'react';
import { useData } from '../DataContext';
import { UnifiedSpyProfile } from '../types';
import { identifySpies, generateThreatReport } from '../utils/riskAnalysis';
import { AlertTriangle, Eye, Shield, TrendingUp, Download } from 'lucide-react';

const SpyDetection: React.FC = () => {
  const { employeeData } = useData();
  const [selectedSuspect, setSelectedSuspect] = useState<UnifiedSpyProfile | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  // Generate spy profiles
  const spyProfiles = useMemo(() => {
    if (employeeData.length === 0) return [];
    return identifySpies(employeeData);
  }, [employeeData]);

  // Filter by threat level
  const filteredProfiles = useMemo(() => {
    if (filterLevel === 'all') return spyProfiles;
    return spyProfiles.filter(p => p.suspiciousness === filterLevel);
  }, [spyProfiles, filterLevel]);

  // Generate threat report
  const threatReport = useMemo(() => {
    return generateThreatReport(spyProfiles);
  }, [spyProfiles]);

  const getSuspiciousnessColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-900 text-white';
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-orange-500 text-white';
      default: return 'bg-yellow-500 text-white';
    }
  };

  const getSuspiciousnessIcon = (level: string) => {
    switch (level) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      default: return '⚠️';
    }
  };

  const downloadReport = () => {
    const reportContent = threatReport.summary + '\n\n' + 
      spyProfiles.map(profile => {
        let text = `\n${'='.repeat(60)}\n`;
        text += `SUSPECT: ${profile.employee_name} (ID: ${profile.user})\n`;
        text += `Department: ${profile.department || 'Unknown'}\n`;
        text += `Spy Score: ${profile.spyScore}/100 [${profile.suspiciousness.toUpperCase()}]\n`;
        text += `Behavioral Risk: ${profile.csvRiskScore}/100\n`;
        text += `Access Control Risk: ${profile.accessRiskScore}/100\n`;
        text += `\nEVIDENCE:\n`;
        profile.evidence.forEach(e => text += `  ${e}\n`);
        text += `\nRECOMMENDATIONS:\n`;
        profile.recommendations.forEach(r => text += `  ${r}\n`);
        return text;
      }).join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(reportContent)}`);
    element.setAttribute('download', `spy-detection-report-${new Date().toISOString().slice(0, 10)}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Eye className="w-10 h-10 text-red-500" />
          Insider Threat Detection System
        </h1>
        <p className="text-slate-400">Combined CSV behavioral + CCTV access analysis</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <div className="text-red-400 text-sm font-semibold mb-2">🚨 CRITICAL</div>
          <div className="text-3xl font-bold text-red-300">{threatReport.criticalThreats.length}</div>
          <p className="text-slate-400 text-xs mt-1">Immediate action required</p>
        </div>
        
        <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4">
          <div className="text-orange-400 text-sm font-semibold mb-2">⚠️ HIGH RISK</div>
          <div className="text-3xl font-bold text-orange-300">{threatReport.highThreats.length}</div>
          <p className="text-slate-400 text-xs mt-1">Investigation recommended</p>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
          <div className="text-yellow-400 text-sm font-semibold mb-2">⚡ MEDIUM</div>
          <div className="text-3xl font-bold text-yellow-300">{threatReport.mediumThreats.length}</div>
          <p className="text-slate-400 text-xs mt-1">Monitoring required</p>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
          <div className="text-blue-400 text-sm font-semibold mb-2">📊 TOTAL SUSPECTS</div>
          <div className="text-3xl font-bold text-blue-300">{threatReport.totalSuspects}</div>
          <p className="text-slate-400 text-xs mt-1">of {employeeData.length} employees</p>
        </div>
      </div>

      {/* Filter & Export */}
      <div className="flex gap-4 mb-6">
        <div className="flex gap-2">
          {['all', 'critical', 'high', 'medium'].map(level => (
            <button
              key={level}
              onClick={() => setFilterLevel(level as any)}
              className={`px-4 py-2 rounded font-semibold transition ${
                filterLevel === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {level.toUpperCase()}
            </button>
          ))}
        </div>
        
        <button
          onClick={downloadReport}
          className="ml-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      {/* No suspects message */}
      {filteredProfiles.length === 0 && (
        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-6 text-center">
          <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-300 mb-2">All Clear</h3>
          <p className="text-green-200">No threats detected in current dataset</p>
        </div>
      )}

      {/* Suspects List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredProfiles.map(suspect => {
          const isUnauthorized = suspect.unauthorizedAccessCount > 0;
          return (
          <div
            key={suspect.user}
            onClick={() => setSelectedSuspect(selectedSuspect?.user === suspect.user ? null : suspect)}
            className={`p-4 rounded-lg border-2 transition cursor-pointer ${
              isUnauthorized 
                ? 'border-red-500 bg-red-950/30 ring-2 ring-red-500/50 animate-pulse-slow'
                : selectedSuspect?.user === suspect.user
                ? 'border-blue-500 bg-blue-950/30'
                : `border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800/70`
            }`}
          >
            {/* CRITICAL Banner for Unauthorized */}
            {isUnauthorized && (
              <div className="bg-red-600 text-white px-3 py-1 rounded-t-lg -mx-4 -mt-4 mb-3 text-center font-bold text-sm">
                🚨 CRITICAL: UNAUTHORIZED ACCESS DETECTED
              </div>
            )}
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 rounded text-sm font-bold ${getSuspiciousnessColor(suspect.suspiciousness)}`}>
                    {getSuspiciousnessIcon(suspect.suspiciousness)} {suspect.suspiciousness.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{suspect.employee_name}</h3>
                <p className="text-slate-400 text-sm">ID: {suspect.user} • {suspect.department || 'Unknown'}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-400">{suspect.spyScore}</div>
                <p className="text-xs text-slate-400">Spy Score</p>
              </div>
            </div>

            {/* Risk Breakdown */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div className="bg-slate-700/50 p-2 rounded">
                <p className="text-slate-400 text-xs">Behavioral Risk</p>
                <p className="text-yellow-300 font-bold">{suspect.csvRiskScore}/100</p>
              </div>
              <div className="bg-slate-700/50 p-2 rounded">
                <p className="text-slate-400 text-xs">Access Risk</p>
                <p className="text-orange-300 font-bold">{suspect.accessRiskScore}/100</p>
              </div>
            </div>

            {/* Unauthorized Access Badge */}
            {suspect.unauthorizedAccessCount > 0 && (
              <div className="bg-red-900/60 border-2 border-red-500 rounded px-3 py-2 mb-3 text-sm font-bold text-red-200 flex items-center gap-2 animate-pulse">
                <span className="text-lg">🚨</span>
                <span>{suspect.unauthorizedAccessCount} UNAUTHORIZED ACCESS EVENT(S)</span>
                <span className="ml-auto bg-red-600 text-white px-2 py-1 rounded text-xs">ACTION REQUIRED</span>
              </div>
            )}

            {/* Quick Evidence Summary */}
            {!selectedSuspect || selectedSuspect.user !== suspect.user ? (
              <div className="text-xs text-slate-400">
                {suspect.evidence.slice(0, 2).map((e, i) => (
                  <div key={i} className="truncate">{e}</div>
                ))}
                {suspect.evidence.length > 2 && (
                  <div className="text-blue-400 mt-1">+{suspect.evidence.length - 2} more evidence</div>
                )}
              </div>
            ) : null}
          </div>
          );
        })}
      </div>

      {/* Detailed View */}
      {selectedSuspect && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedSuspect.employee_name}</h2>
                <p className="text-slate-400">ID: {selectedSuspect.user} • Department: {selectedSuspect.department || 'Unknown'}</p>
              </div>
              <button
                onClick={() => setSelectedSuspect(null)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Risk Scores */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800 p-4 rounded border border-slate-700">
                <p className="text-slate-400 text-sm mb-2">Overall Risk Score</p>
                <p className="text-3xl font-bold text-red-400">{selectedSuspect.overallRiskScore}</p>
              </div>
              <div className="bg-slate-800 p-4 rounded border border-slate-700">
                <p className="text-slate-400 text-sm mb-2">Behavioral Risk</p>
                <p className="text-3xl font-bold text-yellow-400">{selectedSuspect.csvRiskScore}</p>
              </div>
              <div className="bg-slate-800 p-4 rounded border border-slate-700">
                <p className="text-slate-400 text-sm mb-2">Access Risk</p>
                <p className="text-3xl font-bold text-orange-400">{selectedSuspect.accessRiskScore}</p>
              </div>
            </div>

            {/* Evidence */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Evidence & Red Flags
              </h3>
              <div className="space-y-2">
                {selectedSuspect.evidence.map((item, idx) => (
                  <div key={idx} className="bg-slate-800 p-3 rounded border-l-4 border-red-500 text-slate-200 text-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Unauthorized Access Details */}
            {selectedSuspect.unauthorizedAccessTimes.length > 0 && (
              <div className="mb-6 bg-red-900/20 border border-red-500 rounded p-4">
                <h3 className="font-bold text-red-300 mb-2">🚨 Unauthorized Access Events</h3>
                <div className="space-y-1 text-sm text-red-200">
                  {selectedSuspect.unauthorizedAccessTimes.map((time, idx) => (
                    <div key={idx}>• {time}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Actions Required
              </h3>
              <div className="space-y-2">
                {selectedSuspect.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-blue-900/20 p-3 rounded border-l-4 border-blue-500 text-blue-100 text-sm">
                    {rec}
                  </div>
                ))}
              </div>
            </div>

            {/* Behavioral Risk Factors */}
            {selectedSuspect.csvRiskFactors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-yellow-300 mb-3">CSV Behavioral Risk Factors</h3>
                <div className="space-y-1">
                  {selectedSuspect.csvRiskFactors.map((factor, idx) => (
                    <div key={idx} className="text-slate-300 text-sm">• {factor}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Access Risk Factors */}
            {selectedSuspect.accessRiskFactors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-orange-300 mb-3">CCTV Access Risk Factors</h3>
                <div className="space-y-1">
                  {selectedSuspect.accessRiskFactors.map((factor, idx) => (
                    <div key={idx} className="text-slate-300 text-sm">• {factor}</div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedSuspect(null)}
              className="w-full mt-6 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpyDetection;
