import React, { createContext, useContext, useState, useEffect } from 'react';
import { EmployeeRisk } from './types';

const MOCK_EMPLOYEE_DATA: EmployeeRisk[] = [
  { user: "AAE0190", login_count: 385, night_logins: 0, usb_count: 0, file_activity_count: 0, anomaly_label: 1, risk_score: 64.02 },
  { user: "AAF0535", login_count: 328, night_logins: 0, usb_count: 346, file_activity_count: 357, anomaly_label: 1, risk_score: 77.37 },
  { user: "ABC0174", login_count: 649, night_logins: 0, usb_count: 642, file_activity_count: 589, anomaly_label: 1, risk_score: 78.63 },
  { user: "ACC0042", login_count: 1510, night_logins: 455, usb_count: 0, file_activity_count: 0, anomaly_label: 1, risk_score: 92.46 },
  { user: "AJF0370", login_count: 1816, night_logins: 485, usb_count: 4261, file_activity_count: 11053, anomaly_label: -1, risk_score: 113.38 },
  { user: "AIB0948", login_count: 649, night_logins: 0, usb_count: 2990, file_activity_count: 1669, anomaly_label: 1, risk_score: 95.32 },
  { user: "BJM0111", login_count: 481, night_logins: 42, usb_count: 2919, file_activity_count: 7841, anomaly_label: -1, risk_score: 102.47 },
  { user: "CCA0046", login_count: 1540, night_logins: 452, usb_count: 758, file_activity_count: 1678, anomaly_label: -1, risk_score: 103.61 },
  { user: "AIP0982", login_count: 559, night_logins: 0, usb_count: 366, file_activity_count: 6182, anomaly_label: 1, risk_score: 95.57 },
  { user: "ANM0123", login_count: 82, night_logins: 0, usb_count: 29, file_activity_count: 47, anomaly_label: 1, risk_score: 18.31 },
  { user: "ZSL0305", login_count: 385, night_logins: 0, usb_count: 0, file_activity_count: 0, anomaly_label: 1, risk_score: 24.02 },
  { user: "LOW0001", login_count: 100, night_logins: 0, usb_count: 0, file_activity_count: 5, anomaly_label: 1, risk_score: 12.50 },
  { user: "MED0001", login_count: 400, night_logins: 5, usb_count: 2, file_activity_count: 50, anomaly_label: 1, risk_score: 35.20 },
  { user: "GTD0219", login_count: 980, night_logins: 316, usb_count: 479, file_activity_count: 1281, anomaly_label: -1, risk_score: 101.53 },
  { user: "BSS0369", login_count: 1924, night_logins: 538, usb_count: 2740, file_activity_count: 2295, anomaly_label: -1, risk_score: 110.4 },
  { user: "HPH0075", login_count: 632, night_logins: 0, usb_count: 3180, file_activity_count: 9323, anomaly_label: 1, risk_score: 100.0 }
];

interface DataContextType {
  employeeData: EmployeeRisk[];
  setEmployeeData: (data: EmployeeRisk[]) => void;
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
  const [employeeData, setEmployeeData] = useState<EmployeeRisk[]>(MOCK_EMPLOYEE_DATA);

  useEffect(() => {
    // Load from localStorage if available
    const stored = localStorage.getItem('employeeData');
    if (stored) {
      try {
        setEmployeeData(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    }
  }, []);

  const updateData = (data: EmployeeRisk[]) => {
    setEmployeeData(data);
    localStorage.setItem('employeeData', JSON.stringify(data));
  };

  return (
    <DataContext.Provider value={{ employeeData, setEmployeeData: updateData }}>
      {children}
    </DataContext.Provider>
  );
};