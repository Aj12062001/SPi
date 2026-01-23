
// ============ Core Employee Risk Data ============
export interface EmployeeRisk {
  user: string;
  employee_name?: string;
  department?: string;
  job_title?: string;
  date?: string;
  login_count: number;
  night_logins: number;
  unique_pcs?: number;
  usb_count: number;
  file_activity_count: number;
  file_deleted?: number;
  file_copied?: number;
  file_accessed?: number;
  emails_sent?: number;
  external_mails?: number;
  email_attachments?: number;
  http_requests?: number;
  unique_urls?: number;
  cctv_anomalies?: number;
  access_card_anomalies?: number;
  behavioral_score?: number;
  anomaly_label: number;
  risk_score: number;
  // Legacy compatibility fields
  logoff_count?: number;
  file_events?: number;
  unique_files?: number;
  avg_filename_length?: number;
  avg_email_size?: number;
  attachments?: number;
  usb_connect?: number;
  usb_disconnect?: number;
  O?: number;
  C?: number;
  E?: number;
  A?: number;
  N?: number;
}

// ============ Activity Tracking ============
export interface ActivityLog {
  id: string;
  userId: string;
  timestamp: string;
  activityType: 'file_opened' | 'file_deleted' | 'file_copied' | 'file_modified' | 'file_accessed' | 'usb_connected' | 'usb_disconnected' | 'email_sent' | 'login' | 'logout' | 'http_request';
  details: {
    fileName?: string;
    fileSize?: number;
    filePath?: string;
    usbName?: string;
    emailRecipients?: number;
    urlAccessed?: string;
    pcName?: string;
  };
  duration?: number; // in seconds
  isAnomalous: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ActivityStats {
  totalActivities: number;
  anomalousActivities: number;
  filesOpened: number;
  filesDeleted: number;
  filesCopied: number;
  usbConnections: number;
  emailsSent: number;
  loginCount: number;
  sessionDuration: number; // in minutes
  averageActivityDuration: number;
  peakActivityTime: string;
}

// ============ Risk Assessment ============
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface RiskAssessment {
  user: string;
  overallRiskScore: number;
  riskLevel: RiskLevel;
  fileActivityRisk: number;
  loginPatternRisk: number;
  usbActivityRisk: number;
  emailActivityRisk: number;
  behavioralRisk: number;
  anomalyScore: number;
  flaggedActivities: ActivityLog[];
  recommendations: string[];
  lastUpdated: string;
}

// ============ Analysis Features ============
export interface TimeSeriesData {
  timestamp: string;
  value: number;
  anomaly?: boolean;
}

export interface BehavioralProfile {
  userId: string;
  personalityScores: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  typicalLoginTime: string;
  typicalLogoutTime: string;
  averageLoginCount: number;
  averageFileOperations: number;
  normalEmailFrequency: number;
  deviations: string[];
}

// ============ Authentication ============
export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  role?: 'admin' | 'analyst' | 'user';
  permissions?: string[];
}
