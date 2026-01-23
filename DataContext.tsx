import React, { createContext, useContext, useState, useEffect } from 'react';
import { EmployeeRisk, RiskAssessment, ActivityLog } from './types';
import { generateRiskAssessment, identifyAtRiskUsers, calculateRiskTrend } from './utils/riskAnalysis';
import { getActivityStats } from './utils/activityTracker';

// Compact mock data aligned to upload schema
const ENHANCED_EMPLOYEE_DATA: EmployeeRisk[] = [
  {
    user: "AAE0190",
    employee_name: "August Armando Evans",
    date: "2024-11-10",
    login_count: 385,
    night_logins: 12,
    usb_count: 24,
    file_activity_count: 640,
    anomaly_label: 1,
    risk_score: 64.02
  },
  {
    user: "AAF0535",
    employee_name: "Anna Anderson",
    date: "2024-11-11",
    login_count: 328,
    night_logins: 5,
    usb_count: 346,
    file_activity_count: 357,
    anomaly_label: -1,
    risk_score: 77.37
  },
  {
    user: "ABC0174",
    employee_name: "Bob Clarke",
    date: "2024-11-12",
    login_count: 649,
    night_logins: 8,
    usb_count: 642,
    file_activity_count: 589,
    anomaly_label: -1,
    risk_score: 78.63
  },
  {
    user: "ACC0042",
    employee_name: "Chandra Costa",
    date: "2024-11-13",
    login_count: 1510,
    night_logins: 455,
    usb_count: 72,
    file_activity_count: 124,
    anomaly_label: 1,
    risk_score: 92.46
  },
  {
    user: "LOW0001",
    employee_name: "Low Baseline",
    date: "2024-11-14",
    login_count: 100,
    night_logins: 0,
    usb_count: 0,
    file_activity_count: 5,
    anomaly_label: 1,
    risk_score: 12.5
  }
];

interface DataContextType {
  employeeData: EmployeeRisk[];
  setEmployeeData: (data: EmployeeRisk[]) => void;
  riskAssessments: Map<string, RiskAssessment>;
  activityLogs: ActivityLog[];
  logUserActivity: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  getEmployeeRiskAssessment: (userId: string) => RiskAssessment | null;
  getAtRiskUsers: () => EmployeeRisk[];
  getRiskTrend: (days?: number) => any[];
  getUserActivityStats: (userId: string, hours?: number) => any;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employeeData, setEmployeeDataState] = useState<EmployeeRisk[]>(ENHANCED_EMPLOYEE_DATA);
  const [riskAssessments, setRiskAssessments] = useState<Map<string, RiskAssessment>>(new Map());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedEmployees = localStorage.getItem('employeeData');
    const storedActivities = localStorage.getItem('activityLogs');

    if (storedEmployees) {
      try {
        setEmployeeDataState(JSON.parse(storedEmployees));
      } catch (error) {
        console.error('Error loading employee data:', error);
      }
    }

    if (storedActivities) {
      try {
        setActivityLogs(JSON.parse(storedActivities));
      } catch (error) {
        console.error('Error loading activity logs:', error);
      }
    }

    // Generate initial risk assessments
    generateAssessments(employeeData);
  }, []);

  // Update risk assessments when employee data changes
  useEffect(() => {
    generateAssessments(employeeData);
  }, [employeeData]);

  const generateAssessments = (employees: EmployeeRisk[]) => {
    const newAssessments = new Map<string, RiskAssessment>();
    employees.forEach(emp => {
      const assessment = generateRiskAssessment(emp, activityLogs);
      newAssessments.set(emp.user, assessment);
    });
    setRiskAssessments(newAssessments);
  };

  const setEmployeeData = (data: EmployeeRisk[]) => {
    setEmployeeDataState(data);
    localStorage.setItem('employeeData', JSON.stringify(data));
  };

  const logUserActivity = (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newActivity: ActivityLog = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    const updatedLogs = [...activityLogs, newActivity];
    setActivityLogs(updatedLogs);
    localStorage.setItem('activityLogs', JSON.stringify(updatedLogs));

    // Update risk assessment for this user
    const emp = employeeData.find(e => e.user === activity.userId);
    if (emp) {
      const assessment = generateRiskAssessment(emp, updatedLogs);
      setRiskAssessments(prev => new Map(prev).set(emp.user, assessment));
    }
  };

  const getEmployeeRiskAssessment = (userId: string): RiskAssessment | null => {
    return riskAssessments.get(userId) || null;
  };

  const getAtRiskUsers = (): EmployeeRisk[] => {
    return identifyAtRiskUsers(employeeData, 60);
  };

  const getRiskTrend = (days: number = 7) => {
    return calculateRiskTrend(employeeData, days);
  };

  const getUserActivityStats = (userId: string, hours: number = 24) => {
    return getActivityStats(userId, hours);
  };

  return (
    <DataContext.Provider
      value={{
        employeeData,
        setEmployeeData,
        riskAssessments,
        activityLogs,
        logUserActivity,
        getEmployeeRiskAssessment,
        getAtRiskUsers,
        getRiskTrend,
        getUserActivityStats,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};