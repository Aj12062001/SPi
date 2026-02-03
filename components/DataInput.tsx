
import React, { useState } from 'react';
import { useData } from '../DataContext';
import { EmployeeRisk } from '../types';

interface DataInputProps {
  onScanComplete: () => void;
}

const DataInput: React.FC<DataInputProps> = ({ onScanComplete }) => {
  const { setEmployeeData } = useData();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const scanStates = [
    "Initializing Isolation Forest model...",
    "Loading CSV report data...",
    "Correlating logon events...",
    "Analyzing USB and File activity...",
    "Processing CCTV temporal data...",
    "Computing risk probability scores...",
    "Finalizing threat intelligence report..."
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const isCsv = file?.type === 'text/csv' || file?.name.toLowerCase().endsWith('.csv');
    const isTxtCsv = file?.name.toLowerCase().endsWith('.txt');

    if (file && (isCsv || isTxtCsv)) {
      setSelectedFile(file);
    } else {
      alert('Please select a valid CSV or TXT file with comma-separated values.');
    }
  };

  const parseCSV = (csvText: string): EmployeeRisk[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length <= 1) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data: EmployeeRisk[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < 6) continue;

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });

      // Map the CSV columns to EmployeeRisk interface
      const employee: EmployeeRisk = {
        user: row.user_id || row.user || `USER_${i.toString().padStart(5, '0')}`,
        user_id: row.user_id || row.user,
        employee_name: row.employee_name || `Employee ${i}`,
        department: row.department,
        job_title: row.job_title,
        date: row.date,
        login_count: parseInt(row.login_count) || 0,
        night_logins: parseInt(row.night_logins) || 0,
        unique_pcs: parseInt(row.unique_pcs) || 1,
        
        // Session tracking
        session_duration_total: parseFloat(row.session_duration_total) || 0,
        session_duration_avg: parseFloat(row.session_duration_avg) || 0,
        
        // USB activity
        usb_count: parseInt(row.usb_connect) || parseInt(row.usb_disconnect) || 0,
        usb_connect: parseInt(row.usb_connect) || 0,
        usb_disconnect: parseInt(row.usb_disconnect) || 0,
        
        // File operations
        file_activity_count: parseInt(row.total_file_operations) || parseInt(row.file_activity_count) || 0,
        file_opened: parseInt(row.file_opened) || 0,
        file_copied: parseInt(row.file_copied) || 0,
        file_deleted: parseInt(row.file_deleted) || 0,
        file_downloaded: parseInt(row.file_downloaded) || 0,
        file_uploaded: parseInt(row.file_uploaded) || 0,
        file_edited: parseInt(row.file_edited) || 0,
        total_file_operations: parseInt(row.total_file_operations) || 0,
        sensitive_files_accessed: parseInt(row.sensitive_files_accessed) || 0,
        unique_files_accessed: parseInt(row.unique_files_accessed) || 0,
        systems_accessed: row.systems_accessed || '',
        file_operations_detail: row.file_operations_detail || '',
        
        // Email activity
        emails_sent: parseInt(row.emails_sent) || 0,
        external_mails: parseInt(row.external_mails) || 0,
        email_attachments: parseInt(row.email_attachments) || 0,
        avg_email_size: parseFloat(row.avg_email_size) || 0,
        
        // Web activity
        http_requests: parseInt(row.http_requests) || 0,
        unique_urls: parseInt(row.unique_urls) || 0,
        
        // Other attributes
        cctv_anomalies: parseInt(row.cctv_anomalies) || 0,
        access_card_anomalies: parseInt(row.access_card_anomalies) || 0,
        behavioral_score: parseFloat(row.behavioral_score) || 50,
        anomaly_label: parseInt(row.anomaly_label) || 1,
        risk_score: parseFloat(row.risk_score) || 0,
        risk_profile: row.risk_profile,
        
        // Legacy compatibility
        logoff_count: parseInt(row.logoff_count) || parseInt(row.login_count) || 0,
        file_accessed: parseInt(row.file_accessed) || 0,
        file_events: parseInt(row.file_events) || 0,
        unique_files: parseInt(row.unique_files) || 0,
        avg_filename_length: parseFloat(row.avg_filename_length) || 0,
        attachments: parseInt(row.attachments) || 0,
        O: parseInt(row.O) || 0,
        C: parseInt(row.C) || 0,
        E: parseInt(row.E) || 0,
        A: parseInt(row.A) || 0,
        N: parseInt(row.N) || 0,
      };

      data.push(employee);
    }

    return data;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setStatusText(scanStates[0]);

    try {
      const text = await selectedFile.text();
      const parsedData = parseCSV(text);
      
      // Simulate processing
      let p = 0;
      const interval = setInterval(() => {
        p += 2;
        setProgress(p);
        
        const statusIdx = Math.min(Math.floor((p / 100) * scanStates.length), scanStates.length - 1);
        setStatusText(scanStates[statusIdx]);

        if (p >= 100) {
          clearInterval(interval);
          setEmployeeData(parsedData);
          setTimeout(() => {
            setUploading(false);
            setSelectedFile(null);
            onScanComplete();
          }, 800);
        }
      }, 80);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setUploading(false);
      alert('Error processing the file. Please check the format.');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900/40 backdrop-blur-md p-10 rounded-[2rem] border border-slate-800/50 group hover:border-indigo-500/30 transition-all duration-500 shadow-2xl">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-white italic tracking-tight">DATASET <span className="text-indigo-500">.CSV</span></h3>
          </div>
          <div className="relative group/upload border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center hover:bg-slate-950 transition-all cursor-pointer">
            <input type="file" accept=".csv,.txt" className="hidden" id="csv-upload" onChange={handleFileChange} />
            <label htmlFor="csv-upload" className="cursor-pointer block">
              <div className="bg-slate-900 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover/upload:scale-110 group-hover/upload:rotate-3 transition-all duration-500 border border-slate-800 shadow-xl">
                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-200 tracking-tight">
                {selectedFile ? `Selected: ${selectedFile.name}` : 'Upload Threat Report'}
              </p>
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">Supports DB exports & ML output</p>
            </label>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-md p-10 rounded-[2rem] border border-slate-800/50 group hover:border-indigo-500/30 transition-all duration-500 shadow-2xl">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-white italic tracking-tight">CCTV <span className="text-indigo-500">MEDIA</span></h3>
          </div>
          <div className="relative group/upload border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center hover:bg-slate-950 transition-all cursor-pointer">
            <input type="file" className="hidden" id="video-upload" />
            <label htmlFor="video-upload" className="cursor-pointer block">
              <div className="bg-slate-900 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover/upload:scale-110 group-hover/upload:-rotate-3 transition-all duration-500 border border-slate-800 shadow-xl">
                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-200 tracking-tight">Physical Surveillance</p>
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">MP4 / H.264 / Prerecorded</p>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center pt-4">
        {uploading ? (
          <div className="w-full max-w-2xl bg-slate-900/80 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Processing Intelligence</p>
                <p className="text-lg font-bold text-white transition-all duration-300">{statusText}</p>
              </div>
              <p className="text-2xl font-black text-white font-mono">{progress}%</p>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full transition-all duration-150 relative" 
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={selectedFile ? handleUpload : undefined}
            disabled={!selectedFile || uploading}
            className={`group relative bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 px-20 rounded-2xl transition-all shadow-[0_15px_40px_-10px_rgba(79,70,229,0.5)] active:scale-95 uppercase tracking-tighter italic text-xl ${(!selectedFile || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="relative z-10">{selectedFile ? 'Initialize ML Analysis' : 'Select a CSV File First'}</span>
            <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        )}
      </div>
    </div>
  );
};

export default DataInput;
