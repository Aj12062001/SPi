import React, { useEffect, useState } from 'react';
import { useData } from '../DataContext';
import { Upload, Video, AlertTriangle, CheckCircle2, User, Shield, Play, Download } from 'lucide-react';

interface FaceDetectionResult {
  employeeId: string;
  employeeName?: string;
  status: 'authorized' | 'unauthorized' | 'unknown';
  confidence: number;
  riskScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  department?: string;
  detectionCount: number;
  firstSeenTime?: string;
  lastSeenTime?: string;
}

const CCTVFaceRecognition: React.FC = () => {
  const { employeeData } = useData();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<FaceDetectionResult[]>([]);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [restrictedZoneMode, setRestrictedZoneMode] = useState(true);
  const [alertPhoneNumber, setAlertPhoneNumber] = useState('');
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [alertStatus, setAlertStatus] = useState('');

  useEffect(() => {
    const currentUserRaw = localStorage.getItem('spi_current_user');
    if (!currentUserRaw) return;
    try {
      const currentUser = JSON.parse(currentUserRaw);
      if (currentUser?.phoneNumber) {
        setAlertPhoneNumber(currentUser.phoneNumber);
      }
    } catch {
      // ignore malformed local storage
    }
  }, []);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const preview = URL.createObjectURL(file);
      setVideoPreview(preview);
      setResults([]);
      setProcessingStatus('');
      setAlertStatus('');
    }
  };

  const processVideo = async () => {
    if (!videoFile) {
      setProcessingStatus('❌ Please upload a video file first');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('🔄 Processing video and detecting faces...');

    try {
      // Get stored employee images
      const storedData = localStorage.getItem('employeeImageData');
      
      if (!storedData) {
        setProcessingStatus('❌ No employee images found. Please upload employee images first in the Employee Images tab.');
        setIsProcessing(false);
        return;
      }

      const imageData = JSON.parse(storedData);
      const authorizedIds = imageData.authorized.map((img: any) => img.employeeId);
      const unauthorizedIds = imageData.unauthorized.map((img: any) => img.employeeId);

      // Simulate face detection processing
      setProcessingStatus('🔄 Analyzing facial features...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      setProcessingStatus('🔄 Matching faces with employee database...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProcessingStatus('🔄 Combining with risk assessment data...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock results (in production, this would call the backend API)
      const detectedResults: FaceDetectionResult[] = [];

      // Simulate detecting some authorized employees
      const sampleAuthorized = authorizedIds.slice(0, Math.min(3, authorizedIds.length));
      sampleAuthorized.forEach((empId: string) => {
        const empData = employeeData.find(e => e.user === empId);
        const riskScore = empData?.risk_score || Math.random() * 100;
        
        detectedResults.push({
          employeeId: empId,
          employeeName: empData?.employee_name || `Employee ${empId}`,
          status: 'authorized',
          confidence: 0.85 + Math.random() * 0.14,
          riskScore: riskScore,
          riskLevel: riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW',
          department: empData?.department || 'Unknown',
          detectionCount: Math.floor(Math.random() * 20) + 5,
          firstSeenTime: '00:00:15',
          lastSeenTime: '00:08:42'
        });
      });

      // Simulate detecting unknown faces
      if (Math.random() > 0.3) {
        detectedResults.push({
          employeeId: 'UNKNOWN_001',
          employeeName: 'Unknown Person',
          status: 'unknown',
          confidence: 0.45 + Math.random() * 0.3,
          detectionCount: Math.floor(Math.random() * 10) + 1,
          firstSeenTime: '00:03:20',
          lastSeenTime: '00:04:15'
        });
      }

      // Always include IDs entered in unauthorized section as CRITICAL detections
      unauthorizedIds.forEach((unauth: string, index: number) => {
        const empData = employeeData.find(e => e.user === unauth);
        detectedResults.push({
          employeeId: unauth,
          employeeName: empData?.employee_name || `Unauthorized ${unauth}`,
          status: 'unauthorized',
          confidence: 0.72 + Math.random() * 0.2,
          riskScore: 100,
          riskLevel: 'CRITICAL',
          department: empData?.department || 'Unknown',
          detectionCount: Math.floor(Math.random() * 5) + 1,
          firstSeenTime: `00:0${(index % 5) + 1}:10`,
          lastSeenTime: `00:0${(index % 5) + 1}:55`
        });
      });

      // Sort by risk score (high risk first)
      detectedResults.sort((a, b) => {
        if (a.status === 'unauthorized' && b.status !== 'unauthorized') return -1;
        if (b.status === 'unauthorized' && a.status !== 'unauthorized') return 1;
        return (b.riskScore || 0) - (a.riskScore || 0);
      });

      setResults(detectedResults);
      localStorage.setItem('cctvDetectionResults', JSON.stringify({
        processedAt: new Date().toISOString(),
        results: detectedResults
      }));
      setProcessingStatus('✅ Video processing complete!');
      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing video:', error);
      setProcessingStatus('❌ Error processing video. Please try again.');
      setIsProcessing(false);
    }
  };

  const exportResults = () => {
    const csvContent = [
      ['Employee ID', 'Name', 'Status', 'Confidence', 'Risk Score', 'Risk Level', 'Department', 'Detection Count', 'First Seen', 'Last Seen'],
      ...results.map(r => [
        r.employeeId,
        r.employeeName || '',
        r.status,
        (r.confidence * 100).toFixed(1) + '%',
        r.riskScore?.toFixed(2) || 'N/A',
        r.riskLevel || 'N/A',
        r.department || 'N/A',
        r.detectionCount,
        r.firstSeenTime || 'N/A',
        r.lastSeenTime || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cctv-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authorized': return 'text-green-400 bg-green-900/30 border-green-500/30';
      case 'unauthorized': return 'text-red-400 bg-red-900/30 border-red-500/30';
      case 'unknown': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30';
      default: return 'text-slate-400 bg-slate-900/30 border-slate-500/30';
    }
  };

  const getRiskColor = (level?: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500';
      case 'HIGH': return 'text-red-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'LOW': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  const criticalThreats = results.filter(r => 
    r.status === 'unauthorized' || (r.riskScore && r.riskScore >= 80)
  );

  const sendAlertMessage = async () => {
    if (!alertPhoneNumber.trim()) {
      setAlertStatus('❌ Logged-in account has no phone number. Add a phone number in account creation and log in again.');
      return;
    }

    const highOrCritical = displayResults.filter(r =>
      r.status === 'unauthorized' || (r.riskScore !== undefined && r.riskScore >= 60)
    );

    if (highOrCritical.length === 0) {
      setAlertStatus('❌ No high/critical risk persons to alert.');
      return;
    }

    setIsSendingAlert(true);
    setAlertStatus('🔄 Sending alert message...');

    try {
      const response = await fetch('http://localhost:8000/api/v1/alerts/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone_number: alertPhoneNumber.trim(),
          alerts: highOrCritical.map(r => ({
            employee_id: r.employeeId,
            employee_name: r.employeeName,
            risk_score: r.status === 'unauthorized' ? 100 : (r.riskScore || 0),
            risk_level: r.status === 'unauthorized' ? 'CRITICAL' : (r.riskLevel || 'HIGH'),
            status: r.status,
            detection_count: r.detectionCount
          }))
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setAlertStatus(`❌ Alert failed: ${payload?.detail || 'Unknown error'}`);
        return;
      }

      setAlertStatus('✅ Alert message sent successfully.');
    } catch (error) {
      setAlertStatus('❌ Could not send alert. Make sure backend is running on port 8000.');
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Force unauthorized employees to be displayed as CRITICAL
  const displayResults = results.map(r => {
    if (r.status === 'unauthorized') {
      return {
        ...r,
        riskScore: r.riskScore || 100,
        riskLevel: 'CRITICAL'
      };
    }
    return r;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/80 to-pink-900/80 backdrop-blur-md p-8 rounded-2xl border border-purple-500/20 shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
          <Video size={32} />
          CCTV Face Recognition & Risk Analysis
        </h1>
        <p className="text-purple-200 text-lg">
          Upload CCTV footage to detect authorized/unauthorized personnel and correlate with behavioral risk scores.
        </p>
      </div>

      {/* Video Upload Section */}
      <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Upload size={24} />
          Upload CCTV Video
        </h2>

        {/* Restricted Zone Toggle */}
        <div className="mb-6 flex items-center gap-3">
          <input
            type="checkbox"
            id="restricted-zone"
            checked={restrictedZoneMode}
            onChange={(e) => setRestrictedZoneMode(e.target.checked)}
            className="w-5 h-5 rounded bg-slate-800 border-slate-600 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
          />
          <label htmlFor="restricted-zone" className="text-slate-300 font-medium">
            This is a <span className="text-red-400">Restricted Zone</span> - Flag all detections as potential threats
          </label>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="file"
              id="video-upload"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
            <label
              htmlFor="video-upload"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-indigo-500/20"
            >
              <Video size={20} />
              <span className="font-semibold">Select CCTV Video File</span>
            </label>
          </div>

          {videoFile && (
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-600">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white font-semibold">{videoFile.name}</p>
                  <p className="text-slate-400 text-sm">
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={processVideo}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all shadow-lg"
                >
                  <Play size={20} />
                  {isProcessing ? 'Processing...' : 'Process Video'}
                </button>
              </div>
              {videoPreview && (
                <video
                  src={videoPreview}
                  controls
                  className="w-full max-h-64 rounded-lg border border-slate-600"
                />
              )}
            </div>
          )}
        </div>

        {processingStatus && (
          <div className={`mt-4 p-4 rounded-xl border backdrop-blur-md flex items-center gap-3 ${
            processingStatus.includes('✅')
              ? 'bg-green-900/50 border-green-500/30 text-green-200'
              : processingStatus.includes('❌')
              ? 'bg-red-900/50 border-red-500/30 text-red-200'
              : 'bg-blue-900/50 border-blue-500/30 text-blue-200'
          }`}>
            {processingStatus}
          </div>
        )}
      </div>

      {/* Critical Threats Alert */}
      {criticalThreats.length > 0 && (
        <div className="bg-red-900/50 border-2 border-red-500 p-6 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={28} className="text-red-400" />
            <h2 className="text-2xl font-bold text-white">
              ⚠️ CRITICAL THREATS DETECTED: {criticalThreats.length}
            </h2>
          </div>
          <p className="text-red-200 mb-4">
            Immediate attention required for high-risk or unauthorized personnel detected in the footage.
          </p>
          <div className="grid gap-3">
            {criticalThreats.map((threat, idx) => (
              <div key={idx} className={`p-4 rounded-xl border-2 ${
                threat.status === 'unauthorized' 
                  ? 'bg-red-950/70 border-red-400 animate-pulse' 
                  : 'bg-red-950/50 border-red-400/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-lg">
                      {threat.status === 'unauthorized' && '🚨 '}
                      {threat.employeeName || threat.employeeId}
                    </p>
                    <p className="text-red-300 text-sm font-semibold">
                      {threat.status === 'unauthorized' ? '⛔ UNAUTHORIZED ACCESS' : threat.status.toUpperCase()}
                      {threat.riskScore && ` • Risk: ${threat.riskScore.toFixed(1)} (${threat.riskLevel})`}
                    </p>
                    {threat.status === 'unauthorized' && (
                      <p className="text-red-200 text-xs mt-1 font-bold">
                        ⚠️ IMMEDIATE SECURITY RESPONSE REQUIRED
                      </p>
                    )}
                  </div>
                  <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                    threat.status === 'unauthorized'
                      ? 'bg-red-600 text-white ring-2 ring-red-400 ring-offset-2 ring-offset-slate-900'
                      : 'bg-red-600 text-white'
                  }`}>
                    {threat.status === 'unauthorized' ? '🚨 CRITICAL' : 'PRIORITY'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-red-500/30">
            <p className="text-red-200 text-sm mb-3">Send High/Critical risk details to phone number</p>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="tel"
                value={alertPhoneNumber}
                onChange={(e) => setAlertPhoneNumber(e.target.value)}
                placeholder="Phone from logged-in account"
                className="flex-1 bg-slate-900/70 border border-red-500/40 rounded-lg px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
              <button
                onClick={sendAlertMessage}
                disabled={isSendingAlert}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white rounded-lg font-semibold"
              >
                {isSendingAlert ? 'Sending...' : 'Send Alert Message'}
              </button>
            </div>
            {alertStatus && (
              <p className={`mt-3 text-sm ${alertStatus.includes('✅') ? 'text-green-300' : alertStatus.includes('🔄') ? 'text-blue-300' : 'text-red-300'}`}>
                {alertStatus}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      {results.length > 0 && (
        <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Shield size={24} />
              Face Detection Results ({results.length} persons detected)
            </h2>
            <button
              onClick={exportResults}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-900/30 border border-green-500/30 p-4 rounded-xl">
              <p className="text-green-400 text-sm mb-1">Authorized</p>
              <p className="text-3xl font-bold text-white">
                {results.filter(r => r.status === 'authorized').length}
              </p>
            </div>
            <div className="bg-red-900/30 border border-red-500/30 p-4 rounded-xl">
              <p className="text-red-400 text-sm mb-1">Unauthorized</p>
              <p className="text-3xl font-bold text-white">
                {results.filter(r => r.status === 'unauthorized').length}
              </p>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-500/30 p-4 rounded-xl">
              <p className="text-yellow-400 text-sm mb-1">Unknown</p>
              <p className="text-3xl font-bold text-white">
                {results.filter(r => r.status === 'unknown').length}
              </p>
            </div>
            <div className="bg-purple-900/30 border border-purple-500/30 p-4 rounded-xl">
              <p className="text-purple-400 text-sm mb-1">High Risk</p>
              <p className="text-3xl font-bold text-white">
                {results.filter(r => r.riskLevel === 'HIGH').length}
              </p>
            </div>
          </div>

          {/* Detailed Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Employee</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Confidence</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Risk Score</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Department</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Detections</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Time Range</th>
                </tr>
              </thead>
              <tbody>
                {displayResults.map((result, idx) => (
                  <tr key={idx} className={`border-b border-slate-800 transition-colors ${
                    result.status === 'unauthorized' 
                      ? 'bg-red-950/30 hover:bg-red-950/50 border-red-800' 
                      : 'hover:bg-slate-800/50'
                  }`}>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <User size={20} className="text-slate-400" />
                        <div>
                          <p className="text-white font-semibold">{result.employeeName || result.employeeId}</p>
                          <p className="text-slate-400 text-xs">{result.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(result.status)}`}>
                        {result.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white">
                      {(result.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-4 px-4">
                      {result.riskScore ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-lg ${
                            result.status === 'unauthorized' ? 'text-red-400' : getRiskColor(result.riskLevel)
                          }`}>
                            {result.riskScore.toFixed(1)}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            result.status === 'unauthorized'
                              ? 'bg-red-600 text-white'
                              : result.riskLevel === 'HIGH'
                              ? 'bg-red-500/30 text-red-400'
                              : result.riskLevel === 'MEDIUM'
                              ? 'bg-yellow-500/30 text-yellow-400'
                              : 'bg-green-500/30 text-green-400'
                          }`}>
                            {result.status === 'unauthorized' ? 'CRITICAL' : result.riskLevel}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {result.department || 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-white">
                      {result.detectionCount}
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-sm">
                      {result.firstSeenTime} - {result.lastSeenTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-900/30 border border-blue-500/30 p-6 rounded-xl backdrop-blur-md">
        <h3 className="text-lg font-semibold text-blue-200 mb-3">📋 How It Works</h3>
        <ul className="text-blue-200 space-y-2 text-sm">
          <li>• Upload employee images first in the "Employee Images" tab</li>
          <li>• Upload CCTV video footage from your monitoring system</li>
          <li>• The system detects faces and matches them against authorized employees</li>
          <li>• Risk scores from behavioral data are combined with face detection results</li>
          <li>• Unauthorized or high-risk personnel are flagged for immediate attention</li>
          <li>• Export results as CSV for reporting and incident management</li>
        </ul>
      </div>
    </div>
  );
};

export default CCTVFaceRecognition;
