import { EmployeeRisk, RiskAssessment, RiskLevel, ActivityLog } from '../types';
import { getHighSeverityActivities, getAnomalousActivities } from './activityTracker';

/**
 * Calculate overall risk score based on CSV features
 */
export const calculateRiskScore = (employee: EmployeeRisk): number => {
  const safe = (value: number | undefined, fallback = 0) => (Number.isFinite(value) ? (value as number) : fallback);

  const loginCount = safe(employee.login_count);
  const nightLogins = safe(employee.night_logins);
  const usbCount = safe(employee.usb_count);
  const fileActivity = safe(employee.file_activity_count);
  const modelRisk = safe(employee.risk_score);

  const fileActivityRisk = Math.min(35, fileActivity * 0.05);
  const usbActivityRisk = Math.min(25, usbCount * 0.08);
  const nightLoginRisk = Math.min(20, nightLogins * 0.5);
  const loginVolumeRisk = Math.min(10, Math.max(loginCount - 150, 0) * 0.05);
  const anomalyBoost = employee.anomaly_label === -1 ? 10 : 0;

  const score = modelRisk * 0.25 + fileActivityRisk + usbActivityRisk + nightLoginRisk + loginVolumeRisk + anomalyBoost;
  
  // Debug first few employees
  if (Math.random() < 0.01) {
    console.log(`📊 Risk Score for ${employee.user}: ${score} (modelRisk=${modelRisk}, fileRisk=${fileActivityRisk}, usbRisk=${usbActivityRisk})`);
  }

  return Math.round(score * 100) / 100;
};

/**
 * Determine risk level from score
 */
export const getRiskLevel = (score: number): RiskLevel => {
  if (score >= 60) return RiskLevel.HIGH;
  if (score >= 30) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
};

/**
 * Calculate behavioral anomaly score
 */
export const calculateBehavioralAnomalyScore = (employee: EmployeeRisk): number => {
  const personalityScores = [employee.O, employee.C, employee.E, employee.A, employee.N]
    .filter((v) => Number.isFinite(v)) as number[];

  if (personalityScores.length === 0) {
    const baseline = employee.risk_score || 0;
    const nightBoost = Math.min(30, (employee.night_logins || 0) * 0.6);
    return Math.min(100, baseline + nightBoost);
  }

  const avgPersonality = personalityScores.reduce((a, b) => a + b, 0) / personalityScores.length;
  const personalityDeviation = personalityScores.reduce((sum, score) => sum + Math.abs(score - avgPersonality), 0) / personalityScores.length;
  const anomalyBoost = employee.anomaly_label === -1 ? 8 : 0;

  return Math.min(100, personalityDeviation * 1.2 + (employee.risk_score || 0) * 0.6 + anomalyBoost);
};

/**
 * Generate comprehensive risk assessment
 */
export const generateRiskAssessment = (
  employee: EmployeeRisk,
  activityLogs: ActivityLog[] = []
): RiskAssessment => {
  const overallRiskScore = calculateRiskScore(employee);
  const riskLevel = getRiskLevel(overallRiskScore);
  
  // Component risk scores
  const fileActivityRisk = Math.min(100, (employee.file_activity_count || employee.file_events || 0) * 0.25);
  const loginPatternRisk = Math.min(100, Math.abs((employee.login_count || 0) - (employee.night_logins || 0)) * 0.8);
  const usbActivityRisk = Math.min(100, (employee.usb_count || employee.usb_connect || 0) * 0.6);
  const emailActivityRisk = Math.min(100, (employee.external_mails || 0) * 0.5);
  const behavioralRisk = calculateBehavioralAnomalyScore(employee);

  // Get activity-based flags
  const userActivityLogs = activityLogs.filter(log => log.userId === employee.user);
  const anomalousActivities = userActivityLogs.filter(log => log.isAnomalous);
  const highSeverityActivities = userActivityLogs.filter(
    log => log.severity === 'high' || log.severity === 'critical'
  );

  // Generate recommendations
  const recommendations: string[] = [];

  if (fileActivityRisk > 70) {
    recommendations.push('Monitor file access patterns - unusually high file operations detected');
  }
  if (usbActivityRisk > 60) {
    recommendations.push('USB device connections exceed normal baseline - investigate data transfer');
  }
  if (emailActivityRisk > 50) {
    recommendations.push('External email communication is elevated - review recipients');
  }
  if (loginPatternRisk > 50) {
    recommendations.push('Unusual login patterns detected - verify authentication methods');
  }
  if (anomalousActivities.length > 5) {
    recommendations.push(`${anomalousActivities.length} anomalous activities detected in recent logs`);
  }
  if (behavioralRisk > 70) {
    recommendations.push('Behavioral profile deviates significantly from baseline');
  }
  if (employee.anomaly_label === -1) {
    recommendations.push('Machine learning model flagged this user - priority review recommended');
  }

  if (recommendations.length === 0) {
    recommendations.push('No significant risk indicators detected');
  }

  const assessment: RiskAssessment = {
    user: employee.user,
    overallRiskScore: Math.round(overallRiskScore * 100) / 100,
    riskLevel,
    fileActivityRisk: Math.round(fileActivityRisk * 100) / 100,
    loginPatternRisk: Math.round(loginPatternRisk * 100) / 100,
    usbActivityRisk: Math.round(usbActivityRisk * 100) / 100,
    emailActivityRisk: Math.round(emailActivityRisk * 100) / 100,
    behavioralRisk: Math.round(behavioralRisk * 100) / 100,
    anomalyScore: employee.risk_score,
    flaggedActivities: [...anomalousActivities, ...highSeverityActivities].slice(0, 20),
    recommendations,
    lastUpdated: new Date().toISOString(),
  };

  return assessment;
};

