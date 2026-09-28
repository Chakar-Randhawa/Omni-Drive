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

  // Remove Watermark — genuinely removes watermark Annotations (e.g. Stamp
  // annotations added by DocuSign, Adobe, and many office exporters) and
  // named "Watermark" Optional Content Group layers. NOTE: a watermark that
  // was flattened directly into a page's drawn content (as opposed to an
  // annotation or OCG layer) cannot be reliably detected and stripped
  // without risking damage to the rest of the page — this is a real
  // limitation of any client-side PDF editor, not just this tool.
  async removeWatermark(file, onProgress) {
    if (onProgress) onProgress('Scanning for watermark annotations and layers...');
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = doc.getPages();
    let removedCount = 0;

    for (const page of pages) {
      const annots = page.node.Annots();
      if (annots) {
        const kept = [];
        for (let i = 0; i < annots.size(); i++) {
          const annotRef = annots.get(i);
          const annot = doc.context.lookup(annotRef);
          const subtype = annot?.get ? annot.get(doc.context.obj('Subtype')) : null;
          const name = subtype ? subtype.toString() : '';
          const contentsEntry = annot?.get ? annot.get(doc.context.obj('Contents')) : null;
          const contentsText = contentsEntry && contentsEntry.decodeText ? contentsEntry.decodeText().toLowerCase() : '';
          const looksLikeWatermark = name.includes('Stamp') || name.includes('Watermark') || contentsText.includes('watermark') || contentsText.includes('confidential') || contentsText.includes('draft');
          if (looksLikeWatermark) {
            removedCount++;
          } else {
            kept.push(annotRef);
          }
        }
        page.node.set(doc.context.obj('Annots'), doc.context.obj(kept));
      }

      // Remove named "Watermark" Optional Content Groups from this page's resources
      const resources = page.node.Resources();
      const properties = resources?.get ? resources.get(doc.context.obj('Properties')) : null;
      if (properties && properties.entries) {
        for (const [key] of properties.entries()) {
          const ocg = doc.context.lookup(properties.get(key));
          const ocgName = ocg?.get ? ocg.get(doc.context.obj('Name')) : null;
          const ocgNameText = ocgName && ocgName.decodeText ? ocgName.decodeText().toLowerCase() : '';
          if (ocgNameText.includes('watermark')) {
            properties.delete(key);
            removedCount++;
          }
        }
      }
    }

    if (onProgress) {
      onProgress(removedCount > 0
        ? `Removed ${removedCount} watermark annotation(s)/layer(s).`
        : 'No annotation- or layer-based watermark found (a watermark baked into the page graphics itself cannot be safely auto-removed).');
    }

    const outBytes = await doc.save({ useObjectStreams: true });
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
  // Protect PDF — real standard PDF encryption (RC4/AES) via pdf-lib-plus-encrypt,
  // so the file genuinely requires the given password to open in any PDF reader.
  async protectPDF(file, password = 'password', onProgress) {
    if (!password || !password.trim()) throw new Error('Please enter a password to protect this PDF.');
    if (onProgress) onProgress('Encrypting document with a real password...');
    const encMod = await import('pdf-lib-plus-encrypt');
    const EncryptablePDFDocument = encMod.PDFDocument || (encMod.default && encMod.default.PDFDocument);
    const bytes = await file.arrayBuffer();
    const doc = await EncryptablePDFDocument.load(bytes, { ignoreEncryption: true });

    await doc.encrypt({
      userPassword: password,
      ownerPassword: password,
      permissions: { printing: 'highResolution', modifying: false, copying: false, annotating: false },
    });

    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // Unlock PDF — removes owner/permission restrictions from PDFs that don't
  // require a password to open. Genuinely decrypting a PDF that requires a
  // password to open isn't possible client-side without the correct password
  // (that would defeat the purpose of PDF encryption); this throws a clear
  // error in that case instead of silently returning a still-locked file.
  async unlockPDF(file, password = '', onProgress) {
    if (onProgress) onProgress('Removing document security wrapper...');
    const bytes = await file.arrayBuffer();
    let doc;
    try {
      doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      // Force-touch the page tree; PDFs that truly require a password to
      // open will fail here even with ignoreEncryption set.
      doc.getPageCount();
    } catch (err) {
      throw new Error('This PDF requires the correct password to open, so it cannot be decrypted in the browser without it. This tool can only remove permission restrictions (printing/copying locks) from PDFs that open without a password.');
    }

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
    if (onProgress) onProgress('Rendering PDF and extracting real text content...');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.mjs';
      const bytes = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        if (onProgress) onProgress(`Extracting text from page ${i} of ${pdf.numPages}...`);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(' ');
        pages.push(pageText.trim());
      }
      const result = pages.join('\n\n').trim();
      if (result) return result;
    } catch (err) {
      if (onProgress) onProgress('Real text layer unavailable, falling back to raw stream scan...');
    }

    // Fallback for edge cases (e.g. malformed PDFs pdf.js can't parse):
    // scan uncompressed content streams directly. This only catches text
    // in PDFs that were saved without stream compression.
    const bytes = await file.arrayBuffer();
    const raw = new TextDecoder('utf-8').decode(bytes);
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
      result = 'No extractable text layer was found in this PDF (it may be a scanned image). Try the Image to Text (OCR) tool on individual pages instead.';
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
    if (onProgress) onProgress('Unzipping .docx and parsing document.xml...');
    const buffer = await file.arrayBuffer();
    let text = '';

    try {
      // Real .docx files are ZIP archives containing word/document.xml
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(buffer);
      const docXmlFile = zip.file('word/document.xml');
      if (docXmlFile) {
        const xml = await docXmlFile.async('string');
        // Preserve paragraph breaks, then pull text runs
        const withBreaks = xml.replace(/<\/w:p>/g, '\n');
        const xmlMatches = withBreaks.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
        text = xmlMatches
          .map(m => m.replace(/<[^>]+>/g, ''))
          .join('')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
      }
    } catch (err) {
      // Not a valid ZIP (e.g. a .txt file renamed to .docx) — fall through
    }

    if (!text.trim()) {
      // Fallback: treat as plain text
      const textDecoder = new TextDecoder('utf-8');
      const raw = textDecoder.decode(buffer);
      text = raw.replace(/[^\x20-\x7E\n]/g, ' ').replace(/[ \t]+/g, ' ');
    }
    // pdf-lib's built-in StandardFonts only support WinAnsi characters
    text = text.replace(/[^\x09\x0A\x0D\x20-\xFF]/g, '');

    if (onProgress) onProgress('Rendering formatted PDF pages...');
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    
    let page = doc.addPage([595.28, 841.89]);
    let y = 800;
    
    page.drawText(file.name.replace(/\.[^/.]+$/, ''), { x: 50, y, size: 18, font: boldFont, color: rgb(0.1, 0.1, 0.2) });
    y -= 40;

    const paragraphs = text.split('\n');
    for (const para of paragraphs) {
      const words = para.split(' ');
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length > 70) {
          if (y < 50) { page = doc.addPage([595.28, 841.89]); y = 800; }
          page.drawText(currentLine, { x: 50, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
          y -= 16;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (y < 50) { page = doc.addPage([595.28, 841.89]); y = 800; }
      page.drawText(currentLine, { x: 50, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
      y -= 16;
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
    if (onProgress) onProgress('Extracting text from each PDF page...');
    // Real .pptx output (a ZIP-based OOXML package), one slide per PDF page.
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.mjs';
    const bytes = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const PptxGenJS = (await import('pptxgenjs')).default;
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const title = pptx.addSlide();
    title.addText(file.name.replace(/\.[^/.]+$/, ''), { x: 0.6, y: 2.0, w: 8.8, h: 1.2, fontSize: 36, bold: true, color: '1A1A4D' });
    title.addText(`${pdf.numPages} page(s) converted in your browser`, { x: 0.6, y: 3.2, w: 8.8, h: 0.6, fontSize: 16, color: '666677' });

    for (let i = 1; i <= pdf.numPages; i++) {
      if (onProgress) onProgress(`Building slide ${i} of ${pdf.numPages}...`);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
      const slide = pptx.addSlide();
      slide.addText(`Page ${i}`, { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true, color: '1A1A40' });
      slide.addText(text ? text.slice(0, 1800) : '(No text layer on this page)', { x: 0.5, y: 1.1, w: 9, h: 4.2, fontSize: 14, color: '333333', valign: 'top', fit: 'shrink' });
    }
    return await pptx.write({ outputType: 'blob' });
  },

  // PPT to PDF
  async pptToPDF(file, onProgress) {
    if (onProgress) onProgress('Unzipping .pptx and reading slide XML...');
    const buffer = await file.arrayBuffer();
    const JSZip = (await import('jszip')).default;
    let zip;
    try {
      zip = await JSZip.loadAsync(buffer);
    } catch (e) {
      throw new Error('This file is not a valid .pptx presentation (older .ppt binary files are not supported).');
    }
    const slideNames = Object.keys(zip.files)
      .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => parseInt(a.match(/(\d+)\.xml/)[1]) - parseInt(b.match(/(\d+)\.xml/)[1]));
    if (slideNames.length === 0) throw new Error('No slides found in this file.');

    const decode = t => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    const safe = t => t.replace(/[^\x20-\xFF]/g, '');

    const doc = await PDFDocument.create();
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const font = await doc.embedFont(StandardFonts.Helvetica);

    for (let i = 0; i < slideNames.length; i++) {
      if (onProgress) onProgress(`Rendering slide ${i + 1} of ${slideNames.length}...`);
      const xml = await zip.file(slideNames[i]).async('string');
      const paragraphs = (xml.match(/<a:p>[\s\S]*?<\/a:p>|<a:p [\s\S]*?<\/a:p>/g) || [])
        .map(p => decode((p.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('')).trim())
        .filter(Boolean);
      const slide = doc.addPage([960, 540]);
      slide.drawText(`Slide ${i + 1}`, { x: 40, y: 500, size: 12, font, color: rgb(0.5, 0.5, 0.55) });
      let y = 460;
      paragraphs.forEach((para, idx) => {
        const size = idx === 0 ? 26 : 15;
        const f = idx === 0 ? boldFont : font;
        const maxChars = idx === 0 ? 60 : 100;
        const words = safe(para).split(' ');
        let line = '';
        const flush = () => { if (line && y > 30) { slide.drawText(line, { x: 60, y, size, font: f, color: rgb(0.12, 0.12, 0.2) }); y -= size + 8; } line = ''; };
        for (const w of words) {
          if ((line + ' ' + w).trim().length > maxChars) flush();
          line = (line + ' ' + w).trim();
        }
        flush();
        y -= 6;
      });
    }
    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // PDF to Images (JPG, PNG, WebP) — renders every real page with pdf.js
  // and returns a single image Blob (1-page PDFs) or a ZIP of images
  // (multi-page PDFs), instead of a fake text-summary placeholder.
  async pdfToImages(file, format = 'png', onProgress) {
    if (onProgress) onProgress('Loading PDF for real page rendering...');
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.mjs';
    const bytes = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const quality = format === 'png' ? undefined : 0.92;

    const renderPage = async (pageNum) => {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      return await new Promise(resolve => canvas.toBlob(resolve, mime, quality));
    };

    if (pdf.numPages === 1) {
      if (onProgress) onProgress(`Rendering page to ${format.toUpperCase()}...`);
      return await renderPage(1);
    }

    // Multiple pages: render each and bundle into a ZIP
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    for (let i = 1; i <= pdf.numPages; i++) {
      if (onProgress) onProgress(`Rendering page ${i} of ${pdf.numPages} to ${format.toUpperCase()}...`);
      const pageBlob = await renderPage(i);
      const pageBytes = new Uint8Array(await pageBlob.arrayBuffer());
      zip.file(`page-${String(i).padStart(2, '0')}.${format}`, pageBytes);
    }
    if (onProgress) onProgress('Packaging pages into a ZIP archive...');
    return await zip.generateAsync({ type: 'blob' });
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
    if (onProgress) onProgress('Scanning every page for embedded images...');
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.mjs';
    const bytes = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const IMG_OPS = [pdfjsLib.OPS.paintImageXObject, pdfjsLib.OPS.paintInlineImageXObject].filter(v => v !== undefined);

    const toPngBlob = (img) => new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (img.bitmap) {
        ctx.drawImage(img.bitmap, 0, 0);
      } else {
        const rgba = ctx.createImageData(img.width, img.height);
        const src = img.data;
        if (src.length === img.width * img.height * 4) {
          rgba.data.set(src);
        } else if (src.length === img.width * img.height * 3) {
          for (let i = 0, j = 0; i < src.length; i += 3, j += 4) {
            rgba.data[j] = src[i]; rgba.data[j + 1] = src[i + 1]; rgba.data[j + 2] = src[i + 2]; rgba.data[j + 3] = 255;
          }
        } else {
          // 1-bit grayscale, rows padded to whole bytes
          const rowBytes = Math.ceil(img.width / 8);
          for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
              const bit = (src[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
              const o = (y * img.width + x) * 4;
              rgba.data[o] = rgba.data[o + 1] = rgba.data[o + 2] = bit ? 255 : 0;
              rgba.data[o + 3] = 255;
            }
          }
        }
        ctx.putImageData(rgba, 0, 0);
      }
      canvas.toBlob(resolve, 'image/png');
    });

    const found = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      if (onProgress) onProgress(`Extracting images from page ${p} of ${pdf.numPages}...`);
      const page = await pdf.getPage(p);
      const ops = await page.getOperatorList();
      for (let i = 0; i < ops.fnArray.length; i++) {
        if (!IMG_OPS.includes(ops.fnArray[i])) continue;
        const arg = ops.argsArray[i][0];
        let img = null;
        if (typeof arg === 'string') {
          img = await new Promise((resolve) => {
            const t = setTimeout(() => resolve(null), 3000);
            page.objs.get(arg, (o) => { clearTimeout(t); resolve(o); });
          });
        } else {
          img = arg;
        }
        if (img && img.width > 16 && img.height > 16) {
          const blob = await toPngBlob(img);
          if (blob) found.push({ page: p, blob });
        }
      }
    }

    if (found.length === 0) {
      throw new Error('No embedded images were found in this PDF (pages may be pure text/vector graphics). Use PDF to PNG to capture full pages instead.');
    }
    if (found.length === 1) return found[0].blob;

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    for (let i = 0; i < found.length; i++) {
      zip.file(`image-${String(i + 1).padStart(2, '0')}-page-${found[i].page}.png`, new Uint8Array(await found[i].blob.arrayBuffer()));
    }
    return await zip.generateAsync({ type: 'blob' });
  },

  // EPUB to PDF
  async epubToPDF(file, onProgress) {
    if (onProgress) onProgress('Unzipping EPUB and reading reading order...');
    const buffer = await file.arrayBuffer();
    const JSZip = (await import('jszip')).default;
    let zip;
    try {
      zip = await JSZip.loadAsync(buffer);
    } catch (e) {
      throw new Error('This file is not a valid EPUB (EPUB files are ZIP archives).');
    }

    // Locate the OPF package via META-INF/container.xml, then follow the spine order
    let chapterPaths = [];
    try {
      const container = await zip.file('META-INF/container.xml').async('string');
      const opfPath = container.match(/full-path="([^"]+)"/)[1];
      const opf = await zip.file(opfPath).async('string');
      const baseDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
      const manifest = {};
      (opf.match(/<item\s[^>]*>/g) || []).forEach(tag => {
        const id = (tag.match(/\bid="([^"]+)"/) || [])[1];
        const href = (tag.match(/\bhref="([^"]+)"/) || [])[1];
        if (id && href) manifest[id] = href;
      });
      chapterPaths = (opf.match(/<itemref\s[^>]*>/g) || [])
        .map(t => (t.match(/idref="([^"]+)"/) || [])[1])
        .filter(id => manifest[id])
        .map(id => baseDir + decodeURIComponent(manifest[id]));
    } catch (e) {
      chapterPaths = Object.keys(zip.files).filter(n => /\.(x?html?)$/i.test(n));
    }
    if (chapterPaths.length === 0) throw new Error('No readable chapters found in this EPUB.');

    const decode = t => t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
    const paragraphs = [];
    for (let i = 0; i < chapterPaths.length; i++) {
      if (onProgress) onProgress(`Reading chapter ${i + 1} of ${chapterPaths.length}...`);
      const f = zip.file(chapterPaths[i]);
      if (!f) continue;
      const html = await f.async('string');
      const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [null, html])[1]
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
        .replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '');
      decode(body).split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean).forEach(l => paragraphs.push(l));
    }

    if (onProgress) onProgress('Typesetting PDF pages...');
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
    let page = doc.addPage([595.28, 841.89]);
    let y = 800;
    page.drawText(file.name.replace(/\.[^/.]+$/, '').replace(/[^\x20-\xFF]/g, ''), { x: 50, y, size: 18, font: boldFont, color: rgb(0.1, 0.1, 0.2) });
    y -= 40;

    for (const para of paragraphs) {
      const words = para.replace(/[^\x20-\xFF]/g, '').split(' ');
      let line = '';
      const flush = () => {
        if (!line) return;
        if (y < 50) { page = doc.addPage([595.28, 841.89]); y = 800; }
        page.drawText(line, { x: 50, y, size: 10, font, color: rgb(0.15, 0.15, 0.15) });
        y -= 15;
        line = '';
      };
      for (const w of words) {
        if ((line + ' ' + w).trim().length > 88) flush();
        line = (line + ' ' + w).trim();
      }
      flush();
      y -= 6;
    }

    const outBytes = await doc.save();
    return new Blob([outBytes], { type: 'application/pdf' });
  },

  // PDF to EPUB — builds a real, spec-compliant EPUB 3 ZIP container
  async pdfToEPUB(file, onProgress) {
    if (onProgress) onProgress('Extracting document text...');
    const text = await this.extractText(file);
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const title = esc(file.name.replace(/\.[^/.]+$/, ''));
    const id = 'urn:uuid:' + (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));

    if (onProgress) onProgress('Packaging EPUB container...');
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    // The mimetype entry must be first and stored uncompressed per the EPUB spec
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
    zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`);
    zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${id}</dc:identifier>
    <dc:title>${title}</dc:title>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine><itemref idref="chapter1"/></spine>
</package>`);
    zip.file('OEBPS/nav.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Contents</title></head>
<body><nav epub:type="toc"><ol><li><a href="chapter1.xhtml">${title}</a></li></ol></nav></body>
</html>`);
    zip.file('OEBPS/chapter1.xhtml', `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${title}</title></head>
<body>
<h1>${title}</h1>
${lines.map(l => `<p>${esc(l)}</p>`).join('\n')}
</body>
</html>`);
    return await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  }
};
