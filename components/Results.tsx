
import React, { useState } from 'react';
import { useData } from '../DataContext';
import { EmployeeRisk, RiskLevel } from '../types';

const Results: React.FC = () => {
  const { employeeData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel | null>(null);
  const [individualSearch, setIndividualSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRisk | null>(null);

  const getRiskLevel = (score: number): RiskLevel => {
    if (score < 25) return RiskLevel.LOW;
    if (score >= 25 && score <= 50) return RiskLevel.MEDIUM;
    return RiskLevel.HIGH;
  };

  const filteredData = employeeData.filter(emp => 
    emp.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const highRiskEmployees = employeeData.filter(emp => getRiskLevel(emp.risk_score) === RiskLevel.HIGH);
  const medRiskEmployees = employeeData.filter(emp => getRiskLevel(emp.risk_score) === RiskLevel.MEDIUM);
  const lowRiskEmployees = employeeData.filter(emp => getRiskLevel(emp.risk_score) === RiskLevel.LOW);

  const medRiskCount = medRiskEmployees.length;
  const lowRiskCount = lowRiskEmployees.length;

  const getEmployeesForRiskLevel = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.LOW:
        return lowRiskEmployees;
      case RiskLevel.MEDIUM:
        return medRiskEmployees;
      case RiskLevel.HIGH:
        return highRiskEmployees;
      default:
        return [];
    }
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.LOW:
        return 'green';
      case RiskLevel.MEDIUM:
        return 'yellow';
      case RiskLevel.HIGH:
        return 'red';
      default:
        return 'slate';
    }
  };

  const getRiskTitle = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.LOW:
        return 'Low Risk Detail Audit';
      case RiskLevel.MEDIUM:
        return 'Medium Risk Detail Audit';
      case RiskLevel.HIGH:
        return 'High Risk Detail Audit';
      default:
        return 'Risk Detail Audit';
    }
  };

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.LOW:
        return 'Low Risk - Monitor';
      case RiskLevel.MEDIUM:
        return 'Medium Risk - Watch';
      case RiskLevel.HIGH:
        return 'High Risk - Immediate Attention Required';
      default:
        return '';
    }
  };

  const handleIndividualSearch = () => {
    const employee = employeeData.find(emp => 
      emp.user.toLowerCase() === individualSearch.toLowerCase()
    );
    setSelectedEmployee(employee || null);
  };

  const renderEmployeeTable = (employees: EmployeeRisk[], riskLevel: RiskLevel | null) => (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-700 flex justify-between items-center">
        <h3 className={`text-xl font-bold ${riskLevel === RiskLevel.LOW ? 'text-green-400' : riskLevel === RiskLevel.MEDIUM ? 'text-yellow-400' : riskLevel === RiskLevel.HIGH ? 'text-red-400' : 'text-slate-400'}`}>
          {riskLevel ? getRiskTitle(riskLevel) : 'All Employees Risk Assessment'}
        </h3>
        {riskLevel && (
          <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${
            riskLevel === RiskLevel.LOW 
              ? 'bg-green-900/40 text-green-400 border-green-500/30' 
              : riskLevel === RiskLevel.MEDIUM 
                ? 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30' 
                : 'bg-red-900/40 text-red-400 border-red-500/30'
          }`}>
            {getRiskBadge(riskLevel)}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-8 py-4">Employee ID</th>
              <th className="px-8 py-4">Risk Score</th>
              <th className="px-8 py-4">Login Count</th>
              <th className="px-8 py-4">Night Logins</th>
              <th className="px-8 py-4">USB Events</th>
              <th className="px-8 py-4">File Activity</th>
              <th className="px-8 py-4">Anomaly Label</th>
              <th className="px-8 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {employees.map((emp) => (
              <tr key={emp.user} className="hover:bg-slate-800/80 transition-colors">
                <td className="px-8 py-5 font-bold text-white">{emp.user}</td>
                <td className="px-8 py-5">
                  <span className={`font-mono text-lg ${
                    riskLevel ? (
                      riskLevel === RiskLevel.LOW ? 'text-green-500' : 
                      riskLevel === RiskLevel.MEDIUM ? 'text-yellow-500' : 
                      'text-red-500'
                    ) : (
                      getRiskLevel(emp.risk_score) === RiskLevel.LOW ? 'text-green-500' :
                      getRiskLevel(emp.risk_score) === RiskLevel.MEDIUM ? 'text-yellow-500' :
                      'text-red-500'
                    )
                  }`}>
                    {emp.risk_score}
                  </span>
                </td>
                <td className="px-8 py-5 text-slate-300">{emp.login_count}</td>
                <td className="px-8 py-5 text-slate-300">{emp.night_logins}</td>
                <td className="px-8 py-5 text-slate-300">{emp.usb_count}</td>
                <td className="px-8 py-5 text-slate-300">{emp.file_activity_count}</td>
                <td className="px-8 py-5">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${emp.anomaly_label === -1 ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {emp.anomaly_label === -1 ? 'SEVERE OUTLIER' : 'PATTERN MATCH'}
                  </span>
                </td>
                <td className="px-8 py-5">
                  <button 
                    onClick={() => setSelectedEmployee(emp)}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold underline"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {employeeData.length === 0 ? (
        <div className="bg-slate-800/50 p-12 rounded-2xl border border-slate-700 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-300 mb-2">No Data Available</h3>
          <p className="text-slate-400 mb-6">Please upload a CSV file in the Data Ingestion tab to view risk assessments.</p>
          <button
            onClick={() => window.location.hash = '#data'}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Data Ingestion
          </button>
        </div>
      ) : (
        <>
          {/* Individual Employee Search */}
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <div className="mb-4">
              <h3 className="text-xl font-bold">Individual Risk Assessment</h3>
              <p className="text-sm text-slate-400">Search for specific employee by ID or name</p>
            </div>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Employee ID (e.g., AAE0190)"
                  className="bg-slate-900 border border-slate-700 rounded-lg px-10 py-2 w-full text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={individualSearch}
                  onChange={(e) => setIndividualSearch(e.target.value)}
                />
                <svg className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={handleIndividualSearch}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Individual Employee Details */}
          {selectedEmployee && (
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-indigo-400">Employee Details: {selectedEmployee.user}</h3>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-slate-400 hover:text-slate-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-4 rounded-xl">
                  <p className="text-sm text-slate-400 uppercase tracking-wider">Risk Score</p>
                  <p className={`text-2xl font-bold ${selectedEmployee.risk_score > 50 ? 'text-red-400' : selectedEmployee.risk_score > 25 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {selectedEmployee.risk_score}
                  </p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl">
                  <p className="text-sm text-slate-400 uppercase tracking-wider">Login Count</p>
                  <p className="text-2xl font-bold text-white">{selectedEmployee.login_count}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl">
                  <p className="text-sm text-slate-400 uppercase tracking-wider">Night Logins</p>
                  <p className="text-2xl font-bold text-white">{selectedEmployee.night_logins}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl">
                  <p className="text-sm text-slate-400 uppercase tracking-wider">USB Events</p>
                  <p className="text-2xl font-bold text-white">{selectedEmployee.usb_count}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl">
                  <p className="text-sm text-slate-400 uppercase tracking-wider">File Activity</p>
                  <p className="text-2xl font-bold text-white">{selectedEmployee.file_activity_count}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl">
                  <p className="text-sm text-slate-400 uppercase tracking-wider">Anomaly Status</p>
                  <p className={`text-lg font-bold ${selectedEmployee.anomaly_label === -1 ? 'text-orange-400' : 'text-blue-400'}`}>
                    {selectedEmployee.anomaly_label === -1 ? 'SEVERE OUTLIER' : 'NORMAL PATTERN'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Risk Level Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <button
              onClick={() => setSelectedRiskLevel(RiskLevel.LOW)}
              className={`p-6 rounded-2xl border-l-4 transition-all ${
                selectedRiskLevel === RiskLevel.LOW
                  ? 'bg-green-500/10 border-green-500 ring-2 ring-green-500/20'
                  : 'bg-slate-800 border-green-500 hover:bg-slate-700'
              }`}
            >
              <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Low Risk</p>
              <p className="text-3xl font-bold mt-1 text-green-400">{lowRiskCount}</p>
              <p className="text-xs text-slate-500 mt-2">Employees with normal activity</p>
            </button>
            <button
              onClick={() => setSelectedRiskLevel(RiskLevel.MEDIUM)}
              className={`p-6 rounded-2xl border-l-4 transition-all ${
                selectedRiskLevel === RiskLevel.MEDIUM
                  ? 'bg-yellow-500/10 border-yellow-500 ring-2 ring-yellow-500/20'
                  : 'bg-slate-800 border-yellow-500 hover:bg-slate-700'
              }`}
            >
              <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Medium Risk</p>
              <p className="text-3xl font-bold mt-1 text-yellow-400">{medRiskCount}</p>
              <p className="text-xs text-slate-500 mt-2">Employees requiring monitoring</p>
            </button>
            <button
              onClick={() => setSelectedRiskLevel(RiskLevel.HIGH)}
              className={`p-6 rounded-2xl border-l-4 transition-all ${
                selectedRiskLevel === RiskLevel.HIGH
                  ? 'bg-red-500/10 border-red-500 ring-2 ring-red-500/20'
                  : 'bg-slate-800 border-red-500 hover:bg-slate-700'
              }`}
            >
              <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">High Risk</p>
              <p className="text-3xl font-bold mt-1 text-red-400">{highRiskEmployees.length}</p>
              <p className="text-xs text-slate-500 mt-2">Immediate attention required</p>
            </button>
            <button
              onClick={() => setSelectedRiskLevel(null)}
              className={`p-6 rounded-2xl border-l-4 transition-all ${
                selectedRiskLevel === null
                  ? 'bg-slate-500/10 border-slate-500 ring-2 ring-slate-500/20'
                  : 'bg-slate-800 border-slate-500 hover:bg-slate-700'
              }`}
            >
              <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">All Employees</p>
              <p className="text-3xl font-bold mt-1 text-slate-400">{employeeData.length}</p>
              <p className="text-xs text-slate-500 mt-2">View all risk categories</p>
            </button>
          </div>

          {/* Selected Risk Level Table */}
          <div className="space-y-4">
            {selectedRiskLevel ? (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Showing {selectedRiskLevel} Risk Employees</h3>
                  <button
                    onClick={() => setSelectedRiskLevel(null)}
                    className="text-slate-400 hover:text-slate-300 text-sm"
                  >
                    Clear Selection
                  </button>
                </div>
                {(() => {
                  const employees = getEmployeesForRiskLevel(selectedRiskLevel);
                  if (employees.length === 0) {
                    return (
                      <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 text-center">
                        <p className="text-slate-400">No employees found in the {selectedRiskLevel} risk category.</p>
                      </div>
                    );
                  }
                  return renderEmployeeTable(employees, selectedRiskLevel);
                })()}
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">All Employees</h3>
                </div>
                {employeeData.length === 0 ? (
                  <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 text-center">
                    <p className="text-slate-400">No employee data available.</p>
                  </div>
                ) : (
                  renderEmployeeTable(employeeData, null)
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Results;
