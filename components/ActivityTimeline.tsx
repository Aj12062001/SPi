import React, { useState, useMemo } from 'react';
import { ActivityLog } from '../types';
import '../styles/ActivityTimeline.css';

interface ActivityTimelineProps {
  activities: ActivityLog[];
  userId?: string;
  showSearch?: boolean;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities, userId, showSearch = false }) => {
  const [filter, setFilter] = useState<'all' | 'anomalous' | 'high-severity'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchType, setSearchType] = useState<'employee' | 'activity'>('employee');

  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (userId) {
      filtered = filtered.filter(a => a.userId === userId);
    }

    if (filter === 'anomalous') {
      filtered = filtered.filter(a => a.isAnomalous);
    } else if (filter === 'high-severity') {
      filtered = filtered.filter(a => a.severity === 'high' || a.severity === 'critical');
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity => {
        if (searchType === 'employee') {
          return activity.userId?.toLowerCase().includes(query) || false;
        } else {
          return activity.activityType?.toLowerCase().includes(query) || false;
        }
      });
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities, userId, filter, searchQuery, searchType]);

  const getActivityIcon = (type: ActivityLog['activityType']): string => {
    const icons: { [key: string]: string } = {
      file_opened: '📂',
      file_deleted: '🗑️',
      file_copied: '📋',
      file_modified: '✏️',
      file_accessed: '👁️',
      usb_connected: '🔌',
      usb_disconnected: '🔌❌',
      email_sent: '📧',
      login: '🔓',
      logout: '🔒',
      http_request: '🌐',
    };
    return icons[type] || '📌';
  };

  const getSeverityColor = (severity: ActivityLog['severity']): string => {
    switch (severity) {
      case 'critical':
        return '#d32f2f';
      case 'high':
        return '#f57c00';
      case 'medium':
        return '#fbc02d';
      case 'low':
        return '#388e3c';
      default:
        return '#1976d2';
    }
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="activity-timeline">
      <div className="activity-header">
        <h3>Activity Timeline</h3>
        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({activities.length})
          </button>
          <button
            className={filter === 'anomalous' ? 'active' : ''}
            onClick={() => setFilter('anomalous')}
          >
            Anomalous ({activities.filter(a => a.isAnomalous).length})
          </button>
          <button
            className={filter === 'high-severity' ? 'active' : ''}
            onClick={() => setFilter('high-severity')}
          >
            High Severity ({activities.filter(a => a.severity === 'high' || a.severity === 'critical').length})
          </button>
        </div>
      </div>

      {/* Search Employee Activity Section */}
      {showSearch && (
        <div className="search-employee-activity">
          <div className="search-container">
            <div className="search-input-group">
              <input
                type="text"
                placeholder={searchType === 'employee' ? 'Search employee ID...' : 'Search activity type...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'employee' | 'activity')}
                className="search-type-select"
              >
                <option value="employee">Search by Employee</option>
                <option value="activity">Search by Activity</option>
              </select>
              <button
                onClick={() => setSearchQuery('')}
                className="clear-search-btn"
                style={{ display: searchQuery ? 'inline-block' : 'none' }}
              >
                ✕ Clear
              </button>
            </div>
            <div className="search-results-info">
              Found {filteredActivities.length} activities {searchQuery ? `for "${searchQuery}"` : ''}
            </div>
          </div>
        </div>
      )}

      <div className="timeline-container">
        {filteredActivities.length === 0 ? (
          <div className="empty-state">No activities found</div>
        ) : (
          filteredActivities.map((activity, index) => (
            <div
              key={activity.id}
              className={`timeline-item ${activity.isAnomalous ? 'anomalous' : ''}`}
            >
              <div className="timeline-marker" style={{ backgroundColor: getSeverityColor(activity.severity) }}>
                {getActivityIcon(activity.activityType)}
              </div>

              <div className="timeline-content">
                <div className="timeline-header" onClick={() => setExpandedId(expandedId === activity.id ? null : activity.id)}>
                  <div className="activity-info">
                    <span className="activity-type">{activity.activityType.replace(/_/g, ' ').toUpperCase()}</span>
                    <span className="activity-time">{formatTime(activity.timestamp)}</span>
                    {activity.isAnomalous && <span className="anomaly-badge">⚠️ ANOMALY</span>}
                    <span className="severity-badge" style={{ backgroundColor: getSeverityColor(activity.severity) }}>
                      {activity.severity.toUpperCase()}
                    </span>
                  </div>
                  <span className="expand-icon">{expandedId === activity.id ? '▼' : '▶'}</span>
                </div>

                {expandedId === activity.id && (
                  <div className="timeline-details">
                    <p><strong>User ID:</strong> {activity.userId}</p>
                    <p><strong>Severity:</strong> {activity.severity}</p>
                    <p><strong>Duration:</strong> {activity.duration ? `${activity.duration}s` : 'N/A'}</p>

                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="details-section">
                        <strong>Details:</strong>
                        <ul>
                          {Object.entries(activity.details).map(([key, value]) => {
                            if (value === undefined || value === null) return null;
                            return (
                              <li key={key}>
                                <strong>{key.replace(/_/g, ' ')}:</strong> {String(value)}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