/**
 * Get risk trend over time
 */
export const calculateRiskTrend = (
  employees: EmployeeRisk[],
  days: number = 7
): { date: string; averageRisk: number; highRiskCount: number }[] => {
  // Group by date and calculate average risk
  const riskByDate: { [key: string]: number[] } = {};

  const datedEmployees = employees.map((emp, idx) => {
    if (emp.date) return emp;
    const syntheticDate = new Date();
    syntheticDate.setDate(syntheticDate.getDate() - (idx % days));
    return { ...emp, date: syntheticDate.toISOString().slice(0, 10) };
  });

  datedEmployees.forEach(emp => {
    const dateKey = emp.date || new Date().toISOString().slice(0, 10);
    if (!riskByDate[dateKey]) {
      riskByDate[dateKey] = [];
    }
    riskByDate[dateKey].push(calculateRiskScore(emp));
  });

  return Object.entries(riskByDate)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-days)
    .map(([date, scores]) => ({
      date,
      averageRisk: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
      highRiskCount: scores.filter(score => score >= 60).length,
    }));
};

/**
 * Compare employee risk against peer group
 */
export const compareRiskToGroup = (
  targetEmployee: EmployeeRisk,
  peerGroup: EmployeeRisk[]
): {
  userRisk: number;
  groupAverage: number;
  percentile: number;
  classification: 'below_average' | 'average' | 'above_average';
} => {
  const userRisk = calculateRiskScore(targetEmployee);
  const groupRisks = peerGroup.map(emp => calculateRiskScore(emp));
  const groupAverage = groupRisks.reduce((a, b) => a + b, 0) / groupRisks.length;
  
  const higherCount = groupRisks.filter(risk => risk > userRisk).length;
  const percentile = Math.round((higherCount / groupRisks.length) * 100);

  let classification: 'below_average' | 'average' | 'above_average';
  if (userRisk < groupAverage * 0.8) {
    classification = 'below_average';
  } else if (userRisk > groupAverage * 1.2) {
    classification = 'above_average';
  } else {
    classification = 'average';
  }

  return {
    userRisk: Math.round(userRisk * 100) / 100,
    groupAverage: Math.round(groupAverage * 100) / 100,
    percentile,
    classification,
  };
};

/**
 * Identify at-risk users
 */
export const identifyAtRiskUsers = (
  employees: EmployeeRisk[],
  threshold: number = 60
): EmployeeRisk[] => {
  return employees
    .map(emp => ({
      ...emp,
      _riskScore: calculateRiskScore(emp),
    }))
    .filter(emp => emp._riskScore >= threshold)
    .sort((a, b) => b._riskScore - a._riskScore);
};

/**
 * Generate risk mitigation recommendations
 */
export const generateMitigationRecommendations = (
  assessment: RiskAssessment
): string[] => {
  const recommendations: string[] = [];

  if (assessment.riskLevel === RiskLevel.HIGH) {
    recommendations.push('🔴 HIGH RISK: Immediate investigation required');
    recommendations.push('Increase monitoring and review access permissions');
  } else if (assessment.riskLevel === RiskLevel.MEDIUM) {
    recommendations.push('🟡 MEDIUM PRIORITY: Schedule review with supervisor');
    recommendations.push('Increase monitoring frequency');
  }

  if (assessment.fileActivityRisk > 70) {
    recommendations.push('Restrict file transfer capabilities');
    recommendations.push('Implement stricter file access controls');
  }

  if (assessment.usbActivityRisk > 60) {
    recommendations.push('Disable USB ports or require approval');
    recommendations.push('Monitor all USB device activities');
  }

  if (assessment.emailActivityRisk > 50) {
    recommendations.push('Review external email distribution lists');
    recommendations.push('Implement email content inspection');
  }

  recommendations.push('Schedule user awareness training');
  recommendations.push('Review access permissions and roles');

  return recommendations;
};

/**
 * Predict future risk based on trend
 */
export const predictRiskTrend = (
  riskHistory: { date: string; risk: number }[]
): 'increasing' | 'decreasing' | 'stable' => {
  if (riskHistory.length < 2) return 'stable';

  const recent = riskHistory.slice(-7);
  const earlyAverage = recent.slice(0, 3).reduce((a, b) => a + b.risk, 0) / 3;
  const lateAverage = recent.slice(-3).reduce((a, b) => a + b.risk, 0) / 3;

  const difference = lateAverage - earlyAverage;

  if (difference > 5) return 'increasing';
  if (difference < -5) return 'decreasing';
  return 'stable';
};
