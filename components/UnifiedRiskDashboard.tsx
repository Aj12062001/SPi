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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'id' | 'name' | 'department'>('all');

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

  // Filtered employees based on selected risk and search
  const filteredEmployees = useMemo(() => {
    return (employeeData as EmployeeRisk[]).map(emp => ({
      ...emp,
      assessment: riskAssessments.get(emp.user)
    })).filter(emp => {
      // Risk filter
      let matchesRisk = true;
      if (selectedRiskFilter === 'critical') matchesRisk = emp.assessment?.riskLevel === RiskLevel.CRITICAL;
      else if (selectedRiskFilter === 'high') matchesRisk = emp.assessment?.riskLevel === RiskLevel.HIGH;
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
            (emp.department?.toLowerCase().includes(query));
        } else if (searchField === 'id') {
          matchesSearch = 
            (emp.user?.toLowerCase().includes(query)) ||
            (emp.user_id?.toLowerCase().includes(query));
        } else if (searchField === 'name') {
          matchesSearch = emp.employee_name?.toLowerCase().includes(query) || false;
        } else if (searchField === 'department') {
          matchesSearch = emp.department?.toLowerCase().includes(query) || false;
        }
      }
      
      return matchesRisk && matchesSearch;
    }).sort((a, b) => (b.assessment?.overallRiskScore || 0) - (a.assessment?.overallRiskScore || 0));
  }, [employeeData, riskAssessments, selectedRiskFilter, searchQuery, searchField]);

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
          {/* Search Bar */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search employees..."
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
                </select>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* File Operations */}
                  <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
                    <h5 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      File Operations
                    </h5>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Opened:</span>
                        <span className="text-white font-semibold">{selectedUserData.file_opened || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Copied:</span>
                        <span className="text-white font-semibold">{selectedUserData.file_copied || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Deleted:</span>
                        <span className="text-red-400 font-semibold">{selectedUserData.file_deleted || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Downloaded:</span>
                        <span className="text-orange-400 font-semibold">{selectedUserData.file_downloaded || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Uploaded:</span>
                        <span className="text-white font-semibold">{selectedUserData.file_uploaded || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Edited:</span>
                        <span className="text-white font-semibold">{selectedUserData.file_edited || 0}</span>
                      </div>
                      <div className="flex justify-between col-span-2 pt-3 border-t border-slate-700">
                        <span className="text-slate-400">Sensitive Files:</span>
                        <span className="text-red-400 font-bold">{selectedUserData.sensitive_files_accessed || 0}</span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-slate-400">Unique Files:</span>
                        <span className="text-white font-semibold">{selectedUserData.unique_files_accessed || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Systems Accessed */}
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(emp.user);
                          }}
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
        <div className="space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search employees for activity logs..."
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
                </select>
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

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            {selectedUser ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <h3 className="text-lg font-bold text-white">Activity for {selectedUserData?.employee_name || selectedUser}</h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-indigo-500/60 transition-all"
                  >
                    Change Employee
                  </button>
                </div>
                <ActivityTimeline activities={selectedUserActivities} />
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400">Select an employee to view their activity log.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredEmployees.slice(0, 8).map((emp) => (
                    <button
                      key={emp.user}
                      onClick={() => setSelectedUser(emp.user)}
                      className="text-left p-4 bg-slate-900 border border-slate-700 rounded-xl hover:border-indigo-500/50 transition-all"
                    >
                      <p className="text-white font-semibold">{emp.employee_name || emp.user}</p>
                      <p className="text-xs text-slate-400">{emp.user_id || emp.user} • {emp.department || 'Unknown'} • {emp.job_title || 'N/A'}</p>
                    </button>
                  ))}
                </div>
                {filteredEmployees.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No employees match your search.
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
