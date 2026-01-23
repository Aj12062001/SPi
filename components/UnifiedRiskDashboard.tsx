import React, { useMemo, useState } from 'react';
import { useData } from '../DataContext';
import { EmployeeRisk, RiskLevel } from '../types';
import ActivityTimeline from './ActivityTimeline';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Area, AreaChart
} from 'recharts';

const UnifiedRiskDashboard: React.FC = () => {
  const { employeeData, riskAssessments, activityLogs, getRiskTrend, getUserActivityStats } = useData();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'details' | 'activity'>('overview');

  // Risk counts
  const riskCounts = useMemo(() => {
    let critical = 0, high = 0, medium = 0, low = 0;
    riskAssessments.forEach(assessment => {
      if (assessment.riskLevel === RiskLevel.CRITICAL) critical++;
      else if (assessment.riskLevel === RiskLevel.HIGH) high++;
      else if (assessment.riskLevel === RiskLevel.MEDIUM) medium++;
      else if (assessment.riskLevel === RiskLevel.LOW) low++;
    });
    return { critical, high, medium, low, total: employeeData.length };
  }, [riskAssessments, employeeData]);

  // Filtered employees based on selected risk
  const filteredEmployees = useMemo(() => {
    return (employeeData as EmployeeRisk[]).map(emp => ({
      ...emp,
      assessment: riskAssessments.get(emp.user)
    })).filter(emp => {
      if (selectedRiskFilter === 'all') return true;
      if (selectedRiskFilter === 'critical') return emp.assessment?.riskLevel === RiskLevel.CRITICAL;
      if (selectedRiskFilter === 'high') return emp.assessment?.riskLevel === RiskLevel.HIGH;
      if (selectedRiskFilter === 'medium') return emp.assessment?.riskLevel === RiskLevel.MEDIUM;
      if (selectedRiskFilter === 'low') return emp.assessment?.riskLevel === RiskLevel.LOW;
      return true;
    }).sort((a, b) => (b.assessment?.overallRiskScore || 0) - (a.assessment?.overallRiskScore || 0));
  }, [employeeData, riskAssessments, selectedRiskFilter]);

  // Risk distribution
  const riskDistribution = useMemo(() => {
    return [
      { name: RiskLevel.CRITICAL, value: riskCounts.critical, color: '#d32f2f' },
      { name: RiskLevel.HIGH, value: riskCounts.high, color: '#f57c00' },
      { name: RiskLevel.MEDIUM, value: riskCounts.medium, color: '#fbc02d' },
      { name: RiskLevel.LOW, value: riskCounts.low, color: '#388e3c' },
    ].filter(d => d.value > 0);
  }, [riskCounts]);

  const riskTrend = useMemo(() => getRiskTrend(7), [getRiskTrend]);

  const selectedUserData = selectedUser ? employeeData.find(e => e.user === selectedUser) : null;
  const selectedUserAssessment = selectedUser ? riskAssessments.get(selectedUser) : null;
  const selectedUserActivities = selectedUser ? activityLogs.filter(log => log.userId === selectedUser) : [];

  // Department risk summary
  const deptRiskSummary = useMemo(() => {
    const summary: Record<string, { total: number; critical: number; high: number; avgRisk: number }> = {};
    
    employeeData.forEach(emp => {
      const dept = emp.department || 'Unknown';
      const assessment = riskAssessments.get(emp.user);
      const isCritical = assessment?.riskLevel === RiskLevel.CRITICAL;
      const isHigh = assessment?.riskLevel === RiskLevel.HIGH;
      
      if (!summary[dept]) {
        summary[dept] = { total: 0, critical: 0, high: 0, avgRisk: 0 };
      }
      summary[dept].total++;
      if (isCritical) summary[dept].critical++;
      if (isHigh) summary[dept].high++;
      summary[dept].avgRisk += assessment?.overallRiskScore || 0;
    });

    return Object.entries(summary)
      .map(([name, data]) => ({
        name,
        critical: data.critical,
        high: data.high,
        avgRisk: Math.round(data.avgRisk / data.total)
      }))
      .sort((a, b) => b.critical + b.high - a.critical - a.high);
  }, [employeeData, riskAssessments]);

  const getRiskLevelColor = (level: RiskLevel): string => {
    switch (level) {
      case RiskLevel.CRITICAL: return '#d32f2f';
      case RiskLevel.HIGH: return '#f57c00';
      case RiskLevel.MEDIUM: return '#fbc02d';
      case RiskLevel.LOW: return '#388e3c';
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* KPI Cards - Clickable Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Employees */}
        <button
          onClick={() => setSelectedRiskFilter('all')}
          className={`group relative overflow-hidden p-8 rounded-2xl border-2 transition-all duration-300 ${
            selectedRiskFilter === 'all'
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

        {/* Critical Risk */}
        <button
          onClick={() => setSelectedRiskFilter('critical')}
          className={`group relative overflow-hidden p-8 rounded-2xl border-2 transition-all duration-300 ${
            selectedRiskFilter === 'critical'
              ? 'bg-red-600/30 border-red-500 shadow-lg shadow-red-500/30'
              : 'bg-red-500/10 border-red-500/30 hover:border-red-500 hover:bg-red-600/20 hover:shadow-lg hover:shadow-red-500/20'
          }`}
        >
          <div className="relative z-10">
            <p className="text-sm font-semibold text-red-300 uppercase tracking-widest">Critical Risk</p>
            <p className="text-5xl font-black text-red-400 mt-3">{riskCounts.critical}</p>
            <p className="text-xs text-red-200 mt-2">Immediate Action Required</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* High Risk */}
        <button
          onClick={() => setSelectedRiskFilter('high')}
          className={`group relative overflow-hidden p-8 rounded-2xl border-2 transition-all duration-300 ${
            selectedRiskFilter === 'high'
              ? 'bg-orange-600/30 border-orange-500 shadow-lg shadow-orange-500/30'
              : 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500 hover:bg-orange-600/20 hover:shadow-lg hover:shadow-orange-500/20'
          }`}
        >
          <div className="relative z-10">
            <p className="text-sm font-semibold text-orange-300 uppercase tracking-widest">High Risk</p>
            <p className="text-5xl font-black text-orange-400 mt-3">{riskCounts.high}</p>
            <p className="text-xs text-orange-200 mt-2">Enhanced Monitoring</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Low Risk */}
        <button
          onClick={() => setSelectedRiskFilter('low')}
          className={`group relative overflow-hidden p-8 rounded-2xl border-2 transition-all duration-300 ${
            selectedRiskFilter === 'low'
              ? 'bg-emerald-600/30 border-emerald-500 shadow-lg shadow-emerald-500/30'
              : 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-600/20 hover:shadow-lg hover:shadow-emerald-500/20'
          }`}
        >
          <div className="relative z-10">
            <p className="text-sm font-semibold text-emerald-300 uppercase tracking-widest">Low Risk</p>
            <p className="text-5xl font-black text-emerald-400 mt-3">{riskCounts.low}</p>
            <p className="text-xs text-emerald-200 mt-2">Baseline Compliance</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
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
            className={`px-6 py-2.5 rounded-lg font-semibold transition-all ${
              viewMode === tab.id
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

            {/* 7-Day Risk Trend */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">7-Day Risk Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={riskTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="averageRisk" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} name="Avg Risk Score" />
                </LineChart>
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
              {selectedRiskFilter === 'critical' && `Critical Risk Employees (${filteredEmployees.length})`}
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">Risk Score</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">Level</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">File Ops</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">USB</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.slice(0, 20).map((emp, idx) => (
                    <tr
                      key={emp.user}
                      className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-300">{emp.user}</td>
                      <td className="py-3 px-4 font-medium text-white">{emp.employee_name}</td>
                      <td className="py-3 px-4 text-slate-400">{emp.department || 'Unknown'}</td>
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
                      <td className="py-3 px-4 text-slate-300">{(emp.file_deleted || 0) + (emp.file_copied || 0)}</td>
                      <td className="py-3 px-4 text-slate-300">{emp.usb_count}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedUser(emp.user)}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs"
                        >
                          View Details →
                        </button>
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
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
          {selectedUser ? (
            <>
              <h3 className="text-lg font-bold text-white mb-4">Activity for {selectedUserData?.employee_name || selectedUser}</h3>
              <ActivityTimeline activities={selectedUserActivities} />
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p>Select an employee from the details tab to view their activity log.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedRiskDashboard;
