# 🚀 Quick Reference Guide

## Project Structure at a Glance

```
SPi-main/
├── 📂 components/              React Components
│   ├── ActivityInsights.tsx    ✨ Activity statistics dashboard
│   ├── ActivityTimeline.tsx    ✨ Activity log timeline  
│   ├── Results.tsx             🔄 Main results dashboard
│   └── ... other components
│
├── 📂 utils/                   Utility Functions
│   ├── activityTracker.ts      ✨ Activity logging system
│   └── riskAnalysis.ts         ✨ Risk calculation engine
│
├── 📂 styles/                  CSS Styles
│   ├── ActivityTimeline.css    ✨ Timeline styles
│   └── ActivityInsights.css    ✨ Insights styles
│
├── 📄 types.ts                 🔄 Type definitions (ENHANCED)
├── 📄 DataContext.tsx          🔄 React context (ENHANCED)
├── 📄 App.tsx                  Main app component
└── 📄 index.tsx                Entry point
```

## Key Functions Reference

### Activity Tracking (`utils/activityTracker.ts`)

| Function | Purpose | Returns |
|----------|---------|---------|
| `logActivity()` | Create new activity log | `ActivityLog` |
| `getActivityLogs()` | Retrieve all logs | `ActivityLog[]` |
| `getUserActivityLogs(userId)` | Get user's logs | `ActivityLog[]` |
| `getActivityStats(userId, hours)` | Get statistics | `ActivityStats` |
| `getAnomalousActivities(userId)` | Get anomalies | `ActivityLog[]` |
| `getActivitiesByType(userId, type)` | Filter by type | `ActivityLog[]` |
| `getHighSeverityActivities(userId)` | High severity | `ActivityLog[]` |
| `exportActivityLogsAsCSV(userId?)` | Export to CSV | `string` |
| `generateActivityReport(userId, hours)` | Generate report | `string` |

### Risk Analysis (`utils/riskAnalysis.ts`)

| Function | Purpose | Returns |
|----------|---------|---------|
| `calculateRiskScore(employee)` | Risk calculation | `number` |
| `getRiskLevel(score)` | Determine level | `RiskLevel` |
| `calculateBehavioralAnomalyScore(employee)` | Behavior analysis | `number` |
| `generateRiskAssessment(employee, logs)` | Full assessment | `RiskAssessment` |
| `calculateRiskTrend(employees, days)` | Historical trend | `array` |
| `compareRiskToGroup(employee, peers)` | Peer comparison | `object` |
| `identifyAtRiskUsers(employees, threshold)` | Find at-risk | `EmployeeRisk[]` |
| `generateMitigationRecommendations(assessment)` | Recommendations | `string[]` |
| `predictRiskTrend(history)` | Predict direction | `'increasing' | 'decreasing' | 'stable'` |

## Data Structures Reference

### ActivityLog
```typescript
{
  id: string                    // Unique identifier
  userId: string                // Employee ID
  timestamp: string             // ISO 8601 timestamp
  activityType: string          // file_opened, file_deleted, etc.
  details: {
    fileName?: string
    fileSize?: number
    filePath?: string
    usbName?: string
    emailRecipients?: number
    urlAccessed?: string
    pcName?: string
  }
  duration?: number             // in seconds
  isAnomalous: boolean          // Flag for anomaly
  severity: string              // 'low' | 'medium' | 'high' | 'critical'
}
```

### RiskAssessment
```typescript
{
  user: string                  // Employee ID
  overallRiskScore: number      // 0-100
  riskLevel: RiskLevel          // LOW, MEDIUM, HIGH, CRITICAL
  fileActivityRisk: number      // Component score
  usbActivityRisk: number       // Component score
  emailActivityRisk: number     // Component score
  loginPatternRisk: number      // Component score
  behavioralRisk: number        // Component score
  anomalyScore: number          // From model
  flaggedActivities: ActivityLog[]  // Recent issues
  recommendations: string[]      // Action items
  lastUpdated: string           // ISO timestamp
}
```

### ActivityStats
```typescript
{
  totalActivities: number       // Total count
  anomalousActivities: number   // Anomaly count
  filesOpened: number           // File opens
  filesDeleted: number          // File deletions
  filesCopied: number           // File copies
  usbConnections: number        // USB events
  emailsSent: number            // Emails
  loginCount: number            // Logins
  sessionDuration: number       // Minutes
  averageActivityDuration: number  // Seconds
  peakActivityTime: string      // 'HH:MM'
}
```

## Common Usage Patterns

### Pattern 1: Log User Activity
```typescript
import { logActivity } from './utils/activityTracker';

logActivity({
  userId: 'AAE0190',
  activityType: 'file_deleted',
  severity: 'high',
  isAnomalous: true,
  details: { fileName: 'confidential.pdf' },
  duration: 45
});
```

### Pattern 2: Get User Risk Assessment
```typescript
import { useData } from './DataContext';

const { getEmployeeRiskAssessment } = useData();
const assessment = getEmployeeRiskAssessment('AAE0190');

console.log(`Risk Level: ${assessment.riskLevel}`);
console.log(`Overall Score: ${assessment.overallRiskScore}`);
```

