'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icons';

export const FileDropZone = ({
  onFilesSelected,
  accept = "*/*",
  multiple = false,
  maxSizeMB = 100,
  disabled = false,
  selectedFiles = [],
  onClear,
  label = "Choose files or drag & drop here",
  sublabel = "All files are processed strictly in your local browser memory"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const validateAndPassFiles = (filesList) => {
    setError(null);
    if (!filesList || filesList.length === 0) return;

    const files = Array.from(filesList);
    // Check sizes
    const oversized = files.find(f => f.size > maxSizeMB * 1024 * 1024);
    if (oversized) {
      setError(`File "${oversized.name}" exceeds the maximum client processing limit of ${maxSizeMB}MB.`);
      return;
    }

    onFilesSelected(multiple ? files : files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    validateAndPassFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e) => {
    validateAndPassFiles(e.target.files);
    e.target.value = ''; // Reset for re-selection
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filesArray = Array.isArray(selectedFiles) ? selectedFiles : (selectedFiles ? [selectedFiles] : []);

  return (
    <div className="w-full">
      {filesArray.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label={label}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#5B5BD6] focus-visible:border-transparent ${
            isDragging
              ? 'border-[#5B5BD6] bg-[#5B5BD6]/5 scale-[0.995]'
              : 'border-[#E5E7EB] hover:border-[#5B5BD6]/60 bg-white hover:bg-[#F7F8FC]/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileInputChange}
            disabled={disabled}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#5B5BD6]/10 text-[#5B5BD6] flex items-center justify-center transition-transform group-hover:scale-105">
              <Icon name="upload" className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-base sm:text-lg font-semibold text-[#111827]">
                {label}
              </p>
              <p className="text-xs sm:text-sm text-[#667085]">
                {sublabel}
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEF0F4] text-[#4B5563]">
                Max {maxSizeMB} MB
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#12A88A]/10 text-[#12A88A]">
                100% Private Client
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#EEF0F4] mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]"></span>
              <h4 className="text-sm font-semibold text-[#111827]">
                Selected Input {filesArray.length > 1 ? `(${filesArray.length} files)` : ''}
              </h4>
            </div>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-medium text-[#DC2626] hover:text-[#B91C1C] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Icon name="x" className="w-3.5 h-3.5" /> Remove
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {filesArray.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F7F8FC] border border-[#EEF0F4]"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-8 h-8 rounded-lg bg-[#5B5BD6]/10 text-[#5B5BD6] flex items-center justify-center shrink-0">
                    <Icon name="file" className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-[#111827] truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-[#667085]">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#667085] uppercase px-2 py-0.5 bg-white border border-[#E5E7EB] rounded">
                  {file.name.split('.').pop() || 'FILE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <Icon name="info" className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
export default FileDropZone;
