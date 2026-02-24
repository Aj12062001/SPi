import { ActivityLog, ActivityStats } from '../types';

const ACTIVITY_STORAGE_KEY = 'spi_activity_logs';

/**
 * Log an activity for the user
 */
export const logActivity = (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
  const newActivity: ActivityLog = {
    ...activity,
    id: generateActivityId(),
    timestamp: new Date().toISOString(),
  };

  const existing = getActivityLogs();
  existing.push(newActivity);
  
  // Keep only last 10,000 activities to avoid storage limits
  if (existing.length > 10000) {
    existing.splice(0, existing.length - 10000);
  }
  
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(existing));
  return newActivity;
};

/**
 * Get all activity logs
 */
export const getActivityLogs = (): ActivityLog[] => {
  const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing activity logs:', error);
      return [];
    }
  }
  return [];
};

/**
 * Get activity logs for a specific user
 */
export const getUserActivityLogs = (userId: string): ActivityLog[] => {
  return getActivityLogs().filter(log => log.userId === userId);
};

/**
 * Get activity logs within a date range
 */
export const getActivityLogsByDateRange = (startDate: string, endDate: string): ActivityLog[] => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return getActivityLogs().filter(log => {
    const logTime = new Date(log.timestamp).getTime();
    return logTime >= start && logTime <= end;
  });
};

/**
 * Get activity statistics for a user
 */
export const getActivityStats = (userId: string, hoursBack: number = 24): ActivityStats => {
  const logs = getUserActivityLogs(userId);
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).getTime();
  const recentLogs = logs.filter(log => new Date(log.timestamp).getTime() >= cutoffTime);

  const stats: ActivityStats = {
    totalActivities: recentLogs.length,
    anomalousActivities: recentLogs.filter(log => log.isAnomalous).length,
    filesOpened: recentLogs.filter(log => log.activityType === 'file_opened').length,
    filesDeleted: recentLogs.filter(log => log.activityType === 'file_deleted').length,
    filesCopied: recentLogs.filter(log => log.activityType === 'file_copied').length,
    filesDownloaded: recentLogs.filter(log => log.activityType === 'file_downloaded').length,
    filesUploaded: recentLogs.filter(log => log.activityType === 'file_uploaded').length,
    filesEdited: recentLogs.filter(log => log.activityType === 'file_edited' || log.activityType === 'file_modified').length,
    sensitiveFilesAccessed: recentLogs.filter(log => Boolean(log.details?.isSensitive)).length,
    uniqueFilesAccessed: new Set(recentLogs.map(log => log.details?.fileName).filter(Boolean)).size,
    systemsAccessed: Array.from(new Set(recentLogs.map(log => log.details?.system).filter(Boolean) as string[])),
    usbConnections: recentLogs.filter(log => log.activityType === 'usb_connected').length,
    emailsSent: recentLogs.filter(log => log.activityType === 'email_sent').length,
    loginCount: recentLogs.filter(log => log.activityType === 'login').length,
    sessionDuration: calculateSessionDuration(recentLogs),
    databaseSessionDuration: 0,
    databaseQueries: 0,
    averageActivityDuration: calculateAverageActivityDuration(recentLogs),
    peakActivityTime: calculatePeakActivityTime(recentLogs),
  };

  return stats;
};

/**
 * Get anomalous activities for a user
 */
export const getAnomalousActivities = (userId: string): ActivityLog[] => {
  return getUserActivityLogs(userId).filter(log => log.isAnomalous);
};

/**
 * Get activities by type
 */
export const getActivitiesByType = (
  userId: string,
  activityType: ActivityLog['activityType']
): ActivityLog[] => {
  return getUserActivityLogs(userId).filter(log => log.activityType === activityType);
};

/**
 * Get high-severity activities
 */
export const getHighSeverityActivities = (userId: string): ActivityLog[] => {
  return getUserActivityLogs(userId).filter(
    log => log.severity === 'high' || log.severity === 'critical'
  );
};

/**
 * Delete activity logs older than specified days
 */
export const deleteOldActivityLogs = (daysOld: number): number => {
  const logs = getActivityLogs();
  const cutoffTime = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).getTime();
  const filtered = logs.filter(log => new Date(log.timestamp).getTime() > cutoffTime);
  const deletedCount = logs.length - filtered.length;
  
  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(filtered));
  return deletedCount;
};

