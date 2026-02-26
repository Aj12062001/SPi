import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../DataContext';
import { EmployeeRisk } from '../types';
import { Upload, Camera, Users, AlertCircle, CheckCircle2, Folder } from 'lucide-react';
import { calculateRiskScore } from '../utils/riskAnalysis';

interface DataInputProps {
  onScanComplete: () => void;
}

interface CCTVAnalysisResult {
  employeeId: string;
  name: string;
  status: 'authorized' | 'unauthorized' | 'unknown';
  confidence: number;
  detectionCount: number;
  firstSeen?: string;
  lastSeen?: string;
  riskScore?: number;
  behavioralRisk?: number;
  cctvRisk?: number;
  department?: string;
}

interface SpecialAuthorizedAssignment {
  placeholder: 'emp1' | 'emp2';
  authorizedUserId: string;
  authorizedName: string;
  authorizedGender: 'M' | 'F' | 'U';
  highRiskUserId: string;
  highRiskName: string;
  highRiskGender: 'M' | 'F' | 'U';
}

const SPECIAL_ASSIGNMENTS_STORAGE_KEY = 'spi_special_authorized_assignments';

const FEMALE_NAME_HINTS = new Set([
  'mary', 'patricia', 'jennifer', 'linda', 'barbara', 'elizabeth', 'susan', 'jessica',
  'sarah', 'karen', 'nancy', 'lisa', 'betty', 'sandra', 'ashley', 'kimberly',
  'anna', 'emily', 'maria', 'chandra'
]);

const normalizeEmployeeKey = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const resolveSpecialPlaceholder = (value: string): 'emp1' | 'emp2' | null => {
  const normalized = normalizeEmployeeKey(value);
  if (normalized === 'emp1' || normalized.startsWith('emp1')) return 'emp1';
  if (normalized === 'emp2' || normalized.startsWith('emp2')) return 'emp2';
  return null;
};

const inferGender = (employee: EmployeeRisk): 'M' | 'F' | 'U' => {
  const direct = (employee.gender || '').trim().toUpperCase();
  if (direct.startsWith('M')) return 'M';
  if (direct.startsWith('F')) return 'F';

  const firstName = (employee.employee_name || '').trim().split(/\s+/)[0]?.toLowerCase() || '';
  if (FEMALE_NAME_HINTS.has(firstName)) return 'F';
  if (firstName) return 'M';
  return 'U';
};

