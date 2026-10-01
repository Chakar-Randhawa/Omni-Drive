'use client';

import React, { useState } from 'react';
import { imageEngine } from '../../utils/imageEngine';
import { ffmpegEngine } from '../../utils/ffmpegEngine';
import { FileDropZone } from '../FileDropZone';
import { Icon } from '../Icons';

export const ImageWorkspace = ({ tool }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultPreviewUrl, setResultPreviewUrl] = useState(null);
  const [resultStats, setResultStats] = useState(null);
  const [error, setError] = useState(null);
  const [progressMsg, setProgressMsg] = useState('');

  // Tool specific configurations
  const [quality, setQuality] = useState(0.8);
  const [resizeWidth, setResizeWidth] = useState(800);
  const [resizeHeight, setResizeHeight] = useState(600);
  const [lockAspect, setLockAspect] = useState(true);
  const [memeTop, setMemeTop] = useState('WHEN YOU PROCESS LOCALLY');
  const [memeBottom, setMemeBottom] = useState('AND NEVER UPLOAD TO A SERVER');
  const [qrText, setQrText] = useState('https://omnidrive.tools');
  const [barcodeText, setBarcodeText] = useState('123456789012');
  const [filterBrightness, setFilterBrightness] = useState(100);
  const [filterContrast, setFilterContrast] = useState(100);
  const [filterGrayscale, setFilterGrayscale] = useState(0);
  const [filterSepia, setFilterSepia] = useState(0);
  const [filterBlur, setFilterBlur] = useState(0);
  const [pixelateSize, setPixelateSize] = useState(16);
  const [paletteColors, setPaletteColors] = useState([]);
  const [exifData, setExifData] = useState(null);
  const [ocrResultText, setOcrResultText] = useState('');
  const [qrScanResult, setQrScanResult] = useState('');
  const [svgCode, setSvgCode] = useState('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">\n  <circle cx="100" cy="100" r="80" fill="#5B5BD6" />\n  <polygon points="100,40 140,140 60,140" fill="#FFFFFF" />\n</svg>');

  const isDirectGenerator = ['img-qr-code-generator', 'img-barcode-generator', 'img-svg-editor'].includes(tool.id);

  const handleFileSelected = (selectedFile) => {
    setError(null);
    setResultBlob(null);
    setResultPreviewUrl(null);
    setResultStats(null);
    setPaletteColors([]);
    setExifData(null);
    setOcrResultText('');
    setQrScanResult('');
    
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleExecute = async () => {
    if (!file && !isDirectGenerator) {
      setError('Please select an image file to process.');
      return;
    }
    setProcessing(true);
    setError(null);
    setProgressMsg('');

    try {
      let outputBlob = null;

      switch (tool.id) {
        case 'img-compressor': {
          const res = await imageEngine.compressImage(file, { quality });
          outputBlob = res.blob;
          setResultStats(`Original: ${(res.originalSize / 1024).toFixed(1)} KB → Compressed: ${(res.compressedSize / 1024).toFixed(1)} KB (Saved ${res.reductionPercent}%)`);
          break;
        }
        case 'img-resizer':
        case 'img-image-resizer-by-pixel': {
          const res = await imageEngine.resizeImage(file, { width: resizeWidth, height: resizeHeight, maintainAspectRatio: lockAspect });
          outputBlob = res.blob;
          break;
        }
        case 'img-image-enlarger': {
          outputBlob = await imageEngine.enlargeImage(file, 2);
          break;
        }
        case 'img-cropper': {
          outputBlob = await imageEngine.cropImage(file, { x: 20, y: 20, width: 400, height: 400 });
          break;
        }
        case 'img-webp-converter':
          outputBlob = await imageEngine.convertFormat(file, 'image/webp', quality);
          break;
        case 'img-png-to-jpg':
          outputBlob = await imageEngine.convertFormat(file, 'image/jpeg', 0.95, '#FFFFFF');
          break;
        case 'img-jpg-to-png':
        case 'img-svg-to-png':
          outputBlob = await imageEngine.convertFormat(file, 'image/png');
          break;
        case 'img-png-to-svg':
          outputBlob = await imageEngine.traceToSVG(file);
          break;
        case 'img-background-remover':
          outputBlob = await imageEngine.removeBackground(file);
          break;
        case 'img-color-palette-extractor': {
          const colors = await imageEngine.extractPalette(file);
          setPaletteColors(colors);
          outputBlob = new Blob([JSON.stringify(colors, null, 2)], { type: 'application/json' });
          break;
        }
        case 'img-svg-editor': {
          outputBlob = new Blob([svgCode], { type: 'image/svg+xml' });
          break;
        }
        case 'img-photo-filters':
          outputBlob = await imageEngine.applyFilters(file, {
            brightness: filterBrightness,
            contrast: filterContrast,
            grayscale: filterGrayscale,
            sepia: filterSepia,
            blur: filterBlur
          });
          break;
        case 'img-qr-code-generator':
          outputBlob = await imageEngine.generateQRCode(qrText);
          break;
        case 'img-qr-code-scanner': {
          const text = await imageEngine.scanQRCode(file);
          setQrScanResult(text);
          outputBlob = new Blob([text], { type: 'text/plain' });
          break;
        }
        case 'img-barcode-generator':
          outputBlob = imageEngine.generateBarcode(barcodeText);
          break;
        case 'img-favicon-generator':
          outputBlob = await imageEngine.generateFavicon(file);
          break;
        case 'img-meme-generator':
          outputBlob = await imageEngine.generateMeme(file, { topText: memeTop, bottomText: memeBottom });
          break;
        case 'img-image-to-text-ocr': {
          const text = await imageEngine.extractOCRText(file);
          setOcrResultText(text);
          outputBlob = new Blob([text], { type: 'text/plain' });
          break;
        }
        case 'img-pixelate-image':
          outputBlob = await imageEngine.pixelateImage(file, pixelateSize);
          break;
        case 'img-blur-image':
          outputBlob = await imageEngine.applyFilters(file, { blur: 12 });
          break;
        case 'img-gif-to-mp4':
          outputBlob = await ffmpegEngine.gifToMp4(file, setProgressMsg);
          break;
        case 'img-mp4-to-gif':
          outputBlob = await ffmpegEngine.mp4ToGif(file, {}, setProgressMsg);
          break;
        case 'img-image-metadata-exif-viewer': {
          const exif = await imageEngine.readEXIF(file);
          setExifData(exif);
          outputBlob = new Blob([JSON.stringify(exif, null, 2)], { type: 'application/json' });
          break;
        }
        default:
          throw new Error(`Unsupported or unhandled image tool operation: ${tool.id}`);
      }

      if (outputBlob) {
        setResultBlob(outputBlob);
        const resUrl = URL.createObjectURL(outputBlob);
        setResultPreviewUrl(resUrl);
      }
    } catch (err) {
      setError(err.message || 'Error occurred during image processing.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    let ext = tool.output === 'image' ? (resultBlob.type.includes('png') ? 'png' : 'jpg') : tool.output;
    if (ext === 'palette') ext = 'json';
    if (ext === 'data') ext = 'json';
    // Use the container the browser actually recorded (mp4 or webm), so the
    // extension always matches the real file contents.
    if (resultBlob.type === 'video/webm') ext = 'webm';
    if (resultBlob.type === 'video/mp4') ext = 'mp4';
    a.download = `omnidrive-${tool.id}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultPreviewUrl) URL.revokeObjectURL(resultPreviewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultBlob(null);
    setResultPreviewUrl(null);
    setResultStats(null);
    setPaletteColors([]);
    setExifData(null);
    setOcrResultText('');
    setQrScanResult('');
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* If Direct Generator (QR Code, Barcode, or SVG Editor) */}
      {isDirectGenerator ? (
        <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6 space-y-4">
          {tool.id === 'img-svg-editor' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-2">
                SVG Vector Markup
              </label>
              <textarea
                rows={6}
                value={svgCode}
                onChange={(e) => setSvgCode(e.target.value)}
                className="w-full p-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-[#5B5BD6]"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-2">
                {tool.id === 'img-qr-code-generator' ? 'Enter Content (URL, Text, WiFi)' : 'Enter Barcode Value'}
              </label>
              <input
                type="text"
                value={tool.id === 'img-qr-code-generator' ? qrText : barcodeText}
                onChange={(e) => tool.id === 'img-qr-code-generator' ? setQrText(e.target.value) : setBarcodeText(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#5B5BD6]"
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleExecute}
            className="px-6 py-2.5 rounded-xl bg-[#5B5BD6] hover:bg-[#4949B8] text-white font-semibold text-sm cursor-pointer shadow-xs"
          >
            Generate {tool.name}
          </button>
        </div>
      ) : (
        <FileDropZone
          selectedFiles={file}
          onFilesSelected={handleFileSelected}
          onClear={handleReset}
          disabled={processing}
          accept={tool.input}
          label="Choose an image or drag & drop here"
        />
      )}

      {/* Tool-specific Controls */}
      <div className="space-y-4">
        {tool.id === 'img-compressor' && (
          <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#111827]">
                Compression Quality: {Math.round(quality * 100)}%
              </label>
              <span className="text-xs text-[#6B7280]">
                {quality > 0.8 ? 'High Fidelity' : quality > 0.5 ? 'Balanced' : 'Maximum Savings'}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full accent-[#5B5BD6]"
            />
          </div>
        )}

        {(tool.id === 'img-resizer' || tool.id === 'img-image-resizer-by-pixel') && (
          <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-2">Target Width (px)</label>
              <input
                type="number"
                value={resizeWidth}
                onChange={(e) => setResizeWidth(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-2">Target Height (px)</label>
              <input
                type="number"
                value={resizeHeight}
                onChange={(e) => setResizeHeight(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-medium outline-none"
              />
            </div>
          </div>
        )}

        {tool.id === 'img-meme-generator' && (
          <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6 space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-1">Top Caption</label>
              <input
                type="text"
                value={memeTop}
                onChange={(e) => setMemeTop(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm font-bold uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-1">Bottom Caption</label>
              <input
                type="text"
                value={memeBottom}
                onChange={(e) => setMemeBottom(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm font-bold uppercase"
              />
            </div>
          </div>
        )}

        {tool.id === 'img-pixelate-image' && (
          <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl p-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111827] mb-2">
              Pixel Block Size: {pixelateSize}px
            </label>
            <input
              type="range"
              min="4"
              max="48"
              step="4"
              value={pixelateSize}
              onChange={(e) => setPixelateSize(parseInt(e.target.value, 10))}
              className="w-full accent-[#5B5BD6]"
            />
          </div>
        )}
      </div>

      {/* Action Button */}
      {file && !isDirectGenerator && !resultBlob && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleExecute}
            disabled={processing}
            className="px-6 py-3 rounded-xl bg-[#12A88A] hover:bg-[#0E856D] text-white font-semibold text-sm cursor-pointer shadow-xs disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {processing && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            )}
            <span>{processing ? (progressMsg || 'Processing In Browser...') : `Execute ${tool.name}`}</span>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#B91C1C] text-sm flex items-center gap-2">
          <Icon name="x" className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Preview & Download */}
      {resultBlob && (
        <div className="p-6 rounded-2xl bg-white border-2 border-[#12A88A]/30 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#12A88A]/10 text-[#12A88A] flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Processing Ready</h4>
                <p className="text-xs text-[#6B7280]">
                  {(resultBlob.size / 1024).toFixed(1)} KB
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

          {/* Palette View */}
          {paletteColors.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[#111827]">Extracted Swatches</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {paletteColors.map((color) => (
                  <div key={color} className="p-2 bg-[#F7F8FC] border border-[#EEF0F4] rounded-xl text-center space-y-2">
                    <div className="w-full h-12 rounded-lg shadow-2xs" style={{ backgroundColor: color }} />
                    <span className="text-[11px] font-mono font-bold text-[#111827]">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EXIF View */}
          {exifData && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[#111827]">EXIF Metadata</label>
              <div className="bg-[#F7F8FC] border border-[#EEF0F4] rounded-xl p-4 grid grid-cols-2 gap-2 text-xs">
                {Object.entries(exifData).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-[#EEF0F4] pb-1">
                    <span className="text-[#6B7280]">{k}:</span>
                    <span className="font-mono text-[#111827]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OCR text */}
          {ocrResultText && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-[#111827]">Extracted Text</label>
              <textarea
                readOnly
                rows={5}
                value={ocrResultText}
                className="w-full p-3 bg-[#F7F8FC] border border-[#E5E7EB] rounded-xl text-xs font-mono"
              />
            </div>
          )}

          {/* QR scan result */}
          {qrScanResult && (
            <div className="p-4 bg-[#F7F8FC] rounded-xl text-xs font-mono text-[#111827]">
              <strong>Scanned Data:</strong> {qrScanResult}
            </div>
          )}

          {/* Image Preview */}
          {resultPreviewUrl && (
            <div className="border border-[#EEF0F4] rounded-xl p-4 bg-[#F7F8FC] flex justify-center">
              <img
                src={resultPreviewUrl}
                alt="Processing Preview"
                className="max-h-80 max-w-full object-contain rounded-lg shadow-2xs"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ImageWorkspace;
