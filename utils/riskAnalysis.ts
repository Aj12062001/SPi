import { EmployeeRisk, RiskAssessment, RiskLevel, ActivityLog, CCTVAccessLog, UnifiedSpyProfile } from '../types';
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
  const dbSessionDuration = safe(employee.database_session_duration);
  const dbQueryCount = safe(employee.database_query_count);
  const dbWriteOps = safe(employee.database_write_ops);
  const modelRisk = safe(employee.risk_score);

  const fileActivityRisk = Math.min(35, fileActivity * 0.05);
  const usbActivityRisk = Math.min(25, usbCount * 0.08);
  const nightLoginRisk = Math.min(20, nightLogins * 0.5);
  const loginVolumeRisk = Math.min(10, Math.max(loginCount - 150, 0) * 0.05);
  const dbSessionRisk = Math.min(8, dbSessionDuration * 0.02);
  const dbQueryRisk = Math.min(8, dbQueryCount * 0.004);
  const dbWriteRisk = Math.min(10, dbWriteOps * 0.02);
  const anomalyBoost = employee.anomaly_label === -1 ? 10 : 0;

  const score = modelRisk * 0.2 + fileActivityRisk + usbActivityRisk + nightLoginRisk + loginVolumeRisk + dbSessionRisk + dbQueryRisk + dbWriteRisk + anomalyBoost;

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
  if (score >= 80) return RiskLevel.CRITICAL;
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
  const databaseActivityRisk = Math.min(100,
    (employee.database_query_count || 0) * 0.03 +
    (employee.database_session_duration || 0) * 0.05 +
    (employee.database_write_ops || 0) * 0.08
  );
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
  if (databaseActivityRisk > 55) {
    recommendations.push('Database access volume is elevated - review query/write behavior and privileged access');
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
 * Calculate combined risk score integrating behavioral data and CCTV detection patterns
 */
export const calculateCombinedRiskScore = (
  behavioralRisk: number,
  cctvData: {
    detectionCount: number;
    avgConfidence: number;
    authorized: boolean;
    durationFrames: number;
    totalFrames: number;
  }
): {
  combinedScore: number;
  cctvRisk: number;
  breakdown: string[];
} => {
  const breakdown: string[] = [];

  // Detection frequency risk (0-30 points)
  const detectionFrequency = cctvData.detectionCount / (cctvData.totalFrames / 10);
  const frequencyRisk = Math.min(30, detectionFrequency * 100);
  if (frequencyRisk > 20) {
    breakdown.push(`High detection frequency: ${cctvData.detectionCount} detections`);
  }

  // Unauthorized access bonus (0-40 points)
  const unauthorizedBonus = cctvData.authorized ? 0 : 40;
  if (!cctvData.authorized) {
    breakdown.push('CRITICAL: Unauthorized person detected in restricted area');
  }

  // Low confidence risk - may indicate disguise or evasion (0-15 points)
  const lowConfidenceRisk = cctvData.avgConfidence < 0.7 ? 15 : 0;
  if (cctvData.avgConfidence < 0.7) {
    breakdown.push(`Low recognition confidence: ${Math.round(cctvData.avgConfidence * 100)}%`);
  }

  // Extended presence risk (0-15 points)
  const extendedPresenceRisk = Math.min(15, (cctvData.durationFrames / cctvData.totalFrames) * 30);
  if (extendedPresenceRisk > 10) {
    breakdown.push(`Extended presence detected across ${cctvData.durationFrames} frames`);
  }

  // Calculate CCTV risk component
  const cctvRisk = frequencyRisk + unauthorizedBonus + lowConfidenceRisk + extendedPresenceRisk;

  // Combine: 60% behavioral, 40% CCTV
  const combinedScore = Math.min(100, behavioralRisk * 0.6 + cctvRisk * 0.4);

  return {
    combinedScore: Math.round(combinedScore),
    cctvRisk: Math.round(cctvRisk),
    breakdown
  };
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

/**
 * Calculate access control risk from CCTV data
 */
export const calculateAccessRisk = (
  employee: EmployeeRisk,
  cctvLog: CCTVAccessLog | null
): { score: number; unauthorizedCount: number; times: string[]; factors: string[] } => {
  const factors: string[] = [];
  let unauthorizedCount = 0;
  let score = 0;
  const unauthorizedTimes: string[] = [];

  if (!cctvLog || cctvLog.accessEvents.length === 0) {
    return { score: 0, unauthorizedCount: 0, times: [], factors: [] };
  }

  // Find access events for this employee
  const employeeAccesses = cctvLog.accessEvents.filter(
    event => event.detectedPersonName === employee.employee_name || event.detectedPersonId === employee.user
  );

  if (employeeAccesses.length === 0) {
    // No CCTV record for this employee - high risk if they should be monitored
    if (employee.risk_score > 60) {
      factors.push('No CCTV record found despite high behavioral risk');
      score += 15;
    }
    return { score, unauthorizedCount, times: unauthorizedTimes, factors };
  }

  // Check for unauthorized accesses
  const unauthorizedAccesses = employeeAccesses.filter(event => !event.authorized);
  unauthorizedCount = unauthorizedAccesses.length;

  if (unauthorizedCount > 0) {
    unauthorizedAccesses.forEach(event => {
      unauthorizedTimes.push(event.timestamp);
      score += 25; // Each unauthorized access adds significant risk
      factors.push(`Unauthorized access at ${event.timestamp} (confidence: ${(event.confidence * 100).toFixed(0)}%)`);
    });
  }

  // Low confidence matches are also suspicious
  const lowConfidenceAccesses = employeeAccesses.filter(event => event.confidence < 0.7 && event.confidence > 0.3);
  if (lowConfidenceAccesses.length > 0) {
    score += lowConfidenceAccesses.length * 8;
    factors.push(`${lowConfidenceAccesses.length} low-confidence face matches detected`);
  }

  // Excessive access attempts (normal employees rarely appear multiple times on CCTV)
  if (employeeAccesses.length > 5) {
    score += 10;
    factors.push(`Excessive CCTV appearances (${employeeAccesses.length}x) - possible surveillance evasion`);
  }

  // Access outside business hours
  const nightAccesses = employeeAccesses.filter(event => {
    const hour = new Date(event.timestamp).getHours();
    return hour < 6 || hour > 20;
  });
  if (nightAccesses.length > 0) {
    score += nightAccesses.length * 12;
    factors.push(`${nightAccesses.length} access event(s) detected during off-hours`);
  }

  return {
    score: Math.min(100, score),
    unauthorizedCount,
    times: unauthorizedTimes,
    factors
  };
};

/**
 * Generate unified spy profile combining CSV + CCTV data
 */
export const generateSpyProfile = (
  employee: EmployeeRisk,
  cctvLog: CCTVAccessLog | null = null,
  activityLogs: ActivityLog[] = []
): UnifiedSpyProfile => {
  // CSV-based behavioral risk
  const csvRiskScore = calculateRiskScore(employee);
  const csvRiskLevel = getRiskLevel(csvRiskScore);

  const csvRiskFactors: string[] = [];
  if (employee.file_activity_count > 500) csvRiskFactors.push('Excessive file operations');
  if (employee.night_logins > 5) csvRiskFactors.push('Frequent night-time logins');
  if (employee.usb_count > 20) csvRiskFactors.push('High USB device usage');
  if (employee.external_mails || 0 > 50) csvRiskFactors.push('Excessive external email communication');
  if (employee.anomaly_label === -1) csvRiskFactors.push('ML model anomaly detection flag');

  // CCTV-based access risk
  const accessRisk = calculateAccessRisk(employee, cctvLog);
  const accessRiskFactors = accessRisk.factors;

  // Combine scores with weighted average
  // CSV contributes 60%, CCTV contributes 40% (CCTV is direct evidence)
  const combinedScore = (csvRiskScore * 0.6 + accessRisk.score * 0.4);

  // Determine suspiciousness level
  // CRITICAL: Any unauthorized access is automatically critical
  let suspiciousness: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (accessRisk.unauthorizedCount > 0) {
    suspiciousness = 'critical'; // FORCE CRITICAL for unauthorized access
  } else if (combinedScore >= 80) {
    suspiciousness = 'critical';
  } else if (combinedScore >= 60) {
    suspiciousness = 'high';
  } else if (combinedScore >= 40) {
    suspiciousness = 'medium';
  }

  // Spy score: probability this employee is an insider threat
  // Higher if both CSV and CCTV have red flags (convergent evidence)
  let spyScore = combinedScore;
  const bothFlagged = csvRiskScore >= 60 && accessRisk.score >= 30;
  const unauthorizedAccess = accessRisk.unauthorizedCount > 0;

  if (unauthorizedAccess) {
    spyScore = Math.max(95, spyScore); // CRITICAL: Unauthorized = minimum 95/100 score
    spyScore = Math.min(100, spyScore * 1.5); // Further boost
  } else if (bothFlagged) {
    spyScore = Math.min(100, spyScore * 1.3); // Boost if both systems flag
  }

  // Determine if suspect (both behavioral AND access red flags)
  const isSuspect = (csvRiskScore >= 60 && accessRisk.score >= 30) || unauthorizedAccess;

  // Consolidate evidence
  const evidence: string[] = [
    ...csvRiskFactors.map(f => `🟥 BEHAVIOR: ${f}`),
    ...accessRiskFactors.map(f => `🚨 ACCESS: ${f}`)
  ];

  // Generate actionable recommendations
  const recommendations: string[] = [];

  if (unauthorizedAccess) {
    recommendations.push('� CRITICAL ALERT: UNAUTHORIZED ACCESS DETECTED');
    recommendations.push('🔴 IMMEDIATE ACTION: Suspend all access credentials and badges');
    recommendations.push('📹 URGENT: Review complete CCTV footage for breach timeline');
    recommendations.push('👮 SECURITY: Contact security team and law enforcement immediately');
    recommendations.push('📝 FORENSICS: Preserve all digital evidence, logs, and access records');
  }

  if (csvRiskScore >= 70) {
    recommendations.push('Escalate to management: Behavioral pattern matches insider threat profile');
  }

  if (accessRisk.score >= 60) {
    recommendations.push('Review CCTV logs: Multiple suspicious access patterns detected');
  }

  if (bothFlagged) {
    recommendations.push('🚨 HIGH PRIORITY: Convergent evidence from behavioral + physical access - full investigation required');
  }

  recommendations.push('Preserve all digital evidence: logs, emails, file access history');
  recommendations.push('Interview supervisor and colleagues about any suspicious behavior');

  return {
    user: employee.user,
    employee_name: employee.employee_name || employee.user,
    department: employee.department,
    overallRiskScore: Math.round(combinedScore * 100) / 100,
    riskLevel: suspiciousness === 'critical' || suspiciousness === 'high' ? RiskLevel.HIGH : (suspiciousness === 'medium' ? RiskLevel.MEDIUM : RiskLevel.LOW),
    csvRiskScore: Math.round(csvRiskScore * 100) / 100,
    csvRiskFactors,
    accessRiskScore: Math.round(accessRisk.score * 100) / 100,
    unauthorizedAccessCount: accessRisk.unauthorizedCount,
    unauthorizedAccessTimes: accessRisk.times,
    accessRiskFactors,
    cctvFaceRiskScore: 0,
    cctvDetections: [],
    isSuspect,
    suspiciousness,
    spyScore: Math.round(spyScore * 100) / 100,
    evidence,
    recommendations
  };
};

/**
 * Identify spies from combined CSV + CCTV data
 */
export const identifySpies = (
  employees: EmployeeRisk[],
  cctvLogs: Map<string, CCTVAccessLog> = new Map()
): UnifiedSpyProfile[] => {
  const spyProfiles = employees
    .map(emp => {
      const cctvLog = cctvLogs.get(emp.user) || null;
      return generateSpyProfile(emp, cctvLog, []);
    })
    .filter(profile => profile.isSuspect || profile.spyScore >= 60)
    .sort((a, b) => b.spyScore - a.spyScore);

  return spyProfiles;
};

/**
 * Create summary report of potential threats
 */
export const generateThreatReport = (
  spyProfiles: UnifiedSpyProfile[]
): {
  totalSuspects: number;
  criticalThreats: UnifiedSpyProfile[];
  highThreats: UnifiedSpyProfile[];
  mediumThreats: UnifiedSpyProfile[];
  summary: string;
} => {
  const criticalThreats = spyProfiles.filter(p => p.suspiciousness === 'critical');
  const highThreats = spyProfiles.filter(p => p.suspiciousness === 'high');
  const mediumThreats = spyProfiles.filter(p => p.suspiciousness === 'medium');

  let summary = `INSIDER THREAT ANALYSIS REPORT\n`;
  summary += `Generated: ${new Date().toISOString()}\n\n`;
  summary += `THREAT SUMMARY:\n`;
  summary += `- Critical Threats: ${criticalThreats.length}\n`;
  summary += `- High Risk: ${highThreats.length}\n`;
  summary += `- Medium Risk: ${mediumThreats.length}\n`;
  summary += `- Total Suspects: ${spyProfiles.length}\n\n`;

  if (criticalThreats.length > 0) {
    summary += `🚨 CRITICAL THREATS:\n`;
    criticalThreats.forEach((threat, idx) => {
      summary += `${idx + 1}. ${threat.employee_name} (${threat.user})\n`;
      summary += `   Spy Score: ${threat.spyScore}/100\n`;
      summary += `   Behavioral Risk: ${threat.csvRiskScore}/100 | Access Risk: ${threat.accessRiskScore}/100\n`;
      summary += `   Status: ${threat.unauthorizedAccessCount > 0 ? '⚠️ UNAUTHORIZED ACCESS DETECTED' : 'Monitoring Required'}\n\n`;
    });
  }

  return {
    totalSuspects: spyProfiles.length,
    criticalThreats,
    highThreats,
    mediumThreats,
    summary
  };
};