/**
 * Clear all activity logs
 */
export const clearActivityLogs = (): void => {
  localStorage.removeItem(ACTIVITY_STORAGE_KEY);
};

// ============ Helper Functions ============

const generateActivityId = (): string => {
  return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const calculateSessionDuration = (logs: ActivityLog[]): number => {
  if (logs.length === 0) return 0;

  const loginTimes = logs
    .filter(log => log.activityType === 'login')
    .map(log => new Date(log.timestamp).getTime());

  const logoutTimes = logs
    .filter(log => log.activityType === 'logout')
    .map(log => new Date(log.timestamp).getTime());

  let totalDuration = 0;
  for (let i = 0; i < loginTimes.length; i++) {
    const logoutTime = logoutTimes[i] || Date.now();
    totalDuration += (logoutTime - loginTimes[i]) / (1000 * 60); // Convert to minutes
  }

  return totalDuration;
};

const calculateAverageActivityDuration = (logs: ActivityLog[]): number => {
  if (logs.length === 0) return 0;
  const activitiesWithDuration = logs.filter(log => log.duration !== undefined);
  if (activitiesWithDuration.length === 0) return 0;

  const totalDuration = activitiesWithDuration.reduce((sum, log) => sum + (log.duration || 0), 0);
  return totalDuration / activitiesWithDuration.length;
};

const calculatePeakActivityTime = (logs: ActivityLog[]): string => {
  if (logs.length === 0) return '00:00';

  const hourCounts: { [key: number]: number } = {};

  logs.forEach(log => {
    const hour = new Date(log.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const hourKeys = Object.keys(hourCounts).map(key => parseInt(key, 10));
  const peakHour = hourKeys.reduce((maxHour, hour) => {
    return hourCounts[hour] > hourCounts[maxHour] ? hour : maxHour;
  }, hourKeys[0]);

  return `${String(peakHour).padStart(2, '0')}:00`;
};

/**
 * Export activity logs as CSV
 */
export const exportActivityLogsAsCSV = (userId?: string): string => {
  const logs = userId ? getUserActivityLogs(userId) : getActivityLogs();
  
  if (logs.length === 0) return '';

  const headers = ['ID', 'User ID', 'Timestamp', 'Activity Type', 'Severity', 'Anomalous', 'Duration (s)'];
  const rows = logs.map(log => [
    log.id,
    log.userId,
    log.timestamp,
    log.activityType,
    log.severity,
    log.isAnomalous ? 'Yes' : 'No',
    log.duration || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
};

/**
 * Generate activity report summary
 */
export const generateActivityReport = (userId: string, hoursBack: number = 24): string => {
  const stats = getActivityStats(userId, hoursBack);
  const anomalies = getAnomalousActivities(userId);
  const highSeverity = getHighSeverityActivities(userId);

  const report = `
Activity Report for User: ${userId}
Generated: ${new Date().toISOString()}
Time Period: Last ${hoursBack} hours

=== ACTIVITY SUMMARY ===
Total Activities: ${stats.totalActivities}
Anomalous Activities: ${stats.anomalousActivities}
Files Opened: ${stats.filesOpened}
Files Deleted: ${stats.filesDeleted}
Files Copied: ${stats.filesCopied}
USB Connections: ${stats.usbConnections}
Emails Sent: ${stats.emailsSent}
Login Count: ${stats.loginCount}
Session Duration: ${stats.sessionDuration.toFixed(2)} minutes
Average Activity Duration: ${stats.averageActivityDuration.toFixed(2)} seconds
Peak Activity Time: ${stats.peakActivityTime}

=== HIGH-SEVERITY ACTIVITIES ===
Count: ${highSeverity.length}
${highSeverity.slice(0, 10).map(log => `  - ${log.timestamp}: ${log.activityType}`).join('\n')}
${highSeverity.length > 10 ? `  ... and ${highSeverity.length - 10} more` : ''}

=== ANOMALIES DETECTED ===
Count: ${anomalies.length}
${anomalies.slice(0, 10).map(log => `  - ${log.timestamp}: ${log.activityType}`).join('\n')}
${anomalies.length > 10 ? `  ... and ${anomalies.length - 10} more` : ''}
  `;

  return report;
};
