import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../DataContext';
import { AlertTriangle, Shield, Lock, Bell, Download, Camera, ZoneIcon } from 'lucide-react';
import { generateSpyProfile } from '../utils/riskAnalysis';

interface RestrictedZone {
  id: string;
  name: string;
  authorizedUsers: string[];
  securityLevel: 'critical' | 'high' | 'medium' | 'low';
}

interface AccessAlert {
  id: string;
  timestamp: string;
  personName: string;
  personId?: string;
  zone: string;
  status: 'granted' | 'denied' | 'suspicious';
  confidence: number;
  riskScore: number;
  details: string;
}

const CCTVMonitoring: React.FC = () => {
  const { employeeData } = useData();
  const [videoStream, setVideoStream] = useState<string>('');
  const [detectedPerson, setDetectedPerson] = useState<any>(null);
  const [currentZone, setCurrentZone] = useState<RestrictedZone | null>(null);
  const [accessAlerts, setAccessAlerts] = useState<AccessAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AccessAlert | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [criticalThreats, setCriticalThreats] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Restricted zones configuration
  const restrictedZones: RestrictedZone[] = [
    {
      id: 'zone_1',
      name: '🔴 CEO Executive Suite',
      authorizedUsers: ['AAE0190', 'AAF0535'],
      securityLevel: 'critical'
    },
    {
      id: 'zone_2',
      name: '🔐 Financial Records Vault',
      authorizedUsers: ['ABC0174', 'AAE0190'],
      securityLevel: 'high'
    },
    {
      id: 'zone_3',
      name: '🟠 Server Room',
      authorizedUsers: ['LOW0001', 'AAE0190'],
      securityLevel: 'high'
    },
    {
      id: 'zone_4',
      name: '🟡 R&D Lab',
      authorizedUsers: ['AAF0535', 'ABC0174'],
      securityLevel: 'medium'
    }
  ];

  // Simulate face detection and zone access
  useEffect(() => {
    const simulateAccess = () => {
      const randomZone = restrictedZones[Math.floor(Math.random() * restrictedZones.length)];
      const randomEmployee = employeeData[Math.floor(Math.random() * employeeData.length)];

      if (randomEmployee) {
        const isAuthorized = randomZone.authorizedUsers.includes(randomEmployee.user);
        const riskScore = randomEmployee.risk_score || 50;
        
        // Determine access status
        let status: 'granted' | 'denied' | 'suspicious' = 'granted';
        let confidence = 0.85 + Math.random() * 0.15;

        if (!isAuthorized) {
          status = riskScore > 70 ? 'suspicious' : 'denied';
          confidence = 0.4 + Math.random() * 0.4; // Lower confidence for unauthorized
        }

        setDetectedPerson({
          name: randomEmployee.employee_name || randomEmployee.user,
          id: randomEmployee.user,
          department: randomEmployee.department,
          riskScore: riskScore,
          confidence: confidence
        });
        setCurrentZone(randomZone);

        // Create alert
        const alert: AccessAlert = {
          id: `alert_${Date.now()}`,
          timestamp: new Date().toISOString(),
          personName: randomEmployee.employee_name || randomEmployee.user,
          personId: randomEmployee.user,
          zone: randomZone.name,
          status: status,
          confidence: confidence,
          riskScore: riskScore,
          details: `${status === 'granted' ? '✅ GRANTED' : status === 'denied' ? '🚫 DENIED' : '⚠️ SUSPICIOUS'}: ${randomEmployee.employee_name} attempted access to ${randomZone.name}`
        };

        setAccessAlerts(prev => [alert, ...prev].slice(0, 20));

        // Update critical threats if high risk and unauthorized
        if (status !== 'granted' && riskScore > 60) {
          const profile = generateSpyProfile(randomEmployee, null, []);
          setCriticalThreats(prev => {
            const exists = prev.find(t => t.user === randomEmployee.user);
            if (exists) return prev;
            return [profile, ...prev].slice(0, 10);
          });
        }
      }
    };

    const interval = setInterval(simulateAccess, 3000); // Simulate every 3 seconds
    return () => clearInterval(interval);
  }, [employeeData, restrictedZones]);

  const getAlertColor = (status: string) => {
    switch (status) {
      case 'granted':
        return 'border-green-500 bg-green-900/20';
      case 'denied':
        return 'border-red-500 bg-red-900/20';
      case 'suspicious':
        return 'border-orange-500 bg-orange-900/20';
      default:
        return 'border-slate-500 bg-slate-800';
    }
  };

  const getAlertTextColor = (status: string) => {
    switch (status) {
      case 'granted':
        return 'text-green-300';
      case 'denied':
        return 'text-red-300';
      case 'suspicious':
        return 'text-orange-300';
      default:
        return 'text-slate-300';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-600 text-white';
    if (score >= 60) return 'bg-orange-600 text-white';
    if (score >= 40) return 'bg-yellow-600 text-white';
    return 'bg-green-600 text-white';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 80) return '🚨 CRITICAL';
    if (score >= 60) return '⚠️ HIGH';
    if (score >= 40) return '⚡ MEDIUM';
    return '✅ LOW';
  };

  const downloadPDFReport = (alert: AccessAlert) => {
    const employee = employeeData.find(e => e.user === alert.personId);
    if (!employee) return;

    const profile = generateSpyProfile(employee, null, []);

    const reportContent = `
╔════════════════════════════════════════════════════════════════╗
║                  UNAUTHORIZED ACCESS REPORT                   ║
║                 REAL-TIME CCTV MONITORING ALERT              ║
╚════════════════════════════════════════════════════════════════╝

INCIDENT DETAILS
────────────────────────────────────────────────────────────────
Report ID:        ${alert.id}
Timestamp:        ${new Date(alert.timestamp).toLocaleString()}
Alert Status:     ${alert.status.toUpperCase()}
Confidence:       ${(alert.confidence * 100).toFixed(1)}%

PERSON IDENTIFIED
────────────────────────────────────────────────────────────────
Name:             ${alert.personName}
Employee ID:      ${alert.personId}
Department:       ${employee.department || 'Unknown'}
Job Title:        ${employee.job_title || 'Not Available'}

RESTRICTED ZONE ACCESS
────────────────────────────────────────────────────────────────
Zone:             ${alert.zone}
Security Level:   ${alert.zone.includes('Critical') ? 'CRITICAL' : alert.zone.includes('Financial') ? 'HIGH' : 'MEDIUM'}
Access Grant:     ${alert.status === 'granted' ? 'AUTHORIZED' : 'UNAUTHORIZED'}

RISK ASSESSMENT
────────────────────────────────────────────────────────────────
CSV Risk Score:         ${profile.csvRiskScore}/100
Access Control Risk:    ${profile.accessRiskScore}/100
Overall Risk Score:     ${alert.riskScore}/100
Spy Score:             ${profile.spyScore}/100
Threat Level:          ${profile.suspiciousness.toUpperCase()}

BEHAVIORAL ANALYSIS
────────────────────────────────────────────────────────────────
Login Count:            ${employee.login_count}
Night Logins:           ${employee.night_logins}
USB Connections:        ${employee.usb_count}
File Operations:        ${employee.file_activity_count}
External Emails:        ${employee.external_mails || 0}
ML Anomaly Flag:        ${employee.anomaly_label === -1 ? 'YES ⚠️' : 'NO'}

EVIDENCE & RED FLAGS
────────────────────────────────────────────────────────────────
${profile.evidence.slice(0, 5).map((e, i) => `${i + 1}. ${e}`).join('\n')}

RECOMMENDATIONS
────────────────────────────────────────────────────────────────
${profile.recommendations.slice(0, 4).map((r, i) => `${i + 1}. ${r}`).join('\n')}

ACTION ITEMS FOR COMPANY OWNER
────────────────────────────────────────────────────────────────
${alert.status === 'denied' ? '1. ⛔ BLOCK ALL ACCESS CREDENTIALS\n2. 📋 Preserve all digital evidence\n3. 📞 Contact Legal & HR immediately\n4. 🔒 Secure employee workstation' : alert.status === 'suspicious' ? '1. ⚠️ ESCALATE TO SECURITY TEAM\n2. 📊 Monitor all future access attempts\n3. 🔍 Review recent activities\n4. 📧 Notify department manager' : '1. ✅ Access Granted - Normal Operation\n2. 📝 Log entry for audit trail\n3. 👁️ Maintain baseline monitoring'}

VERDICT
────────────────────────────────────────────────────────────────
Is this person a SPY/INSIDER THREAT?
Decision: ${profile.isSuspect ? '🚨 YES - HIGH CONFIDENCE' : '✅ NO - LOW RISK'}
Confidence: ${profile.spyScore}%
Status: ${profile.suspiciousness.toUpperCase()}

This individual presents ${profile.suspiciousness === 'critical' ? 'an IMMEDIATE and CRITICAL threat' : profile.suspiciousness === 'high' ? 'a significant threat requiring urgent investigation' : profile.suspiciousness === 'medium' ? 'elevated risk requiring monitoring' : 'normal risk levels'}.

SECURITY PROTOCOL
────────────────────────────────────────────────────────────────
If CRITICAL or HIGH: Immediate action required within 1 hour
If MEDIUM: Investigation within 24 hours
If LOW: Standard baseline monitoring

Report Generated: ${new Date().toLocaleString()}
System: AI-Based Insider Threat Detection (SPi)
────────────────────────────────────────────────────────────────
`;

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(reportContent)}`);
    element.setAttribute('download', `CCTV_Alert_${alert.personId}_${new Date().getTime()}.txt`);
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
          <Camera className="w-10 h-10 text-blue-500" />
          Real-Time CCTV Access Control
        </h1>
        <p className="text-slate-400">Restricted Zone Monitoring with Face Recognition</p>
      </div>

      {/* Live Detection Feed */}
      {detectedPerson && currentZone && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Current Detection */}
          <div className="lg:col-span-2 bg-slate-800 border-2 border-blue-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-400" />
              Live Face Detection
            </h2>
            
            <div className="bg-black rounded-lg p-4 mb-4 h-64 flex items-center justify-center border-2 border-slate-700">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-5xl">👤</span>
                </div>
                <p className="text-blue-300 font-semibold">Scanning Face...</p>
                <p className="text-slate-500 text-sm">Confidence: {(detectedPerson.confidence * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* Detection Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/50 p-3 rounded">
                <p className="text-slate-400 text-sm">Person Detected</p>
                <p className="text-white font-bold">{detectedPerson.name}</p>
              </div>
              <div className="bg-slate-700/50 p-3 rounded">
                <p className="text-slate-400 text-sm">Employee ID</p>
                <p className="text-white font-bold">{detectedPerson.id}</p>
              </div>
              <div className="bg-slate-700/50 p-3 rounded">
                <p className="text-slate-400 text-sm">Department</p>
                <p className="text-white font-bold">{detectedPerson.department || 'N/A'}</p>
              </div>
              <div className="bg-slate-700/50 p-3 rounded">
                <p className="text-slate-400 text-sm">Current Risk</p>
                <p className={`font-bold ${getRiskColor(detectedPerson.riskScore)}`}>
                  {getRiskLabel(detectedPerson.riskScore)}
                </p>
              </div>
            </div>
          </div>

          {/* Current Zone */}
          <div className="bg-slate-800 border-2 border-yellow-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-yellow-400" />
              Restricted Zone
            </h2>

            <div className="space-y-4">
              <div className="bg-slate-700/50 p-4 rounded border-2 border-yellow-500">
                <p className="text-yellow-300 font-bold text-lg">{currentZone.name}</p>
                <p className="text-slate-400 text-sm mt-2">Security Level</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded font-bold ${
                  currentZone.securityLevel === 'critical' ? 'bg-red-600 text-white' :
                  currentZone.securityLevel === 'high' ? 'bg-orange-600 text-white' :
                  'bg-yellow-600 text-white'
                }`}>
                  {currentZone.securityLevel.toUpperCase()}
                </span>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-2">Authorized Users</p>
                <div className="space-y-1">
                  {currentZone.authorizedUsers.map(userId => {
                    const emp = employeeData.find(e => e.user === userId);
                    const isMatch = detectedPerson.id === userId;
                    return (
                      <div key={userId} className={`p-2 rounded text-sm ${isMatch ? 'bg-green-900/30 text-green-300' : 'bg-slate-700 text-slate-300'}`}>
                        {isMatch ? '✅' : '⭕'} {emp?.employee_name || userId}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Access Decision */}
              <div className={`p-4 rounded border-l-4 ${
                currentZone.authorizedUsers.includes(detectedPerson.id)
                  ? 'border-green-500 bg-green-900/20'
                  : 'border-red-500 bg-red-900/20'
              }`}>
                <p className={currentZone.authorizedUsers.includes(detectedPerson.id) ? 'text-green-300' : 'text-red-300'}>
                  {currentZone.authorizedUsers.includes(detectedPerson.id)
                    ? '✅ ACCESS GRANTED'
                    : '🚫 ACCESS DENIED'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zone Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
        {restrictedZones.map(zone => (
          <div
            key={zone.id}
            className={`p-4 rounded-lg border-2 text-center cursor-pointer transition ${
              currentZone?.id === zone.id
                ? 'border-blue-500 bg-blue-900/20'
                : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
            }`}
            onClick={() => setCurrentZone(zone)}
          >
            <p className="font-bold text-white">{zone.name.split(' ')[0]}</p>
            <p className="text-xs text-slate-400">{zone.name.slice(4)}</p>
            <span className={`inline-block mt-2 px-2 py-1 text-xs rounded font-bold ${
              zone.securityLevel === 'critical' ? 'bg-red-600' :
              zone.securityLevel === 'high' ? 'bg-orange-600' :
              'bg-yellow-600'
            } text-white`}>
              {zone.securityLevel.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Critical Threats Alert */}
      {criticalThreats.length > 0 && (
        <div className="bg-red-900/20 border-l-4 border-red-500 p-4 mb-8 rounded">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-bold text-red-300">🚨 CRITICAL THREATS DETECTED</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criticalThreats.slice(0, 4).map(threat => (
              <div key={threat.user} className="bg-slate-800 p-3 rounded border border-red-500">
                <p className="font-bold text-white">{threat.employee_name}</p>
                <p className="text-sm text-slate-400">ID: {threat.user}</p>
                <p className="text-red-300 font-bold mt-1">SPY SCORE: {threat.spyScore}/100</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Access Alerts Timeline */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Bell className="w-6 h-6 text-yellow-400" />
          Access Alerts Timeline
        </h2>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {accessAlerts.map((alert, idx) => (
            <div
              key={alert.id}
              onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
              className={`p-4 rounded border-l-4 cursor-pointer transition ${getAlertColor(alert.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`font-bold ${getAlertTextColor(alert.status)}`}>
                    {alert.details}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-slate-300 mt-2">{alert.zone}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded text-sm font-bold ${getRiskColor(alert.riskScore)}`}>
                    {alert.riskScore.toFixed(0)}/100
                  </span>
                  <p className="text-xs text-slate-400 mt-1">{(alert.confidence * 100).toFixed(0)}% confidence</p>
                </div>
              </div>

              {/* Expanded Alert Details */}
              {selectedAlert?.id === alert.id && (
                <div className="mt-4 pt-4 border-t border-slate-600 space-y-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPDFReport(alert);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    Download Full Report (TXT)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Risk Management Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 font-bold mb-2">🚨 CRITICAL</p>
          <p className="text-2xl font-bold text-red-300">
            {accessAlerts.filter(a => a.status === 'suspicious' && a.riskScore >= 80).length}
          </p>
          <p className="text-xs text-slate-400">Unauthorized + High Risk</p>
        </div>

        <div className="bg-orange-900/20 border border-orange-500 rounded-lg p-4">
          <p className="text-orange-400 font-bold mb-2">⚠️ HIGH RISK</p>
          <p className="text-2xl font-bold text-orange-300">
            {accessAlerts.filter(a => a.riskScore >= 60 && a.riskScore < 80).length}
          </p>
          <p className="text-xs text-slate-400">Elevated Risk Zone Access</p>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
          <p className="text-yellow-400 font-bold mb-2">⚡ MEDIUM</p>
          <p className="text-2xl font-bold text-yellow-300">
            {accessAlerts.filter(a => a.riskScore >= 40 && a.riskScore < 60).length}
          </p>
          <p className="text-xs text-slate-400">Monitoring Required</p>
        </div>

        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
          <p className="text-green-400 font-bold mb-2">✅ LOW RISK</p>
          <p className="text-2xl font-bold text-green-300">
            {accessAlerts.filter(a => a.status === 'granted').length}
          </p>
          <p className="text-xs text-slate-400">Authorized Access</p>
        </div>
      </div>
    </div>
  );
};

export default CCTVMonitoring;
