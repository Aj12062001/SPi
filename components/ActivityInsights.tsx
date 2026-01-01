import React, { useMemo } from 'react';
import { ActivityStats } from '../types';
import '../styles/ActivityInsights.css';

interface ActivityInsightsProps {
  stats: ActivityStats;
  userName: string;
  isAnomalous?: boolean;
}

const ActivityInsights: React.FC<ActivityInsightsProps> = ({ stats, userName, isAnomalous = false }) => {
  const calculateAnomalyRate = useMemo(() => {
    if (stats.totalActivities === 0) return 0;
    return Math.round((stats.anomalousActivities / stats.totalActivities) * 100);
  }, [stats]);

  const getAnomalyLevelColor = useMemo(() => {
    if (calculateAnomalyRate > 50) return '#d32f2f';
    if (calculateAnomalyRate > 30) return '#f57c00';
    if (calculateAnomalyRate > 10) return '#fbc02d';
    return '#388e3c';
  }, [calculateAnomalyRate]);

  return (
    <div className="activity-insights">
      <div className="insights-header">
        <h2>Activity Insights - {userName}</h2>
        {isAnomalous && <span className="anomaly-warning">⚠️ Anomalous Activity Detected</span>}
      </div>

      <div className="insights-grid">
        {/* Anomaly Rate */}
        <div className="insight-card anomaly-rate">
          <div className="card-header">Anomaly Rate</div>
          <div className="card-body">
            <div className="anomaly-meter">
              <div
                className="anomaly-fill"
                style={{
                  width: `${calculateAnomalyRate}%`,
                  backgroundColor: getAnomalyLevelColor,
                }}
              />
            </div>
            <div className="card-stat">{calculateAnomalyRate}%</div>
            <div className="card-label">{stats.anomalousActivities} of {stats.totalActivities}</div>
          </div>
        </div>

        {/* File Operations */}
        <div className="insight-card">
          <div className="card-header">📂 File Operations</div>
          <div className="card-body">
            <div className="stat-row">
              <span>Opened:</span>
              <strong>{stats.filesOpened}</strong>
            </div>
            <div className="stat-row">
              <span>Deleted:</span>
              <strong>{stats.filesDeleted}</strong>
            </div>
            <div className="stat-row">
              <span>Copied:</span>
              <strong>{stats.filesCopied}</strong>
            </div>
          </div>
        </div>

        {/* USB Activity */}
        <div className="insight-card">
          <div className="card-header">🔌 USB Activity</div>
          <div className="card-body">
            <div className="card-stat">{stats.usbConnections}</div>
            <div className="card-label">USB Connections</div>
          </div>
        </div>

        {/* Email Activity */}
        <div className="insight-card">
          <div className="card-header">📧 Email Activity</div>
          <div className="card-body">
            <div className="card-stat">{stats.emailsSent}</div>
            <div className="card-label">Emails Sent</div>
          </div>
        </div>

        {/* Login Statistics */}
        <div className="insight-card">
          <div className="card-header">🔓 Login Statistics</div>
          <div className="card-body">
            <div className="card-stat">{stats.loginCount}</div>
            <div className="card-label">Logins</div>
            <div className="card-stat-secondary">{stats.sessionDuration.toFixed(0)} min session</div>
          </div>
        </div>

        {/* Activity Duration */}
        <div className="insight-card">
          <div className="card-header">⏱️ Average Duration</div>
          <div className="card-body">
            <div className="card-stat">{stats.averageActivityDuration.toFixed(2)}</div>
            <div className="card-label">Seconds per Activity</div>
          </div>
        </div>

        {/* Total Activities */}
        <div className="insight-card">
          <div className="card-header">📊 Total Activities</div>
          <div className="card-body">
            <div className="card-stat">{stats.totalActivities}</div>
            <div className="card-label">Activities Logged</div>
          </div>
        </div>

        {/* Peak Activity Time */}
        <div className="insight-card">
          <div className="card-header">🕐 Peak Activity Time</div>
          <div className="card-body">
            <div className="card-stat">{stats.peakActivityTime}</div>
            <div className="card-label">Most Active Hour</div>
          </div>
        </div>
      </div>

      {/* Risk Summary */}
      <div className="risk-summary">
        <h3>Activity Risk Assessment</h3>
        <div className="risk-indicators">
          {stats.filesOpened > 100 && (
            <div className="risk-indicator warning">
              ⚠️ High file access frequency ({stats.filesOpened} files)
            </div>
          )}
          {stats.filesDeleted > 20 && (
            <div className="risk-indicator danger">
              🚨 Significant file deletion activity ({stats.filesDeleted} files)
            </div>
          )}
          {stats.usbConnections > 5 && (
            <div className="risk-indicator warning">
              ⚠️ Multiple USB connections detected ({stats.usbConnections})
            </div>
          )}
          {stats.emailsSent > 50 && (
            <div className="risk-indicator warning">
              ⚠️ High email sending volume ({stats.emailsSent} emails)
            </div>
          )}
          {stats.anomalousActivities > 10 && (
            <div className="risk-indicator danger">
              🚨 Multiple anomalies detected ({stats.anomalousActivities})
            </div>
          )}
          {calculateAnomalyRate < 10 && stats.anomalousActivities === 0 && (
            <div className="risk-indicator safe">
              ✅ Activity appears normal
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityInsights;
