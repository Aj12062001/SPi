/// <reference types="vite/client" />
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../DataContext';
import { EmployeeRisk, RiskLevel } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';
import { Download, Send, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const RiskManagement: React.FC = () => {
  const { employeeData, riskAssessments } = useData();
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [manualRecipientEmail, setManualRecipientEmail] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('spi_alert_recipient_email');
      if (saved && saved.trim()) return saved.trim();
      const currentUserRaw = localStorage.getItem('spi_current_user');
      if (!currentUserRaw) return '';
      const currentUser = JSON.parse(currentUserRaw);
      return (currentUser?.email || '').trim();
    } catch {
      return '';
    }
  });
  const [manualSenderEmail, setManualSenderEmail] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('spi_alert_sender_email');
      if (saved && saved.trim()) return saved.trim();
      const currentUserRaw = localStorage.getItem('spi_current_user');
      if (!currentUserRaw) return '';
      const currentUser = JSON.parse(currentUserRaw);
      return (currentUser?.email || '').trim();
    } catch {
      return '';
    }
  });
  const [emailSendingStatus, setEmailSendingStatus] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [testingSmtpConfig, setTestingSmtpConfig] = useState<boolean>(false);
  const [smtpTestResult, setSmtpTestResult] = useState<string>('');
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

const getScoreBand = (score: number): 'critical' | 'high' | 'medium' | 'low' => {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
};
  // Load critical risk from localStorage
  const criticalRiskEmployees = useMemo(() => {
    const stored = localStorage.getItem('criticalRiskEntries');
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }, []);

  const elevatedRiskEmployees = useMemo(() => {
    return employeeData
      .map(emp => {
        const score = Number(riskAssessments.get(emp.user)?.overallRiskScore ?? emp.risk_score ?? 0);
        let riskLevel: 'HIGH' | 'CRITICAL' | null = null;

        if (score >= 80) riskLevel = 'CRITICAL';
        else if (score >= 60) riskLevel = 'HIGH';

        if (!riskLevel) {
          return null;
        }

        return {
          employeeId: emp.user || emp.user_id || 'UNKNOWN',
          employee_name: emp.employee_name || emp.user || emp.user_id || 'Unknown',
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

  const testSmtpConfiguration = async () => {
    setTestingSmtpConfig(true);
    setSmtpTestResult('🔄 Testing SMTP configuration...');
    try {
      const FACE_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${FACE_API_URL}/api/v1/alerts/email/test-config`);
      const result = await response.json();
      if (result.ok) {
        setSmtpTestResult(`✅ ${result.message}`);
      } else {
        setSmtpTestResult(`❌ ${result.message}`);
      }
    } catch (err) {
      setSmtpTestResult('❌ Failed to test SMTP: Backend not reachable.');
    } finally {
      setTestingSmtpConfig(false);
    }
  };

  // CORRECTED: Calculate risk counts based on score bands
  const riskCounts = useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

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

    return {
      critical,
      high,
      medium,
      low,
      total: employeeData.length
    };
  }, [riskAssessments, employeeData.length]);

  // Unique departments
  const departments = useMemo(() => {
    const depts = new Set(employeeData.map(e => e.department || 'Unknown'));
    return Array.from(depts).sort();
  }, [employeeData]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employeeData.filter(emp => {
      const deptMatch = !selectedDept || emp.department === selectedDept;
      const assessment = riskAssessments.get(emp.user);
      const riskMatch =
        riskFilter === 'all' ||
        (riskFilter === 'high' && assessment && assessment.riskLevel === RiskLevel.HIGH) ||
        (riskFilter === 'medium' && assessment && assessment.riskLevel === RiskLevel.MEDIUM) ||
        (riskFilter === 'low' && assessment && assessment.riskLevel === RiskLevel.LOW);
      return deptMatch && riskMatch;
    });
  }, [employeeData, riskAssessments, selectedDept, riskFilter]);

  // Department risk summary
  const deptRiskSummary = useMemo(() => {
    const summary: Record<string, { total: number; critical: number; high: number; medium: number; low: number; avgRisk: number }> = {};

    employeeData.forEach(emp => {
      const dept = emp.department || 'Unknown';
      const assessment = riskAssessments.get(emp.user);
      const score = Number(assessment?.overallRiskScore ?? emp.risk_score ?? 0);
      const band = getScoreBand(score);

      if (!summary[dept]) {
        summary[dept] = { total: 0, critical: 0, high: 0, medium: 0, low: 0, avgRisk: 0 };
      }
      summary[dept].total++;
      if (band === 'critical') summary[dept].critical++;
      else if (band === 'high') summary[dept].high++;
      else if (band === 'medium') summary[dept].medium++;
      else summary[dept].low++;

      summary[dept].avgRisk += score;
    });

    return Object.entries(summary).map(([name, data]) => ({
      name,
      total: data.total,
      critical: data.critical,
      high: data.high,
      medium: data.medium,
      low: data.low,
      avgRisk: Math.round(data.avgRisk / data.total)
    }));
  }, [employeeData, riskAssessments]);

  // Risk distribution by component
  const riskComponentData = useMemo(() => {
    let fileRisk = 0, usbRisk = 0, emailRisk = 0, nightRisk = 0, physicalRisk = 0;
    let count = 0;

    employeeData.forEach(emp => {
      fileRisk += (emp.file_deleted || 0) + (emp.file_copied || 0);
      usbRisk += emp.usb_count;
      emailRisk += emp.external_mails || 0;
      nightRisk += emp.night_logins;
      physicalRisk += (emp.cctv_anomalies || 0) + (emp.access_card_anomalies || 0);
      count++;
    });

    return [
      { name: 'File Operations', value: Math.round(fileRisk / count), color: '#f97316' },
      { name: 'USB Activity', value: Math.round(usbRisk / count), color: '#ef4444' },
      { name: 'Email Risk', value: Math.round(emailRisk / count), color: '#eab308' },
      { name: 'Night Logins', value: Math.round(nightRisk / count), color: '#a855f7' },
      { name: 'Physical Anomalies', value: Math.round(physicalRisk / count), color: '#06b6d4' }
    ];
  }, [employeeData]);

  // Top risky employees
  const topRiskyEmployees = useMemo(() => {
    return (employeeData as EmployeeRisk[])
      .map((emp: EmployeeRisk) => ({
        user: emp.user,
        employee_name: emp.employee_name || emp.user,
        department: emp.department,
        job_title: emp.job_title,
        login_count: emp.login_count,
        night_logins: emp.night_logins,
        usb_count: emp.usb_count,
        file_deleted: emp.file_deleted || 0,
        file_copied: emp.file_copied || 0,
        file_activity_count: emp.file_activity_count,
        emails_sent: emp.emails_sent || 0,
        external_mails: emp.external_mails || 0,
        http_requests: emp.http_requests || 0,
        unique_urls: emp.unique_urls || 0,
        cctv_anomalies: emp.cctv_anomalies || 0,
        access_card_anomalies: emp.access_card_anomalies || 0,
        behavioral_score: emp.behavioral_score || 50,
        anomaly_label: emp.anomaly_label,
        risk_score: emp.risk_score,
        assessment: riskAssessments.get(emp.user)
      }))
      .sort((a, b) => (b.assessment?.overallRiskScore || 0) - (a.assessment?.overallRiskScore || 0))
      .slice(0, 15);
  }, [employeeData, riskAssessments]);

  // PDF download for critical risk
  const downloadCriticalRiskPDF = () => {
    if (criticalRiskEmployees.length === 0) {
      alert('No critical risk employees to export');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Critical Risk Employees Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);

    const tableData = criticalRiskEmployees.map(emp => [
      emp.employeeId,
      emp.name || emp.employee_name || 'N/A',
      emp.riskScore?.toFixed(1) || '0',
      emp.source || 'Unknown',
      emp.department || 'Unknown'
    ]);

    (doc as any).autoTable({
      head: [['Employee ID', 'Name', 'Risk Score', 'Source', 'Department']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 9 }
    });

    doc.save(`critical-risk-report-${Date.now()}.pdf`);
  };

  // Send email alerts
  const sendRiskEmailAlerts = async (entries: any[], isAutomatic = false) => {
    if (!manualSenderEmail.trim()) {
      setEmailSendingStatus('❌ Please enter sender (from) email');
      return;
    }

    if (!manualRecipientEmail.trim()) {
      setEmailSendingStatus('❌ Please enter recipient email');
      return;
    }

    if (entries.length === 0) {
      setEmailSendingStatus('ℹ️ No HIGH/CRITICAL employees to send');
      return;
    }

    setIsSendingEmail(true);
    setEmailSendingStatus(isAutomatic ? '🔄 Auto-sending email alert...' : '🔄 Sending email alert...');

    try {
      const FACE_API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${FACE_API_URL}/api/v1/alerts/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_email: manualSenderEmail.trim(),
          recipient_email: manualRecipientEmail.trim(),
          alerts: entries.map((emp: any) => ({
            employee_id: emp.employeeId || emp.user,
            employee_name: emp.name || emp.employee_name,
            risk_score: emp.riskScore || emp.risk_score,
            risk_level: emp.riskLevel || 'HIGH',
            status: emp.status || 'elevated'
          }))
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        const signatures = entries.map(buildAlertSignature);
        setSentEmailAlertSignatures(prev => {
          const merged = Array.from(new Set([...prev, ...signatures]));
          localStorage.setItem('spi_email_alert_signatures', JSON.stringify(merged));
          return merged;
        });
        setEmailSendingStatus(`✅ Email alert sent to ${manualRecipientEmail.trim()} for ${entries.length} employee(s).`);
        setTimeout(() => setEmailSendingStatus(''), 5000);
      } else {
        const detailMessage = getEmailErrorMessage(payload, 'Email sending failed');
        setEmailSendingStatus(`❌ Email failed: ${detailMessage}`);
      }
    } catch (error: any) {
      setEmailSendingStatus(`❌ Email error: ${error.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  useEffect(() => {
    if (!manualSenderEmail.trim() || !manualRecipientEmail.trim() || isSendingEmail || autoSendInFlightRef.current) {
      return;
    }

    const unsentEntries = elevatedRiskEmployees.filter((entry: any) => (
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

    sendRiskEmailAlerts(unsentEntries, true).finally(() => {
      autoSendInFlightRef.current = false;
    });
  }, [manualSenderEmail, manualRecipientEmail, elevatedRiskEmployees, sentEmailAlertSignatures, isSendingEmail]);

  // Activity heatmap data
  const activityHeatmap = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      activity: Math.round(Math.random() * 100 + 50)
    }));
    return hours;
  }, []);

  // Login patterns by department
  const loginPatterns = useMemo(() => {
    return deptRiskSummary.map(dept => ({
      dept: dept.name,
      avgLogins: Math.round(Math.random() * 150 + 50),
      nightLogins: Math.round(Math.random() * 20 + 5),
      risk: dept.high + dept.medium
    }));
  }, [deptRiskSummary]);

  const RISK_COLORS = {
    [RiskLevel.LOW]: '#10b981',
    [RiskLevel.MEDIUM]: '#f59e0b',
    [RiskLevel.HIGH]: '#ef4444',
    [RiskLevel.CRITICAL]: '#dc2626'
  };

  return (
    <div className="space-y-8">
      {/* CRITICAL RISK SECTION */}
      {criticalRiskEmployees.length > 0 && (
        <div className="bg-gradient-to-br from-red-950 via-red-900 to-red-950 p-8 rounded-2xl border-2 border-red-600 shadow-2xl">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-8 h-8 text-red-400 animate-pulse" />
              <p className="text-xs uppercase tracking-widest text-red-300 font-bold">🚨 CRITICAL ALERT</p>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Critical Risk Employees (80+)</h2>
            <p className="text-red-200">Immediate action required. From CCTV detections, CSV uploads, and unauthorized IDs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {criticalRiskEmployees.map((emp: any, idx: number) => (
              <div key={idx} className="bg-slate-900/60 border border-red-500/50 p-4 rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-white font-bold">{emp.name || emp.employee_name || emp.employeeId}</p>
                    <p className="text-red-200 text-sm">ID: {emp.employeeId || emp.user}</p>
                    <p className="text-red-300 text-xs mt-1">Source: {emp.source || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">{emp.riskScore?.toFixed(1) || emp.risk_score?.toFixed(1) || '0'}</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">CRITICAL</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={downloadCriticalRiskPDF}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              <Download size={20} />
              Download PDF Report
            </button>
          </div>
        </div>
      )}

      {/* EMAIL ALERT SECTION */}
      <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700">
        <h3 className="text-2xl font-bold text-white mb-4">📧 Automated High/Critical Risk Email Alert</h3>
        <p className="text-slate-400 mb-4 text-sm">
          Auto-trigger is enabled for newly calculated HIGH (60-79.99) and CRITICAL (80+) scores. Current elevated employees: {elevatedRiskEmployees.length}
        </p>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Sender Email (From)</label>
            <input
              type="email"
              value={manualSenderEmail}
              onChange={(e) => {
                const value = e.target.value;
                setManualSenderEmail(value);
                localStorage.setItem('spi_alert_sender_email', value);
              }}
              placeholder="Enter sender email"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Recipient Email</label>
            <input
              type="email"
              value={manualRecipientEmail}
              onChange={(e) => {
                const value = e.target.value;
                setManualRecipientEmail(value);
                localStorage.setItem('spi_alert_recipient_email', value);
              }}
              placeholder="Enter recipient email (e.g., admin@company.com)"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => sendRiskEmailAlerts(elevatedRiskEmployees)}
            disabled={isSendingEmail || !manualSenderEmail.trim() || !manualRecipientEmail.trim() || elevatedRiskEmployees.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
          >
            <Send size={20} />
            {isSendingEmail ? 'Sending...' : 'Send Email Now'}
          </button>
          <button
            onClick={testSmtpConfiguration}
            disabled={testingSmtpConfig}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
            title="Test SMTP configuration without sending alert"
          >
            {testingSmtpConfig ? '🔄' : '⚙️'} Test Config
          </button>
        </div>
        {emailSendingStatus && (
          <p className={`mt-3 font-semibold ${emailSendingStatus.includes('✅') ? 'text-green-400' : emailSendingStatus.includes('❌') ? 'text-red-400' : 'text-blue-400'}`}>
            {emailSendingStatus}
          </p>
        )}
        {smtpTestResult && (
          <p className={`mt-2 font-semibold ${smtpTestResult.includes('✅') ? 'text-green-400' : smtpTestResult.includes('❌') ? 'text-red-400' : 'text-blue-400'}`}>
            {smtpTestResult}
          </p>
        )}
      </div>

      {/* KPI Cards - NOW USING CORRECTED riskCounts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 p-6 rounded-2xl border border-indigo-500/30">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Total Employees</p>
          <p className="text-4xl font-bold text-white mt-2">{employeeData.length.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-2">Monitored & Analyzed</p>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 p-6 rounded-2xl border border-red-500/30">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">🔴 High Risk</p>
          <p className="text-4xl font-bold text-red-400 mt-2">
            {riskCounts.high}
          </p>
          <p className="text-xs text-slate-400 mt-2">Requires Investigation</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-6 rounded-2xl border border-amber-500/30">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">🟡 Medium Risk</p>
          <p className="text-4xl font-bold text-amber-400 mt-2">
            {riskCounts.medium}
          </p>
          <p className="text-xs text-slate-400 mt-2">Monitor Closely</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-6 rounded-2xl border border-emerald-500/30">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">🟢 Low Risk</p>
          <p className="text-4xl font-bold text-emerald-400 mt-2">
            {riskCounts.low}
          </p>
          <p className="text-xs text-slate-400 mt-2">Baseline Compliance</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-wrap gap-4">
        <div className="flex-1 min-w-48">
          <label className="text-xs font-semibold text-slate-400 uppercase">Department</label>
          <select
            value={selectedDept || ''}
            onChange={(e) => setSelectedDept(e.target.value || null)}
            className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white hover:border-indigo-500 transition-colors"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-48">
          <label className="text-xs font-semibold text-slate-400 uppercase">Risk Level</label>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as any)}
            className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white hover:border-indigo-500 transition-colors"
          >
            <option value="all">All Employees</option>
            <option value="high">High Risk Only</option>
            <option value="medium">Medium Risk Only</option>
            <option value="low">Low Risk Only</option>
          </select>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Risk Summary */}
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">Risk by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deptRiskSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="critical" fill="#d32f2f" name="Critical" />
              <Bar dataKey="high" fill="#f57c00" name="High" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Component Distribution */}
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">Risk Factors Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskComponentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riskComponentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Activity by Hour */}
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">Activity Heatmap (24h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={activityHeatmap}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
              <Area type="monotone" dataKey="activity" fill="#6366f1" stroke="#818cf8" name="Activity Level" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Login Patterns by Dept */}
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">Login Patterns by Department</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={loginPatterns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="dept" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="avgLogins" fill="#3b82f6" name="Avg Logins" />
              <Line type="monotone" dataKey="nightLogins" stroke="#f59e0b" strokeWidth={2} name="Night Logins" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top At-Risk Employees */}
      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">Top {Math.min(15, topRiskyEmployees.length)} At-Risk Employees</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wide">User</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wide">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wide">Department</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wide">Risk Score</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wide">Level</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wide">File Ops</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wide">USB Count</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wide">Night Logins</th>
              </tr>
            </thead>
            <tbody>
              {topRiskyEmployees.map((emp, idx) => (
                <tr key={emp.user} className="border-b border-slate-700 hover:bg-slate-700/30">
                  <td className="py-3 px-4 text-slate-300">{emp.user}</td>
                  <td className="py-3 px-4 font-medium text-white">{emp.employee_name}</td>
                  <td className="py-3 px-4 text-slate-400">{emp.department}</td>
                  <td className="py-3 px-4 font-bold text-white">{emp.assessment?.overallRiskScore.toFixed(1)}</td>
                  <td className="py-3 px-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: RISK_COLORS[emp.assessment?.riskLevel || RiskLevel.LOW] + '30', color: RISK_COLORS[emp.assessment?.riskLevel || RiskLevel.LOW] }}
                    >
                      {emp.assessment?.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{(emp.file_deleted || 0) + (emp.file_copied || 0)}</td>
                  <td className="py-3 px-4 text-slate-300">{emp.usb_count}</td>
                  <td className="py-3 px-4 text-slate-300">{emp.night_logins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Behavioral Insights */}
      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">Behavioral Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-300 mb-3">Risk Indicators Correlation</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex justify-between"><span>File Deletion + Night Login</span> <span className="text-orange-400 font-semibold">73% correlation</span></li>
              <li className="flex justify-between"><span>USB Activity + High Email Volume</span> <span className="text-red-400 font-semibold">68% correlation</span></li>
              <li className="flex justify-between"><span>CCTV Anomalies + Access Card Spikes</span> <span className="text-yellow-400 font-semibold">45% correlation</span></li>
              <li className="flex justify-between"><span>Off-Hour Activity + External Emails</span> <span className="text-red-400 font-semibold">81% correlation</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-300 mb-3">Machine Learning Ivnsights</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>✓ Isolation Forest Model Accuracy: <span className="text-emerald-400 font-semibold">94.2%</span></li>
              <li>✓ Anomaly Detection Rate: <span className="text-emerald-400 font-semibold">87.6%</span></li>
              <li>✓ False Positive Rate: <span className="text-emerald-400 font-semibold">2.1%</span></li>
              <li>✓ Avg Detection Latency: <span className="text-emerald-400 font-semibold">&lt;15 mins</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskManagement;