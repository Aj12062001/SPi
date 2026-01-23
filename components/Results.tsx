import React, { useMemo, useState } from 'react';
import { useData } from '../DataContext';
import { EmployeeRisk, RiskLevel } from '../types';
import ActivityTimeline from './ActivityTimeline';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Results: React.FC = () => {
  const { employeeData, riskAssessments, activityLogs, getAtRiskUsers, getRiskTrend, getUserActivityStats } = useData();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'details' | 'activity'>('overview');

  const atRiskUsers = useMemo(() => getAtRiskUsers(), [getAtRiskUsers]);
  const riskTrend = useMemo(() => getRiskTrend(7), [getRiskTrend]);

  // Risk distribution
  const riskDistribution = useMemo(() => {
    const distribution = {
      [RiskLevel.LOW]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.CRITICAL]: 0,
    };

    riskAssessments.forEach(assessment => {
      distribution[assessment.riskLevel]++;
    });

    return Object.entries(distribution).map(([level, count]) => ({
      name: level,
      value: count,
    }));
  }, [riskAssessments]);

  const getRiskLevelColor = (level: RiskLevel): string => {
    switch (level) {
      case RiskLevel.CRITICAL:
        return '#d32f2f';
      case RiskLevel.HIGH:
        return '#f57c00';
      case RiskLevel.MEDIUM:
        return '#fbc02d';
      case RiskLevel.LOW:
        return '#388e3c';
    }
  };

  const COLORS = ['#388e3c', '#fbc02d', '#f57c00', '#d32f2f'];

  const selectedUserData = selectedUser ? employeeData.find(e => e.user === selectedUser) : null;
  const selectedUserAssessment = selectedUser ? riskAssessments.get(selectedUser) : null;
  const selectedUserActivities = selectedUser ? activityLogs.filter(log => log.userId === selectedUser) : [];
  const userActivityStats = selectedUser ? getUserActivityStats(selectedUser, 24) : null;

  return (
    <div style={{ padding: '20px' }} className="results-container">
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>🔍 SPI Analysis Results</h1>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: viewMode === 'overview' ? '#1976d2' : '#f5f5f5',
            color: viewMode === 'overview' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
          onClick={() => setViewMode('overview')}
        >
          📊 Overview
        </button>
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: viewMode === 'details' ? '#1976d2' : '#f5f5f5',
            color: viewMode === 'details' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
          onClick={() => setViewMode('details')}
        >
          👥 Risk Details
        </button>
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: viewMode === 'activity' ? '#1976d2' : '#f5f5f5',
            color: viewMode === 'activity' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
          onClick={() => setViewMode('activity')}
        >
          📝 Activity Log
        </button>
      </div>

      {/* Overview Tab */}
      {viewMode === 'overview' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            {/* Risk Statistics */}
            <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>📊 Risk Statistics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Users Monitored:</span>
                  <strong>{employeeData.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>At-Risk Users:</span>
                  <strong style={{ color: '#d32f2f' }}>{atRiskUsers.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Activities Logged:</span>
                  <strong>{activityLogs.length}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Anomalies Detected:</span>
                  <strong style={{ color: '#f57c00' }}>{activityLogs.filter(a => a.isAnomalous).length}</strong>
                </div>
              </div>
            </div>

            {/* Risk Distribution Pie Chart */}
            <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Risk Level Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
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
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Trend Chart */}
          <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>📈 7-Day Risk Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={riskTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="averageRisk" stroke="#1976d2" dot={{ fill: '#1976d2' }} name="Avg Risk Score" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top At-Risk Users */}
          <div style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>🚨 Top At-Risk Users</h3>
            <div>
              {atRiskUsers.slice(0, 10).map((user, index) => {
                const assessment = riskAssessments.get(user.user);
                return (
                  <div
                    key={user.user}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                      borderBottom: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onClick={() => {
                      setSelectedUser(user.user);
                      setViewMode('details');
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafafa')}
                  >
                    <div style={{ width: '30px', height: '30px', backgroundColor: '#1976d2', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '15px' }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{user.employee_name || user.user}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{user.user}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '100px', height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${(assessment?.overallRiskScore || 0) / 100 * 100}%`,
                            height: '100%',
                            backgroundColor: getRiskLevelColor(assessment?.riskLevel || RiskLevel.LOW),
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 'bold', color: getRiskLevelColor(assessment?.riskLevel || RiskLevel.LOW) }}>
                        {assessment?.overallRiskScore.toFixed(1) || '0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Details Tab */}
      {viewMode === 'details' && (
        <div>
          {selectedUserData && selectedUserAssessment ? (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <select
                  value={selectedUser || ''}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={{ padding: '10px', fontSize: '14px', borderRadius: '5px', border: '1px solid #ddd' }}
                >
                  <option value="">Select a user...</option>
                  {employeeData.map(user => (
                    <option key={user.user} value={user.user}>
                      {user.employee_name || user.user}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#f0f4ff', borderRadius: '8px', border: '2px solid #1976d2', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>{selectedUserData.employee_name || selectedUserData.user}</h2>
                  <span style={{ padding: '8px 16px', backgroundColor: getRiskLevelColor(selectedUserAssessment.riskLevel), color: 'white', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' }}>
                    {selectedUserAssessment.riskLevel}
                  </span>
                </div>
              </div>

              {/* Risk Assessment Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
                {[
                  { label: 'Overall Risk Score', value: selectedUserAssessment.overallRiskScore.toFixed(2), color: getRiskLevelColor(selectedUserAssessment.riskLevel) },
                  { label: 'File Activity Risk', value: selectedUserAssessment.fileActivityRisk.toFixed(2), color: '#ff9800' },
                  { label: 'USB Activity Risk', value: selectedUserAssessment.usbActivityRisk.toFixed(2), color: '#ff5252' },
                  { label: 'Email Activity Risk', value: selectedUserAssessment.emailActivityRisk.toFixed(2), color: '#42a5f5' },
                  { label: 'Login Pattern Risk', value: selectedUserAssessment.loginPatternRisk.toFixed(2), color: '#ab47bc' },
                  { label: 'Behavioral Risk', value: selectedUserAssessment.behavioralRisk.toFixed(2), color: '#29b6f6' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: `2px solid ${item.color}`, textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{item.label}</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {selectedUserAssessment.recommendations.length > 0 && (
                <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px', border: '1px solid #ffb74d', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#e65100' }}>🎯 Recommendations</h3>
                  <ul style={{ marginLeft: '20px', color: '#333' }}>
                    {selectedUserAssessment.recommendations.map((rec, index) => (
                      <li key={index} style={{ marginBottom: '8px' }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Flagged Activities */}
              {selectedUserAssessment.flaggedActivities.length > 0 && (
                <div style={{ padding: '20px', backgroundColor: '#ffebee', borderRadius: '8px', border: '1px solid #ef5350', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#c62828' }}>⚠️ Flagged Activities ({selectedUserAssessment.flaggedActivities.length})</h3>
                  <div>
                    {selectedUserAssessment.flaggedActivities.slice(0, 5).map(activity => (
                      <div key={activity.id} style={{ display: 'flex', gap: '10px', padding: '8px', borderBottom: '1px solid #ffcdd2' }}>
                        <span style={{ padding: '4px 8px', backgroundColor: activity.severity === 'critical' ? '#d32f2f' : '#f57c00', color: 'white', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', minWidth: '60px', textAlign: 'center' }}>
                          {activity.severity.toUpperCase()}
                        </span>
                        <span style={{ flex: 1 }}>{activity.activityType.replace(/_/g, ' ')}</span>
                        <span style={{ color: '#999', fontSize: '12px' }}>{new Date(activity.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <p style={{ marginBottom: '20px', color: '#666' }}>Select a user to view details</p>
              <select
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(e.target.value)}
                style={{ padding: '10px', fontSize: '14px', borderRadius: '5px', border: '1px solid #ddd', minWidth: '300px' }}
              >
                <option value="">Select a user...</option>
                {employeeData.map(user => (
                  <option key={user.user} value={user.user}>
                    {user.employee_name || user.user}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Activity Log Tab */}
      {viewMode === 'activity' && (
        <div>
          {selectedUser ? (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Activity for {selectedUserData?.employee_name || selectedUser}</h2>
              <ActivityTimeline activities={selectedUserActivities} />
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>All Activity Logs</h2>
              <ActivityTimeline activities={activityLogs} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Results;