### Pattern 3: Analyze Activity Statistics
```typescript
import { useData } from './DataContext';

const { getUserActivityStats } = useData();
const stats = getUserActivityStats('AAE0190', 24); // Last 24 hours

console.log(`Files Deleted: ${stats.filesDeleted}`);
console.log(`Anomalies: ${stats.anomalousActivities}`);
```

### Pattern 4: Identify At-Risk Users
```typescript
import { useData } from './DataContext';

const { getAtRiskUsers } = useData();
const atRiskUsers = getAtRiskUsers();

atRiskUsers.forEach(user => {
  console.log(`${user.user} - Risk Score: ${user.risk_score}`);
});
```

### Pattern 5: Generate Reports
```typescript
import { generateActivityReport } from './utils/activityTracker';

const report = generateActivityReport('AAE0190', 24);
console.log(report);
// Email or save the report
```

## Component Integration Guide

### Using ActivityTimeline
```tsx
import ActivityTimeline from './components/ActivityTimeline';

<ActivityTimeline activities={activityLogs} userId="AAE0190" />
```

### Using ActivityInsights
```tsx
import ActivityInsights from './components/ActivityInsights';

<ActivityInsights 
  stats={activityStats}
  userName="John Doe"
  isAnomalous={false}
/>
```

### Using Enhanced Results
```tsx
import Results from './components/Results';

<Results /> // Handles all data internally via useData()
```

## Risk Level Guide

| Level | Score Range | Color | Action |
|-------|-------------|-------|--------|
| LOW | < 30 | 🟢 Green | Monitor |
| MEDIUM | 30-60 | 🟡 Yellow | Review |
| HIGH | 60-80 | 🟠 Orange | Investigate |
| CRITICAL | ≥ 80 | 🔴 Red | Immediate Action |

## Activity Type Mapping

| Type | Icon | Description |
|------|------|-------------|
| file_opened | 📂 | File access |
| file_deleted | 🗑️ | File deletion |
| file_copied | 📋 | File copy |
| file_modified | ✏️ | File edit |
| file_accessed | 👁️ | File view |
| usb_connected | 🔌 | USB device |
| usb_disconnected | 🔌❌ | USB removed |
| email_sent | 📧 | Email message |
| login | 🔓 | System login |
| logout | 🔒 | System logout |
| http_request | 🌐 | Web request |

## Performance Tips

1. **Optimize Activity Logs**: Limit storage to 10,000 entries
2. **Use Memoization**: Wrap expensive calculations
3. **Lazy Load**: Load data on demand
4. **Batch Updates**: Group multiple changes
5. **Cache Results**: Reuse calculations when possible

## Common Issues & Solutions

### Issue: Activities not appearing
**Solution**: Check that `logUserActivity()` is being called with correct userId

### Issue: Risk scores seem off
**Solution**: Verify employee data has required fields (file_events, emails_sent, etc.)

### Issue: Performance is slow
**Solution**: Check browser console for errors, clear old activity logs

### Issue: Data not persisting
**Solution**: Enable LocalStorage in browser, check storage quota

## Debugging Tips

### Enable Logging
```typescript
// In browser console
window.__DEBUG__ = true;
```

### Check Activity Logs
```typescript
// In browser console
import { getActivityLogs } from './utils/activityTracker';
console.table(getActivityLogs());
```

### Check Risk Assessments
```typescript
// In React component
const { riskAssessments } = useData();
console.table(Array.from(riskAssessments.values()));
```

### Export Activity Data
```typescript
import { exportActivityLogsAsCSV } from './utils/activityTracker';
const csv = exportActivityLogsAsCSV('AAE0190');
console.log(csv);
```

## Browser Dev Tools

### LocalStorage Inspection
1. Open Dev Tools (F12)
2. Go to Application tab
3. Expand LocalStorage
4. Check keys:
   - `employeeData`
   - `activityLogs`

### Network Monitoring
1. Go to Network tab
2. Monitor API calls
3. Check response times

### Console Debugging
1. Go to Console tab
2. Run utility functions directly
3. Test data structures

## Useful Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| F12 | Open Dev Tools |
| Ctrl+Shift+I | Inspect Element |
| Ctrl+Alt+J | Open Console |
| Ctrl+Shift+K | Clear Console |
| Ctrl+R | Reload Page |
| Ctrl+Shift+R | Hard Reload |

## Resources

- **FEATURES.md**: Complete feature documentation
- **SETUP.md**: Installation and setup guide  
- **UPGRADE_SUMMARY.md**: What's new in v2.0
- **Type Definitions**: `types.ts` - Self-documenting
- **Inline Comments**: Throughout source code

## Support Contacts

- **Documentation**: Check FEATURES.md, SETUP.md
- **Errors**: Check browser console
- **Issues**: Review code comments
- **Questions**: Refer to type definitions

---

**Last Updated**: January 23, 2026  
**Version**: 2.0  
**Status**: Production Ready ✅