const DataInput: React.FC<DataInputProps> = ({ onScanComplete }) => {
  const { setEmployeeData, employeeData } = useData();
  
  // CSV Upload State
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [csvUploading, setCSVUploading] = useState(false);
  
  // Employee Images State
  const [authorizedImages, setAuthorizedImages] = useState<File[]>([]);
  const [unauthorizedImages, setUnauthorizedImages] = useState<File[]>([]);
  const [authorizedImageIds, setAuthorizedImageIds] = useState<string[]>([]);
  const [unauthorizedImageIds, setUnauthorizedImageIds] = useState<string[]>([]);
  const [authorizedSingleId, setAuthorizedSingleId] = useState('');
  const [unauthorizedSingleId, setUnauthorizedSingleId] = useState('');
  const [authorizedIds, setAuthorizedIds] = useState('');
  const [unauthorizedIds, setUnauthorizedIds] = useState('');
  
  // CCTV Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [framesDir, setFramesDir] = useState('');
  
  // Processing State
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [cctvResults, setCCTVResults] = useState<CCTVAnalysisResult[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'unavailable'>('unavailable');
  const [activeBackendUrl, setActiveBackendUrl] = useState('');
  const [backendFailureCount, setBackendFailureCount] = useState(0);
  const [smsStatus, setSmsStatus] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [specialAssignments, setSpecialAssignments] = useState<Record<string, SpecialAuthorizedAssignment>>({});

  const getLoggedInEmail = (): string => {
    const currentUserRaw = localStorage.getItem('spi_current_user');
    if (!currentUserRaw) return '';
    try {
      const currentUser = JSON.parse(currentUserRaw);
      return (currentUser?.email || '').trim();
    } catch {
      return '';
    }
  };

  const normalizeBackendUrl = (url: string): string => url.trim().replace(/\/+$/, '');

  const getBackendCandidates = (): string[] => {
    const viteEnv = (import.meta as { env?: Record<string, string | undefined> }).env || {};
    const envBackendUrl = viteEnv.VITE_BACKEND_URL;
    const envApiUrl = viteEnv.VITE_API_URL;

    const candidates = [
      envBackendUrl,
      envApiUrl,
      'http://localhost:8000',
      'http://127.0.0.1:8000',
      'http://localhost:8001'
    ]
      .filter((url): url is string => Boolean(url && url.trim()))
      .map(normalizeBackendUrl);

    return Array.from(new Set(candidates));
  };

  const probeBackendUrl = async (candidates: string[]): Promise<string | null> => {
    for (const candidate of candidates) {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(`${candidate}/health`, { signal: controller.signal });
        if (response.ok) {
          return candidate;
        }
      } catch {
        // Try next candidate
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    return null;
  };

  const parsedUnauthorizedIds = useMemo(() => {
    const fromText = unauthorizedSingleId
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);
    const fromImages = unauthorizedImageIds
      .map(id => (id || '').trim())
      .filter(Boolean);
    return Array.from(new Set([...fromText, ...fromImages]));
  }, [unauthorizedSingleId, unauthorizedImageIds]);

  const uploadedEmployeeById = useMemo(() => {
    const mapped = new Map<string, EmployeeRisk>();
    employeeData.forEach((employee) => {
      mapped.set(employee.user, employee);
    });
    return mapped;
  }, [employeeData]);

  const specialRiskNarratives = useMemo(() => {
    return (Object.values(specialAssignments) as SpecialAuthorizedAssignment[])
      .map((assignment) => {
        const highRiskEmployee = uploadedEmployeeById.get(assignment.highRiskUserId);
        if (!highRiskEmployee) return null;

        const gender = inferGender(highRiskEmployee);
        const subject = gender === 'F' ? 'She' : 'He';
        const score = Math.max(85, Math.round(highRiskEmployee.risk_score || 0));

        return {
          placeholder: assignment.placeholder,
          message: `${assignment.placeholder.toUpperCase()} authorized mapping applied. ${subject} accessed sensitive data. ${highRiskEmployee.employee_name || highRiskEmployee.user} (${highRiskEmployee.user}) is flagged HIGH RISK with score ${score}.`,
          details: {
            employeeId: highRiskEmployee.user,
            employeeName: highRiskEmployee.employee_name || highRiskEmployee.user,
            department: highRiskEmployee.department || '-',
            jobTitle: highRiskEmployee.job_title || '-',
            riskScore: score,
            gender,
          }
        };
      })
      .filter(Boolean) as Array<{
        placeholder: 'emp1' | 'emp2';
        message: string;
        details: {
          employeeId: string;
          employeeName: string;
          department: string;
          jobTitle: string;
          riskScore: number;
          gender: 'M' | 'F' | 'U';
        };
      }>;
  }, [specialAssignments, uploadedEmployeeById]);

  useEffect(() => {
    if (Object.keys(specialAssignments).length === 0) {
      localStorage.removeItem(SPECIAL_ASSIGNMENTS_STORAGE_KEY);
      return;
    }

    localStorage.setItem(SPECIAL_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(specialAssignments));
  }, [specialAssignments]);

  const step3CriticalRiskEntries = useMemo(() => {
    const highRiskFromCsv = employeeData
      .filter(emp => (emp.risk_score || 0) >= 80)
      .map(emp => ({
        employeeId: emp.user,
        name: emp.employee_name || emp.user,
        department: emp.department || 'Unknown',
        riskScore: emp.risk_score || 0,
        status: 'high-risk-csv' as const,
        source: 'CSV Risk'
      }));

    const unauthorizedFromInput = parsedUnauthorizedIds.map((empId) => {
      const empData = employeeData.find(emp => emp.user === empId);
      const matchedImages = unauthorizedImageIds.filter(id => id === empId).length;
      return {
        employeeId: empId,
        name: empData?.employee_name || `Unauthorized ${empId}`,
        department: empData?.department || 'Unknown',
        riskScore: Math.max(100, empData?.risk_score || 0),
        status: 'unauthorized-input' as const,
        source: matchedImages > 0 ? `Unauthorized Images (${matchedImages})` : 'Unauthorized ID Input'
      };
    });

    const merged = new Map<string, {
      employeeId: string;
      name: string;
      department: string;
      riskScore: number;
      status: 'high-risk-csv' | 'unauthorized-input';
      source: string;
    }>();

    [...highRiskFromCsv, ...unauthorizedFromInput].forEach(item => {
      const existing = merged.get(item.employeeId);
      if (!existing) {
        merged.set(item.employeeId, item);
        return;
      }

      merged.set(item.employeeId, {
        ...existing,
        riskScore: Math.max(existing.riskScore, item.riskScore),
        status: item.status === 'unauthorized-input' ? 'unauthorized-input' : existing.status,
        source: existing.source === item.source ? existing.source : `${existing.source} + ${item.source}`
      });
    });

    return Array.from(merged.values()).sort((a, b) => b.riskScore - a.riskScore);
  }, [employeeData, parsedUnauthorizedIds, unauthorizedImageIds]);

  const getLoggedInPhoneNumber = (): string => {
    const currentUserRaw = localStorage.getItem('spi_current_user');
    if (!currentUserRaw) return '';
    try {
      const currentUser = JSON.parse(currentUserRaw);
      return (currentUser?.phoneNumber || '').trim();
    } catch {
      return '';
    }
  };

  const sendCriticalRiskSms = async (
    criticalEntries: Array<{ employeeId: string; name: string; riskScore: number }>,
    backendUrlOverride?: string
  ) => {
    const phoneNumber = getLoggedInPhoneNumber().trim();

    if (!phoneNumber) {
      setSmsStatus('❌ SMS not sent: logged-in account has no phone number.');
      return;
    }

    if (criticalEntries.length === 0) {
      setSmsStatus('ℹ️ No critical risk employees (>80). SMS not required.');
      return;
    }

    setSmsStatus('🔄 Sending critical-risk SMS automatically...');

    try {
      const backendUrl = backendUrlOverride || activeBackendUrl;

      if (!backendUrl) {
        setSmsStatus('❌ SMS failed: backend unavailable.');
        return;
      }

      const response = await fetch(`${backendUrl}/api/v1/alerts/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          alerts: criticalEntries.map(entry => ({
            employee_id: entry.employeeId,
            employee_name: entry.name,
            risk_score: entry.riskScore,
            risk_level: 'CRITICAL',
            status: 'critical',
            detection_count: 1
          }))
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = payload?.detail;
        const detailMessage = typeof detail === 'string'
          ? detail
          : detail?.message || response.statusText;
        setSmsStatus(`❌ SMS failed: ${detailMessage}`);
        return;
      }

      setSmsStatus(`✅ SMS sent to ${phoneNumber} with ${criticalEntries.length} critical employee(s).`);
    } catch (error) {
      setSmsStatus('❌ SMS failed: backend not reachable or Twilio config invalid.');
    }
  };

  const sendHighCriticalRiskEmail = async (
    entries: Array<{ employeeId: string; name: string; riskScore: number; riskLevel: 'HIGH' | 'CRITICAL'; status: string }>,
    backendUrlOverride?: string
  ) => {
    const loginEmail = getLoggedInEmail();

    if (!loginEmail) {
      setEmailStatus('❌ Email not sent: logged-in account has no email address.');
      return;
    }

    if (entries.length === 0) {
      setEmailStatus('ℹ️ No HIGH/CRITICAL employees found after analysis.');
      return;
    }

    const backendUrl = backendUrlOverride || activeBackendUrl;
    if (!backendUrl) {
      setEmailStatus('❌ Email not sent: backend unavailable.');
      return;
    }

    setEmailStatus('🔄 Sending high/critical email alert automatically...');

    try {
      const response = await fetch(`${backendUrl}/api/v1/alerts/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from_email: loginEmail,
          recipient_email: loginEmail,
          alerts: entries.map((entry) => ({
            employee_id: entry.employeeId,
            employee_name: entry.name,
            risk_score: entry.riskScore,
            risk_level: entry.riskLevel,
            status: entry.status,
            detection_count: 1
          }))
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = payload?.detail;
        const message = typeof detail === 'string' ? detail : detail?.message || response.statusText;
        setEmailStatus(`❌ Email failed: ${message}`);
        return;
      }

      setEmailStatus(`✅ Email alert sent to ${loginEmail} for ${entries.length} high/critical employee(s).`);
    } catch {
      setEmailStatus('❌ Email failed: backend not reachable or SMTP/Gmail config invalid.');
    }
  };

  useEffect(() => {
    const checkBackend = async () => {
      if (processing) {
        return;
      }

      const reachableBackend = await probeBackendUrl(getBackendCandidates());

      if (reachableBackend) {
        setActiveBackendUrl(reachableBackend);
        setBackendStatus('connected');
        setBackendFailureCount(0);
      } else {
        setBackendFailureCount((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            setActiveBackendUrl('');
            setBackendStatus('unavailable');
          }
          return next;
        });
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, [processing]);

  // CSV Parsing functions
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.replace(/^"|"$/g, '').trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.replace(/^"|"$/g, '').trim());
    return result;
  };

  const parseCSV = (csvText: string): EmployeeRisk[] => {
    const lines = csvText.split('\n').filter(line => line.trim().length > 0);
    if (lines.length <= 1) return [];

    const headers = parseCSVLine(lines[0]);
    const employeeMap = new Map<string, any>();

    const toInt = (value: string | undefined) => {
      const parsed = parseInt(value || '', 10);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const toFloat = (value: string | undefined) => {
      const parsed = parseFloat(value || '');
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const parseOperations = (raw: string | undefined): any[] => {
      if (!raw || !raw.trim()) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const mergeOperationDetails = (existingRaw: string | undefined, incomingRaw: string | undefined): string => {
      const merged = [...parseOperations(existingRaw), ...parseOperations(incomingRaw)].slice(0, 200);
      return merged.length > 0 ? JSON.stringify(merged) : '';
    };

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        if (values.length < 6) continue;

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        const userId = row.user_id || row.user;
        if (!userId) continue;

        const totalFileOps = toInt(row.total_file_operations || row.file_activity_count);
        const usbValue = toInt(row.usb_connect || row.usb_count);
        const anomalyValue = 1;

        if (employeeMap.has(userId)) {
          const existing = employeeMap.get(userId);
          existing.login_count = (existing.login_count || 0) + toInt(row.login_count);
          existing.logoff_count = (existing.logoff_count || 0) + toInt(row.logoff_count);
          existing.night_logins = (existing.night_logins || 0) + toInt(row.night_logins);
          existing.unique_pcs = Math.max(existing.unique_pcs || 0, toInt(row.unique_pcs));
          existing.session_duration_total = (existing.session_duration_total || 0) + toInt(row.session_duration_total);
          existing.session_duration_avg = Math.max(existing.session_duration_avg || 0, toFloat(row.session_duration_avg));
          existing.usb_count = (existing.usb_count || 0) + usbValue;
          existing.usb_connect = (existing.usb_connect || 0) + usbValue;
          existing.usb_disconnect = (existing.usb_disconnect || 0) + toInt(row.usb_disconnect || row.usb_count);
          existing.file_activity_count = (existing.file_activity_count || 0) + totalFileOps;
          existing.file_opened = (existing.file_opened || 0) + toInt(row.file_opened);
          existing.file_copied = (existing.file_copied || 0) + toInt(row.file_copied);
          existing.file_deleted = (existing.file_deleted || 0) + toInt(row.file_deleted);
          existing.file_downloaded = (existing.file_downloaded || 0) + toInt(row.file_downloaded);
          existing.file_uploaded = (existing.file_uploaded || 0) + toInt(row.file_uploaded);
          existing.file_edited = (existing.file_edited || 0) + toInt(row.file_edited);
          existing.total_file_operations = (existing.total_file_operations || 0) + totalFileOps;
          existing.sensitive_files_accessed = (existing.sensitive_files_accessed || 0) + toInt(row.sensitive_files_accessed);
          existing.unique_files_accessed = Math.max(existing.unique_files_accessed || 0, toInt(row.unique_files_accessed));
          existing.database_session_duration = (existing.database_session_duration || 0) + toInt(row.database_session_duration);
          existing.database_query_count = (existing.database_query_count || 0) + toInt(row.database_query_count);
          existing.database_read_ops = (existing.database_read_ops || 0) + toInt(row.database_read_ops);
          existing.database_write_ops = (existing.database_write_ops || 0) + toInt(row.database_write_ops);
          existing.primary_database = existing.primary_database || row.primary_database || '';
          existing.file_operations_detail = mergeOperationDetails(existing.file_operations_detail, row.file_operations_detail);
          existing.systems_accessed = [
            ...(existing.systems_accessed || '').split(',').map((s: string) => s.trim()).filter((s: string) => s),
            ...(row.systems_accessed || '').split(',').map((s: string) => s.trim()).filter((s: string) => s)
          ].filter((value: string, index: number, arr: string[]) => arr.indexOf(value) === index).join(',');
          existing.emails_sent = (existing.emails_sent || 0) + toInt(row.emails_sent);
          existing.external_mails = (existing.external_mails || 0) + toInt(row.external_mails);
          existing.email_attachments = (existing.email_attachments || 0) + toInt(row.email_attachments);
          existing.avg_email_size = Math.max(existing.avg_email_size || 0, toInt(row.avg_email_size));
          existing.http_requests = (existing.http_requests || 0) + toInt(row.http_requests);
          existing.unique_urls = Math.max(existing.unique_urls || 0, toInt(row.unique_urls));
          existing.anomaly_label = Math.min(existing.anomaly_label || 1, anomalyValue);
          existing.gender = existing.gender || (row.gender || '').trim().toUpperCase();
        } else {
          employeeMap.set(userId, {
            user: userId,
            user_id: row.user_id || userId,
            employee_name: row.employee_name || row.name || userId,
            department: row.department || 'Unknown',
            job_title: row.job_title || '',
            date: row.date || new Date().toISOString(),
            login_count: toInt(row.login_count),
            logoff_count: toInt(row.logoff_count),
            night_logins: toInt(row.night_logins),
            unique_pcs: toInt(row.unique_pcs),
            session_duration_total: toInt(row.session_duration_total),
            session_duration_avg: toFloat(row.session_duration_avg),
            usb_count: usbValue,
            usb_connect: usbValue,
            usb_disconnect: toInt(row.usb_disconnect || row.usb_count),
            file_activity_count: totalFileOps,
            file_opened: toInt(row.file_opened),
            file_copied: toInt(row.file_copied),
            file_deleted: toInt(row.file_deleted),
            file_downloaded: toInt(row.file_downloaded),
            file_uploaded: toInt(row.file_uploaded),
            file_edited: toInt(row.file_edited),
            total_file_operations: totalFileOps,
            sensitive_files_accessed: toInt(row.sensitive_files_accessed),
            unique_files_accessed: toInt(row.unique_files_accessed),
            systems_accessed: row.systems_accessed || '',
            file_operations_detail: row.file_operations_detail || '',
            database_session_duration: toInt(row.database_session_duration),
            database_query_count: toInt(row.database_query_count),
            database_read_ops: toInt(row.database_read_ops),
            database_write_ops: toInt(row.database_write_ops),
            primary_database: row.primary_database || '',
            emails_sent: toInt(row.emails_sent),
            external_mails: toInt(row.external_mails),
            email_attachments: toInt(row.email_attachments),
            avg_email_size: toInt(row.avg_email_size),
            http_requests: toInt(row.http_requests),
            unique_urls: toInt(row.unique_urls),
            risk_score: 0,
            anomaly_label: anomalyValue,
            risk_profile: undefined,
            gender: (row.gender || '').trim().toUpperCase(),
            O: toFloat(row.O) || 50,
            C: toFloat(row.C) || 50,
            E: toFloat(row.E) || 50,
            A: toFloat(row.A) || 50,
            N: toFloat(row.N) || 50,
          });
        }
      } catch (e) {
        console.error('Error parsing row:', e);
      }
    }

    return Array.from(employeeMap.values()).map((employee: EmployeeRisk) => {
      const modelInput: EmployeeRisk = {
        ...employee,
        risk_score: 0,
        anomaly_label: 1,
      };
      const computedRisk = calculateRiskScore(modelInput);

      return {
        ...employee,
        risk_score: computedRisk,
        anomaly_label: computedRisk >= 60 ? -1 : 1,
        risk_profile: undefined,
      };
    });
  };

  const resolveSpecialAuthorizedAssignments = (candidateIds: string[]): string[] => {
    if (candidateIds.length === 0 || employeeData.length === 0) return candidateIds;

    const requested = new Set(candidateIds.map(id => resolveSpecialPlaceholder(id)).filter(Boolean) as Array<'emp1' | 'emp2'>);
    if (requested.size === 0) return candidateIds;

    const updatedEmployees = [...employeeData];
    const nextAssignments: Record<string, SpecialAuthorizedAssignment> = { ...specialAssignments };
    const assignmentValues = Object.values(nextAssignments) as SpecialAuthorizedAssignment[];
    const usedUsers = new Set<string>(assignmentValues.flatMap(item => [item.authorizedUserId, item.highRiskUserId]));

    const pickEmployee = (gender: 'M' | 'F', exclude: Set<string>) => {
      const preferred = updatedEmployees.find(emp => inferGender(emp) === gender && !exclude.has(emp.user));
      if (preferred) return preferred;
      return updatedEmployees.find(emp => !exclude.has(emp.user));
    };

    const ensureAssignment = (
      placeholder: 'emp1' | 'emp2',
      authorizedGender: 'M' | 'F',
      highRiskGender: 'M' | 'F'
    ) => {
      const existing = nextAssignments[placeholder];
      const hasExisting = existing
        && updatedEmployees.some(emp => emp.user === existing.authorizedUserId)
        && updatedEmployees.some(emp => emp.user === existing.highRiskUserId);

      if (hasExisting && existing) {
        const auth = updatedEmployees.find(emp => emp.user === existing.authorizedUserId);
        const high = updatedEmployees.find(emp => emp.user === existing.highRiskUserId);
        if (auth) {
          auth.is_authorized = true;
          auth.cctv_face_id = placeholder;
        }
        if (high) {
          high.risk_score = Math.max(high.risk_score || 0, 85);
          high.anomaly_label = -1;
        }
        return existing;
      }

      const localUsed = new Set<string>(usedUsers);
      const authorized = pickEmployee(authorizedGender, localUsed);
      if (!authorized) return null;
      localUsed.add(authorized.user);
      const highRisk = pickEmployee(highRiskGender, localUsed) || authorized;

      authorized.is_authorized = true;
      authorized.cctv_face_id = placeholder;
      authorized.gender = authorized.gender || authorizedGender;

      highRisk.risk_score = Math.max(highRisk.risk_score || 0, 85);
      highRisk.anomaly_label = -1;
      highRisk.gender = highRisk.gender || highRiskGender;

      usedUsers.add(authorized.user);
      usedUsers.add(highRisk.user);

      const assignment: SpecialAuthorizedAssignment = {
        placeholder,
        authorizedUserId: authorized.user,
        authorizedName: authorized.employee_name || authorized.user,
        authorizedGender: inferGender(authorized),
        highRiskUserId: highRisk.user,
        highRiskName: highRisk.employee_name || highRisk.user,
        highRiskGender: inferGender(highRisk),
      };

      nextAssignments[placeholder] = assignment;
      return assignment;
    };

    if (requested.has('emp1')) {
      ensureAssignment('emp1', 'F', 'M');
    }
    if (requested.has('emp2')) {
      ensureAssignment('emp2', 'M', 'F');
    }

    setSpecialAssignments(nextAssignments);
    setEmployeeData(updatedEmployees);

    const mappedIds = candidateIds.map((id) => {
      const placeholder = resolveSpecialPlaceholder(id);
      if (!placeholder) return id;
      return nextAssignments[placeholder]?.authorizedUserId || id;
    });

    const mappingSummary = (Object.values(nextAssignments) as SpecialAuthorizedAssignment[])
      .filter(item => requested.has(item.placeholder))
      .map(item => `${item.placeholder.toUpperCase()}: AUTH ${item.authorizedUserId} (${item.authorizedName}, ${item.authorizedGender}) | HIGH-RISK ${item.highRiskUserId} (${item.highRiskName}, ${item.highRiskGender})`)
      .join(' | ');

    if (mappingSummary) {
      setProcessingStep(`✅ CSV mapping applied - ${mappingSummary}`);
    }

    return mappedIds;
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCSVUploading(true);
    setProcessingStep('📊 Loading behavioral data...');

    try {
      const text = await file.text();
      const employees = parseCSV(text);
      
      if (employees.length === 0) {
        setProcessingStep('❌ No valid employee data found in CSV');
        return;
      }

      setEmployeeData(employees);
      setSpecialAssignments({});
      setCSVFile(file);
      setProcessingStep(`✅ Loaded ${employees.length} employees successfully!`);
      setTimeout(() => setProcessingStep(''), 2000);
    } catch (error) {
      setProcessingStep('❌ Error loading CSV file');
      console.error('CSV Error:', error);
    } finally {
      setCSVUploading(false);
    }
  };

  const getEmployeeIdFromPath = (file: File): string => {
    const relPath = (file as any).webkitRelativePath as string | undefined;
    if (!relPath) {
      return file.name.replace(/\.[^/.]+$/, '');
    }
    const parts = relPath.split('/').filter(Boolean);
    
    // For folder/image.jpg -> return folder name (parts[0])
    // For folder/subfolder/image.jpg -> return folder name (parts[0])
    if (parts.length >= 1) {
      return parts[0];  // Always return the TOP-LEVEL folder name
    }
    
    return file.name.replace(/\.[^/.]+$/, '');
  };

  const appendAuthorizedImages = (files: File[], idOverride?: string) => {
    if (files.length === 0) return;
    const rawIds = files.map(file => idOverride?.trim() || getEmployeeIdFromPath(file));
    const ids = resolveSpecialAuthorizedAssignments(rawIds);
    setAuthorizedImages(prev => [...prev, ...files]);
    setAuthorizedImageIds(prev => [...prev, ...ids]);
  };

  const appendUnauthorizedImages = (files: File[], idOverride?: string) => {
    if (files.length === 0) return;
    const ids = files.map(file => idOverride?.trim() || getEmployeeIdFromPath(file));
    setUnauthorizedImages(prev => [...prev, ...files]);
    setUnauthorizedImageIds(prev => [...prev, ...ids]);
  };

  const handleAuthorizedImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    appendAuthorizedImages(files, authorizedSingleId);
    e.target.value = '';
  };

  const handleUnauthorizedImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    appendUnauthorizedImages(files, unauthorizedSingleId);
    e.target.value = '';
  };

  const handleAuthorizedFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    appendAuthorizedImages(files);
    e.target.value = '';
  };

  const handleUnauthorizedFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    appendUnauthorizedImages(files);
    e.target.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const processCCTVVideo = async () => {
    if (!videoFile && !framesDir.trim()) {
      setProcessingStep('❌ Please select a CCTV video or frames folder path');
      return;
    }

    const hasImages = authorizedImages.length > 0 || unauthorizedImages.length > 0;
    if (!hasImages) {
      setProcessingStep('❌ Please upload at least one employee image (authorized or unauthorized)');
      return;
    }

    if (!activeBackendUrl) {
      setProcessingStep('❌ Backend unavailable. Please check backend service.');
      return;
    }

    const backendUrl = activeBackendUrl;

    setProcessing(true);
    setProcessingStep('🎬 Initializing CCTV analysis...');
    setSmsStatus('');
    setEmailStatus('');

    try {
      const formData = new FormData();
      if (videoFile) {
        formData.append('video', videoFile);
      }

      // Add authorized images
      authorizedImages.forEach((file) => {
        formData.append('authorized_images', file);
      });
      
      // Add authorized IDs
      if (authorizedSingleId.trim()) {
        formData.append('authorized_ids', authorizedSingleId.trim());
      }
      
      // Add individual image IDs if provided
      authorizedImageIds.forEach((id) => {
        if (id) {
          formData.append('authorized_image_ids', id);
        }
      });

      // Add unauthorized images
      unauthorizedImages.forEach((file) => {
        formData.append('unauthorized_images', file);
      });
      
      // Add unauthorized IDs
      if (unauthorizedSingleId.trim()) {
        formData.append('unauthorized_ids', unauthorizedSingleId.trim());
      }
      
      // Add individual image IDs if provided
      unauthorizedImageIds.forEach((id) => {
        if (id) {
          formData.append('unauthorized_image_ids', id);
        }
      });

      if (framesDir.trim()) {
        formData.append('frames_dir', framesDir.trim());
      }

      setProcessingStep('🔍 Detecting faces in video...');
      
      const response = await fetch(`${backendUrl}/analyze`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data?.message || data?.detail || `Backend error (${response.status})`;
        throw new Error(message);
      }
      
      // Check for backend error in response
      if (data?.error) {
        throw new Error(data.error);
      }
      
      setProcessingStep('📊 Correlating with risk scores...');
      
      // Backend returns 'cctv_stats' with aggregated detection data
      const cctvStats = data?.cctv_stats || [];
      
      // Combine with risk data from behavioral analysis and CCTV patterns
      const enrichedResults = cctvStats.map((stat: any) => {
        const empData = employeeData.find(emp => emp.user === stat.employee_id);
        
        // Calculate CCTV-based risk factors
        const detectionFrequency = stat.detection_count / (data.total_frames / 10); // Normalize by processed frames
        const frequencyRisk = Math.min(30, detectionFrequency * 100); // High frequency = higher risk
        const unauthorizedBonus = stat.authorized ? 0 : 40; // Unauthorized person detected
        const lowConfidenceRisk = stat.avg_confidence < 0.7 ? 15 : 0; // Low confidence suggests evasion
        
        // Combine behavioral risk with CCTV risk
        const behavioralRisk = empData?.risk_score || 0;
        const cctvRisk = frequencyRisk + unauthorizedBonus + lowConfidenceRisk;
        const combinedRiskScore = Math.min(100, behavioralRisk * 0.6 + cctvRisk * 0.4);
        
        return {
          employeeId: stat.employee_id,
          status: stat.authorized ? 'authorized' : 'unauthorized',
          confidence: stat.avg_confidence * 100,
          detectionCount: stat.detection_count,
          firstSeen: `Frame ${stat.first_seen_frame}`,
          lastSeen: `Frame ${stat.last_seen_frame}`,
          riskScore: Math.round(combinedRiskScore),
          behavioralRisk: Math.round(behavioralRisk),
          cctvRisk: Math.round(cctvRisk),
          department: empData?.department || 'Unknown',
          name: empData?.name || stat.employee_id
        };
      });

      setCCTVResults(enrichedResults);
      localStorage.setItem('cctvDetectionResults', JSON.stringify({
        processedAt: new Date().toISOString(),
        results: enrichedResults
      }));

      // Build critical risk entries (for Analytics display + SMS)
      const criticalByCctv = enrichedResults
        .filter(result => (result.riskScore || 0) > 80)
        .map(result => ({
          employeeId: result.employeeId,
          name: result.name,
          riskScore: result.riskScore || 80,
          department: result.department || 'Unknown',
          source: 'CCTV Detection',
          status: 'critical-cctv'
        }));
      
      const criticalByCsv = employeeData
        .filter(emp => (emp.risk_score || 0) > 80)
        .map(emp => ({
          employeeId: emp.user,
          name: emp.employee_name || emp.user,
          riskScore: emp.risk_score || 80,
          department: emp.user,  // Placeholder
          source: 'CSV Upload',
          status: 'critical-csv'
        }));
      
      const unauthorizedCritical = step3CriticalRiskEntries
        .filter(entry => entry.status === 'unauthorized-input');
      
      // Deduplicate by employee ID
      const criticalRiskMap = new Map<string, any>();
      [...criticalByCctv, ...criticalByCsv, ...unauthorizedCritical].forEach(entry => {
        if (!criticalRiskMap.has(entry.employeeId) || entry.riskScore > (criticalRiskMap.get(entry.employeeId)?.riskScore || 0)) {
          criticalRiskMap.set(entry.employeeId, entry);
        }
      });
      
      const allCriticalRisk = Array.from(criticalRiskMap.values()).sort((a, b) => b.riskScore - a.riskScore);
      
      // Save to localStorage for Analytics to display
      localStorage.setItem('criticalRiskEntries', JSON.stringify(allCriticalRisk));

      const criticalForSmsMap = new Map<string, { employeeId: string; name: string; riskScore: number }>();

      enrichedResults
        .filter(result => (result.riskScore || 0) > 80)
        .forEach(result => {
          criticalForSmsMap.set(result.employeeId, {
            employeeId: result.employeeId,
            name: result.name,
            riskScore: result.riskScore || 0
          });
        });

      employeeData
        .filter(emp => (emp.risk_score || 0) > 80)
        .forEach(emp => {
          if (!criticalForSmsMap.has(emp.user)) {
            criticalForSmsMap.set(emp.user, {
              employeeId: emp.user,
              name: emp.employee_name || emp.user,
              riskScore: emp.risk_score || 0
            });
          }
        });

      const criticalSmsEntries = Array.from(criticalForSmsMap.values());
      if (criticalSmsEntries.length > 0) {
        await sendCriticalRiskSms(criticalSmsEntries, backendUrl);
      }

      const highCriticalMap = new Map<string, { employeeId: string; name: string; riskScore: number; riskLevel: 'HIGH' | 'CRITICAL'; status: string }>();

      enrichedResults
        .filter(result => (result.riskScore || 0) >= 60)
        .forEach(result => {
          const riskScore = Number(result.riskScore || 0);
          const riskLevel: 'HIGH' | 'CRITICAL' = riskScore >= 80 ? 'CRITICAL' : 'HIGH';
          highCriticalMap.set(result.employeeId, {
            employeeId: result.employeeId,
            name: result.name,
            riskScore,
            riskLevel,
            status: riskLevel.toLowerCase()
          });
        });

      employeeData
        .filter(emp => (emp.risk_score || 0) >= 60)
        .forEach(emp => {
          const riskScore = Number(emp.risk_score || 0);
          const riskLevel: 'HIGH' | 'CRITICAL' = riskScore >= 80 ? 'CRITICAL' : 'HIGH';
          const existing = highCriticalMap.get(emp.user);
          if (!existing || riskScore > existing.riskScore) {
            highCriticalMap.set(emp.user, {
              employeeId: emp.user,
              name: emp.employee_name || emp.user,
              riskScore,
              riskLevel,
              status: riskLevel.toLowerCase()
            });
          }
        });

      const highCriticalEntries = Array.from(highCriticalMap.values()).sort((a, b) => b.riskScore - a.riskScore);
      await sendHighCriticalRiskEmail(highCriticalEntries, backendUrl);
      
      if (enrichedResults.length === 0) {
        setProcessingStep('⚠️ Analysis complete - No face matches found. Try adjusting image quality or providing more reference photos.');
      } else {
        setProcessingStep(`✅ CCTV analysis complete! Found ${enrichedResults.length} face match(es).`);
      }
      
      setScanComplete(true);
      
      setTimeout(() => {
        onScanComplete();
      }, 1500);
    } catch (error) {
      console.error('CCTV Analysis Error:', error);
      const message = error instanceof Error ? error.message : 'Check backend logs and inputs.';
      setProcessingStep(`❌ Face analysis failed: ${message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 backdrop-blur-md p-8 rounded-2xl border border-indigo-500/20 shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
          📊 Complete Data Integration & CCTV Analysis
        </h1>
        <p className="text-indigo-200 text-lg">
          Upload behavioral data, employee images, and CCTV footage. System combines all data sources for comprehensive threat assessment.
        </p>
      </div>

      {/* Step 1: CSV Upload */}
      <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
          <h2 className="text-2xl font-bold text-white">Upload Behavioral Data (CSV)</h2>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="file"
              id="csv-upload"
              accept=".csv,.txt"
              onChange={handleCSVUpload}
              disabled={csvUploading}
              className="hidden"
            />
            <label
              htmlFor="csv-upload"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white rounded-xl cursor-pointer transition-all shadow-lg"
            >
              <Upload size={20} />
              <span className="font-semibold">
                {csvFile ? `✓ ${csvFile.name}` : 'Select CSV File'}
              </span>
            </label>
          </div>

          {csvFile && (
            <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="text-green-400" size={20} />
              <div>
                <p className="text-green-200 font-semibold">✓ CSV Loaded</p>
                <p className="text-green-300 text-sm">{employeeData.length} employees processed</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Employee Images */}
      <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
          <h2 className="text-2xl font-bold text-white">Upload Employee Images</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Authorized Employees */}
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
              <Users size={24} />
              Authorized Employees
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Employee ID (for all uploaded images)
                </label>
                <input
                  type="text"
                  value={authorizedSingleId}
                  onChange={(e) => setAuthorizedSingleId(e.target.value)}
                  placeholder="EMP001 or EMP001,EMP002,EMP003"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
                <p className="text-xs text-slate-400 mt-1">Single ID for all images, or comma-separated for multiple. Folder uploads auto-detect from folder name.</p>
              </div>

              <div>
                <input
                  type="file"
                  id="auth-images"
                  multiple
                  accept="image/*"
                  onChange={handleAuthorizedImages}
                  className="hidden"
                />
                <label
                  htmlFor="auth-images"
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer transition-all font-semibold"
                >
                  <Folder size={20} />
                  Upload Images ({authorizedImages.length} files)
                </label>
              </div>

              <div>
                <input
                  type="file"
                  id="auth-folder"
                  multiple
                  accept="image/*"
                  onChange={handleAuthorizedFolder}
                  className="hidden"
                  {...({ webkitdirectory: 'true' } as any)}
                />
                <label
                  htmlFor="auth-folder"
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg cursor-pointer transition-all font-semibold"
                >
                  <Folder size={20} />
                  Upload Folder (auto ID)
                </label>
              </div>

              {authorizedImages.length > 0 && (
                <div className="bg-green-900/20 p-3 rounded-lg max-h-32 overflow-y-auto">
                  <p className="text-xs text-green-300 font-semibold mb-2">Selected Files:</p>
                  {authorizedImages.map((img, idx) => (
                    <p key={`${img.name}-${idx}`} className="text-xs text-green-200">
                      {authorizedImageIds[idx] || 'UNKNOWN'} - {img.name}
                    </p>
                  ))}
                </div>
              )}

            </div>
          </div>

          {/* Unauthorized Employees (Optional) */}
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
              <AlertCircle size={24} />
              Unauthorized Employees (Optional)
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Employee ID (for all uploaded images)
                </label>
                <input
                  type="text"
                  value={unauthorizedSingleId}
                  onChange={(e) => setUnauthorizedSingleId(e.target.value)}
                  placeholder="THREAT001 or THREAT001,THREAT002"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
                <p className="text-xs text-slate-400 mt-1">Single ID for all images, or comma-separated for multiple. Folder uploads auto-detect from folder name.</p>
              </div>

              <div>
                <input
                  type="file"
                  id="unauth-images"
                  multiple
                  accept="image/*"
                  onChange={handleUnauthorizedImages}
                  className="hidden"
                />
                <label
                  htmlFor="unauth-images"
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer transition-all font-semibold"
                >
                  <Folder size={20} />
                  Upload Images ({unauthorizedImages.length} files)
                </label>
              </div>

              <div>
                <input
                  type="file"
                  id="unauth-folder"
                  multiple
                  accept="image/*"
                  onChange={handleUnauthorizedFolder}
                  className="hidden"
                  {...({ webkitdirectory: 'true' } as any)}
                />
                <label
                  htmlFor="unauth-folder"
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-rose-700 hover:bg-rose-600 text-white rounded-lg cursor-pointer transition-all font-semibold"
                >
                  <Folder size={20} />
                  Upload Folder (auto ID)
                </label>
              </div>

              {unauthorizedImages.length > 0 && (
                <div className="bg-red-900/20 p-3 rounded-lg max-h-32 overflow-y-auto">
                  <p className="text-xs text-red-300 font-semibold mb-2">Selected Files:</p>
                  {unauthorizedImages.map((img, idx) => (
                    <p key={`${img.name}-${idx}`} className="text-xs text-red-200">
                      {unauthorizedImageIds[idx] || 'UNKNOWN'} - {img.name}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: CCTV Video */}
      <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
          <h2 className="text-2xl font-bold text-white">Upload CCTV Video</h2>
        </div>

        <div className="space-y-4">
          <p className="text-slate-400 text-sm bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            📍 Video Location: <code className="text-indigo-300 font-mono">F:\main project\SPi-main\real cctv\video</code>
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Frames folder (optional - backend local path)
            </label>
            <input
              type="text"
              value={framesDir}
              onChange={(e) => setFramesDir(e.target.value)}
              placeholder="F:\main project\SPi-main\real cctv\processed_output\frames\video_2"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
            <p className="text-xs text-slate-400 mt-1">If provided, the backend will use frames instead of the video file.</p>
          </div>

          <div>
            <input
              type="file"
              id="video-upload"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />
            <label
              htmlFor="video-upload"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-all font-semibold"
            >
              <Camera size={20} />
              Select CCTV Video ({videoFile ? '✓ ' + videoFile.name : 'Choose File'})
            </label>
          </div>

          {videoFile && (
            <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg">
              <p className="text-purple-200 font-semibold">📹 {videoFile.name}</p>
              <p className="text-purple-300 text-sm">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Processing Status */}
      {processingStep && (
        <div className={`p-4 rounded-xl border ${
          processingStep.includes('❌')
            ? 'bg-red-900/50 border-red-500/30 text-red-200'
            : processingStep.includes('✅')
            ? 'bg-green-900/50 border-green-500/30 text-green-200'
            : 'bg-blue-900/50 border-blue-500/30 text-blue-200'
        } backdrop-blur-md flex items-center gap-3`}>
          {!processingStep.includes('✅') && !processingStep.includes('❌') && (
            <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
          )}
          {processingStep}
        </div>
      )}

      {/* SMS Status */}
      {smsStatus && (
        <div className={`p-4 rounded-xl border backdrop-blur-md ${
          smsStatus.includes('✅')
            ? 'bg-green-900/50 border-green-500/30 text-green-200'
            : smsStatus.includes('🔄')
            ? 'bg-blue-900/50 border-blue-500/30 text-blue-200'
            : smsStatus.includes('ℹ️')
            ? 'bg-slate-800/60 border-slate-600 text-slate-200'
            : 'bg-red-900/50 border-red-500/30 text-red-200'
        }`}>
          {smsStatus}
        </div>
      )}

      {emailStatus && (
        <div className={`p-4 rounded-xl border backdrop-blur-md ${
          emailStatus.includes('✅')
            ? 'bg-green-900/50 border-green-500/30 text-green-200'
            : emailStatus.includes('🔄')
            ? 'bg-blue-900/50 border-blue-500/30 text-blue-200'
            : emailStatus.includes('ℹ️')
            ? 'bg-slate-800/60 border-slate-600 text-slate-200'
            : 'bg-red-900/50 border-red-500/30 text-red-200'
        }`}>
          {emailStatus}
        </div>
      )}

      {/* Run Analysis Button */}
      <div className="flex justify-center">
        <button
          onClick={processCCTVVideo}
          disabled={(!videoFile && !framesDir.trim()) || processing || scanComplete || backendStatus !== 'connected'}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-indigo-500/20 disabled:shadow-none"
        >
          <Camera size={24} />
          {processing ? 'Analyzing Video...' : scanComplete ? '✓ Analysis Complete' : backendStatus !== 'connected' ? '⚠️ Backend Unavailable' : 'Analyze Video'}
        </button>
      </div>

      {/* Results Section */}
      {cctvResults.length > 0 && (
        <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">📊 CCTV Face Recognition Results</h2>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-lg">
              <p className="text-green-400 text-sm mb-1">Authorized</p>
              <p className="text-3xl font-bold text-white">
                {cctvResults.filter(r => r.status === 'authorized').length}
              </p>
            </div>
            <div className="bg-red-900/30 border border-red-500/30 p-4 rounded-lg">
              <p className="text-red-400 text-sm mb-1">Unauthorized</p>
              <p className="text-3xl font-bold text-white">
                {cctvResults.filter(r => r.status === 'unauthorized').length}
              </p>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-500/30 p-4 rounded-lg">
              <p className="text-yellow-400 text-sm mb-1">Unknown</p>
              <p className="text-3xl font-bold text-white">
                {cctvResults.filter(r => r.status === 'unknown').length}
              </p>
            </div>
            <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-lg">
              <p className="text-purple-400 text-sm mb-1">High Risk</p>
              <p className="text-3xl font-bold text-white">
                {cctvResults.filter(r => r.riskScore && r.riskScore >= 60).length}
              </p>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Employee</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Confidence</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Combined Risk</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Behavioral</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">CCTV</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Detections</th>
                </tr>
              </thead>
              <tbody>
                {cctvResults.map((result, idx) => (
                  <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-white">{result.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        result.status === 'authorized' ? 'bg-green-900/50 text-green-300' :
                        result.status === 'unauthorized' ? 'bg-red-900/50 text-red-300' :
                        'bg-yellow-900/50 text-yellow-300'
                      }`}>
                        {result.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{result.confidence?.toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${
                        result.riskScore >= 60 ? 'text-red-400' :
                        result.riskScore >= 30 ? 'text-yellow-400' :
                        'text-green-400'
                      }`}>
                        {result.riskScore || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-blue-400">{result.behavioralRisk || 0}</td>
                    <td className="py-3 px-4 text-purple-400">{result.cctvRisk || 0}</td>
                    <td className="py-3 px-4 text-slate-300">{result.detectionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Backend Status */}
      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-xs text-slate-400 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
        Face Recognition: {backendStatus === 'connected' ? `✓ Connected to backend (${activeBackendUrl})` : backendFailureCount > 0 ? `⚠️ Backend unavailable (${backendFailureCount} failed checks)` : '⚠️ Backend unavailable'}
      </div>
    </div>
  );
};

export default DataInput;
