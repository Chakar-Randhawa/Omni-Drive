'use client';

import React, { useState, useRef } from 'react';
import { pdfEngine } from '../../utils/pdfEngine';
import { FileDropZone } from '../FileDropZone';
import { Icon } from '../Icons';

export const PDFWorkspace = ({ tool }) => {
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [resultBlob, setResultBlob] = useState(null);
  const [resultStats, setResultStats] = useState(null);
  const [error, setError] = useState(null);

  // Configuration states
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [rotationAngle, setRotationAngle] = useState(90);
  const [splitRange, setSplitRange] = useState('1-2');
  const [removePagesStr, setRemovePagesStr] = useState('1');
  const [cropMargin, setCropMargin] = useState(10);
  const [pageNumberFormat, setPageNumberFormat] = useState('Page {n} of {total}');
  const [pdfPassword, setPdfPassword] = useState('MySecurePassword123');
  const [extractedText, setExtractedText] = useState('');
  const [htmlInput, setHtmlInput] = useState('<h1>Meeting Summary</h1><p>Processed securely in your browser with zero remote transmission.</p>');

  // Signature canvas
  const sigCanvasRef = useRef(null);
  const [isSigning, setIsSigning] = useState(false);

  const isMultiFile = ['pdf-merge', 'jpg-to-pdf', 'png-to-pdf', 'webp-to-pdf'].includes(tool.id);
  const isHtmlTool = tool.id === 'html-to-pdf';

  const handleFilesSelected = (selected) => {
    setError(null);
    setResultBlob(null);
    setResultStats(null);
    setExtractedText('');
    setFiles(Array.isArray(selected) ? selected : [selected]);
  };

  const handleClearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startSign = (e) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    setIsSigning(true);
  };

  const drawSign = (e) => {
    if (!isSigning) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopSign = () => {
    setIsSigning(false);
  };

  const handleExecute = async () => {
    if (files.length === 0 && !isHtmlTool) {
      setError('Please select an input document to process.');
      return;
    }
    setProcessing(true);
    setError(null);
    setProgressMsg('Initializing client processing...');

    try {
      let outputBlob = null;
      const file = files[0];

      switch (tool.id) {
        case 'pdf-merge':
          outputBlob = await pdfEngine.mergePDFs(files, setProgressMsg);
          break;
        case 'pdf-split':
          outputBlob = await pdfEngine.splitPDF(file, splitRange, setProgressMsg);
          break;
        case 'pdf-compress': {
          const res = await pdfEngine.compressPDF(file, setProgressMsg);
          outputBlob = res.blob;
          setResultStats(`Optimized from ${(res.originalSize / 1024).toFixed(1)} KB to ${(res.newSize / 1024).toFixed(1)} KB (Saved ${res.savedRatio}%)`);
          break;
        }
        case 'add-watermark':
          outputBlob = await pdfEngine.addWatermark(file, watermarkText, watermarkOpacity, 48, setProgressMsg);
          break;
        case 'remove-watermark':
          outputBlob = await pdfEngine.removeWatermark(file, setProgressMsg);
          break;
        case 'rotate-pdf':
          outputBlob = await pdfEngine.rotatePDF(file, rotationAngle, setProgressMsg);
          break;
        case 'add-page-numbers':
          outputBlob = await pdfEngine.addPageNumbers(file, pageNumberFormat, setProgressMsg);
          break;
        case 'remove-pdf-pages':
          outputBlob = await pdfEngine.removePages(file, removePagesStr, setProgressMsg);
          break;
        case 'reorder-pdf-pages':
          outputBlob = await pdfEngine.reorderPages(file, null, setProgressMsg);
          break;
        case 'crop-pdf':
          outputBlob = await pdfEngine.cropPDF(file, cropMargin, setProgressMsg);
          break;
        case 'protect-pdf':
          outputBlob = await pdfEngine.protectPDF(file, pdfPassword, setProgressMsg);
          break;
        case 'unlock-pdf':
          outputBlob = await pdfEngine.unlockPDF(file, pdfPassword, setProgressMsg);
          break;
        case 'sign-pdf': {
          const canvas = sigCanvasRef.current;
          const sigDataUrl = canvas ? canvas.toDataURL('image/png') : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
          outputBlob = await pdfEngine.signPDF(file, sigDataUrl, 1, 100, 100, 150, 60, setProgressMsg);
          break;
        }
        case 'pdf-to-word':
          outputBlob = await pdfEngine.pdfToWord(file, setProgressMsg);
          break;
        case 'word-to-pdf':
          outputBlob = await pdfEngine.wordToPDF(file, setProgressMsg);
          break;
        case 'pdf-to-excel':
          outputBlob = await pdfEngine.pdfToExcel(file, setProgressMsg);
          break;
        case 'excel-to-pdf':
          outputBlob = await pdfEngine.excelToPDF(file, setProgressMsg);
          break;
        case 'pdf-to-ppt':
          outputBlob = await pdfEngine.pdfToPPT(file, setProgressMsg);
          break;
        case 'ppt-to-pdf':
          outputBlob = await pdfEngine.pptToPDF(file, setProgressMsg);
          break;
        case 'pdf-to-jpg':
          outputBlob = await pdfEngine.pdfToImages(file, 'jpg', setProgressMsg);
          break;
        case 'pdf-to-png':
          outputBlob = await pdfEngine.pdfToImages(file, 'png', setProgressMsg);
          break;
        case 'pdf-to-webp':
          outputBlob = await pdfEngine.pdfToImages(file, 'webp', setProgressMsg);
          break;
        case 'jpg-to-pdf':
        case 'png-to-pdf':
        case 'webp-to-pdf':
          outputBlob = await pdfEngine.imagesToPDF(files, setProgressMsg);
          break;
        case 'pdf-to-text': {
          const txt = await pdfEngine.extractText(file, setProgressMsg);
          setExtractedText(txt);
          outputBlob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
          break;
        }
        case 'html-to-pdf':
          outputBlob = await pdfEngine.htmlToPDF(file || htmlInput, setProgressMsg);
          break;
        case 'extract-pdf-images':
          outputBlob = await pdfEngine.extractPDFImages(file, setProgressMsg);
          break;
        case 'epub-to-pdf':
          outputBlob = await pdfEngine.epubToPDF(file, setProgressMsg);
          break;
        case 'pdf-to-epub':
          outputBlob = await pdfEngine.pdfToEPUB(file, setProgressMsg);
          break;
        default:
          throw new Error(`Unsupported or unhandled PDF tool operation: ${tool.id}`);
      }

      setResultBlob(outputBlob);
      setProgressMsg('Completed successfully.');
    } catch (err) {
      setError(err.message || 'Error occurred during client processing.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    
    // Choose appropriate file extension
    let ext = tool.output;
    if (ext === 'images') ext = 'jpg';
    a.download = `omnidrive-${tool.id}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleReset = () => {
    setFiles([]);
    setResultBlob(null);
    setResultStats(null);
    setExtractedText('');
    setError(null);
    setProgressMsg('');
    handleClearSignature();
  };

  return (
    <div className="space-y-6">
      {/* File Dropzone */}
      {isHtmlTool && files.length === 0 ? (
        <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#111827]">
            Enter HTML or Plain Text
          </label>
          <textarea
            rows={5}
            value={htmlInput}
            onChange={(e) => setHtmlInput(e.target.value)}
            className="w-full p-4 bg-white border border-[#E5E7EB] rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-[#5B5BD6]"
          />
        </div>
      ) : (
        <FileDropZone
          selectedFiles={isMultiFile ? files : files[0]}
          onFilesSelected={handleFilesSelected}
          onClear={handleReset}
          disabled={processing}
          accept={tool.input}
          multiple={isMultiFile}
          label={isMultiFile ? 'Choose multiple files or drag & drop here' : 'Choose a file or drag & drop here'}
        />
      )}

      {/* Tool-specific Controls */}
      <div className="space-y-4">
        {tool.id === 'add-watermark' && (
          <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-2">Watermark Text</label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-2">Opacity: {Math.round(watermarkOpacity * 100)}%</label>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                className="w-full mt-2 accent-[#5B5BD6]"
              />
            </div>
          </div>
        )}

        {tool.id === 'rotate-pdf' && (
          <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-3">Rotation Angle</label>
            <div className="flex gap-3">
              {[90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => setRotationAngle(deg)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    rotationAngle === deg ? 'bg-[#5B5BD6] text-white shadow-xs' : 'bg-white border border-[#E5E7EB] text-[#4B5563]'
                  }`}
                >
                  +{deg}&deg; Clockwise
                </button>
              ))}
            </div>
          </div>
        )}

        {tool.id === 'pdf-split' && (
          <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-2">Page Range</label>
            <input
              type="text"
              value={splitRange}
              onChange={(e) => setSplitRange(e.target.value)}
              placeholder="e.g. 1-3, 5, 7"
              className="w-full max-w-sm px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium outline-none"
            />
            <p className="text-xs text-[#6B7280] mt-1.5">Specify single pages or comma-separated ranges.</p>
          </div>
        )}

        {tool.id === 'remove-pdf-pages' && (
          <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-2">Pages to Delete</label>
            <input
              type="text"
              value={removePagesStr}
              onChange={(e) => setRemovePagesStr(e.target.value)}
              placeholder="e.g. 1, 4"
              className="w-full max-w-sm px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium outline-none"
            />
          </div>
        )}

        {tool.id === 'crop-pdf' && (
          <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-2">Crop Margin: {cropMargin}%</label>
            <input
              type="range"
              min="2"
              max="25"
              step="1"
              value={cropMargin}
              onChange={(e) => setCropMargin(parseInt(e.target.value, 10))}
              className="w-full max-w-md accent-[#5B5BD6]"
            />
          </div>
        )}

        {(tool.id === 'protect-pdf' || tool.id === 'unlock-pdf') && (
          <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-2">
              {tool.id === 'protect-pdf' ? 'Set Document Password' : 'Enter Decryption Password'}
            </label>
            <input
              type="text"
              value={pdfPassword}
              onChange={(e) => setPdfPassword(e.target.value)}
              className="w-full max-w-sm px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium outline-none"
            />
          </div>
        )}

        {tool.id === 'sign-pdf' && (
          <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111827]">
                Draw Signature Below
              </label>
              <button
                type="button"
                onClick={handleClearSignature}
                className="text-xs text-[#EF4444] hover:underline cursor-pointer font-medium"
              >
                Clear Canvas
              </button>
            </div>
            <div className="border border-[#E5E7EB] rounded-xl bg-white p-1">
              <canvas
                ref={sigCanvasRef}
                width={380}
                height={140}
                onMouseDown={startSign}
                onMouseMove={drawSign}
                onMouseUp={stopSign}
                onMouseLeave={stopSign}
                onTouchStart={startSign}
                onTouchMove={drawSign}
                onTouchEnd={stopSign}
                className="w-full h-36 bg-white cursor-crosshair rounded-lg"
              />
            </div>
          </div>
        )}

        {tool.id === 'add-page-numbers' && (
          <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-2">Numbering Template</label>
            <input
              type="text"
              value={pageNumberFormat}
              onChange={(e) => setPageNumberFormat(e.target.value)}
              className="w-full max-w-sm px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium outline-none"
            />
          </div>
        )}
      </div>

      {/* Action / Process Button */}
      {(files.length > 0 || isHtmlTool) && !resultBlob && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleExecute}
            disabled={processing}
            className="px-6 py-3 rounded-xl bg-[#5B5BD6] hover:bg-[#4949B8] text-white font-semibold text-sm cursor-pointer shadow-xs disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {processing && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            )}
            <span>{processing ? 'Processing Locally...' : `Process with ${tool.name}`}</span>
          </button>
        </div>
      )}

      {/* Status & Progress Messages */}
      {processing && (
        <div className="p-4 rounded-xl bg-[#F7F8FC] border border-[#EEF0F4] text-xs font-medium text-[#4B5563] flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#5B5BD6] animate-pulse"></span>
          <span>{progressMsg}</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#B91C1C] text-sm flex items-center gap-2">
          <Icon name="x" className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card & Download */}
      {resultBlob && (
        <div className="p-6 rounded-2xl bg-white border-2 border-[#12A88A]/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#12A88A]/10 text-[#12A88A] flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Processing Ready</h4>
                <p className="text-xs text-[#6B7280]">
                  Result file size: {(resultBlob.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-[#E5E7EB] hover:bg-[#F7F8FC] text-[#4B5563] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="px-5 py-2.5 bg-[#12A88A] hover:bg-[#0E856D] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Icon name="download" className="w-4 h-4" />
                <span>Download Result</span>
              </button>
            </div>
          </div>

          {resultStats && (
            <div className="p-3 bg-[#F7F8FC] rounded-xl text-xs text-[#4B5563]">
              {resultStats}
            </div>
          )}

          {extractedText && (
            <div className="mt-4">
              <label className="block text-xs font-bold uppercase text-[#111827] mb-2">Extracted Plain Text</label>
              <textarea
                readOnly
                rows={6}
                value={extractedText}
                className="w-full p-3 bg-[#F7F8FC] border border-[#E5E7EB] rounded-xl text-xs font-mono text-[#374151]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default PDFWorkspace;
