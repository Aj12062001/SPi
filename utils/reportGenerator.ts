import React from 'react';
import { EmployeeRisk } from '../types';
import { UnifiedSpyProfile } from '../types';

/**
 * Generate a comprehensive PDF-style report for unauthorized access incidents
 */
export const generateDetailedAccessReport = (
  employee: EmployeeRisk,
  spyProfile: UnifiedSpyProfile,
  accessZone: string,
  timestamp: string,
  accessStatus: 'granted' | 'denied' | 'suspicious',
  confidence: number
): string => {
  const reportHeader = `
╔════════════════════════════════════════════════════════════════════════════╗
║                    UNAUTHORIZED ACCESS INCIDENT REPORT                     ║
║                     REAL-TIME CCTV MONITORING SYSTEM                      ║
║                    AI-Based Insider Threat Detection (SPi)                 ║
╚════════════════════════════════════════════════════════════════════════════╝

CONFIDENTIAL - FOR AUTHORIZED PERSONNEL ONLY

Report Generated: ${new Date().toLocaleString()}
────────────────────────────────────────────────────────────────────────────

1. INCIDENT SUMMARY
════════════════════════════════════════════════════════════════════════════
Report Date/Time:          ${new Date(timestamp).toLocaleString()}
Incident Type:             ${accessStatus === 'denied' ? 'DENIED ACCESS' : accessStatus === 'suspicious' ? 'SUSPICIOUS ACCESS' : 'GRANTED ACCESS'}
Severity Level:            ${spyProfile.suspiciousness === 'critical' ? '🚨 CRITICAL' : spyProfile.suspiciousness === 'high' ? '⚠️ HIGH' : spyProfile.suspiciousness === 'medium' ? '⚡ MEDIUM' : '✅ LOW'}
Face Recognition Confidence: ${(confidence * 100).toFixed(1)}%


2. PERSON IDENTIFICATION
════════════════════════════════════════════════════════════════════════════
Name:                      ${employee.employee_name || 'Unknown'}
Employee ID:               ${employee.user}
Department:                ${employee.department || 'Not Available'}
Job Title:                 ${employee.job_title || 'Not Specified'}
Hire Date:                 ${employee.date || 'Not Available'}
Current Employment Status:  Active


3. RESTRICTED ZONE ACCESS
════════════════════════════════════════════════════════════════════════════
Zone Accessed:             ${accessZone}
Access Grant Status:       ${accessStatus === 'granted' ? '✅ AUTHORIZED' : '🚫 UNAUTHORIZED'}
Authorization Level:       ${accessZone.includes('Critical') ? 'LEVEL 1 - CRITICAL' : accessZone.includes('Financial') ? 'LEVEL 2 - HIGH' : 'LEVEL 3 - MEDIUM'}
Time Spent in Zone:        Real-time monitoring
Security Protocol:         ${accessStatus === 'denied' ? 'BLOCKED - Alert sent to security' : 'MONITORING - Active surveillance'}


4. BEHAVIORAL RISK ASSESSMENT
════════════════════════════════════════════════════════════════════════════
CSV Behavioral Risk Score:  ${spyProfile.csvRiskScore}/100
CCTV Access Risk Score:     ${spyProfile.accessRiskScore}/100
Combined Risk Score:        ${spyProfile.overallRiskScore}/100
Spy Score (Insider Threat): ${spyProfile.spyScore}/100

Risk Classification:       ${spyProfile.suspiciousness.toUpperCase()}
Threat Status:             ${spyProfile.isSuspect ? '🚨 CONFIRMED THREAT' : '✅ LOW RISK'}
Investigation Priority:    ${spyProfile.suspiciousness === 'critical' ? '1 - IMMEDIATE' : spyProfile.suspiciousness === 'high' ? '2 - URGENT' : spyProfile.suspiciousness === 'medium' ? '3 - HIGH' : '4 - STANDARD'}


5. BEHAVIORAL PATTERN ANALYSIS
════════════════════════════════════════════════════════════════════════════
Total Login Count:         ${employee.login_count}
Night-Time Logins:         ${employee.night_logins}
Unusual Access Frequency:  ${employee.login_count > 500 ? 'YES - ELEVATED' : 'Normal'}

USB Device Connections:    ${employee.usb_count}
USB Risk Assessment:       ${employee.usb_count > 20 ? 'HIGH - Potential data exfiltration' : 'Normal'}

File Operations:           ${employee.file_activity_count}
Files Deleted:             ${employee.file_deleted || 0}
Files Downloaded:          ${employee.file_downloaded || 0}
File Transfer Risk:        ${employee.file_activity_count > 500 ? 'CRITICAL - Investigate immediately' : 'Normal'}

External Email Communication: ${employee.external_mails || 0}
Email Recipient Count:     Elevated - Review distribution lists

Machine Learning Anomaly:  ${employee.anomaly_label === -1 ? '🚩 FLAGGED AS ANOMALOUS' : 'Normal behavior'}


6. EVIDENCE & RED FLAGS
════════════════════════════════════════════════════════════════════════════
${spyProfile.evidence.map((evidence, idx) => `${idx + 1}. ${evidence}`).join('\n')}


7. RISK FACTORS IDENTIFIED (CSV Data)
════════════════════════════════════════════════════════════════════════════
${spyProfile.csvRiskFactors.length > 0 
  ? spyProfile.csvRiskFactors.map((factor, idx) => `${idx + 1}. 🟥 ${factor}`).join('\n')
  : 'No significant behavioral risk factors detected'}


8. ACCESS CONTROL VIOLATIONS (CCTV Data)
════════════════════════════════════════════════════════════════════════════
${spyProfile.accessRiskFactors.length > 0 
  ? spyProfile.accessRiskFactors.map((factor, idx) => `${idx + 1}. 🚨 ${factor}`).join('\n')
  : 'No access control violations detected'}

Unauthorized Access Count: ${spyProfile.unauthorizedAccessCount}
${spyProfile.unauthorizedAccessTimes.length > 0 
  ? `Access Timestamps:\n${spyProfile.unauthorizedAccessTimes.map(t => `  • ${t}`).join('\n')}`
  : 'No unauthorized access attempts recorded'}


9. INSIDER THREAT ASSESSMENT
════════════════════════════════════════════════════════════════════════════
Is this person a SPY/INSIDER THREAT?

Determination:             ${spyProfile.isSuspect ? '🚨 YES - CONFIRMED' : '✅ NO - LOW RISK'}
Confidence Level:          ${spyProfile.spyScore}%
Threat Profile:            ${spyProfile.suspiciousness.toUpperCase()}

Analysis Summary:
${spyProfile.suspiciousness === 'critical' 
  ? 'This individual presents an IMMEDIATE and CRITICAL THREAT to company security.\nConvergent evidence from behavioral analysis AND physical access violations indicates\nhigh-confidence insider threat indicators.'
  : spyProfile.suspiciousness === 'high'
  ? 'This individual shows SIGNIFICANT THREAT indicators. Both behavioral patterns and\naccess control violations suggest potential insider threat activity requiring investigation.'
  : spyProfile.suspiciousness === 'medium'
  ? 'This individual shows ELEVATED RISK requiring increased monitoring and management\nreview. Some behavioral patterns warrant investigation.'
  : 'This individual presents NORMAL RISK LEVELS with no significant threat indicators detected.'}


10. IMMEDIATE ACTION ITEMS FOR COMPANY OWNER
════════════════════════════════════════════════════════════════════════════

Priority Actions:
${accessStatus === 'denied' || spyProfile.suspiciousness === 'critical'
  ? `1. ⛔ IMMEDIATE (Within 1 Hour):
   - Revoke all system credentials and access badges
   - Disable network access and system logins
   - Secure and confiscate workstation
   - Contact Legal and HR departments
   - Preserve all digital evidence

2. URGENT (Within 24 Hours):
   - Formal investigation initiation
   - Interview department supervisor
   - Review complete file access history
   - Analyze email communications
   - Assess potential data breach scope

3. FOLLOW-UP (Within 1 Week):
   - Forensic analysis of digital footprint
   - Witness statement collection
   - Determination of affected data/systems
   - HR disciplinary proceedings
   - Post-incident security audit`
  : spyProfile.suspiciousness === 'high'
  ? `1. URGENT (Within 24 Hours):
   - Escalate to security and compliance teams
   - Increase monitoring on all systems
   - Schedule management meeting
   - Review recent access and activities
   - Document all incidents

2. HIGH PRIORITY (Within 1 Week):
   - Formal investigation opening
   - Behavioral assessment interview
   - System and network monitoring
   - Email pattern analysis`
  : `1. RECOMMENDED (Within 1 Week):
   - Schedule routine review meeting
   - Increase monitoring frequency
   - User awareness training
   - Access control verification
   - Quarterly reassessment`
}


11. DETAILED RECOMMENDATIONS
════════════════════════════════════════════════════════════════════════════
${spyProfile.recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n')}


12. COMPLIANCE & DOCUMENTATION
════════════════════════════════════════════════════════════════════════════
Evidence Preservation:
✓ CCTV footage preserved (Real-time monitoring)
✓ Access logs secured
✓ Face recognition data retained
✓ Behavioral analysis documented
✓ Risk scores calculated and timestamped

Documentation Completed:
✓ Real-time incident report generated
✓ Evidence aggregation complete
✓ Risk assessment finalized
✓ Recommendations formulated
✓ Company owner notification sent

Audit Trail:
✓ All system accesses logged
✓ Face recognition matches documented
✓ Risk calculations traceable
✓ Timeline of events recorded
✓ Investigator notes available


13. SYSTEM & METHODOLOGY
════════════════════════════════════════════════════════════════════════════
System Name:               SPi (AI-Based Insider Threat Detection)
Detection Method:          Combined CSV + CCTV Analysis
Risk Calculation:          Behavioral (60%) + Access Control (40%)
Convergent Evidence:       Applied when both systems flag same individual
Face Recognition:          Real-time matching with <70% confidence threshold
Machine Learning:          Isolation Forest for behavioral anomalies

Accuracy Notes:
- Spy scores are probabilistic, not deterministic
- Recommendations should be reviewed by security professionals
- Human judgment essential for final determination
- Legal and HR guidance required for disciplinary action


14. VERIFICATION & APPROVAL
════════════════════════════════════════════════════════════════════════════
Report Generated By:       SPi Automated System
Generation Timestamp:      ${new Date().toISOString()}
Report Version:            1.0
System Version:            v2.0 (Production)

For Questions or Concerns:
Contact: Security Operations Center (SOC)
Escalation: Company Chief Information Security Officer (CISO)

────────────────────────────────────────────────────────────────────────────
END OF REPORT

This is a confidential internal security document. Unauthorized distribution
is prohibited. Report is for immediate action by authorized personnel only.
────────────────────────────────────────────────────────────────────────────
`;

  return reportHeader;
};

