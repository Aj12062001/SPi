import React, { useMemo } from 'react';
import { EmployeeRisk } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart } from 'recharts';

interface ActivityVisualizationProps {
  employeeData: EmployeeRisk;
}

const ActivityVisualization: React.FC<ActivityVisualizationProps> = ({ employeeData }) => {
  // File operations summary data
  const fileOperationsData = useMemo(() => {
    return [
      { name: 'Opened', value: employeeData.file_opened || 0, color: '#3b82f6' },
      { name: 'Copied', value: employeeData.file_copied || 0, color: '#8b5cf6' },
      { name: 'Deleted', value: employeeData.file_deleted || 0, color: '#ef4444' },
      { name: 'Downloaded', value: employeeData.file_downloaded || 0, color: '#f59e0b' },
      { name: 'Uploaded', value: employeeData.file_uploaded || 0, color: '#10b981' },
      { name: 'Edited', value: employeeData.file_edited || 0, color: '#06b6d4' },
    ].filter(op => op.value > 0);
  }, [employeeData]);

  // Login pattern data
  const loginPatternData = useMemo(() => {
    return [
      {
        name: 'Login Activity',
        logins: employeeData.login_count || 0,
        night_logins: employeeData.night_logins || 0,
        total_duration: employeeData.session_duration_total || 0,
      }
    ];
  }, [employeeData]);

  // Detailed file operations table
  const parseFileOperations = useMemo(() => {
    try {
      if (employeeData.file_operations_detail) {
        const ops = JSON.parse(employeeData.file_operations_detail);
        return Array.isArray(ops) ? ops.slice(0, 20) : [];
      }
    } catch (e) {
      console.error('Failed to parse file operations:', e);
    }
    return [];
  }, [employeeData.file_operations_detail]);

  return (
    <div className="activity-visualization space-y-6">
      {/* File Operations Bar Chart */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
        <h4 className="text-lg font-bold text-white mb-4">📊 File Operations Summary</h4>
        {fileOperationsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fileOperationsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8, color: '#fff' }}
                formatter={(value) => [`${value}`, 'Count']}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No file operations recorded</p>
          </div>
        )}
      </div>

      {/* Login Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Login Summary Cards */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
          <h4 className="text-lg font-bold text-white mb-4">🔓 Login Statistics</h4>
          <div className="space-y-4">
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Total Logins</span>
                <span className="text-2xl font-bold text-blue-400">{employeeData.login_count || 0}</span>
              </div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Night Logins</span>
                <span className="text-2xl font-bold text-yellow-400">{employeeData.night_logins || 0}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Logins outside business hours</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Unique PCs</span>
                <span className="text-2xl font-bold text-green-400">{employeeData.unique_pcs || 0}</span>
              </div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Total Session Duration</span>
                <span className="text-2xl font-bold text-purple-400">{employeeData.session_duration_total || 0} min</span>
              </div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Avg Session Duration</span>
                <span className="text-2xl font-bold text-cyan-400">{(employeeData.session_duration_avg || 0).toFixed(1)} min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
          <h4 className="text-lg font-bold text-white mb-4">📋 Activity Summary</h4>
          <div className="space-y-4">
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Total File Operations</span>
                <span className="text-2xl font-bold text-indigo-400">{employeeData.total_file_operations || 0}</span>
              </div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Sensitive Files Accessed</span>
                <span className="text-2xl font-bold text-red-400">{employeeData.sensitive_files_accessed || 0}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">⚠️ Requires attention</div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Emails Sent</span>
                <span className="text-2xl font-bold text-blue-400">{employeeData.emails_sent || 0}</span>
              </div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">External Emails</span>
                <span className="text-2xl font-bold text-orange-400">{employeeData.external_mails || 0}</span>
              </div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">USB Connections</span>
                <span className="text-2xl font-bold text-red-400">{employeeData.usb_connect || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed File Operations Table */}
      {parseFileOperations.length > 0 && (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
          <h4 className="text-lg font-bold text-white mb-4">📁 File Operations Details (Latest 20)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">File Name</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Operation</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">System</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Time</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {parseFileOperations.map((op: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-slate-100 font-mono text-xs truncate max-w-xs">
                      {op.file_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        op.operation === 'delete' ? 'bg-red-500/20 text-red-300' :
                        op.operation === 'download' ? 'bg-orange-500/20 text-orange-300' :
                        op.operation === 'copy' ? 'bg-yellow-500/20 text-yellow-300' :
                        op.operation === 'upload' ? 'bg-green-500/20 text-green-300' :
                        op.operation === 'open' ? 'bg-blue-500/20 text-blue-300' :
                        op.operation === 'edit' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-slate-500/20 text-slate-300'
                      }`}>
                        {op.operation.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-xs">{op.system}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{op.timestamp}</td>
                    <td className="py-3 px-4">
                      {op.is_sensitive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 text-red-300 text-xs font-bold">
                          🔒 SENSITIVE
                        </span>
                      ) : (
                        <span className="text-green-400 text-xs">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Additional Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Systems Accessed */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
          <h4 className="text-lg font-bold text-white mb-4">💻 Systems Accessed</h4>
          <div className="flex flex-wrap gap-2">
            {(employeeData.systems_accessed || '').split(',').filter(s => s).map((system, idx) => (
              <span key={idx} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs border border-slate-700">
                {system.trim()}
              </span>
            ))}
            {(!employeeData.systems_accessed || employeeData.systems_accessed.split(',').filter(s => s).length === 0) && (
              <span className="text-slate-500 text-sm">No systems accessed</span>
            )}
          </div>
        </div>

        {/* HTTP Activity */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
          <h4 className="text-lg font-bold text-white mb-4">🌐 Web Activity</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">HTTP Requests</span>
              <span className="text-xl font-bold text-blue-400">{employeeData.http_requests || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
              <span className="text-slate-400">Unique URLs</span>
              <span className="text-xl font-bold text-indigo-400">{employeeData.unique_urls || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityVisualization;
