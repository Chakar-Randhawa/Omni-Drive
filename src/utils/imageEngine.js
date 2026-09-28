import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export const imageEngine = {
  // Load File or Blob into HTMLImageElement
  loadImage(source) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = typeof source === 'string' ? source : URL.createObjectURL(source);
      img.onload = () => {
        if (typeof source !== 'string') URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        if (typeof source !== 'string') URL.revokeObjectURL(url);
        reject(new Error('Failed to load image. Ensure file is a valid image format.'));
      };
      img.src = url;
    });
  },

  // Compress Image
  async compressImage(file, { quality = 0.8, maxWidth = 1920, format = 'image/jpeg' } = {}) {
    const img = await this.loadImage(file);
    let { width, height } = img;
    
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve({
          blob,
          originalSize: file.size,
          compressedSize: blob.size,
          reductionPercent: Math.max(0, ((file.size - blob.size) / file.size) * 100).toFixed(1),
          width,
          height
        });
      }, format, quality);
    });
  },

  // Resize Image
  async resizeImage(file, { width, height, maintainAspectRatio = true, format = 'image/png' }) {
    const img = await this.loadImage(file);
    let targetW = width || img.width;
    let targetH = height || img.height;

    if (maintainAspectRatio) {
      const ratio = img.width / img.height;
      if (width && !height) targetH = Math.round(width / ratio);
      else if (height && !width) targetW = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve({ blob, width: targetW, height: targetH });
      }, format, 0.92);
    });
  },

  // Enlarge / Upscale Image (2x or 4x with bicubic/high-quality smoothing)
  async enlargeImage(file, factor = 2) {
    const img = await this.loadImage(file);
    const targetW = Math.round(img.width * factor);
    const targetH = Math.round(img.height * factor);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  },

  // Crop Image
  async cropImage(file, { x, y, width, height, format = 'image/png' }) {
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), format, 0.95);
    });
  },

  // Convert Format (PNG to JPG, WebP, etc.)
  async convertFormat(file, targetFormat = 'image/webp', quality = 0.92, bgColor = '#FFFFFF') {
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, img.width, img.height);
    }
    ctx.drawImage(img, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), targetFormat, quality);
    });
  },

  // Trace bitmap to SVG vector paths
  async traceToSVG(file) {
    // Real colour vector tracing (bezier/line paths) via imagetracerjs,
    // instead of one <rect> per dark pixel block.
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    const maxDim = 800;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const mod = await import('imagetracerjs');
    const ImageTracer = mod.default || mod;
    const svg = ImageTracer.imagedataToSVG(imgData, {
      numberofcolors: 16,
      ltres: 1,
      qtres: 1,
      pathomit: 8,
      colorsampling: 2,
      blurradius: 0,
      scale: 1,
      viewbox: true,
    });
    return new Blob([svg], { type: 'image/svg+xml' });
  },
  // Background removal by flood-filling inward from the image border.
  // Works well on solid / uniform / lightly-graded backgrounds. It is NOT an
  // AI segmentation model, so busy photographic backgrounds won't cut cleanly.
  async removeBackground(file, tolerance = 40) {
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    const w = canvas.width = img.width;
    const h = canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    const dist = (i, r, g, b) => Math.sqrt((d[i] - r) ** 2 + (d[i + 1] - g) ** 2 + (d[i + 2] - b) ** 2);
    // Reference colours: the four corners (handles different-coloured corners)
    const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4].map(i => [d[i], d[i + 1], d[i + 2]]);
    const isBgSeed = (i) => corners.some(([r, g, b]) => dist(i, r, g, b) < tolerance);

    const visited = new Uint8Array(w * h);
    const stack = [];
    const push = (x, y) => {
      const p = y * w + x;
      if (visited[p]) return;
      const i = p * 4;
      if (d[i + 3] === 0 || isBgSeed(i)) { visited[p] = 1; stack.push(p); }
    };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

    while (stack.length) {
      const p = stack.pop();
      const x = p % w, y = (p - x) / w;
      if (x > 0) push(x - 1, y);
      if (x < w - 1) push(x + 1, y);
      if (y > 0) push(x, y - 1);
      if (y < h - 1) push(x, y + 1);
    }

    for (let p = 0; p < w * h; p++) if (visited[p]) d[p * 4 + 3] = 0;

    // Soften the cut edge: pixels touching the removed area get partial alpha
    const alphaCopy = new Uint8ClampedArray(w * h);
    for (let p = 0; p < w * h; p++) alphaCopy[p] = d[p * 4 + 3];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        if (alphaCopy[p] === 0) continue;
        const touching = alphaCopy[p - 1] === 0 || alphaCopy[p + 1] === 0 || alphaCopy[p - w] === 0 || alphaCopy[p + w] === 0;
        if (touching) d[p * 4 + 3] = 170;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
  },

  async extractPalette(file, count = 6) {
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 64, 64);

    const imgData = ctx.getImageData(0, 0, 64, 64).data;
    const colorMap = {};

    for (let i = 0; i < imgData.length; i += 16) {
      const r = Math.round(imgData[i] / 24) * 24;
      const g = Math.round(imgData[i + 1] / 24) * 24;
      const b = Math.round(imgData[i + 2] / 24) * 24;
      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
      colorMap[hex] = (colorMap[hex] || 0) + 1;
    }

    const sorted = Object.entries(colorMap).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, count).map(([hex]) => hex);
  },

  // Photo Filters
  async applyFilters(file, { brightness = 100, contrast = 100, grayscale = 0, sepia = 0, blur = 0, invert = 0 } = {}) {
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%) sepia(${sepia}%) blur(${blur}px) invert(${invert}%)`;
    ctx.drawImage(img, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  },

  // Pixelate / Censor Image
  async pixelateImage(file, blockSize = 16) {
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    // Draw scaled down
    const smallW = Math.max(1, Math.floor(img.width / blockSize));
    const smallH = Math.max(1, Math.floor(img.height / blockSize));

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, smallW, smallH);
    // Draw scaled back up
    ctx.drawImage(canvas, 0, 0, smallW, smallH, 0, 0, img.width, img.height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  },

  // QR Code Generator
  async generateQRCode(text) {
    const dataUrl = await QRCode.toDataURL(text || 'https://omnidrive.tools', {
      width: 512,
      margin: 2,
      color: { dark: '#111827', light: '#FFFFFF' }
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  },

  // QR Code Scanner
  async scanQRCode(file) {
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // 1) Native BarcodeDetector where available (Chrome/Edge)
    if (typeof window !== 'undefined' && window.BarcodeDetector) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const codes = await detector.detect(canvas);
        if (codes && codes.length > 0) return codes[0].rawValue;
      } catch {
        // fall through to the pure-JS decoder
      }
    }

    // 2) Cross-browser pure-JS decoder (Safari, Firefox, etc.)
    const jsQR = (await import('jsqr')).default;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
    if (result && result.data) return result.data;

    throw new Error('No QR code could be detected in this image. Try a sharper, higher-contrast picture with the whole code visible.');
  },

  // Barcode Generator
  generateBarcode(text, format = 'CODE128') {
    const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svgNode, text || '123456789012', {
      format,
      lineColor: '#111827',
      width: 2,
      height: 100,
      displayValue: true
    });
    const xml = new XMLSerializer().serializeToString(svgNode);
    return new Blob([xml], { type: 'image/svg+xml' });
  },

  // Meme Generator
  async generateMeme(file, { topText = '', bottomText = '' }) {
    const img = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, 0, 0);

    const fontSize = Math.max(24, Math.floor(img.width / 12));
    ctx.font = `bold ${fontSize}px Impact, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(2, Math.floor(fontSize / 10));
    ctx.textAlign = 'center';

    if (topText) {
      ctx.strokeText(topText.toUpperCase(), canvas.width / 2, fontSize + 20);
      ctx.fillText(topText.toUpperCase(), canvas.width / 2, fontSize + 20);
    }

    if (bottomText) {
      ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 30);
      ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - 30);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  },

  // Favicon Generator (produces 32x32 standard PNG icon)
  // Generates a real favicon pack as a ZIP: PNGs at standard sizes plus a
  // multi-size favicon.ico (PNG-encoded entries).
  async generateFavicon(file) {
    const img = await this.loadImage(file);
    const sizes = [16, 32, 48, 64, 180, 192, 512];
    const renderPng = (size) => new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      // Cover-fit: crop to a centred square so non-square logos aren't stretched
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      canvas.toBlob(async (blob) => resolve(new Uint8Array(await blob.arrayBuffer())), 'image/png');
    });

    const pngs = {};
    for (const size of sizes) pngs[size] = await renderPng(size);

    // Build favicon.ico containing 16/32/48 PNG entries
    const icoSizes = [16, 32, 48];
    const headerSize = 6 + icoSizes.length * 16;
    const total = headerSize + icoSizes.reduce((n, sz) => n + pngs[sz].length, 0);
    const ico = new Uint8Array(total);
    const view = new DataView(ico.buffer);
    view.setUint16(0, 0, true);
    view.setUint16(2, 1, true);
    view.setUint16(4, icoSizes.length, true);
    let offset = headerSize;
    icoSizes.forEach((sz, idx) => {
      const base = 6 + idx * 16;
      ico[base] = sz;
      ico[base + 1] = sz;
      ico[base + 2] = 0;
      ico[base + 3] = 0;
      view.setUint16(base + 4, 1, true);
      view.setUint16(base + 6, 32, true);
      view.setUint32(base + 8, pngs[sz].length, true);
      view.setUint32(base + 12, offset, true);
      ico.set(pngs[sz], offset);
      offset += pngs[sz].length;
    });

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('favicon.ico', ico);
    zip.file('favicon-16x16.png', pngs[16]);
    zip.file('favicon-32x32.png', pngs[32]);
    zip.file('favicon-48x48.png', pngs[48]);
    zip.file('favicon-64x64.png', pngs[64]);
    zip.file('apple-touch-icon.png', pngs[180]);
    zip.file('android-chrome-192x192.png', pngs[192]);
    zip.file('android-chrome-512x512.png', pngs[512]);
    zip.file('README.txt', 'Add to <head>:\n<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n');
    return await zip.generateAsync({ type: 'blob' });
  },

  // OCR Text Extraction (using Tesseract.js if available or canvas pixel density)
  async extractOCRText(file) {
    let worker;
    try {
      const { createWorker } = await import('tesseract.js');
      worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      const text = (ret.data.text || '').trim();
      return text || 'No text detected in the provided image.';
    } catch (err) {
      throw new Error('OCR could not run. The OCR engine downloads its language data on first use, so please check your internet connection and try again.');
    } finally {
      if (worker) { try { await worker.terminate(); } catch { /* ignore */ } }
    }
  },

  // Picks a video container this browser can genuinely record
  pickVideoMime() {
    const candidates = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    if (typeof MediaRecorder === 'undefined') return null;
    return candidates.find(m => MediaRecorder.isTypeSupported(m)) || null;
  },

  // GIF to video — decodes real GIF frames (with their delays) and records them
  async gifToMp4(file) {
    const mimeType = this.pickVideoMime();
    if (!mimeType) throw new Error('This browser cannot record video (MediaRecorder unsupported). Try Chrome, Edge, or Firefox.');
    const { parseGIF, decompressFrames } = await import('gifuct-js');
    const gif = parseGIF(await file.arrayBuffer());
    const frames = decompressFrames(gif, true);
    if (!frames.length) throw new Error('No frames could be read from this GIF.');
    const width = gif.lsd.width, height = gif.lsd.height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const patch = document.createElement('canvas');
    const pctx = patch.getContext('2d');

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType.split(';')[0] }));
    });

    recorder.start();
    for (const frame of frames) {
      const { left, top, width: fw, height: fh } = frame.dims;
      if (frame.disposalType === 2) ctx.clearRect(0, 0, width, height);
      patch.width = fw;
      patch.height = fh;
      pctx.putImageData(new ImageData(new Uint8ClampedArray(frame.patch), fw, fh), 0, 0);
      ctx.drawImage(patch, left, top);
      await new Promise(r => setTimeout(r, Math.max(20, frame.delay || 40)));
    }
    await new Promise(r => setTimeout(r, 100));
    recorder.stop();
    return await done;
  },

  // Video to real animated GIF (frames sampled via seeking, encoded with gifenc)
  async mp4ToGif(file, { fps = 10, maxSeconds = 10, maxWidth = 480 } = {}) {
    const url = URL.createObjectURL(file);
    try {
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = () => reject(new Error('This video format could not be read by your browser.'));
      });

      const width = Math.min(maxWidth, video.videoWidth);
      const height = Math.round((width * video.videoHeight) / video.videoWidth);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
      const gif = GIFEncoder();
      const duration = Math.min(video.duration || maxSeconds, maxSeconds);
      const step = 1 / fps;
      const delay = Math.round(1000 / fps);

      for (let t = 0; t < duration; t += step) {
        await new Promise((resolve) => {
          video.onseeked = resolve;
          video.currentTime = t;
        });
        ctx.drawImage(video, 0, 0, width, height);
        const { data } = ctx.getImageData(0, 0, width, height);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, width, height, { palette, delay });
      }
      gif.finish();
      return new Blob([gif.bytes()], { type: 'image/gif' });
    } finally {
      URL.revokeObjectURL(url);
    }
  },

  // Read EXIF Metadata — real parsing via exifr (camera, lens, exposure, GPS, dates...)
  async readEXIF(file) {
    const info = {
      FileName: file.name,
      FileSize: `${(file.size / 1024).toFixed(1)} KB`,
      MimeType: file.type || 'unknown',
      LastModified: new Date(file.lastModified).toLocaleString(),
    };
    const exifr = (await import('exifr')).default;
    let tags = null;
    try {
      tags = await exifr.parse(file, { tiff: true, exif: true, gps: true, ifd1: false, xmp: false, translateValues: true, reviveValues: true });
    } catch {
      tags = null;
    }
    if (!tags || Object.keys(tags).length === 0) {
      info.Note = 'No EXIF metadata found in this image (it may be a PNG/WebP/screenshot, or the metadata was stripped).';
      return info;
    }
    const fmt = (v) => {
      if (v instanceof Date) return v.toLocaleString();
      if (typeof v === 'number') return Number.isInteger(v) ? v : Number(v.toFixed(4));
      if (Array.isArray(v)) return v.join(', ');
      if (v && typeof v === 'object') return JSON.stringify(v);
      return v;
    };
    const wanted = ['Make', 'Model', 'LensModel', 'Software', 'DateTimeOriginal', 'CreateDate', 'ModifyDate', 'ExposureTime', 'FNumber', 'ISO', 'FocalLength', 'FocalLengthIn35mmFormat', 'Flash', 'WhiteBalance', 'ExposureProgram', 'MeteringMode', 'Orientation', 'ColorSpace', 'ExifImageWidth', 'ExifImageHeight', 'XResolution', 'YResolution', 'latitude', 'longitude', 'GPSAltitude'];
    for (const key of wanted) {
      if (tags[key] !== undefined && tags[key] !== null && tags[key] !== '') info[key] = fmt(tags[key]);
    }
    if (info.latitude !== undefined && info.longitude !== undefined) {
      info.GPSMapLink = `https://www.google.com/maps?q=${info.latitude},${info.longitude}`;
    }
    return info;
  }
};
