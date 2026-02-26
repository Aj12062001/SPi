import React, { useState, useEffect } from 'react';
import { Upload, Trash2, CheckCircle, AlertCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { useData } from '../DataContext';

interface FaceUpload {
  faceId: string;
  imageUrl: string;
  employeeName: string;
  department: string;
  jobTitle: string;
  gender: string;
}

export const AuthorizedFaceDatabase: React.FC = () => {
  const { employeeData } = useData();
  const [authorizedFaces, setAuthorizedFaces] = useState<FaceUpload[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFace, setSelectedFace] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [detectionStatus, setDetectionStatus] = useState<{
    emp1: boolean;
    emp2: boolean;
    criticalEmployee: string | null;
  }>({
    emp1: false,
    emp2: false,
    criticalEmployee: null,
  });

  // Initialize authorized faces from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('authorizedFaces');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAuthorizedFaces(parsed);
        updateDetectionStatus(parsed);
      } catch (error) {
        console.warn('Failed to parse authorized faces', error);
      }
    }
  }, []);

  // Update detection status based on authorized faces
  const updateDetectionStatus = (faces: FaceUpload[]) => {
    const emp1Authorized = faces.some((f) => f.faceId === 'emp1');
    const emp2Authorized = faces.some((f) => f.faceId === 'emp2');

    setDetectionStatus({
      emp1: emp1Authorized,
      emp2: emp2Authorized,
      // If emp1 is authorized, emp2 becomes critical risk
      // If emp2 is authorized, emp1 becomes critical risk
      criticalEmployee: emp1Authorized ? 'emp2' : emp2Authorized ? 'emp1' : null,
    });
  };

  const handleUploadFace = (faceId: string) => {
    const employee = employeeData?.find(
      (e) => e.cctv_face_id === faceId
    );

    if (!employee) {
      alert('Employee not found');
      return;
    }

    // Simulate face image upload (in real scenario, read from file)
    const newFace: FaceUpload = {
      faceId,
      imageUrl: `/faces/${faceId}.jpg`, // Points to real CCTV folder
      employeeName: employee.employee_name || `Employee ${faceId}`,
      department: employee.department || 'Unknown',
      jobTitle: employee.job_title || 'Unknown',
      gender: (employee as any).gender || 'Unknown',
    };

    const updated = [
      ...authorizedFaces.filter((f) => f.faceId !== faceId),
      newFace,
    ];
    setAuthorizedFaces(updated);
    localStorage.setItem('authorizedFaces', JSON.stringify(updated));
    updateDetectionStatus(updated);

    alert(`✅ ${employee.employee_name} added to authorized faces`);
    setShowUploadModal(false);
    setSelectedFace('');
  };

  const handleRemoveFace = (faceId: string) => {
    const updated = authorizedFaces.filter((f) => f.faceId !== faceId);
    setAuthorizedFaces(updated);
    localStorage.setItem('authorizedFaces', JSON.stringify(updated));
    updateDetectionStatus(updated);
  };

  const getCriticalRiskEmployee = () => {
    if (!detectionStatus.criticalEmployee) return null;
    return employeeData?.find(
      (e) => e.cctv_face_id === detectionStatus.criticalEmployee
    );
  };

  const emp1 = employeeData?.find((e) => e.cctv_face_id === 'emp1');
  const emp2 = employeeData?.find((e) => e.cctv_face_id === 'emp2');
  const criticalEmployee = getCriticalRiskEmployee();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          CCTV Authorized Face Database
        </h2>
        <p className="text-gray-600 mt-2">
          Upload authorized employee faces. Unauthorized employees detected in CCTV will trigger critical risk alerts.
        </p>
      </div>

      {/* Critical Risk Alert */}
      {criticalEmployee && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-red-800">🚨 CRITICAL RISK DETECTED</h3>
              <p className="text-red-700 text-sm mt-1">
                <strong>{criticalEmployee.employee_name}</strong> ({criticalEmployee.cctv_face_id}) is
                currently marked as CRITICAL RISK because they are NOT in the authorized face database.
              </p>
              <p className="text-red-600 text-xs mt-2">
                If detected in CCTV footage without authorization, immediate alert will be triggered.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Authorization Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* emp1 Card */}
        {emp1 && (
          <div
            className={`border-2 rounded-lg p-4 transition ${
              detectionStatus.emp1
                ? 'border-green-400 bg-green-50'
                : 'border-red-400 bg-red-50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-lg text-gray-900">emp1</h3>
                <p className="text-sm text-gray-700">{emp1.employee_name}</p>
                <p className="text-xs text-gray-600">{emp1.department}</p>
              </div>
              {detectionStatus.emp1 ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
            </div>

            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-1">Risk Status:</p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                  detectionStatus.emp1
                    ? 'bg-green-200 text-green-800'
                    : detectionStatus.criticalEmployee === 'emp1'
                    ? 'bg-red-200 text-red-800'
                    : 'bg-yellow-200 text-yellow-800'
                }`}
              >
                {detectionStatus.emp1
                  ? '✅ Authorized'
                  : detectionStatus.criticalEmployee === 'emp1'
                  ? '🚨 CRITICAL RISK'
                  : 'Not Authorized'}
              </span>
            </div>

            <div className="flex gap-2">
              {!detectionStatus.emp1 ? (
                <button
                  onClick={() => handleUploadFace('emp1')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Add to Authorized
                </button>
              ) : (
                <button
                  onClick={() => handleRemoveFace('emp1')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
          </div>
        )}

        {/* emp2 Card */}
        {emp2 && (
          <div
            className={`border-2 rounded-lg p-4 transition ${
              detectionStatus.emp2
                ? 'border-green-400 bg-green-50'
                : 'border-red-400 bg-red-50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-lg text-gray-900">emp2</h3>
                <p className="text-sm text-gray-700">{emp2.employee_name}</p>
                <p className="text-xs text-gray-600">{emp2.department}</p>
              </div>
              {detectionStatus.emp2 ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
            </div>

            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-1">Risk Status:</p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                  detectionStatus.emp2
                    ? 'bg-green-200 text-green-800'
                    : detectionStatus.criticalEmployee === 'emp2'
                    ? 'bg-red-200 text-red-800'
                    : 'bg-yellow-200 text-yellow-800'
                }`}
              >
                {detectionStatus.emp2
                  ? '✅ Authorized'
                  : detectionStatus.criticalEmployee === 'emp2'
                  ? '🚨 CRITICAL RISK'
                  : 'Not Authorized'}
              </span>
            </div>

            <div className="flex gap-2">
              {!detectionStatus.emp2 ? (
                <button
                  onClick={() => handleUploadFace('emp2')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Add to Authorized
                </button>
              ) : (
                <button
                  onClick={() => handleRemoveFace('emp2')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Authorized Faces List */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Authorized Employees ({authorizedFaces.length})
        </h3>

        {authorizedFaces.length === 0 ? (
          <p className="text-gray-600 text-sm italic">
            No authorized faces uploaded yet. Add employees to whitelist.
          </p>
        ) : (
          <div className="space-y-2">
            {authorizedFaces.map((face) => (
              <div key={face.faceId} className="flex items-center justify-between bg-white p-3 rounded border border-green-200">
                <div>
                  <p className="font-semibold text-gray-900">{face.faceId}</p>
                  <p className="text-sm text-gray-600">{face.employeeName}</p>
                </div>
                <button
                  onClick={() => handleRemoveFace(face.faceId)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          How CCTV Face Detection Works
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 ml-7">
          <li>
            ✅ <strong>Authorized:</strong> Click "Add to Authorized" to mark an employee as allowed. Face detection will show green status.
          </li>
          <li>
            🚨 <strong>Critical Risk:</strong> If only ONE employee is authorized, the OTHER is automatically flagged as CRITICAL RISK.
          </li>
          <li>
            🎥 <strong>CCTV Matching:</strong> When the critical risk employee appears in CCTV footage, system generates urgent alerts.
          </li>
          <li>
            📊 <strong>Risk Score:</strong> Critical employee's risk score stays above 93, with CCTV detection as primary factor.
          </li>
        </ul>
      </div>

      {/* Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-bold text-amber-900 mb-2">📁 Using Local Face Images</h3>
        <p className="text-sm text-amber-800 mb-2">
          Place employee face images in: <code className="bg-white px-2 py-1 rounded">
            real cctv/processed_output/employee_database/video_2/all_faces/
          </code>
        </p>
        <p className="text-sm text-amber-800">
          • For emp1 (female): Create <code className="bg-white px-2 py-1 rounded">emp1/</code> folder with her face images
          <br />• For emp2 (male): Create <code className="bg-white px-2 py-1 rounded">emp2/</code> folder with his face images
          <br />• Click buttons above to add them to authorized database
        </p>
      </div>
    </div>
  );
};

export default AuthorizedFaceDatabase;
