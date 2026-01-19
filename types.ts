
export interface EmployeeRisk {
  user: string;
  login_count: number;
  night_logins: number;
  usb_count: number;
  file_activity_count: number;
  anomaly_label: number;
  risk_score: number;
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
}