/**
 * Generate Excel-compatible report data
 */
export const generateReportData = (
  employee: EmployeeRisk,
  spyProfile: UnifiedSpyProfile,
  accessZone: string,
  timestamp: string,
  accessStatus: string,
  confidence: number
) => {
  return {
    timestamp,
    employeeName: employee.employee_name || employee.user,
    employeeId: employee.user,
    department: employee.department,
    zone: accessZone,
    accessStatus,
    confidence: (confidence * 100).toFixed(1),
    csvRiskScore: spyProfile.csvRiskScore,
    accessRiskScore: spyProfile.accessRiskScore,
    spyScore: spyProfile.spyScore,
    suspiciousness: spyProfile.suspiciousness,
    isSuspect: spyProfile.isSuspect,
    loginCount: employee.login_count,
    nightLogins: employee.night_logins,
    usbCount: employee.usb_count,
    fileActivity: employee.file_activity_count,
    externalEmails: employee.external_mails || 0,
    anomalyFlag: employee.anomaly_label === -1 ? 'YES' : 'NO'
  };
};

/**
 * Component to display report preview
 */
interface ReportPreviewProps {
  report: string;
  onClose: () => void;
  onDownload: () => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({ report, onClose, onDownload }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">📋 Incident Report Preview</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 font-mono text-sm text-slate-300">
          <pre className="whitespace-pre-wrap break-words">{report}</pre>
        </div>

        <div className="flex gap-3 p-4 border-t border-slate-700">
          <button
            onClick={onDownload}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
          >
            💾 Download as TXT
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;
