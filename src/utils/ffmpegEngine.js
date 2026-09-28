// OmniDrive Tools - Client-Side Video & Audio Processing Engine
// Powered by browser Web Audio API, Canvas Stream Capture, and MediaRecorder

export const ffmpegEngine = {
  // Decode audio file into AudioBuffer
  async decodeAudio(file) {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtxClass();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return { audioCtx, audioBuffer };
  },

  // AudioBuffer to 16-bit PCM WAV Blob
  audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    let interleaved;
    if (numChannels === 2) {
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      interleaved = new Float32Array(left.length + right.length);
      for (let i = 0, j = 0; i < left.length; i++) {
        interleaved[j++] = left[i];
        interleaved[j++] = right[i];
      }
    } else {
      interleaved = buffer.getChannelData(0);
    }

    const dataLength = interleaved.length * (bitDepth / 8);
    const headerLength = 44;
    const wavBuffer = new ArrayBuffer(headerLength + dataLength);
    const view = new DataView(wavBuffer);

    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < interleaved.length; i++) {
      let sample = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return new Blob([wavBuffer], { type: 'audio/wav' });
  },

  // Extract Audio track from Video file
  async videoToAudio(file, onProgress) {
    if (onProgress) onProgress('Extracting audio track from video...');
    const { audioBuffer } = await this.decodeAudio(file);
    return this.audioBufferToWav(audioBuffer);
  },

  // Trim Audio (startTime to endTime in seconds)
  async trimAudio(file, startTime, endTime, onProgress) {
    if (onProgress) onProgress('Decoding audio frames...');
    const { audioBuffer } = await this.decodeAudio(file);
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    
    const startSample = Math.max(0, Math.floor(startTime * sampleRate));
    const endSample = Math.min(audioBuffer.length, Math.floor(endTime * sampleRate));
    const frameCount = endSample - startSample;

    if (frameCount <= 0) throw new Error('Invalid start or end time specified.');

    if (onProgress) onProgress('Slicing audio samples...');
    const offlineCtx = new OfflineAudioContext(channels, frameCount, sampleRate);
    const newBuffer = offlineCtx.createBuffer(channels, frameCount, sampleRate);

    for (let c = 0; c < channels; c++) {
      const channelData = audioBuffer.getChannelData(c);
      const subData = channelData.subarray(startSample, endSample);
      newBuffer.copyToChannel(subData, c);
    }

    return this.audioBufferToWav(newBuffer);
  },

  // Reverse Audio
  async reverseAudio(file, onProgress) {
    if (onProgress) onProgress('Decoding audio buffer...');
    const { audioBuffer } = await this.decodeAudio(file);
    const channels = audioBuffer.numberOfChannels;

    if (onProgress) onProgress('Reversing audio samples...');
    for (let c = 0; c < channels; c++) {
      const data = audioBuffer.getChannelData(c);
      data.reverse();
    }

    return this.audioBufferToWav(audioBuffer);
  },

  // Change Audio Volume (gainMultiplier)
  async boostVolume(file, gainMultiplier = 1.5, onProgress) {
    if (onProgress) onProgress('Loading audio track...');
    const { audioBuffer } = await this.decodeAudio(file);
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;

    if (onProgress) onProgress(`Applying ${Math.round(gainMultiplier * 100)}% gain boost...`);
    for (let c = 0; c < channels; c++) {
      const data = audioBuffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        data[i] = Math.tanh(data[i] * gainMultiplier);
      }
    }

    return this.audioBufferToWav(audioBuffer);
  },

  // Change Playback Speed
  async changePlaybackSpeed(file, speed = 1.25, onProgress) {
    if (onProgress) onProgress('Resampling audio track...');
    const { audioBuffer } = await this.decodeAudio(file);
    const newLength = Math.round(audioBuffer.length / speed);
    const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, newLength, audioBuffer.sampleRate);
    
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = speed;
    source.connect(offlineCtx.destination);
    source.start(0);

    const rendered = await offlineCtx.startRendering();
    return this.audioBufferToWav(rendered);
  },

  // Merge Multiple Audio Tracks
  async mergeAudio(files, onProgress) {
    if (files.length < 2) throw new Error('Please select at least 2 audio files.');
    const decodedBuffers = [];
    let totalLength = 0;
    let maxChannels = 1;
    let sampleRate = 44100;

    for (let i = 0; i < files.length; i++) {
      if (onProgress) onProgress(`Decoding track ${i + 1} of ${files.length}...`);
      const { audioBuffer } = await this.decodeAudio(files[i]);
      decodedBuffers.push(audioBuffer);
      totalLength += audioBuffer.length;
      maxChannels = Math.max(maxChannels, audioBuffer.numberOfChannels);
      sampleRate = audioBuffer.sampleRate;
    }

    const offlineCtx = new OfflineAudioContext(maxChannels, totalLength, sampleRate);
    const mergedBuffer = offlineCtx.createBuffer(maxChannels, totalLength, sampleRate);

    let offset = 0;
    for (const buf of decodedBuffers) {
      for (let c = 0; c < maxChannels; c++) {
        const sourceData = buf.getChannelData(Math.min(c, buf.numberOfChannels - 1));
        mergedBuffer.getChannelData(c).set(sourceData, offset);
      }
      offset += buf.length;
    }

    return this.audioBufferToWav(mergedBuffer);
  },

  // Mute Video (remove audio stream)
  // Picks a container this browser can genuinely record (mp4 where supported, else webm)
  pickVideoMime() {
    const candidates = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    if (typeof MediaRecorder === 'undefined') return null;
    return candidates.find(m => MediaRecorder.isTypeSupported(m)) || null;
  },

  // Shared real-time re-encoder: plays the source video onto a canvas and records it.
  // The returned Blob's type is the container that was actually recorded, so file
  // extensions always match real contents. Audio is carried over when keepAudio is true.
  async recordVideo(file, { start = 0, duration = null, width = null, height = null, keepAudio = true, videoBitsPerSecond = undefined } = {}, onProgress) {
    const mimeType = this.pickVideoMime();
    if (!mimeType) throw new Error('This browser cannot record video (MediaRecorder unsupported). Please use Chrome, Edge, or Firefox.');

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.playsInline = true;
    video.muted = !keepAudio;
    video.preload = 'auto';
    try {
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = () => reject(new Error('This video format could not be read by your browser.'));
      });
      const total = isFinite(video.duration) ? video.duration : 0;
      const startAt = Math.max(0, Math.min(start, Math.max(0, total - 0.1)));
      const runFor = duration == null ? Math.max(0.1, total - startAt) : Math.max(0.1, Math.min(duration, total - startAt));

      if (startAt > 0) {
        await new Promise((resolve) => { video.onseeked = resolve; video.currentTime = startAt; });
      }

      const w = width || video.videoWidth;
      const h = height || video.videoHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(30);
      if (keepAudio) {
        const src = video.captureStream ? video.captureStream() : (video.mozCaptureStream ? video.mozCaptureStream() : null);
        if (src) src.getAudioTracks().forEach(t => stream.addTrack(t));
      }

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond });
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      const finished = new Promise((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
      });

      recorder.start(250);
      await video.play();
      const endAt = startAt + runFor;
      await new Promise((resolve) => {
        const draw = () => {
          ctx.drawImage(video, 0, 0, w, h);
          if (onProgress) onProgress(`Processing ${Math.min(100, Math.round(((video.currentTime - startAt) / runFor) * 100))}%...`);
          if (video.ended || video.currentTime >= endAt) {
            resolve();
          } else {
            requestAnimationFrame(draw);
          }
        };
        draw();
      });
      video.pause();
      recorder.stop();
      return await finished;
    } finally {
      URL.revokeObjectURL(url);
    }
  },

  // Remove the audio track (video-only output)
  async muteVideo(file, onProgress) {
    if (onProgress) onProgress('Re-encoding video without an audio track...');
    return this.recordVideo(file, { keepAudio: false }, onProgress);
  },

  // Trim video from startTime to endTime (seconds), keeping audio
  async trimVideo(file, startTime = 0, endTime = 5, onProgress) {
    if (!(endTime > startTime)) throw new Error('End time must be greater than start time.');
    if (onProgress) onProgress('Slicing video clip...');
    return this.recordVideo(file, { start: startTime, duration: endTime - startTime, keepAudio: true }, onProgress);
  },

  // Resize video to a target resolution, keeping audio
  async resizeVideo(file, targetWidth = 1280, targetHeight = 720, onProgress, bitrate) {
    if (onProgress) onProgress(`Resizing video resolution to ${targetWidth}x${targetHeight}...`);
    return this.recordVideo(file, { width: targetWidth, height: targetHeight, keepAudio: true, videoBitsPerSecond: bitrate }, onProgress);
  },

  // Convert decoded audio into another browser-supported format (WAV always; WebM/Opus or MP4/AAC when the browser can record it)
  async convertAudio(file, targetFormat = 'wav', onProgress) {
    const { audioBuffer } = await this.decodeAudio(file);
    if (targetFormat === 'wav') return this.audioBufferToWav(audioBuffer);
    const mime = targetFormat === 'mp4' ? 'audio/mp4' : 'audio/webm;codecs=opus';
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported(mime)) {
      throw new Error(`This browser cannot encode ${targetFormat.toUpperCase()} audio. Choose WAV instead.`);
    }
    if (onProgress) onProgress(`Encoding ${targetFormat.toUpperCase()} audio (real-time)...`);
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = ctx.createMediaStreamDestination();
    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(dest);
    const recorder = new MediaRecorder(dest.stream, { mimeType: mime });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    const done = new Promise(resolve => { recorder.onstop = () => resolve(new Blob(chunks, { type: mime.split(';')[0] })); });
    recorder.start();
    src.start();
    await new Promise(r => { src.onended = r; });
    recorder.stop();
    await ctx.close();
    return await done;
  },

  async editMP3Tags(file, { title, artist, album, year }, onProgress) {
    if (onProgress) onProgress('Writing ID3v2 metadata tags...');
    const bytes = new Uint8Array(await file.arrayBuffer());

    // Validate this is really an MP3 (ID3 header or MPEG frame sync)
    const hasId3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33;
    const hasSync = bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0;
    if (!hasId3 && !hasSync) throw new Error('This tool only edits real MP3 files. Convert your audio to MP3 first.');

    // Strip any existing ID3v2 tag so tags aren't duplicated
    let audioStart = 0;
    if (hasId3) {
      const size = ((bytes[6] & 0x7F) << 21) | ((bytes[7] & 0x7F) << 14) | ((bytes[8] & 0x7F) << 7) | (bytes[9] & 0x7F);
      audioStart = 10 + size;
    }
    let audioEnd = bytes.length;
    // Also strip a trailing ID3v1 tag if present
    if (bytes.length > 128 && bytes[bytes.length - 128] === 0x54 && bytes[bytes.length - 127] === 0x41 && bytes[bytes.length - 126] === 0x47) {
      audioEnd -= 128;
    }
    const audio = bytes.slice(audioStart, audioEnd);

    const enc = new TextEncoder();
    const frame = (id, text) => {
      if (!text) return new Uint8Array(0);
      const payload = new Uint8Array([3, ...enc.encode(String(text))]); // 3 = UTF-8
      const out = new Uint8Array(10 + payload.length);
      out.set(enc.encode(id), 0);
      // ID3v2.4 frame sizes are synchsafe
      out[4] = (payload.length >> 21) & 0x7F;
      out[5] = (payload.length >> 14) & 0x7F;
      out[6] = (payload.length >> 7) & 0x7F;
      out[7] = payload.length & 0x7F;
      out.set(payload, 10);
      return out;
    };
    const frames = [frame('TIT2', title), frame('TPE1', artist), frame('TALB', album), frame('TDRC', year)];
    const framesLen = frames.reduce((n, f) => n + f.length, 0);
    const header = new Uint8Array(10);
    header.set(enc.encode('ID3'), 0);
    header[3] = 4; // ID3v2.4
    header[4] = 0;
    header[5] = 0;
    header[6] = (framesLen >> 21) & 0x7F;
    header[7] = (framesLen >> 14) & 0x7F;
    header[8] = (framesLen >> 7) & 0x7F;
    header[9] = framesLen & 0x7F;

    const combined = new Uint8Array(10 + framesLen + audio.length);
    combined.set(header, 0);
    let o = 10;
    frames.forEach(f => { combined.set(f, o); o += f.length; });
    combined.set(audio, o);
    return new Blob([combined], { type: 'audio/mpeg' });
  },

  // Generate SRT Subtitles
  generateSRT(subtitles) {
    return subtitles.map((sub, idx) => {
      return `${idx + 1}\n${sub.start} --> ${sub.end}\n${sub.text.trim()}\n`;
    }).join('\n');
  }
};
