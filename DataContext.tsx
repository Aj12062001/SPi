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

const mapOperationToActivityType = (operation?: string): ActivityLog['activityType'] => {
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

const buildActivitiesFromOperationDetails = (employee: EmployeeRisk, limit = 60): ActivityLog[] => {
  try {
    const raw = employee.file_operations_detail;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, limit).map((op: any, index: number) => {
      const activityType = mapOperationToActivityType(op?.operation);
      const operation = String(op?.operation || '').toLowerCase();
      const isAnomalous = Boolean(op?.is_sensitive) || operation === 'delete' || employee.risk_score >= 75;
      const severity: ActivityLog['severity'] = isAnomalous
        ? (employee.risk_score >= 85 ? 'critical' : 'high')
        : 'low';

      return {
        id: `op_${employee.user}_${index}`,
        userId: employee.user,
        timestamp: op?.timestamp ? new Date(op.timestamp).toISOString() : new Date().toISOString(),
        activityType,
        severity,
        isAnomalous,
        details: {
          fileName: op?.file_name,
          fileSize: typeof op?.file_size === 'number' ? op.file_size : undefined,
          system: op?.system,
          isSensitive: Boolean(op?.is_sensitive),
          operation: op?.operation,
          databaseName: employee.primary_database,
          queryCount: employee.database_query_count,
        },
        duration: Math.max(10, Math.round((employee.session_duration_avg || 0) * 60)),
      };
    });
  } catch {
    return [];
  }
};

