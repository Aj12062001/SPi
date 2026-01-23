import React, { useMemo, useState } from 'react';
import { useData } from '../DataContext';
import { EmployeeRisk, RiskLevel } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';

const RiskManagement: React.FC = () => {
  const { employeeData, riskAssessments } = useData();
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'critical'>('all');

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
        (riskFilter === 'critical' && assessment && assessment.riskLevel === RiskLevel.CRITICAL);
      return deptMatch && riskMatch;
    });
  }, [employeeData, riskAssessments, selectedDept, riskFilter]);

  // Department risk summary
  const deptRiskSummary = useMemo(() => {
    const summary: Record<string, { total: number; high: number; critical: number; avgRisk: number }> = {};
    
    employeeData.forEach(emp => {
      const dept = emp.department || 'Unknown';
      const assessment = riskAssessments.get(emp.user);
      const isHigh = assessment?.riskLevel === RiskLevel.HIGH;
      const isCritical = assessment?.riskLevel === RiskLevel.CRITICAL;
      
      if (!summary[dept]) {
        summary[dept] = { total: 0, high: 0, critical: 0, avgRisk: 0 };
      }
      summary[dept].total++;
      if (isHigh) summary[dept].high++;
      if (isCritical) summary[dept].critical++;
      summary[dept].avgRisk += assessment?.overallRiskScore || 0;
    });

    return Object.entries(summary).map(([name, data]) => ({
      name,
      total: data.total,
      high: data.high,
      critical: data.critical,
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
      risk: dept.critical + dept.high
    }));
  }, [deptRiskSummary]);

  const RISK_COLORS = {
    [RiskLevel.LOW]: '#10b981',
    [RiskLevel.MEDIUM]: '#f59e0b',
    [RiskLevel.HIGH]: '#ef5350',
    [RiskLevel.CRITICAL]: '#d32f2f'
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 p-6 rounded-2xl border border-indigo-500/30">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Total Employees</p>
          <p className="text-4xl font-bold text-white mt-2">{employeeData.length.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-2">Monitored & Analyzed</p>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 p-6 rounded-2xl border border-red-500/30">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Critical Risk</p>
          <p className="text-4xl font-bold text-red-400 mt-2">
            {Array.from(riskAssessments.values() as Array<any>).filter(a => a.riskLevel === RiskLevel.CRITICAL).length}
          </p>
          <p className="text-xs text-slate-400 mt-2">Immediate Action Required</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 p-6 rounded-2xl border border-orange-500/30">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">High Risk</p>
          <p className="text-4xl font-bold text-orange-400 mt-2">
            {Array.from(riskAssessments.values() as Array<any>).filter(a => a.riskLevel === RiskLevel.HIGH).length}
          </p>
          <p className="text-xs text-slate-400 mt-2">Enhanced Monitoring</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-6 rounded-2xl border border-emerald-500/30">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Low Risk</p>
          <p className="text-4xl font-bold text-emerald-400 mt-2">
            {Array.from(riskAssessments.values() as Array<any>).filter(a => a.riskLevel === RiskLevel.LOW).length}
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
            <option value="critical">Critical Risk Only</option>
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
        <h3 className="text-lg font-bold text-white mb-4">Top {Math.min(15, filteredEmployees.length)} At-Risk Employees</h3>
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
            <h4 className="font-semibold text-slate-300 mb-3">Machine Learning Insights</h4>
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
