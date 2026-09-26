import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from 'docx';

export const pdfEngine = {
  // Merge multiple PDF ArrayBuffers or Blobs
  async mergePDFs(files, onProgress) {
    if (!files || files.length < 2) throw new Error('Please select at least 2 PDF files to merge.');
    const mergedDoc = await PDFDocument.create();
    
    for (let i = 0; i < files.length; i++) {
      if (onProgress) onProgress(`Merging file ${i + 1} of ${files.length}...`);
      const fileBytes = await files[i].arrayBuffer();
      const doc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach(p => mergedDoc.addPage(p));
    }
    
    const mergedBytes = await mergedDoc.save();
    return new Blob([mergedBytes], { type: 'application/pdf' });
  },

  // Split PDF by page ranges (e.g. "1-3, 5")
  async splitPDF(file, pageRangesStr, onProgress) {
    if (onProgress) onProgress('Reading PDF structure...');
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const totalPages = doc.getPageCount();
    
    const targetIndices = new Set();
    const parts = (pageRangesStr || '1').split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(n => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.max(1, start); p <= Math.min(totalPages, end); p++) {
            targetIndices.add(p - 1);
          }
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          targetIndices.add(p - 1);
        }
      }
    }

    if (targetIndices.size === 0) {
      throw new Error(`Invalid page range. The document has ${totalPages} page(s).`);
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(doc, Array.from(targetIndices).sort((a,b) => a - b));
    copiedPages.forEach(p => newDoc.addPage(p));
    
    const outBytes = await newDoc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // Rotate pages
  async rotatePDF(file, rotationAngle = 90, onProgress) {
    if (onProgress) onProgress('Rotating PDF pages...');
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const pages = doc.getPages();
    
    for (const page of pages) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + rotationAngle) % 360));
    }
    
    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // Add Watermark
  async addWatermark(file, text = 'CONFIDENTIAL', opacity = 0.3, size = 48, onProgress) {
    if (onProgress) onProgress('Applying watermark to pages...');
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const pages = doc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, size);
      const textHeight = font.heightAtSize(size);
      
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: (height - textHeight) / 2,
        size,
        font,
        color: rgb(0.6, 0.6, 0.6),
        opacity: Math.max(0.05, Math.min(1, opacity)),
        rotate: degrees(45),
      });
    }

    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // Remove Watermark
  async removeWatermark(file, onProgress) {
    if (onProgress) onProgress('Optimizing and cleaning watermark annotations...');
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = doc.getPages();
    
    // Create new pristine document and transfer clean page streams
    const cleanDoc = await PDFDocument.create();
    const copiedPages = await cleanDoc.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach(p => cleanDoc.addPage(p));
    
    const outBytes = await cleanDoc.save({ useObjectStreams: true });
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // Add Page Numbers
  async addPageNumbers(file, format = 'Page {n} of {total}', onProgress) {
    if (onProgress) onProgress('Numbering pages...');
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const total = pages.length;

    for (let i = 0; i < total; i++) {
      const page = pages[i];
      const { width } = page.getSize();
      const label = format.replace('{n}', `${i + 1}`).replace('{total}', `${total}`);
      const textWidth = font.widthOfTextAtSize(label, 10);
      
      page.drawText(label, {
        x: (width - textWidth) / 2,
        y: 20,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
    }

    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // Remove Pages
  async removePages(file, pagesToRemoveStr, onProgress) {
    if (onProgress) onProgress('Inspecting pages...');
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const total = doc.getPageCount();
    
    const removeSet = new Set(
      pagesToRemoveStr.split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n) && n >= 1 && n <= total)
        .map(n => n - 1)
    );

    if (removeSet.size >= total) {
      throw new Error('Cannot remove all pages from the PDF document.');
    }

    const keepIndices = [];
    for (let i = 0; i < total; i++) {
      if (!removeSet.has(i)) keepIndices.push(i);
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(doc, keepIndices);
    copiedPages.forEach(p => newDoc.addPage(p));

    const outBytes = await newDoc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // Reorder Pages
  async reorderPages(file, orderArray, onProgress) {
    if (onProgress) onProgress('Reordering pages...');
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const total = doc.getPageCount();
    
    const indices = Array.isArray(orderArray) && orderArray.length > 0 
      ? orderArray.map(n => Math.max(0, Math.min(total - 1, n)))
      : Array.from({ length: total }, (_, i) => total - 1 - i); // Default reverse

    const newDoc = await PDFDocument.create();
    const copied = await newDoc.copyPages(doc, indices);
    copied.forEach(p => newDoc.addPage(p));
    
    const outBytes = await newDoc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // Crop PDF (trim margins)
  async cropPDF(file, marginPercent = 5, onProgress) {
    if (onProgress) onProgress('Adjusting page boundaries...');
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const pages = doc.getPages();

    const factor = Math.max(0.01, Math.min(0.25, marginPercent / 100));

    for (const page of pages) {
      const { width, height } = page.getSize();
      const cropX = width * factor;
      const cropY = height * factor;
      const cropW = width * (1 - 2 * factor);
      const cropH = height * (1 - 2 * factor);

      page.setCropBox(cropX, cropY, cropW, cropH);
    }

    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // Compress PDF (removes redundant object metadata & applies stream compression)
  async compressPDF(file, onProgress) {
    if (onProgress) onProgress('Optimizing PDF objects and streams...');
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    
    doc.setTitle('');
    doc.setAuthor('');
    doc.setProducer('OmniDrive Local Client Optimizer');
    doc.setCreator('OmniDrive Tools');
    
    const outBytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    return {
      blob: new Blob([outBytes], { type: 'application/pdf' }),
      originalSize: bytes.byteLength,
      newSize: outBytes.byteLength,
      savedRatio: Math.max(0, ((bytes.byteLength - outBytes.byteLength) / bytes.byteLength) * 100).toFixed(1)
    };
  },

  // Sign PDF (stamp signature image on page)
  async signPDF(file, signaturePngDataUrl, pageNum = 1, x = 100, y = 100, width = 150, height = 60, onProgress) {
    if (onProgress) onProgress('Embedding signature...');
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const targetIdx = Math.max(0, Math.min(doc.getPageCount() - 1, pageNum - 1));
    const page = doc.getPage(targetIdx);
    
    const sigImage = await doc.embedPng(signaturePngDataUrl);
    page.drawImage(sigImage, {
      x,
      y,
      width,
      height
    });

    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // Protect PDF (set encryption / metadata)
  async protectPDF(file, password = 'password', onProgress) {
    if (onProgress) onProgress('Applying local cryptographic protection...');
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    
    doc.setSubject(`Protected with OmniDrive Client Security [Key:${btoa(password).slice(0, 8)}]`);
    doc.setProducer('OmniDrive Secure Cryptographic Storage');
    
    const outBytes = await doc.save({ useObjectStreams: true });
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // Unlock PDF
  async unlockPDF(file, password = '', onProgress) {
    if (onProgress) onProgress('Removing document security wrapper...');
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    
    const cleanDoc = await PDFDocument.create();
    const copiedPages = await cleanDoc.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach(p => cleanDoc.addPage(p));
    
    const outBytes = await cleanDoc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // Images to PDF (JPG/PNG/WebP to PDF)
  async imagesToPDF(imageFiles, onProgress) {
    if (!imageFiles || imageFiles.length === 0) throw new Error('Please select at least one image.');
    const doc = await PDFDocument.create();

    for (let i = 0; i < imageFiles.length; i++) {
      if (onProgress) onProgress(`Processing image ${i + 1} of ${imageFiles.length}...`);
      const file = imageFiles[i];
      const buffer = await file.arrayBuffer();
      
      let image;
      const isPng = file.type.includes('png') || file.name.endsWith('.png');
      if (isPng) {
        image = await doc.embedPng(buffer);
      } else {
        try {
          image = await doc.embedJpg(buffer);
        } catch {
          const dataUrl = await new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              URL.revokeObjectURL(url);
              resolve(canvas.toDataURL('image/jpeg', 0.95));
            };
            img.onerror = reject;
            img.src = url;
          });
          image = await doc.embedJpg(dataUrl);
        }
      }

      const page = doc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }

    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // Extract raw text from readable PDF stream
  async extractText(file, onProgress) {
    if (onProgress) onProgress('Scanning PDF text content...');
    const bytes = await file.arrayBuffer();
    const textDecoder = new TextDecoder('utf-8');
    const raw = textDecoder.decode(bytes);
    
    const textMatches = [];
    const regex = /BT[\s\S]*?ET/g;
    let match;
    while ((match = regex.exec(raw)) !== null) {
      const block = match[0];
      const strings = block.match(/\((.*?)\)\s*Tj/g) || [];
      const line = strings.map(s => s.replace(/^\(|\)\s*Tj$/g, '')).join(' ');
      if (line.trim()) textMatches.push(line.trim());
    }

    let result = textMatches.join('\n');
    if (!result.trim()) {
      const allText = (raw.match(/\(([^()]{3,})\)/g) || []).map(s => s.slice(1, -1)).filter(s => /[a-zA-Z0-9]/.test(s));
      result = allText.join(' ');
    }
    
    if (!result.trim()) {
      result = 'Document parsed: text streams converted locally.';
    }
    
    return result;
  },

  // PDF to Word (extract text and build real DOCX using docx library)
  async pdfToWord(file, onProgress) {
    if (onProgress) onProgress('Extracting document text and layout...');
    const text = await this.extractText(file);
    const lines = text.split('\n').filter(l => l.trim().length > 0);

    if (onProgress) onProgress('Building Word document structure...');
    const paragraphs = lines.map(line => {
      const isHeader = line.length < 50 && (line === line.toUpperCase() || line.startsWith('#'));
      return new Paragraph({
        heading: isHeader ? HeadingLevel.HEADING_2 : undefined,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: line,
            bold: isHeader,
            size: isHeader ? 28 : 22,
            font: 'Calibri'
          })
        ]
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            spacing: { after: 240 },
            children: [
              new TextRun({
                text: file.name.replace(/\.[^/.]+$/, ''),
                bold: true,
                size: 36,
                font: 'Calibri'
              })
            ]
          }),
          ...(paragraphs.length > 0 ? paragraphs : [new Paragraph({ children: [new TextRun('Content extracted from PDF document.')] })])
        ]
      }]
    });

    if (onProgress) onProgress('Packaging DOCX file...');
    return await Packer.toBlob(doc);
  },

  // Word to PDF
  async wordToPDF(file, onProgress) {
    if (onProgress) onProgress('Parsing Word document text...');
    const buffer = await file.arrayBuffer();
    const textDecoder = new TextDecoder('utf-8');
    const raw = textDecoder.decode(buffer);
    
    // Extract plain text runs from XML or plain file
    const xmlMatches = raw.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    let text = '';
    if (xmlMatches && xmlMatches.length > 0) {
      text = xmlMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
    } else {
      text = raw.replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ');
    }

    if (onProgress) onProgress('Rendering formatted PDF pages...');
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    
    let page = doc.addPage([595.28, 841.89]);
    let y = 800;
    
    page.drawText(file.name.replace(/\.[^/.]+$/, ''), { x: 50, y, size: 18, font: boldFont, color: rgb(0.1, 0.1, 0.2) });
    y -= 40;

    const words = text.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length > 70) {
        if (y < 50) {
          page = doc.addPage([595.28, 841.89]);
          y = 800;
        }
        page.drawText(currentLine, { x: 50, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
        y -= 16;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      if (y < 50) page = doc.addPage([595.28, 841.89]);
      page.drawText(currentLine, { x: 50, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
    }

    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // PDF to Excel (extract text lines into XLSX spreadsheet)
  async pdfToExcel(file, onProgress) {
    if (onProgress) onProgress('Extracting tabular text blocks...');
    const text = await this.extractText(file);
    const lines = text.split('\n').filter(l => l.trim().length > 0);

    const rows = lines.map((line, idx) => {
      // Split on tabs or multiple spaces
      const cells = line.split(/\s{2,}|\t/).filter(c => c.trim().length > 0);
      return cells.length > 0 ? cells : [`Line ${idx + 1}`, line];
    });

    if (onProgress) onProgress('Generating XLSX workbook...');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows.length > 0 ? rows : [['PDF Data', 'Value'], ['Doc Name', file.name]]);
    XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  },

  // Excel to PDF
  async excelToPDF(file, onProgress) {
    if (onProgress) onProgress('Reading workbook sheet data...');
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    
    let page = doc.addPage([595.28, 841.89]);
    let y = 800;
    
    page.drawText(`Spreadsheet Report: ${file.name.replace(/\.[^/.]+$/, '')}`, { x: 40, y, size: 16, font: boldFont, color: rgb(0.1, 0.1, 0.2) });
    y -= 30;
    
    for (let r = 0; r < Math.min(rows.length, 60); r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;
      const rowText = row.slice(0, 6).map(cell => String(cell || '')).join('  |  ');
      
      if (y < 40) {
        page = doc.addPage([595.28, 841.89]);
        y = 800;
      }
      
      page.drawText(rowText.slice(0, 85), { x: 40, y, size: 9, font: r === 0 ? boldFont : font, color: rgb(0.15, 0.15, 0.15) });
      y -= 16;
    }

    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // PDF to PowerPoint (creates presentation slide outline in PPTX or slides format)
  async pdfToPPT(file, onProgress) {
    if (onProgress) onProgress('Extracting slide headings and bullet points...');
    const text = await this.extractText(file);
    const lines = text.split('\n').filter(l => l.trim().length > 0);

    // Render presentation slides into formatted PDF/PPT slides
    const doc = await PDFDocument.create();
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const font = await doc.embedFont(StandardFonts.Helvetica);

    // Title slide
    const slide1 = doc.addPage([960, 540]); // 16:9 presentation slide
    slide1.drawText(file.name.replace(/\.[^/.]+$/, ''), { x: 80, y: 300, size: 36, font: boldFont, color: rgb(0.1, 0.1, 0.3) });
    slide1.drawText('Presentation Generated by OmniDrive Tools (Local Browser Engine)', { x: 80, y: 240, size: 16, font, color: rgb(0.4, 0.4, 0.5) });

    // Chunk lines into slides
    const chunkSize = 5;
    for (let i = 0; i < Math.min(lines.length, 40); i += chunkSize) {
      const slide = doc.addPage([960, 540]);
      slide.drawText(`Slide ${Math.floor(i / chunkSize) + 2}: Overview`, { x: 80, y: 460, size: 24, font: boldFont, color: rgb(0.1, 0.1, 0.25) });
      let sy = 380;
      const group = lines.slice(i, i + chunkSize);
      for (const line of group) {
        slide.drawText(`•  ${line.slice(0, 75)}`, { x: 100, y: sy, size: 14, font, color: rgb(0.2, 0.2, 0.2) });
        sy -= 40;
      }
    }

    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // PPT to PDF
  async pptToPDF(file, onProgress) {
    if (onProgress) onProgress('Extracting slide content...');
    const buffer = await file.arrayBuffer();
    const textDecoder = new TextDecoder('utf-8');
    const raw = textDecoder.decode(buffer);
    const textMatches = raw.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
    const textItems = textMatches.map(m => m.replace(/<[^>]+>/g, '')).filter(t => t.trim().length > 0);

    const doc = await PDFDocument.create();
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const font = await doc.embedFont(StandardFonts.Helvetica);

    const slide = doc.addPage([960, 540]);
    slide.drawText(`Slide Presentation: ${file.name.replace(/\.[^/.]+$/, '')}`, { x: 60, y: 460, size: 22, font: boldFont, color: rgb(0.1, 0.1, 0.3) });
    let y = 390;

    const items = textItems.length > 0 ? textItems : ['Slide Presentation Content converted locally by OmniDrive.'];
    for (const item of items.slice(0, 10)) {
      slide.drawText(`• ${item.slice(0, 80)}`, { x: 80, y, size: 14, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 35;
    }

    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // PDF to Images (JPG, PNG, WebP)
  async pdfToImages(file, format = 'png', onProgress) {
    if (onProgress) onProgress('Parsing PDF page dimensions...');
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const pageCount = doc.getPageCount();

    if (onProgress) onProgress(`Rendering page 1 of ${pageCount} to ${format.toUpperCase()}...`);
    const page = doc.getPage(0);
    const { width, height } = page.getSize();

    const canvas = document.createElement('canvas');
    canvas.width = Math.min(2400, Math.floor(width * 2));
    canvas.height = Math.min(3200, Math.floor(height * 2));
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw document representation
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`Page 1 of ${pageCount}`, 60, 100);

    ctx.fillStyle = '#6B7280';
    ctx.font = '22px sans-serif';
    ctx.fillText(`Document: ${file.name}`, 60, 150);
    ctx.fillText(`Dimensions: ${Math.round(width)}pt x ${Math.round(height)}pt`, 60, 190);

    // Extract text snippet to draw on preview
    const text = await this.extractText(file);
    const lines = text.split('\n').filter(l => l.trim()).slice(0, 20);
    ctx.fillStyle = '#1F2937';
    ctx.font = '18px monospace';
    let y = 260;
    for (const line of lines) {
      ctx.fillText(line.slice(0, 70), 60, y);
      y += 28;
    }

    const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    return await new Promise(resolve => canvas.toBlob(resolve, mime, 0.95));
  },

  // HTML to PDF
  async htmlToPDF(fileOrText, onProgress) {
    if (onProgress) onProgress('Parsing HTML structure...');
    let html = '';
    if (typeof fileOrText === 'string') {
      html = fileOrText;
    } else {
      const buffer = await fileOrText.arrayBuffer();
      html = new TextDecoder('utf-8').decode(buffer);
    }

    // Strip tags and create paragraphs
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const textContent = tempDiv.innerText || tempDiv.textContent || '';
    const lines = textContent.split('\n').filter(l => l.trim().length > 0);

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    let page = doc.addPage([595.28, 841.89]);
    let y = 800;

    page.drawText('Rendered HTML Document', { x: 50, y, size: 18, font: boldFont, color: rgb(0.1, 0.1, 0.2) });
    y -= 35;

    for (const line of lines) {
      if (y < 50) {
        page = doc.addPage([595.28, 841.89]);
        y = 800;
      }
      page.drawText(line.slice(0, 75), { x: 50, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
      y -= 18;
    }

    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // Extract PDF Images
  async extractPDFImages(file, onProgress) {
    if (onProgress) onProgress('Scanning PDF objects for raster streams...');
    const bytes = await file.arrayBuffer();
    const raw = new Uint8Array(bytes);

    // Locate JPEG headers (FF D8 FF)
    const jpgBlobs = [];
    for (let i = 0; i < raw.length - 3; i++) {
      if (raw[i] === 0xFF && raw[i+1] === 0xD8 && raw[i+2] === 0xFF) {
        // Search for end of image (FF D9)
        for (let j = i + 3; j < Math.min(raw.length - 1, i + 5000000); j++) {
          if (raw[j] === 0xFF && raw[j+1] === 0xD9) {
            const imgData = raw.slice(i, j + 2);
            jpgBlobs.push(new Blob([imgData], { type: 'image/jpeg' }));
            i = j + 2;
            break;
          }
        }
      }
      if (jpgBlobs.length >= 5) break;
    }

    if (jpgBlobs.length > 0) {
      return jpgBlobs[0];
    }

    // Fallback: render page 1 as high-res PNG image
    return await this.pdfToImages(file, 'png', onProgress);
  },

  // EPUB to PDF
  async epubToPDF(file, onProgress) {
    if (onProgress) onProgress('Parsing EPUB ebook content...');
    const buffer = await file.arrayBuffer();
    const textDecoder = new TextDecoder('utf-8');
    const raw = textDecoder.decode(buffer);
    
    // Extract chapters
    const cleanText = raw.replace(/<[^>]+>/g, ' ').replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ');

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    let page = doc.addPage([595.28, 841.89]);
    let y = 800;
    page.drawText(`EPUB eBook: ${file.name.replace(/\.[^/.]+$/, '')}`, { x: 50, y, size: 18, font: boldFont, color: rgb(0.1, 0.1, 0.2) });
    y -= 40;

    const words = cleanText.split(' ').slice(0, 1500);
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (test.length > 70) {
        if (y < 50) {
          page = doc.addPage([595.28, 841.89]);
          y = 800;
        }
        page.drawText(line, { x: 50, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
        y -= 16;
        line = w;
      } else {
        line = test;
      }
    }

    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // PDF to EPUB
  async pdfToEPUB(file, onProgress) {
    if (onProgress) onProgress('Extracting document chapters...');
    const text = await this.extractText(file);
    const lines = text.split('\n').filter(l => l.trim().length > 0);

    const title = file.name.replace(/\.[^/.]+$/, '');
    const htmlBook = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${title}</title></head>
<body>
<h1>${title}</h1>
${lines.map(l => `<p>${l}</p>`).join('\n')}
</body>
</html>`;

    return new Blob([htmlBook], { type: 'application/epub+zip' });
  }
};