// Generate mock activity data for employees (optimized for speed and low memory)
const generateMockActivities = (employees: EmployeeRisk[]): ActivityLog[] => {
  // For very large datasets, skip activity generation to save memory
  if (employees.length > 100) {
    console.log('⏩ Skipping activity generation for large dataset');
    return [];
  }
  
  const activities: ActivityLog[] = [];
  const activityTypes: ActivityLog['activityType'][] = [
    'file_opened', 'file_deleted', 'file_copied', 'file_modified', 'file_accessed',
    'usb_connected', 'usb_disconnected', 'email_sent', 'login', 'logout'
  ];
  const severities: ActivityLog['severity'][] = ['low', 'medium', 'high', 'critical'];

  console.log('🔨 Generating activities for', employees.length, 'employees...');

  // Generate activities for each employee (reduced for faster processing)
  employees.forEach((emp, empIndex) => {
    const detailedActivities = buildActivitiesFromOperationDetails(emp, 30);
    if (detailedActivities.length > 0) {
      activities.push(...detailedActivities);
      return;
    }

    // Minimal activities per employee for performance
    const activitiesPerEmployee = Math.min(15, emp.file_activity_count || 10);
    const baseDate = emp.date ? new Date(emp.date) : new Date();

    for (let i = 0; i < activitiesPerEmployee; i++) {
      const daysBack = Math.floor(Math.random() * 7);
      const timestamp = new Date(baseDate);
      timestamp.setDate(timestamp.getDate() - daysBack);
      timestamp.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const isAnomalous = (emp.anomaly_label === 1 || emp.risk_score > 70) && Math.random() > 0.7;
      
      const severity: ActivityLog['severity'] = isAnomalous 
        ? severities[Math.floor(Math.random() * 2) + 2] // high or critical for anomalies
        : severities[Math.floor(Math.random() * 2)]; // low or medium for normal

      const details: ActivityLog['details'] = {};

      if (activityType === 'file_opened' || activityType === 'file_deleted' || 
          activityType === 'file_copied' || activityType === 'file_modified' || activityType === 'file_accessed') {
        const fileNames = ['report.pdf', 'data.xlsx', 'credentials.txt', 'confidential.doc', 'config.json', 'database.sql', 'archive.zip', 'analysis.ppt'];
        details.fileName = fileNames[Math.floor(Math.random() * fileNames.length)];
        details.fileSize = Math.floor(Math.random() * 5000000) + 1000;
        details.filePath = `C:\\Users\\${emp.user}\\Documents\\${details.fileName}`;
        details.isSensitive = Math.random() > 0.6;
      } else if (activityType === 'usb_connected' || activityType === 'usb_disconnected') {
        details.usbName = `USB_Device_${Math.floor(Math.random() * 10)}`;
      } else if (activityType === 'email_sent') {
        details.emailRecipients = Math.floor(Math.random() * 5) + 1;
      }

      activities.push({
        id: `activity_${emp.user}_${i}_${empIndex}`,
        userId: emp.user,
        timestamp: timestamp.toISOString(),
        activityType,
        severity,
        isAnomalous,
        details,
        duration: Math.floor(Math.random() * 300) + 10
      });
    }
  });

  // Sort by timestamp descending
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const ENHANCED_ACTIVITY_DATA = generateMockActivities(ENHANCED_EMPLOYEE_DATA);

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
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(ENHANCED_ACTIVITY_DATA);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedEmployees = localStorage.getItem('employeeData');
    const storedActivities = localStorage.getItem('activityLogs');

    if (storedEmployees) {
      try {
        const parsed = JSON.parse(storedEmployees);
        console.log('✅ Loaded employees from localStorage:', parsed.length);
        setEmployeeDataState(parsed);
      } catch (error) {
        console.error('❌ Error loading employee data:', error);
      }
    }

    if (storedActivities) {
      try {
        const activities = JSON.parse(storedActivities);
        console.log('✅ Loaded activity logs from localStorage:', activities.length);
        setActivityLogs(activities);
      } catch (error) {
        console.error('Error loading activity logs:', error);
        setActivityLogs(ENHANCED_ACTIVITY_DATA);
      }
    } else {
      // If no stored activities, use the generated mock data
      console.log('📋 Initialized with mock activity data:', ENHANCED_ACTIVITY_DATA.length, 'activities');
    }
  }, []);

  // Update risk assessments when employee data or activity logs change
  useEffect(() => {
    if (employeeData.length > 0) {
      console.log('🔄 Generating risk assessments for', employeeData.length, 'employees');
      generateAssessmentsBatched(employeeData);
    }
  }, [employeeData, activityLogs]);

  const generateAssessmentsBatched = (employees: EmployeeRisk[]) => {
    const newAssessments = new Map<string, RiskAssessment>();
    const startTime = performance.now();
    
    console.log('🚀 Starting risk assessment generation for', employees.length, 'employees');
    
    // For low-memory systems, process in very large batches and skip activity logs
    const BATCH_SIZE = employees.length > 100 ? 1000 : 200;
    let processedCount = 0;

    const processBatch = (startIdx: number) => {
      try {
        const endIdx = Math.min(startIdx + BATCH_SIZE, employees.length);
        
        // Always skip activity logs for bulk uploads to speed up processing
        const logsForAssessment: ActivityLog[] = [];
        
        for (let i = startIdx; i < endIdx; i++) {
          const emp = employees[i];
          try {
            const assessment = generateRiskAssessment(emp, logsForAssessment);
            newAssessments.set(emp.user, assessment);
          } catch (error) {
            console.error('⚠️ Error assessing employee', emp.user, error);
            // Continue with other employees even if one fails
          }
          processedCount++;
        }

        // Log progress
        const progress = Math.round((processedCount / employees.length) * 100);
        console.log(`⚡ Risk assessments: ${processedCount}/${employees.length} (${progress}%)`);

        if (endIdx < employees.length) {
          // Use setTimeout(0) for better compatibility on low-memory systems
          setTimeout(() => processBatch(endIdx), 0);
        } else {
          const elapsed = performance.now() - startTime;
          console.log(`✅ All ${employees.length} risk assessments generated in ${elapsed.toFixed(0)}ms`);
          setRiskAssessments(newAssessments);
        }
      } catch (error) {
        console.error('❌ Critical error in batch processing:', error);
        // Set whatever assessments we have so far
        setRiskAssessments(newAssessments);
      }
    };

    processBatch(0);
  };

  const createStorageSafeEmployees = (data: EmployeeRisk[]): EmployeeRisk[] => {
    return data.map((emp) => ({
      ...emp,
      file_operations_detail: emp.file_operations_detail
        ? (() => {
            try {
              const parsed = JSON.parse(emp.file_operations_detail);
              if (!Array.isArray(parsed)) return '';
              return JSON.stringify(parsed.slice(0, 20));
            } catch {
              return '';
            }
          })()
        : '',
    }));
  };

  const persistEmployeeDataSafely = (data: EmployeeRisk[]) => {
    try {
      localStorage.setItem('employeeData', JSON.stringify(data));
      return;
    } catch (error) {
      console.warn('⚠️ Full employee data too large for localStorage, saving compact snapshot only');
    }

    try {
      const compact = createStorageSafeEmployees(data);
      localStorage.setItem('employeeData', JSON.stringify(compact));
    } catch (error) {
      console.warn('⚠️ Compact employee data still too large; skipping employeeData localStorage persistence');
      localStorage.removeItem('employeeData');
    }
  };

  const setEmployeeData = (data: EmployeeRisk[]) => {
    console.log('📋 setEmployeeData called with', data.length, 'employees');
    setEmployeeDataState(data);
    persistEmployeeDataSafely(data);
    
    // For large datasets on low-memory systems, minimize activity generation
    if (data.length > 100) {
      // Skip activity generation for large datasets to save memory
      // Activities will be generated on-demand when viewing specific employees
      console.log('⚡ Large dataset detected - skipping bulk activity generation for performance');
      setActivityLogs([]);
      localStorage.setItem('activityLogs', JSON.stringify([]));
    } else {
      // Generate activities only for small datasets
      const newActivities = generateMockActivities(data);
      setActivityLogs(newActivities);
      try {
        localStorage.setItem('activityLogs', JSON.stringify(newActivities));
      } catch {
        console.warn('⚠️ Activity logs too large for localStorage; keeping in-memory only');
      }
      console.log('📋 Generated', newActivities.length, 'activity logs for', data.length, 'employees');
    }
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