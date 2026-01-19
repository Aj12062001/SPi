
import { EmployeeRisk } from './types';

// Load data from CSV
const loadEmployeeData = async (): Promise<EmployeeRisk[]> => {
  try {
    const response = await fetch('/final_insider_threat_report.csv');
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    const data: EmployeeRisk[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length === headers.length) {
        data.push({
          user: values[0],
          login_count: parseInt(values[1]),
          night_logins: parseInt(values[2]),
          usb_count: parseInt(values[3]),
          file_activity_count: parseInt(values[4]),
          anomaly_label: parseInt(values[5]),
          risk_score: parseFloat(values[6])
        });
      }
    }
    return data;
  } catch (error) {
    console.error('Error loading employee data:', error);
    return MOCK_EMPLOYEE_DATA;
  }
};

// For synchronous access, we'll use a promise that resolves to the data
let employeeDataPromise: Promise<EmployeeRisk[]> | null = null;

const getEmployeeData = (): Promise<EmployeeRisk[]> => {
  if (!employeeDataPromise) {
    employeeDataPromise = loadEmployeeData();
  }
  return employeeDataPromise;
};

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

export const EMPLOYEE_DATA = MOCK_EMPLOYEE_DATA; // Temporary, will be replaced with async loading
export { getEmployeeData };
