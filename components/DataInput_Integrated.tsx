import React, { useState, useEffect } from 'react';
import { useData } from '../DataContext';
import { EmployeeRisk } from '../types';
import { Upload, Camera, Users, AlertCircle, CheckCircle2, Folder } from 'lucide-react';

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
}

const DataInput: React.FC<DataInputProps> = ({ onScanComplete }) => {
  const { setEmployeeData, employeeData } = useData();
  
  // CSV Upload State
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [csvUploading, setCSVUploading] = useState(false);
  
  // Employee Images State
  const [authorizedImages, setAuthorizedImages] = useState<File[]>([]);
  const [unauthorizedImages, setUnauthorizedImages] = useState<File[]>([]);
  const [authorizedIds, setAuthorizedIds] = useState('');
  const [unauthorizedIds, setUnauthorizedIds] = useState('');
  
  // CCTV Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  
  // Processing State
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [cctvResults, setCCTVResults] = useState<CCTVAnalysisResult[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'demo'>('demo');

  const FACE_API_URL = 'http://localhost:8000';

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${FACE_API_URL}/health`);
        if (response.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('demo');
        }
      } catch {
        setBackendStatus('demo');
      }
    };
    checkBackend();
  }, []);

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

        if (employeeMap.has(userId)) {
          const existing = employeeMap.get(userId);
          existing.login_count = (existing.login_count || 0) + toInt(row.login_count);
          existing.logoff_count = (existing.logoff_count || 0) + toInt(row.logoff_count);
          existing.night_logins = (existing.night_logins || 0) + toInt(row.night_logins);
          existing.unique_pcs = Math.max(existing.unique_pcs || 0, toInt(row.unique_pcs));
          existing.session_duration_total = (existing.session_duration_total || 0) + toInt(row.session_duration_total);
          existing.session_duration_avg = Math.max(existing.session_duration_avg || 0, toFloat(row.session_duration_avg));
          existing.usb_count = (existing.usb_count || 0) + toInt(row.usb_connect);
          existing.usb_connect = (existing.usb_connect || 0) + toInt(row.usb_connect);
          existing.usb_disconnect = (existing.usb_disconnect || 0) + toInt(row.usb_disconnect);
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
          existing.emails_sent = (existing.emails_sent || 0) + toInt(row.emails_sent);
          existing.external_mails = (existing.external_mails || 0) + toInt(row.external_mails);
          existing.email_attachments = (existing.email_attachments || 0) + toInt(row.email_attachments);
          existing.avg_email_size = Math.max(existing.avg_email_size || 0, toInt(row.avg_email_size));
          existing.http_requests = (existing.http_requests || 0) + toInt(row.http_requests);
          existing.unique_urls = Math.max(existing.unique_urls || 0, toInt(row.unique_urls));
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
            usb_count: toInt(row.usb_connect),
            usb_connect: toInt(row.usb_connect),
            usb_disconnect: toInt(row.usb_disconnect),
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
            emails_sent: toInt(row.emails_sent),
            external_mails: toInt(row.external_mails),
            email_attachments: toInt(row.email_attachments),
            avg_email_size: toInt(row.avg_email_size),
            http_requests: toInt(row.http_requests),
            unique_urls: toInt(row.unique_urls),
            risk_score: toFloat(row.risk_score),
            anomaly_label: row.anomaly_label ? toInt(row.anomaly_label) : 0,
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

    return Array.from(employeeMap.values());
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

  const handleAuthImageFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAuthorizedImages(files);
  };

  const handleUnAuthImageFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUnauthorizedImages(files);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const processCCTVVideo = async () => {
    if (!videoFile) {
      setProcessingStep('❌ Please select a CCTV video');
      return;
    }

    if (employeeData.length === 0) {
      setProcessingStep('❌ Please load behavioral data first');
      return;
    }

    setProcessing(true);
    setProcessingStep('📹 Initializing CCTV analysis with CompreFace...');

    try {
      const formData = new FormData();
      formData.append('video_file', videoFile);
      formData.append('sample_rate', '5'); // Process every 5th frame
      
      setProcessingStep('🔍 Detecting faces in video...');
      
      // Call CompreFace-based video analysis endpoint
      const response = await fetch(`${FACE_API_URL}/cctv/analyze-video`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.error || 'Analysis failed');
      }
      
      setProcessingStep('📊 Correlating with risk scores and anomaly detection...');
      
      // Process the video analysis results
      const videoAnalysis = data.video_analysis;
      const summary = data.summary;
      
      // Combine with employee risk data
      const enrichedResults: CCTVAnalysisResult[] = [];
      
      // Add detected and recognized faces
      const recognizedEmployees = new Set<string>();
      
      for (const anomaly of summary.anomalies_summary.types) {
        // Process each anomaly type
        if (anomaly.type === 'HIGH_RISK_DETECTED' || anomaly.type === 'UNAUTHORIZED_ZONE_ACCESS') {
          const empData = employeeData.find(emp => emp.user === anomaly.employee_id);
          if (empData) {
            recognizedEmployees.add(empData.user);
            enrichedResults.push({
              employeeId: empData.user,
              name: empData.employee_name || empData.user,
              status: anomaly.type === 'UNAUTHORIZED_ZONE_ACCESS' ? 'unauthorized' : 'authorized',
              confidence: anomaly.confidence || 0.85,
              detectionCount: 1,
              riskScore: empData.risk_score || anomaly.risk_score || 0
            });
          }
        }
      }
      
      // Add authorized employee detections
      summary.high_risk_employees.forEach((empId: string) => {
        if (!recognizedEmployees.has(empId)) {
          const empData = employeeData.find(emp => emp.user === empId);
          if (empData) {
            recognizedEmployees.add(empId);
            enrichedResults.push({
              employeeId: empData.user,
              name: empData.employee_name || empData.user,
              status: 'authorized',
              confidence: summary.face_detection_stats.recognition_rate / 100,
              detectionCount: 1,
              riskScore: empData.risk_score || 0
            });
          }
        }
      });
      
      // Set results
      setCCTVResults(enrichedResults);
      
      // Log analysis summary
      console.log('CCTV Analysis Summary:', {
        threat_level: summary.threat_level,
        total_anomalies: summary.anomalies_summary.total_anomalies,
        recognition_rate: `${summary.face_detection_stats.recognition_rate.toFixed(1)}%`,
        duration: summary.total_duration_seconds,
        faces_detected: summary.face_detection_stats.total_detected,
        faces_recognized: summary.face_detection_stats.recognized
      });
      
      setProcessingStep(`✅ CCTV analysis complete! Threat Level: ${summary.threat_level}`);
      setScanComplete(true);
      
      setTimeout(() => {
        onScanComplete();
      }, 1500);
    } catch (error) {
      console.error('CCTV Analysis Error:', error);
      setCCTVResults([]);
      setScanComplete(false);
      setProcessingStep('❌ CCTV analysis failed. Check backend and try again.');
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
                  Employee IDs (comma-separated)
                </label>
                <input
                  type="text"
                  value={authorizedIds}
                  onChange={(e) => setAuthorizedIds(e.target.value)}
                  placeholder="EMP001, EMP002, EMP003"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div>
                <input
                  type="file"
                  id="auth-images"
                  multiple
                  accept="image/*"
                  onChange={handleAuthImageFolder}
                  className="hidden"
                />
                <label
                  htmlFor="auth-images"
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer transition-all font-semibold"
                >
                  <Folder size={20} />
                  Select Images ({authorizedImages.length} files)
                </label>
              </div>

              {authorizedImages.length > 0 && (
                <div className="bg-green-900/20 p-3 rounded-lg max-h-32 overflow-y-auto">
                  <p className="text-xs text-green-300 font-semibold mb-2">Selected Files:</p>
                  {authorizedImages.map((img, idx) => (
                    <p key={idx} className="text-xs text-green-200">{img.name}</p>
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
                  Unauthorized IDs (comma-separated)
                </label>
                <input
                  type="text"
                  value={unauthorizedIds}
                  onChange={(e) => setUnauthorizedIds(e.target.value)}
                  placeholder="THREAT001, THREAT002"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div>
                <input
                  type="file"
                  id="unauth-images"
                  multiple
                  accept="image/*"
                  onChange={handleUnAuthImageFolder}
                  className="hidden"
                />
                <label
                  htmlFor="unauth-images"
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer transition-all font-semibold"
                >
                  <Folder size={20} />
                  Select Images ({unauthorizedImages.length} files)
                </label>
              </div>

              {unauthorizedImages.length > 0 && (
                <div className="bg-red-900/20 p-3 rounded-lg max-h-32 overflow-y-auto">
                  <p className="text-xs text-red-300 font-semibold mb-2">Selected Files:</p>
                  {unauthorizedImages.map((img, idx) => (
                    <p key={idx} className="text-xs text-red-200">{img.name}</p>
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

      {/* Run Analysis Button */}
      <div className="flex justify-center">
        <button
          onClick={processCCTVVideo}
          disabled={!csvFile || !videoFile || processing || scanComplete}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-indigo-500/20 disabled:shadow-none"
        >
          <Camera size={24} />
          {scanComplete ? '✓ Analysis Complete' : 'Run CCTV Analysis'}
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
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Risk Score</th>
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
                    <td className="py-3 px-4 text-slate-300">{(result.confidence * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 font-bold text-white">{result.riskScore?.toFixed(1) || 'N/A'}</td>
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
        <div className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-green-500' : 'bg-yellow-500'}`} />
        Face Recognition: {backendStatus === 'connected' ? '✓ Connected to backend' : '⚠️ Backend unavailable'}
      </div>
    </div>
  );
};

export default DataInput;
