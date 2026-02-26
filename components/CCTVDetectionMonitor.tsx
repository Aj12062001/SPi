import React, { useState, useEffect } from 'react';
import { AlertTriangle, Eye, Clock, MapPin, Activity, User, TrendingUp } from 'lucide-react';
import { useData } from '../DataContext';

interface DetectionAlert {
  id: string;
  faceId: string;
  employeeName: string;
  gender: string;
  timestamp: string;
  confidence: number;
  location: string;
  activities: string[];
  riskScore: number;
  isUnauthorized: boolean;
}

export const CCTVDetectionMonitor: React.FC = () => {
  const { employeeData } = useData();
  const [authorizedFaces, setAuthorizedFaces] = useState<any[]>([]);
  const [detections, setDetections] = useState<DetectionAlert[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<DetectionAlert | null>(null);
  const [simulateDetection, setSimulateDetection] = useState(false);

  // Load authorized faces
  useEffect(() => {
    const stored = localStorage.getItem('authorizedFaces');
    if (stored) {
      try {
        setAuthorizedFaces(JSON.parse(stored));
      } catch (error) {
        console.warn('Failed to parse authorized faces', error);
      }
    }
  }, []);

  // Generate mock CCTV detections based on authorization status
  const generateMockDetections = () => {
    const emp1 = employeeData?.find((e) => e.cctv_face_id === 'emp1');
    const emp2 = employeeData?.find((e) => e.cctv_face_id === 'emp2');

    const newDetections: DetectionAlert[] = [];

    // Determine who is critical
    const emp1Authorized = authorizedFaces.some((f) => f.faceId === 'emp1');
    const emp2Authorized = authorizedFaces.some((f) => f.faceId === 'emp2');
    const criticalFaceId = emp1Authorized ? 'emp2' : emp2Authorized ? 'emp1' : null;
    const criticalEmployee = criticalFaceId === 'emp2' ? emp2 : emp1;

    // If someone is critical and not authorized, generate detections
    if (criticalFaceId && criticalEmployee) {
      const timeBase = new Date();

      // Multiple detections at different times
      for (let i = 0; i < 3; i++) {
        const timestamp = new Date(timeBase.getTime() - i * 3600000); // 1 hour apart

        // Simulate activities based on file operations
        const activities = generateActivitiesForEmployee(criticalEmployee);

        newDetections.push({
          id: `det_${i}_${Date.now()}`,
          faceId: criticalFaceId,
          employeeName: criticalEmployee.employee_name || 'Unknown',
          gender: (criticalEmployee as any).gender || 'Unknown',
          timestamp: timestamp.toISOString(),
          confidence: 0.92 + Math.random() * 0.08,
          location: ['Server Room', 'Data Center', 'Executive Office', 'Finance Department'][i % 4],
          activities: activities,
          riskScore: criticalEmployee.risk_score || 95,
          isUnauthorized: true,
        });
      }
    }

    setDetections(newDetections);
  };

  const generateActivitiesForEmployee = (employee: any) => {
    const baseActivities = [
      `Accessed sensitive database: ${employee.primary_database}`,
      `Downloaded ${Math.floor(Math.random() * 100)} files`,
      `Executed ${Math.floor(Math.random() * 500)} database queries`,
      `Connected USB device (${Math.floor(Math.random() * 50)}GB)`,
      `Sent ${Math.floor(Math.random() * 30)} emails (${Math.floor(Math.random() * 10)} external)`,
      `Copied confidential documents`,
      `Modified system configuration`,
      `Accessed security audit logs`,
      `Transferred data to external drive`,
      `Opened payroll_q4.xlsx file`,
    ];

    return baseActivities.slice(0, Math.floor(Math.random() * 4) + 2);
  };

  // Simulate detection when toggled
  useEffect(() => {
    if (simulateDetection) {
      generateMockDetections();
      const timer = setTimeout(() => {
        setSimulateDetection(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [simulateDetection, authorizedFaces, employeeData]);

  const getCriticalEmployeeInfo = () => {
    const emp1Authorized = authorizedFaces.some((f) => f.faceId === 'emp1');
    const emp2Authorized = authorizedFaces.some((f) => f.faceId === 'emp2');

    if (!emp1Authorized && !emp2Authorized) {
      return {
        employee: null,
        status: 'both_unauthorized',
      };
    }

    if (emp1Authorized) {
      return {
        employee: employeeData?.find((e) => e.cctv_face_id === 'emp2'),
        status: 'emp2_critical',
      };
    }

    return {
      employee: employeeData?.find((e) => e.cctv_face_id === 'emp1'),
      status: 'emp1_critical',
    };
  };

  const criticalInfo = getCriticalEmployeeInfo();
  const hasCritical = criticalInfo.employee && criticalInfo.status !== 'both_unauthorized';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Eye className="w-6 h-6 text-red-600" />
          CCTV Face Detection Monitor
        </h2>
        <p className="text-gray-600 mt-2">
          Real-time detection and alerts when critical risk employees are identified in CCTV footage.
        </p>
      </div>

      {/* Critical Risk Status */}
      {hasCritical ? (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-lg text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                🚨 CRITICAL EMPLOYEE FLAGGED
              </h3>
              <p className="text-red-700 mt-1">
                <strong>{criticalInfo.employee?.employee_name}</strong> is NOT authorized and poses CRITICAL RISK
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600">
                {Math.round(criticalInfo.employee?.risk_score || 95)}%
              </p>
              <p className="text-xs text-red-600">Risk Score</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="bg-red-100 p-2 rounded">
              <p className="text-xs text-red-700">ID</p>
              <p className="font-semibold text-red-900">{criticalInfo.employee?.cctv_face_id}</p>
            </div>
            <div className="bg-red-100 p-2 rounded">
              <p className="text-xs text-red-700">Gender</p>
              <p className="font-semibold text-red-900">{(criticalInfo.employee as any)?.gender}</p>
            </div>
            <div className="bg-red-100 p-2 rounded">
              <p className="text-xs text-red-700">Department</p>
              <p className="font-semibold text-red-900">{criticalInfo.employee?.department}</p>
            </div>
            <div className="bg-red-100 p-2 rounded">
              <p className="text-xs text-red-700">Status</p>
              <p className="font-semibold text-red-900">UNAUTHORIZED</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
          <p className="text-green-700 font-semibold flex items-center gap-2">
            ✅ All critical employees are properly authorized
          </p>
        </div>
      )}

      {/* Detection Simulator */}
      <div className="flex gap-2">
        <button
          onClick={() => setSimulateDetection(true)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-semibold flex items-center justify-center gap-2"
        >
          <Eye className="w-5 h-5" />
          Simulate Detection
        </button>
      </div>

      {/* Detections List */}
      <div>
        <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Recent CCTV Detections ({detections.length})
        </h3>

        {detections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No detections recorded</p>
            <p className="text-sm mt-1">Click "Simulate Detection" to generate sample detections</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {detections.map((detection) => (
              <div
                key={detection.id}
                onClick={() => setSelectedDetection(detection)}
                className={`border rounded-lg p-4 cursor-pointer transition ${
                  selectedDetection?.id === detection.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-red-400 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900">{detection.employeeName}</h4>
                      <p className="text-sm text-gray-600">ID: {detection.faceId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{Math.round(detection.confidence * 100)}%</p>
                    <p className="text-xs text-gray-600">Confidence</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div className="flex items-center gap-1 text-gray-700">
                    <Clock className="w-4 h-4" />
                    {new Date(detection.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <MapPin className="w-4 h-4" />
                    {detection.location}
                  </div>
                </div>

                {detection.activities.length > 0 && (
                  <div className="bg-white p-2 rounded text-xs">
                    <p className="font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <Activity className="w-4 h-4" /> Activities:
                    </p>
                    <ul className="text-gray-600 space-y-0.5">
                      {detection.activities.map((activity, i) => (
                        <li key={i}>• {activity}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Detection View */}
      {selectedDetection && (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
          <h3 className="font-bold text-lg text-red-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Detection Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-red-700 font-semibold">Employee</p>
              <p className="text-lg font-bold text-gray-900">{selectedDetection.employeeName}</p>
            </div>
            <div>
              <p className="text-sm text-red-700 font-semibold">Risk Score</p>
              <p className="text-lg font-bold text-red-600">{Math.round(selectedDetection.riskScore)}%</p>
            </div>
            <div>
              <p className="text-sm text-red-700 font-semibold">Face Detection Confidence</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-300 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${selectedDetection.confidence * 100}%` }}
                  />
                </div>
                <p className="text-lg font-bold text-red-600">
                  {Math.round(selectedDetection.confidence * 100)}%
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-red-700 font-semibold">Detection Time</p>
              <p className="text-gray-900">
                {new Date(selectedDetection.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-red-700 font-semibold mb-2">What was this person doing?</p>
              <ul className="space-y-1 bg-white p-3 rounded border border-red-200">
                {selectedDetection.activities.map((activity, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    {activity}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-red-100 border border-red-300 rounded p-3 text-sm text-red-900">
            <p className="font-semibold mb-1">⚠️ Recommendation</p>
            <p>
              Immediate action required. {selectedDetection.employeeName} is an unauthorized critical risk
              employee with detected CCTV presence. Alert security team immediately.
            </p>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <h3 className="font-bold text-blue-900 mb-2">ℹ️ Understanding Detections</h3>
        <ul className="text-blue-800 space-y-1 ml-5">
          <li>
            🚨 <strong>Critical Risk + Unauthorized:</strong> Only employee NOT in authorized face database
          </li>
          <li>📹 <strong>Confidence Score:</strong> Face matching accuracy from CCTV footage analysis</li>
          <li>
            📊 <strong>Activities:</strong> What the detected person was doing based on network monitoring
          </li>
          <li>🔔 <strong>Auto Alerts:</strong> System generates alerts when critical employees detected</li>
        </ul>
      </div>
    </div>
  );
};

export default CCTVDetectionMonitor;
