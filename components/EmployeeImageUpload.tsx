import React, { useState } from 'react';
import { Upload, UserCheck, UserX, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface EmployeeImage {
  id: string;
  employeeId: string;
  file: File;
  preview: string;
}

const EmployeeImageUpload: React.FC = () => {
  const [authorizedImages, setAuthorizedImages] = useState<EmployeeImage[]>([]);
  const [unauthorizedImages, setUnauthorizedImages] = useState<EmployeeImage[]>([]);
  const [authorizedIds, setAuthorizedIds] = useState<string>('');
  const [unauthorizedIds, setUnauthorizedIds] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const handleImageUpload = (
    files: FileList | null,
    employeeIds: string,
    isAuthorized: boolean
  ) => {
    if (!files || files.length === 0) return;

    const ids = employeeIds.split(',').map(id => id.trim()).filter(id => id);
    if (ids.length === 0) {
      setUploadStatus('❌ Please enter employee IDs (comma-separated)');
      return;
    }

    const newImages: EmployeeImage[] = [];
    const fileArray = Array.from(files);

    fileArray.forEach((file, index) => {
      const employeeId = ids[index % ids.length]; // Cycle through IDs if more files than IDs
      const preview = URL.createObjectURL(file);
      newImages.push({
        id: `${Date.now()}-${index}`,
        employeeId,
        file,
        preview
      });
    });

    if (isAuthorized) {
      setAuthorizedImages([...authorizedImages, ...newImages]);
      setUploadStatus(`✅ Added ${newImages.length} authorized employee image(s)`);
    } else {
      setUnauthorizedImages([...unauthorizedImages, ...newImages]);
      setUploadStatus(`✅ Added ${newImages.length} unauthorized employee image(s)`);
    }

    setTimeout(() => setUploadStatus(''), 3000);
  };

  const removeImage = (id: string, isAuthorized: boolean) => {
    if (isAuthorized) {
      const image = authorizedImages.find(img => img.id === id);
      if (image) URL.revokeObjectURL(image.preview);
      setAuthorizedImages(authorizedImages.filter(img => img.id !== id));
    } else {
      const image = unauthorizedImages.find(img => img.id === id);
      if (image) URL.revokeObjectURL(image.preview);
      setUnauthorizedImages(unauthorizedImages.filter(img => img.id !== id));
    }
  };

  const clearAll = (isAuthorized: boolean) => {
    if (isAuthorized) {
      authorizedImages.forEach(img => URL.revokeObjectURL(img.preview));
      setAuthorizedImages([]);
      setAuthorizedIds('');
    } else {
      unauthorizedImages.forEach(img => URL.revokeObjectURL(img.preview));
      setUnauthorizedImages([]);
      setUnauthorizedIds('');
    }
  };

  const saveToLocalStorage = () => {
    const data = {
      authorized: authorizedImages.map(img => ({
        id: img.id,
        employeeId: img.employeeId,
        fileName: img.file.name
      })),
      unauthorized: unauthorizedImages.map(img => ({
        id: img.id,
        employeeId: img.employeeId,
        fileName: img.file.name
      }))
    };
    localStorage.setItem('employeeImageData', JSON.stringify(data));
    setUploadStatus('✅ Employee image data saved successfully!');
    setTimeout(() => setUploadStatus(''), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 backdrop-blur-md p-8 rounded-2xl border border-indigo-500/20 shadow-xl">
        <h1 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
          📸 Employee Image Management
        </h1>
        <p className="text-indigo-200 text-lg">
          Upload employee images from multiple angles to create face recognition profiles for authorized and unauthorized personnel detection.
        </p>
      </div>

      {/* Status Message */}
      {uploadStatus && (
        <div className={`p-4 rounded-xl border ${
          uploadStatus.includes('✅') 
            ? 'bg-green-900/50 border-green-500/30 text-green-200'
            : 'bg-red-900/50 border-red-500/30 text-red-200'
        } backdrop-blur-md flex items-center gap-3`}>
          {uploadStatus.includes('✅') ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          {uploadStatus}
        </div>
      )}

      {/* Authorized Employees Section */}
      <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <UserCheck className="text-green-400" size={28} />
          <h2 className="text-2xl font-bold text-white">Authorized Employees</h2>
          <span className="ml-auto text-sm text-slate-400">
            {authorizedImages.length} image(s) uploaded
          </span>
        </div>

        <div className="space-y-4">
          {/* Employee ID Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Employee IDs (comma-separated, e.g., EMP001, EMP002, EMP003)
            </label>
            <input
              type="text"
              value={authorizedIds}
              onChange={(e) => setAuthorizedIds(e.target.value)}
              placeholder="EMP001, EMP002, EMP003"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
            />
          </div>

          {/* File Upload */}
          <div className="relative">
            <input
              type="file"
              id="authorized-upload"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files, authorizedIds, true)}
              className="hidden"
            />
            <label
              htmlFor="authorized-upload"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-green-500/20"
            >
              <Upload size={20} />
              <span className="font-semibold">Upload Authorized Employee Images</span>
            </label>
          </div>

          {/* Image Preview Grid */}
          {authorizedImages.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Uploaded Images</h3>
                <button
                  onClick={() => clearAll(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-700 text-white rounded-lg transition-all text-sm"
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {authorizedImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.preview}
                      alt={img.employeeId}
                      className="w-full h-32 object-cover rounded-lg border-2 border-green-500/30"
                    />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                      <span className="text-white text-xs font-semibold">{img.employeeId}</span>
                      <button
                        onClick={() => removeImage(img.id, true)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unauthorized Employees Section (Optional) */}
      <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <UserX className="text-red-400" size={28} />
          <h2 className="text-2xl font-bold text-white">Unauthorized Employees (Optional)</h2>
          <span className="ml-auto text-sm text-slate-400">
            {unauthorizedImages.length} image(s) uploaded
          </span>
        </div>

        <p className="text-slate-400 text-sm mb-4">
          Optionally upload images of unauthorized personnel for enhanced detection.
        </p>

        <div className="space-y-4">
          {/* Employee ID Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Unauthorized Employee IDs (comma-separated)
            </label>
            <input
              type="text"
              value={unauthorizedIds}
              onChange={(e) => setUnauthorizedIds(e.target.value)}
              placeholder="UNAUTH001, UNAUTH002"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
            />
          </div>

          {/* File Upload */}
          <div className="relative">
            <input
              type="file"
              id="unauthorized-upload"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files, unauthorizedIds, false)}
              className="hidden"
            />
            <label
              htmlFor="unauthorized-upload"
              className="flex items-center justify-center gap-3 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-red-500/20"
            >
              <Upload size={20} />
              <span className="font-semibold">Upload Unauthorized Employee Images</span>
            </label>
          </div>

          {/* Image Preview Grid */}
          {unauthorizedImages.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Uploaded Images</h3>
                <button
                  onClick={() => clearAll(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-700 text-white rounded-lg transition-all text-sm"
                >
                  <Trash2 size={16} />
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {unauthorizedImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.preview}
                      alt={img.employeeId}
                      className="w-full h-32 object-cover rounded-lg border-2 border-red-500/30"
                    />
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-2">
                      <span className="text-white text-xs font-semibold">{img.employeeId}</span>
                      <button
                        onClick={() => removeImage(img.id, false)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Configuration */}
      <div className="flex justify-center">
        <button
          onClick={saveToLocalStorage}
          disabled={authorizedImages.length === 0}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-indigo-500/20 disabled:shadow-none"
        >
          <CheckCircle2 size={20} />
          Save Employee Image Configuration
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/30 border border-blue-500/30 p-6 rounded-xl backdrop-blur-md">
        <h3 className="text-lg font-semibold text-blue-200 mb-3 flex items-center gap-2">
          <AlertCircle size={20} />
          How It Works
        </h3>
        <ul className="text-blue-200 space-y-2 text-sm">
          <li>• Upload multiple images of each authorized employee from different angles for better recognition</li>
          <li>• Employee IDs should match those in your behavioral data CSV file</li>
          <li>• Supported formats: JPG, PNG, JPEG</li>
          <li>• The system will use these images to identify personnel in CCTV footage</li>
          <li>• Unauthorized employee images (optional) help the system flag unexpected visitors</li>
          <li>• After uploading, use the CCTV Analysis tab to process video footage</li>
        </ul>
      </div>
    </div>
  );
};

export default EmployeeImageUpload;
