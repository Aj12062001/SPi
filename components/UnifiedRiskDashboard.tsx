import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../DataContext';
import { EmployeeRisk, RiskLevel, ActivityLog } from '../types';
import ActivityTimeline from './ActivityTimeline';
import ActivityVisualization from './ActivityVisualization';
import { Download, FileText, Send, Share2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface SpecialAuthorizedAssignment {
  placeholder: 'emp1' | 'emp2';
  authorizedUserId: string;
  authorizedName: string;
  authorizedGender: 'M' | 'F' | 'U';
  highRiskUserId: string;
  highRiskName: string;
  highRiskGender: 'M' | 'F' | 'U';
}

const SPECIAL_ASSIGNMENTS_STORAGE_KEY = 'spi_special_authorized_assignments';

const FEMALE_NAME_HINTS = new Set([
  'mary', 'patricia', 'jennifer', 'linda', 'barbara', 'elizabeth', 'susan', 'jessica',
  'sarah', 'karen', 'nancy', 'lisa', 'betty', 'sandra', 'ashley', 'kimberly',
  'anna', 'emily', 'maria', 'chandra'
]);

const inferGender = (employee: EmployeeRisk): 'M' | 'F' | 'U' => {
  const direct = (employee.gender || '').trim().toUpperCase();
  if (direct.startsWith('M')) return 'M';
  if (direct.startsWith('F')) return 'F';

  const firstName = (employee.employee_name || '').trim().split(/\s+/)[0]?.toLowerCase() || '';
  if (FEMALE_NAME_HINTS.has(firstName)) return 'F';
  if (firstName) return 'M';
  return 'U';
};

export const UnifiedRiskDashboard: React.FC = () => {
  const { employeeData, riskAssessments, activityLogs, getRiskTrend, getUserActivityStats } = useData();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'details' | 'activity'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'id' | 'name' | 'department' | 'job'>('all');
  const [alertRecipientEmail, setAlertRecipientEmail] = useState(() => {
    try {
      const currentUserRaw = localStorage.getItem('spi_current_user');
      if (currentUserRaw) {
        const currentUser = JSON.parse(currentUserRaw);
        const loginEmail = (currentUser?.email || '').trim();
        if (loginEmail) return loginEmail;
      }
      const saved = localStorage.getItem('spi_alert_recipient_email');
      if (saved && saved.trim()) return saved.trim();
      return '';
    } catch {
      return '';
    }
  });
  const [alertSenderEmail, setAlertSenderEmail] = useState(() => {
    try {
      const currentUserRaw = localStorage.getItem('spi_current_user');
      if (currentUserRaw) {
        const currentUser = JSON.parse(currentUserRaw);
        const loginEmail = (currentUser?.email || '').trim();
        if (loginEmail) return loginEmail;
      }
      const saved = localStorage.getItem('spi_alert_sender_email');
      if (saved && saved.trim()) return saved.trim();
      return '';
    } catch {
      return '';
    }
  });
  const [emailStatus, setEmailStatus] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const autoSendInFlightRef = useRef(false);
  const lastAutoBatchKeyRef = useRef('');
  const [sentEmailAlertSignatures, setSentEmailAlertSignatures] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('spi_email_alert_signatures');
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const viteEnv = (import.meta as { env?: Record<string, string | undefined> }).env || {};
  const FACE_API_URL = viteEnv.VITE_BACKEND_URL || 'http://localhost:8000';
  const [specialAssignments] = useState<Record<string, SpecialAuthorizedAssignment>>(() => {
    try {
      const raw = localStorage.getItem(SPECIAL_ASSIGNMENTS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      return parsed as Record<string, SpecialAuthorizedAssignment>;
    } catch {
      return {};
    }
  });

  // Show loading state while data is being processed
  if (employeeData.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <div className="text-center space-y-2">
          <p className="text-lg font-bold text-white">Generating Risk Assessments</p>
          <p className="text-sm text-slate-400">Processing {riskAssessments.size} employees...</p>
        </div>
      </div>
    );
  }

  // Helper to map score to risk band
  const getScoreBand = (score: number): 'critical' | 'high' | 'medium' | 'low' => {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  };
  // Risk counts
  const riskCounts = useMemo(() => {
    let critical = 0, high = 0, medium = 0, low = 0;

    if (riskAssessments.size === 0) {
      console.warn('⚠️ No risk assessments available');
    } else {
      console.log('📊 Risk Assessments Map size:', riskAssessments.size);
    }

    riskAssessments.forEach((assessment) => {
      const score = Number(assessment?.overallRiskScore ?? 0);
      const band = getScoreBand(score);

      if (band === 'critical') {
        critical++;
      } else if (band === 'high') {
        high++;
      } else if (band === 'medium') {
        medium++;
      } else if (band === 'low') {
        low++;
      }
    });

    const counts = { critical, high, medium, low, total: employeeData.length };
    console.log('✅ Risk Counts:', counts);

    return counts;
  }, [riskAssessments, employeeData.length]);
  // Filtered employees based on selected risk and search
  const filteredEmployees = useMemo(() => {
    return (employeeData as EmployeeRisk[]).map(emp => ({
      ...emp,
      assessment: riskAssessments.get(emp.user)
    })).filter(emp => {
      // Risk filter
      let matchesRisk = true;
      if (selectedRiskFilter === 'high') matchesRisk = emp.assessment?.riskLevel === RiskLevel.HIGH;
      else if (selectedRiskFilter === 'medium') matchesRisk = emp.assessment?.riskLevel === RiskLevel.MEDIUM;
      else if (selectedRiskFilter === 'low') matchesRisk = emp.assessment?.riskLevel === RiskLevel.LOW;

      // Search filter
      let matchesSearch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (searchField === 'all') {
          matchesSearch =
            (emp.user?.toLowerCase().includes(query)) ||
            (emp.user_id?.toLowerCase().includes(query)) ||
            (emp.employee_name?.toLowerCase().includes(query)) ||
            (emp.department?.toLowerCase().includes(query)) ||
            (emp.job_title?.toLowerCase().includes(query));
        } else if (searchField === 'id') {
          matchesSearch =
            (emp.user?.toLowerCase().includes(query)) ||
            (emp.user_id?.toLowerCase().includes(query));
        } else if (searchField === 'name') {
          matchesSearch = emp.employee_name?.toLowerCase().includes(query) || false;
        } else if (searchField === 'department') {
          matchesSearch = emp.department?.toLowerCase().includes(query) || false;
        } else if (searchField === 'job') {
          matchesSearch = emp.job_title?.toLowerCase().includes(query) || false;
        }
      }

      return matchesRisk && matchesSearch;
    }).sort((a, b) => (b.assessment?.overallRiskScore || 0) - (a.assessment?.overallRiskScore || 0));
  }, [employeeData, riskAssessments, selectedRiskFilter, searchQuery, searchField]);

  // Risk distribution
  const riskDistribution = useMemo(() => {
    return [
      { name: 'CRITICAL', value: riskCounts.critical, color: '#ef4444' },
      { name: 'HIGH', value: riskCounts.high, color: '#f59e0b' },
      { name: 'MEDIUM', value: riskCounts.medium, color: '#fbbf24' },
      { name: 'LOW', value: riskCounts.low, color: '#10b981' }
    ];
  }, [riskCounts]);
  // ...existing code...

  const topElevatedEmployees = useMemo(() => {
    return [...employeeData]
      .map(emp => ({
        ...emp,
        computedRisk: riskAssessments.get(emp.user)?.overallRiskScore || emp.risk_score || 0,
      }))
      .sort((a, b) => b.computedRisk - a.computedRisk)
      .slice(0, 10)
      .map(emp => ({
        name: emp.user,
        risk: Number(emp.computedRisk.toFixed(1)),
        sensitive: emp.sensitive_files_accessed || 0,
      }));
  }, [employeeData, riskAssessments]);

  const selectedUserData = selectedUser ? employeeData.find(e => e.user === selectedUser) : null;
  const selectedUserAssessment = selectedUser ? riskAssessments.get(selectedUser) : null;

  const specialAssignmentList = useMemo(() => {
    return (Object.values(specialAssignments) as SpecialAuthorizedAssignment[])
      .sort((a, b) => a.placeholder.localeCompare(b.placeholder));
  }, [specialAssignments]);

  const specialRiskNarratives = useMemo(() => {
    return specialAssignmentList
      .map((assignment) => {
        const highRiskEmployee = employeeData.find(emp => emp.user === assignment.highRiskUserId);
        if (!highRiskEmployee) return null;

        const gender = inferGender(highRiskEmployee);
        const subject = gender === 'F' ? 'She' : 'He';
        const score = Math.max(85, Math.round(highRiskEmployee.risk_score || 0));

        return {
          placeholder: assignment.placeholder,
          message: `${assignment.placeholder.toUpperCase()} authorized mapping applied. ${subject} accessed sensitive data. ${highRiskEmployee.employee_name || highRiskEmployee.user} (${highRiskEmployee.user}) is flagged HIGH RISK with score ${score}.`,
          details: {
            employeeId: highRiskEmployee.user,
            employeeName: highRiskEmployee.employee_name || highRiskEmployee.user,
            department: highRiskEmployee.department || '-',
            jobTitle: highRiskEmployee.job_title || '-',
            riskScore: score,
            gender,
          }
        };
      })
      .filter(Boolean) as Array<{
        placeholder: 'emp1' | 'emp2';
        message: string;
        details: {
          employeeId: string;
          employeeName: string;
          department: string;
          jobTitle: string;
          riskScore: number;
          gender: 'M' | 'F' | 'U';
        };
      }>;
  }, [specialAssignmentList, employeeData]);

  const operationToActivityType = (operation?: string): ActivityLog['activityType'] => {
    switch ((operation || '').toLowerCase()) {
      case 'open':
        return 'file_opened';
      case 'delete':
        return 'file_deleted';
      case 'copy':
        return 'file_copied';
      case 'download':
        return 'file_downloaded';
      case 'upload':
        return 'file_uploaded';
      case 'edit':
        return 'file_edited';
      default:
        return 'file_accessed';
    }
  };

  const buildDetailedActivities = (employee: EmployeeRisk, limit = 80): ActivityLog[] => {
    try {
      if (!employee.file_operations_detail) return [];
      const parsed = JSON.parse(employee.file_operations_detail);
      if (!Array.isArray(parsed)) return [];

      return parsed.slice(0, limit).map((op: any, index: number) => {
        const operation = String(op?.operation || '').toLowerCase();
        const highRiskOperation = operation === 'delete' || operation === 'download' || operation === 'copy';
        const isAnomalous = Boolean(op?.is_sensitive) || highRiskOperation || (employee.risk_score || 0) >= 75;

        return {
          id: `${employee.user}_detail_${index}`,
          userId: employee.user,
          timestamp: op?.timestamp ? new Date(op.timestamp).toISOString() : new Date().toISOString(),
          activityType: operationToActivityType(operation),
          severity: isAnomalous ? ((employee.risk_score || 0) >= 85 ? 'critical' : 'high') : 'low',
          isAnomalous,
          details: {
            fileName: op?.file_name,
            fileSize: op?.file_size,
            system: op?.system,
            isSensitive: Boolean(op?.is_sensitive),
            operation,
            databaseName: employee.primary_database,
            queryCount: employee.database_query_count,
          },
          duration: Math.max(10, Math.round((employee.session_duration_avg || 1) * 60)),
        };
      });
    } catch {
      return [];
    }
  };

  // Generate activities on-demand for selected user if none exist
  const selectedUserActivities = useMemo(() => {
    if (!selectedUser) return [];

    const existingActivities = activityLogs.filter(log => log.userId === selectedUser);

    // If no activities exist (large dataset mode), build from uploaded operation details first
    if (existingActivities.length === 0 && selectedUserData) {
      const built = buildDetailedActivities(selectedUserData);
      if (built.length > 0) {
        return built.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    }

    return existingActivities;
  }, [selectedUser, activityLogs, selectedUserData]);

  // Department risk summary
  const deptRiskSummary = useMemo(() => {
    const summary: Record<string, { total: number; critical: number; high: number; medium: number; avgRisk: number }> = {};

    employeeData.forEach(emp => {
      const dept = emp.department || 'Unknown';
      const assessment = riskAssessments.get(emp.user);
      const isHigh = assessment?.riskLevel === RiskLevel.HIGH;
      const isMedium = assessment?.riskLevel === RiskLevel.MEDIUM;
      const score = assessment?.overallRiskScore || emp.risk_score || 0;
      const isCritical = score >= 80;

      if (!summary[dept]) {
        summary[dept] = { total: 0, critical: 0, high: 0, medium: 0, avgRisk: 0 };
      }
      summary[dept].total++;
      if (isCritical) summary[dept].critical++;
      if (isHigh) summary[dept].high++;
      if (isMedium) summary[dept].medium++;
      summary[dept].avgRisk += assessment?.overallRiskScore || 0;
    });

    return Object.entries(summary)
      .map(([name, data]) => ({
        name,
        critical: data.critical,
        high: data.high,
        medium: data.medium,
        avgRisk: Math.round(data.avgRisk / data.total)
      }))
      .sort((a, b) => b.high + b.medium - a.high - a.medium);
  }, [employeeData, riskAssessments]);

  const getRiskLevelColor = (level: RiskLevel): string => {
    switch (level) {
      case RiskLevel.HIGH: return '#ef4444';
      case RiskLevel.MEDIUM: return '#f59e0b';
      case RiskLevel.LOW: return '#10b981';
      default: return '#6b7280';
    }
  };

  // PDF Export Functions
  const generatePDFContent = (title: string, employees: any[]) => {
    const timestamp = new Date().toLocaleString();
    let content = `
=================================================================
            SPi - INSIDER THREAT DETECTION SYSTEM
               ${title}
=================================================================
Generated: ${timestamp}
Total Records: ${employees.length}
-----------------------------------------------------------------

`;

    employees.forEach((emp, idx) => {
      const assessment = emp.assessment || riskAssessments.get(emp.user);
      content += `
${idx + 1}. EMPLOYEE PROFILE
-----------------------------------------------------------------
Employee ID:       ${emp.user || emp.user_id || 'N/A'}
Name:              ${emp.employee_name || 'N/A'}
Department:        ${emp.department || 'N/A'}
Job Title:         ${emp.job_title || 'N/A'}

RISK ASSESSMENT:
  Overall Risk Score:     ${assessment?.overallRiskScore?.toFixed(2) || 'N/A'} / 100
  Risk Level:             ${assessment?.riskLevel || 'N/A'}
  File Activity Risk:     ${assessment?.fileActivityRisk?.toFixed(2) || 'N/A'}
  USB Activity Risk:      ${assessment?.usbActivityRisk?.toFixed(2) || 'N/A'}
  Login Pattern Risk:     ${assessment?.loginPatternRisk?.toFixed(2) || 'N/A'}
  Email Activity Risk:    ${assessment?.emailActivityRisk?.toFixed(2) || 'N/A'}
  Behavioral Risk:        ${assessment?.behavioralRisk?.toFixed(2) || 'N/A'}

ACTIVITY METRICS:
  Login Count:       ${emp.login_count || 0}
  Night Logins:      ${emp.night_logins || 0}
  File Operations:   ${emp.file_activity_count || 0}
  USB Connections:   ${emp.usb_count || 0}
  External Emails:   ${emp.external_mails || 0}
  
PERSONALITY TRAITS (OCEAN):
  Openness:          ${emp.O?.toFixed(2) || 'N/A'}
  Conscientiousness: ${emp.C?.toFixed(2) || 'N/A'}
  Extraversion:      ${emp.E?.toFixed(2) || 'N/A'}
  Agreeableness:     ${emp.A?.toFixed(2) || 'N/A'}
  Neuroticism:       ${emp.N?.toFixed(2) || 'N/A'}

-----------------------------------------------------------------
`;
    });

    content += `
=================================================================
                    END OF REPORT
=================================================================
`;
    return content;
  };

  const downloadPDF = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAllEmployees = () => {
    const content = generatePDFContent('COMPLETE EMPLOYEE RISK REPORT', filteredEmployees);
    downloadPDF(`spi-all-employees-${new Date().toISOString().split('T')[0]}.txt`, content);
  };

  const exportHighRisk = () => {
    const highRiskEmployees = filteredEmployees.filter(
      emp => emp.assessment?.riskLevel === RiskLevel.HIGH
    );
    const content = generatePDFContent('HIGH RISK EMPLOYEES REPORT', highRiskEmployees);
    downloadPDF(`spi-high-risk-${new Date().toISOString().split('T')[0]}.txt`, content);
  };

  const exportMediumRisk = () => {
    const mediumRiskEmployees = filteredEmployees.filter(
      emp => emp.assessment?.riskLevel === RiskLevel.MEDIUM
    );
    const content = generatePDFContent('MEDIUM RISK EMPLOYEES REPORT', mediumRiskEmployees);
    downloadPDF(`spi-medium-risk-${new Date().toISOString().split('T')[0]}.txt`, content);
  };

  const exportLowRisk = () => {
    const lowRiskEmployees = filteredEmployees.filter(
      emp => emp.assessment?.riskLevel === RiskLevel.LOW
    );
    const content = generatePDFContent('LOW RISK EMPLOYEES REPORT', lowRiskEmployees);
    downloadPDF(`spi-low-risk-${new Date().toISOString().split('T')[0]}.txt`, content);
  };

  const exportIndividualEmployee = (employee: any) => {
    const content = generatePDFContent(`INDIVIDUAL EMPLOYEE REPORT - ${employee.employee_name || employee.user}`, [employee]);
    downloadPDF(`spi-employee-${employee.user}-${new Date().toISOString().split('T')[0]}.txt`, content);
  };

  const elevatedRiskEntries = useMemo(() => {
    return employeeData
      .map(emp => {
        const score = Number(riskAssessments.get(emp.user)?.overallRiskScore ?? emp.risk_score ?? 0);
        let riskLevel: 'HIGH' | 'CRITICAL' | null = null;
        if (score >= 80) riskLevel = 'CRITICAL';
        else if (score >= 60) riskLevel = 'HIGH';
        if (!riskLevel) return null;

        return {
          employeeId: emp.user || emp.user_id || 'UNKNOWN',
          name: emp.employee_name || emp.user || emp.user_id || 'Unknown',
          riskScore: score,
          riskLevel,
          status: riskLevel.toLowerCase()
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.riskScore - a.riskScore);
  }, [employeeData, riskAssessments]);

  const buildAlertSignature = (entry: any) => (
    `${entry.employeeId}:${entry.riskLevel}:${Number(entry.riskScore).toFixed(2)}`
  );

  const getEmailErrorMessage = (payload: any, fallback: string) => {
    const detail = payload?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail.trim();
    }
    if (detail && typeof detail === 'object') {
      if (typeof detail.message === 'string' && detail.message.trim()) {
        return detail.message.trim();
      }
      if (typeof detail.reason === 'string' && detail.reason.trim()) {
        return detail.reason.trim();
      }
    }
    return fallback;
  };

  const buildGmailAlertBody = (entries: any[]) => {
    const generatedAt = new Date().toLocaleString();
    const lines = [
      'SPi High/Critical Risk Alert',
      `Generated: ${generatedAt}`,
      `Total Elevated Employees: ${entries.length}`,
      '',
      'Employee Details:'
    ];

    entries.forEach((entry: any, index: number) => {
      lines.push(
        `${index + 1}. ${entry.name || entry.employee_name || 'Unknown'} | ID: ${entry.employeeId || entry.user || 'UNKNOWN'} | Risk: ${Number(entry.riskScore || entry.risk_score || 0).toFixed(2)} | Level: ${entry.riskLevel || 'HIGH'}`
      );
    });

    lines.push('', 'Please review and take immediate action for HIGH/CRITICAL risk employees.');
    return lines.join('\n');
  };

  const sendRiskAssessmentEmail = async (entries: any[], isAutomatic = false) => {
    if (!alertSenderEmail.trim()) {
      setEmailStatus('❌ Enter sender (from) email.');
      return;
    }

    if (!alertRecipientEmail.trim()) {
      setEmailStatus('❌ Enter recipient email to send alerts.');
      return;
    }

    if (entries.length === 0) {
      setEmailStatus('ℹ️ No HIGH/CRITICAL employees available for alerting.');
      return;
    }

    setIsSendingEmail(true);
    setEmailStatus(isAutomatic ? '🔄 Auto-sending email alert...' : '🔄 Sending risk assessment email...');

    try {
      const response = await fetch(`${FACE_API_URL}/api/v1/alerts/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_email: alertSenderEmail.trim(),
          recipient_email: alertRecipientEmail.trim(),
          alerts: entries.map((entry: any) => ({
            employee_id: entry.employeeId || entry.user || 'UNKNOWN',
            employee_name: entry.name || entry.employee_name || entry.employeeId || entry.user,
            risk_score: Number(entry.riskScore || entry.risk_score || 85),
            risk_level: entry.riskLevel || 'HIGH',
            status: entry.status || 'elevated',
            detection_count: 1
          }))
        })
      });



      const signatures = entries.map(buildAlertSignature);
      setSentEmailAlertSignatures(prev => {
        const merged = Array.from(new Set([...prev, ...signatures]));
        localStorage.setItem('spi_email_alert_signatures', JSON.stringify(merged));
        return merged;
      });

      setEmailStatus(
        `✅ Email alert sent to ${alertRecipientEmail.trim()} for ${entries.length} employee(s).`
      );
    } catch {
      setEmailStatus('❌ Email failed: backend not reachable.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const shareRiskDetailsViaGmail = (entries: any[]) => {
    if (!alertRecipientEmail.trim()) {
      setEmailStatus('❌ Enter recipient email to share via Gmail.');
      return;
    }

    if (entries.length === 0) {
      setEmailStatus('ℹ️ No HIGH/CRITICAL employees available to share.');
      return;
    }

    const reportEmployees = entries.map((entry: any) => ({
      user: entry.employeeId || entry.user || 'UNKNOWN',
      user_id: entry.employeeId || entry.user || 'UNKNOWN',
      employee_name: entry.name || entry.employee_name || entry.employeeId || entry.user || 'Unknown',
      department: 'N/A',
      job_title: 'N/A',
      assessment: {
        overallRiskScore: Number(entry.riskScore || entry.risk_score || 0),
        riskLevel: entry.riskLevel || 'HIGH',
        fileActivityRisk: 0,
        usbActivityRisk: 0,
        loginPatternRisk: 0,
        emailActivityRisk: 0,
        behavioralRisk: 0
      }
    }));

    const reportContent = generatePDFContent('HIGH/CRITICAL RISK EMAIL SHARE REPORT', reportEmployees);
    downloadPDF(`spi-high-critical-share-${new Date().toISOString().split('T')[0]}.txt`, reportContent);

    const subject = 'SPi Alert: High/Critical Risk Employee Details';
    const body = buildGmailAlertBody(entries);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(alertRecipientEmail.trim())}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    setEmailStatus('✅ Gmail compose opened. Alert report file downloaded; attach it in Gmail and click Send.');
  };

  useEffect(() => {
    if (!alertSenderEmail.trim() || !alertRecipientEmail.trim() || isSendingEmail || autoSendInFlightRef.current) {
      return;
    }

    const unsentEntries = elevatedRiskEntries.filter((entry: any) => (
      !sentEmailAlertSignatures.includes(buildAlertSignature(entry))
    ));

    if (unsentEntries.length === 0) {
      lastAutoBatchKeyRef.current = '';
      return;
    }

    const batchKey = unsentEntries.map(buildAlertSignature).join('|');
    if (batchKey === lastAutoBatchKeyRef.current) {
      return;
    }

    lastAutoBatchKeyRef.current = batchKey;
    autoSendInFlightRef.current = true;

    sendRiskAssessmentEmail(unsentEntries, true).finally(() => {
      autoSendInFlightRef.current = false;
    });
  }, [alertSenderEmail, alertRecipientEmail, elevatedRiskEntries, sentEmailAlertSignatures, isSendingEmail]);

  return (
    <div className="space-y-8 pb-8">
      {/* KPI Cards - Clickable Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Employees */}
        <button
          onClick={() => setSelectedRiskFilter('all')}
          className={`group relative overflow-hidden p-8 rounded-2xl border-2 transition-all duration-300 ${selectedRiskFilter === 'all'
            ? 'bg-indigo-600/30 border-indigo-500 shadow-lg shadow-indigo-500/30'
            : 'bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-600/20 hover:shadow-lg hover:shadow-indigo-500/20'
            }`}
        >
          <div className="relative z-10">
            <p className="text-sm font-semibold text-indigo-300 uppercase tracking-widest">Total Employees</p>
            <p className="text-5xl font-black text-white mt-3">{riskCounts.total.toLocaleString()}</p>
            <p className="text-xs text-indigo-200 mt-2">Monitored & Analyzed</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* High Risk */}
        <button
          onClick={() => setSelectedRiskFilter('high')}
          className={`group relative overflow-hidden p-8 rounded-2xl border-2 transition-all duration-300 ${selectedRiskFilter === 'high'
            ? 'bg-red-600/30 border-red-500 shadow-lg shadow-red-500/30'
            : 'bg-red-500/10 border-red-500/30 hover:border-red-500 hover:bg-red-600/20 hover:shadow-lg hover:shadow-red-500/20'
            }`}
        >
          <div className="relative z-10">
            <p className="text-sm font-semibold text-red-300 uppercase tracking-widest">🔴 High Risk</p>
            <p className="text-5xl font-black text-red-400 mt-3">{riskCounts.high}</p>
            <p className="text-xs text-red-200 mt-2">Requires Investigation</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Medium Risk */}
        <button
          onClick={() => setSelectedRiskFilter('medium')}
          className={`group relative overflow-hidden p-8 rounded-2xl border-2 transition-all duration-300 ${selectedRiskFilter === 'medium'
            ? 'bg-amber-600/30 border-amber-500 shadow-lg shadow-amber-500/30'
            : 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500 hover:bg-amber-600/20 hover:shadow-lg hover:shadow-amber-500/20'
            }`}
        >
          <div className="relative z-10">
            <p className="text-sm font-semibold text-amber-300 uppercase tracking-widest">🟡 Medium Risk</p>
            <p className="text-5xl font-black text-amber-400 mt-3">{riskCounts.medium}</p>
            <p className="text-xs text-amber-200 mt-2">Monitor Closely</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Low Risk */}
        <button
          onClick={() => setSelectedRiskFilter('low')}
          className={`group relative overflow-hidden p-8 rounded-2xl border-2 transition-all duration-300 ${selectedRiskFilter === 'low'
            ? 'bg-emerald-600/30 border-emerald-500 shadow-lg shadow-emerald-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-600/20 hover:shadow-lg hover:shadow-emerald-500/20'
            }`}
        >
          <div className="relative z-10">
            <p className="text-sm font-semibold text-emerald-300 uppercase tracking-widest">🟢 Low Risk</p>
            <p className="text-5xl font-black text-emerald-400 mt-3">{riskCounts.low}</p>
            <p className="text-xs text-emerald-200 mt-2">Baseline Compliance</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* Export Section */}
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText size={24} />
              Export Risk Reports
            </h3>
            <p className="text-slate-400 text-sm mt-1">Download detailed risk assessment reports</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={exportAllEmployees}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-indigo-500/20"
          >
            <Download size={18} />
            All Employees ({riskCounts.total})
          </button>
          <button
            onClick={exportHighRisk}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-red-500/20"
          >
            <Download size={18} />
            High Risk ({riskCounts.high})
          </button>
          <button
            onClick={exportMediumRisk}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-amber-500/20"
          >
            <Download size={18} />
            Medium Risk ({riskCounts.medium})
          </button>
          <button
            onClick={exportLowRisk}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-emerald-500/20"
          >
            <Download size={18} />
            Low Risk ({riskCounts.low})
          </button>
        </div>
      </div>

      {/* Email Alert Section */}
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-2">📧 Automated Email Alerts</h3>
        <p className="text-slate-400 text-sm mb-4">
          Alerts auto-send for new HIGH (60-79.99) and CRITICAL (80+) risk scores. Current elevated entries: {elevatedRiskEntries.length}
        </p>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="email"
            value={alertSenderEmail}
            onChange={(e) => {
              const value = e.target.value;
              setAlertSenderEmail(value);
              localStorage.setItem('spi_alert_sender_email', value);
            }}
            placeholder="Enter sender email (from)"
            className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="email"
            value={alertRecipientEmail}
            onChange={(e) => {
              const value = e.target.value;
              setAlertRecipientEmail(value);
              localStorage.setItem('spi_alert_recipient_email', value);
            }}
            placeholder="Enter recipient email (e.g. admin@company.com)"
            className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <button
            onClick={() => shareRiskDetailsViaGmail(elevatedRiskEntries)}
            disabled={!alertRecipientEmail.trim() || elevatedRiskEntries.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold"
            title="Open Gmail compose with high/critical details and download a share report"
          >
            <Share2 size={18} />
            Share via Gmail
          </button>
        </div>
        {emailStatus && (
          <p className={`mt-3 text-sm ${emailStatus.includes('✅') ? 'text-green-300' : emailStatus.includes('🔄') ? 'text-blue-300' : emailStatus.includes('ℹ️') ? 'text-slate-300' : 'text-red-300'}`}>
            {emailStatus}
          </p>
        )}
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 bg-slate-900/50 p-2 rounded-xl border border-slate-800 w-fit">
        {[
          { id: 'overview', label: '📊 Overview', icon: '📊' },
          { id: 'details', label: '👥 Employee Details', icon: '👥' },
          { id: 'activity', label: '📝 Activity Log', icon: '📝' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as any)}
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${viewMode === tab.id
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {viewMode === 'overview' && (
        <div className="space-y-8">
          {specialAssignmentList.length > 0 && (
            <div className="space-y-4">
              <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-700/40">
                <p className="text-sm text-emerald-200 font-semibold mb-2">EMP Mapping from Uploaded CSV Dataset</p>
                {specialAssignmentList.map((item) => {
                  const authorizedFromCsv = employeeData.find(emp => emp.user === item.authorizedUserId);
                  const highRiskFromCsv = employeeData.find(emp => emp.user === item.highRiskUserId);
                  return (
                    <div key={item.placeholder} className="text-sm text-emerald-100 mb-2">
                      <p>
                        {item.placeholder.toUpperCase()} → Authorized: {item.authorizedUserId} ({authorizedFromCsv?.employee_name || item.authorizedName}, {item.authorizedGender}) | High Risk {'>'}=80: {item.highRiskUserId} ({highRiskFromCsv?.employee_name || item.highRiskName}, {item.highRiskGender})
                      </p>
                      <p className="text-emerald-200/90">
                        Source: uploaded CSV | Authorized Dept: {authorizedFromCsv?.department || '-'} | Authorized Role: {authorizedFromCsv?.job_title || '-'} | High-Risk Dept: {highRiskFromCsv?.department || '-'} | High-Risk Role: {highRiskFromCsv?.job_title || '-'}
                      </p>
                    </div>
                  );
                })}
              </div>

              {specialRiskNarratives.length > 0 && (
                <div className="bg-red-900/20 p-4 rounded-xl border border-red-700/40">
                  <p className="text-sm text-red-200 font-semibold mb-2">High Risk Sensitive-Data Alerts</p>
                  {specialRiskNarratives.map((item) => (
                    <div key={item.placeholder} className="text-sm text-red-100 mb-2">
                      <p>{item.message}</p>
                      <p className="text-red-200/90">
                        Source: uploaded CSV | Details: ID {item.details.employeeId} | Name {item.details.employeeName} | Gender {item.details.gender} | Department {item.details.department} | Role {item.details.jobTitle} | Risk {item.details.riskScore}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Risk Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Risk Distribution Pie */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">Risk Level Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Elevated Employees */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">Top Elevated Employees</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topElevatedEmployees}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="risk" fill="#6366f1" name="Risk Score" />
                  <Bar dataKey="sensitive" fill="#ef4444" name="Sensitive Files" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Risk Analysis */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Risk by Department</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptRiskSummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="critical" fill="#d32f2f" name="Critical" />
                <Bar dataKey="high" fill="#f57c00" name="High" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Details Tab - Employee List with Filters */}
      {viewMode === 'details' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-6">
              {selectedRiskFilter === 'all' && 'All Employees'}
              {selectedRiskFilter === 'high' && `High Risk Employees (${filteredEmployees.length})`}
              {selectedRiskFilter === 'medium' && `Medium Risk Employees (${filteredEmployees.length})`}
              {selectedRiskFilter === 'low' && `Low Risk Employees (${filteredEmployees.length})`}
            </h3>

            {selectedUser && selectedUserData && selectedUserAssessment ? (
              <div className="mb-6 pb-6 border-b border-slate-700">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-white">{selectedUserData.employee_name || selectedUserData.user}</h4>
                    <p className="text-sm text-slate-400">{selectedUserData.user} | {selectedUserData.department || 'Unknown'} | {selectedUserData.job_title || 'N/A'}</p>
                  </div>
                  <span
                    className="px-4 py-2 rounded-full font-bold text-sm"
                    style={{
                      backgroundColor: getRiskLevelColor(selectedUserAssessment.riskLevel) + '30',
                      color: getRiskLevelColor(selectedUserAssessment.riskLevel)
                    }}
                  >
                    {selectedUserAssessment.riskLevel}
                  </span>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-slate-400 hover:text-white text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Risk Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Overall Risk Score</p>
                    <p className="text-2xl font-bold text-white mt-1">{selectedUserAssessment.overallRiskScore.toFixed(1)}</p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">File Activity Risk</p>
                    <p className="text-2xl font-bold text-orange-400 mt-1">{selectedUserAssessment.fileActivityRisk.toFixed(1)}</p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">USB Activity Risk</p>
                    <p className="text-2xl font-bold text-red-400 mt-1">{selectedUserAssessment.usbActivityRisk.toFixed(1)}</p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Email Activity Risk</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{selectedUserAssessment.emailActivityRisk.toFixed(1)}</p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Login Pattern Risk</p>
                    <p className="text-2xl font-bold text-purple-400 mt-1">{selectedUserAssessment.loginPatternRisk.toFixed(1)}</p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Behavioral Risk</p>
                    <p className="text-2xl font-bold text-cyan-400 mt-1">{selectedUserAssessment.behavioralRisk.toFixed(1)}</p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Session Duration</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">{(selectedUserData.session_duration_total || 0)} min</p>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Night Logins</p>
                    <p className="text-2xl font-bold text-yellow-400 mt-1">{selectedUserData.night_logins}</p>
                  </div>
                </div>

                {/* Comprehensive Activity Details */}
                <div className="grid grid-cols-1 gap-6 mb-6">
                  {/* File Operations - Full Width */}
                  <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
                    <h5 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Detailed File Operations (with Timestamps)
                    </h5>

                    {/* File Operations Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 pb-5 border-b border-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-xs">Opened:</span>
                        <span className="text-white font-semibold text-sm">{selectedUserData.file_opened || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-xs">Copied:</span>
                        <span className="text-white font-semibold text-sm">{selectedUserData.file_copied || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-xs">Deleted:</span>
                        <span className="text-red-400 font-semibold text-sm">{selectedUserData.file_deleted || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-xs">Downloaded:</span>
                        <span className="text-orange-400 font-semibold text-sm">{selectedUserData.file_downloaded || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-xs">Uploaded:</span>
                        <span className="text-white font-semibold text-sm">{selectedUserData.file_uploaded || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-xs">Edited:</span>
                        <span className="text-white font-semibold text-sm">{selectedUserData.file_edited || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-xs">Sensitive:</span>
                        <span className="text-red-400 font-bold text-sm">{selectedUserData.sensitive_files_accessed || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-xs">Unique Files:</span>
                        <span className="text-white font-semibold text-sm">{selectedUserData.unique_files_accessed || 0}</span>
                      </div>
                    </div>

                    {/* File Operations Details with Timestamps */}
                    {selectedUserData.file_operations_detail && (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        <p className="text-xs font-semibold text-slate-300 mb-3">📋 Recent File Operations (Last 20):</p>
                        {(() => {
                          try {
                            const ops = JSON.parse(selectedUserData.file_operations_detail);
                            if (!ops || ops.length === 0) return <p className="text-slate-500 text-xs">No operation details available</p>;

                            return ops.slice(0, 20).map((op: any, idx: number) => (
                              <div key={idx} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 text-xs hover:border-slate-600 transition-all">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-slate-100 font-mono text-xs truncate font-semibold">{op.file_name}</p>
                                  </div>
                                  {op.is_sensitive && (
                                    <span className="text-red-400 font-bold whitespace-nowrap">🔒 SENSITIVE</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${op.operation === 'delete' ? 'bg-red-500/20 text-red-300' :
                                    op.operation === 'download' ? 'bg-orange-500/20 text-orange-300' :
                                      op.operation === 'copy' ? 'bg-yellow-500/20 text-yellow-300' :
                                        op.operation === 'upload' ? 'bg-green-500/20 text-green-300' :
                                          'bg-blue-500/20 text-blue-300'
                                    }`}>
                                    {op.operation.toUpperCase()}
                                  </span>
                                  <span className="text-slate-400">@ {op.system}</span>
                                  <span className="text-slate-500">📅 {op.timestamp}</span>
                                </div>
                              </div>
                            ));
                          } catch (e) {
                            return <p className="text-slate-500 text-xs">Unable to parse operation details</p>;
                          }
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Secondary Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
                    <h5 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                      </svg>
                      Systems & Devices
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Unique PCs:</span>
                        <span className="text-white font-semibold">{selectedUserData.unique_pcs || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">USB Connections:</span>
                        <span className="text-white font-semibold">{selectedUserData.usb_connect || 0}</span>
                      </div>
                      <div className="pt-3 border-t border-slate-700">
                        <p className="text-slate-400 mb-2">Systems Accessed:</p>
                        <div className="flex flex-wrap gap-2">
                          {(selectedUserData.systems_accessed || '').split(',').filter(s => s).slice(0, 5).map((system, idx) => (
                            <span key={idx} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs">
                              {system}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Communication Activity */}
                  <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
                    <h5 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email & Web Activity
                    </h5>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Emails Sent:</span>
                        <span className="text-white font-semibold">{selectedUserData.emails_sent || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">External:</span>
                        <span className="text-orange-400 font-semibold">{selectedUserData.external_mails || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Attachments:</span>
                        <span className="text-white font-semibold">{selectedUserData.email_attachments || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">HTTP Requests:</span>
                        <span className="text-white font-semibold">{selectedUserData.http_requests || 0}</span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-slate-400">Unique URLs:</span>
                        <span className="text-white font-semibold">{selectedUserData.unique_urls || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Login Activity */}
                  <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
                    <h5 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Login Activity
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Logins:</span>
                        <span className="text-white font-semibold">{selectedUserData.login_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Night Logins:</span>
                        <span className="text-yellow-400 font-semibold">{selectedUserData.night_logins || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Duration:</span>
                        <span className="text-white font-semibold">{selectedUserData.session_duration_total || 0} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Session:</span>
                        <span className="text-white font-semibold">{(selectedUserData.session_duration_avg || 0).toFixed(1)} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Database Activity */}
                  <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
                    <h5 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7c0-2.21 3.58-4 8-4s8 1.79 8 4-3.58 4-8 4-8-1.79-8-4zm0 5c0 2.21 3.58 4 8 4s8-1.79 8-4m-16 5c0 2.21 3.58 4 8 4s8-1.79 8-4" />
                      </svg>
                      Database Session Analysis
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Primary DB:</span>
                        <span className="text-white font-semibold">{selectedUserData.primary_database || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">DB Session Duration:</span>
                        <span className="text-cyan-300 font-semibold">{selectedUserData.database_session_duration || 0} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">DB Query Count:</span>
                        <span className="text-white font-semibold">{selectedUserData.database_query_count || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">DB Read / Write:</span>
                        <span className="text-white font-semibold">{selectedUserData.database_read_ops || 0} / {selectedUserData.database_write_ops || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {selectedUserAssessment.recommendations.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg">
                    <h5 className="text-sm font-bold text-amber-300 mb-2">🎯 Recommendations</h5>
                    <ul className="space-y-1">
                      {selectedUserAssessment.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i} className="text-xs text-amber-200">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            {/* Employees Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">User ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">Job Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">Risk Score</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">Level</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">File Ops</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">Sensitive</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.slice(0, 20).map((emp, idx) => (
                    <tr
                      key={emp.user}
                      className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedUser(emp.user)}
                    >
                      <td className="py-3 px-4 text-slate-300 font-mono text-xs">{emp.user_id || emp.user}</td>
                      <td className="py-3 px-4 font-medium text-white">{emp.employee_name}</td>
                      <td className="py-3 px-4 text-slate-400">{emp.department || 'Unknown'}</td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{emp.job_title || 'N/A'}</td>
                      <td className="py-3 px-4 font-bold text-white">{emp.assessment?.overallRiskScore.toFixed(1)}</td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-1 rounded text-xs font-bold"
                          style={{
                            backgroundColor: getRiskLevelColor(emp.assessment?.riskLevel || RiskLevel.LOW) + '30',
                            color: getRiskLevelColor(emp.assessment?.riskLevel || RiskLevel.LOW)
                          }}
                        >
                          {emp.assessment?.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{emp.total_file_operations || 0}</td>
                      <td className="py-3 px-4">
                        {(emp.sensitive_files_accessed || 0) > 0 ? (
                          <span className="text-red-400 font-semibold">{emp.sensitive_files_accessed}</span>
                        ) : (
                          <span className="text-slate-600">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(emp.user);
                            }}
                            className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs"
                          >
                            View Details →
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              exportIndividualEmployee(emp);
                            }}
                            className="text-emerald-400 hover:text-emerald-300"
                            title="Export Employee Report"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No employees found in this category.
              </div>
            )}

            {filteredEmployees.length > 20 && (
              <div className="text-center mt-4 text-slate-400 text-sm">
                Showing 20 of {filteredEmployees.length} employees
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {viewMode === 'activity' && (
        <div className="space-y-6">
          {/* Search Section */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Search Employee Activity</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter employee ID, name, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <svg className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value as any)}
                  className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Fields</option>
                  <option value="id">Employee ID</option>
                  <option value="name">Name</option>
                  <option value="department">Department</option>
                  <option value="job">Job Title</option>
                </select>
                <button
                  onClick={() => {
                    if (filteredEmployees.length > 0) {
                      setSelectedUser(filteredEmployees[0].user);
                    }
                  }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/50"
                >
                  Search
                </button>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {searchQuery && (
              <div className="mt-3 text-sm text-slate-400">
                Found {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} matching "{searchQuery}"
              </div>
            )}
          </div>

          {/* Activity Display */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            {selectedUser ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6 pb-6 border-b border-slate-700">
                  <div>
                    <h3 className="text-lg font-bold text-white">Activity Log</h3>
                    <p className="text-sm text-slate-400 mt-1">{selectedUserData?.employee_name || selectedUser}</p>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-indigo-500/60 transition-all text-sm"
                  >
                    ← Change Employee
                  </button>
                </div>

                {/* Activity Visualization */}
                {selectedUserData && (
                  <div className="mb-8">
                    <ActivityVisualization employeeData={selectedUserData as EmployeeRisk} />
                  </div>
                )}

                {/* Activity Timeline with Search */}
                <div className="mt-8">
                  <h4 className="text-md font-bold text-white mb-4">Timeline Events</h4>
                  <ActivityTimeline activities={selectedUserActivities} showSearch={true} />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {filteredEmployees.length > 0 ? (
                  <>
                    <p className="text-slate-400 text-sm mb-4">Click on an employee below to view their activity log:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {filteredEmployees.slice(0, 30).map((emp) => (
                        <button
                          key={emp.user}
                          onClick={() => setSelectedUser(emp.user)}
                          className="text-left p-4 bg-slate-900 border border-slate-700 rounded-xl hover:border-indigo-500/70 hover:bg-slate-800/80 transition-all group"
                        >
                          <p className="text-white font-semibold group-hover:text-indigo-300 transition-colors">{emp.employee_name || emp.user}</p>
                          <p className="text-xs text-slate-400 mt-1">{emp.user_id || emp.user}</p>
                          <p className="text-xs text-slate-500 mt-1">{emp.department} • {emp.job_title}</p>
                          <div className="mt-2 flex gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${emp.risk_profile === 'high' ? 'bg-red-500/20 text-red-300' : emp.risk_profile === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                              {emp.risk_profile?.toUpperCase()}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {filteredEmployees.length > 30 && (
                      <p className="text-xs text-slate-500 text-center mt-4">Showing 30 of {filteredEmployees.length} employees</p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No employees match your search. Try different keywords.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedRiskDashboard;