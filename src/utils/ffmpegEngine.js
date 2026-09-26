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
  async muteVideo(file, onProgress) {
    if (onProgress) onProgress('Removing audio tracks from video container...');
    const video = document.createElement('video');
    video.muted = true;
    video.src = URL.createObjectURL(file);
    await new Promise(r => { video.onloadedmetadata = r; });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(25);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    return new Promise((resolve) => {
      recorder.onstop = () => {
        URL.revokeObjectURL(video.src);
        resolve(new Blob(chunks, { type: 'video/mp4' }));
      };
      recorder.start();
      video.play();
      const draw = () => {
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(draw);
        } else {
          recorder.stop();
        }
      };
      draw();
    });
  },

  // Trim Video
  async trimVideo(file, startTime = 0, duration = 5, onProgress) {
    if (onProgress) onProgress('Slicing video clip...');
    const video = document.createElement('video');
    video.muted = true;
    video.src = URL.createObjectURL(file);
    await new Promise(r => { video.onloadedmetadata = r; });

    video.currentTime = startTime;
    await new Promise(r => { video.onseeked = r; });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(25);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    return new Promise((resolve) => {
      recorder.onstop = () => {
        URL.revokeObjectURL(video.src);
        resolve(new Blob(chunks, { type: 'video/mp4' }));
      };
      recorder.start();
      video.play();
      setTimeout(() => {
        video.pause();
        recorder.stop();
      }, duration * 1000);
      const draw = () => {
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0);
          requestAnimationFrame(draw);
        }
      };
      draw();
    });
  },

  // Resize Video Dimensions
  async resizeVideo(file, targetWidth = 1280, targetHeight = 720, onProgress) {
    if (onProgress) onProgress(`Resizing video resolution to ${targetWidth}x${targetHeight}...`);
    const video = document.createElement('video');
    video.muted = true;
    video.src = URL.createObjectURL(file);
    await new Promise(r => { video.onloadedmetadata = r; });

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(25);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    return new Promise((resolve) => {
      recorder.onstop = () => {
        URL.revokeObjectURL(video.src);
        resolve(new Blob(chunks, { type: 'video/mp4' }));
      };
      recorder.start();
      video.play();
      const draw = () => {
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          requestAnimationFrame(draw);
        } else {
          recorder.stop();
        }
      };
      draw();
    });
  },

  // Edit MP3 ID3 Tags
  async editMP3Tags(file, { title, artist, album, year }, onProgress) {
    if (onProgress) onProgress('Writing ID3 metadata tags...');
    const buffer = await file.arrayBuffer();
    const textEncoder = new TextEncoder();
    
    // Construct simplified ID3v1 tag (128 bytes at end of MP3)
    const id3v1 = new Uint8Array(128);
    id3v1.set(textEncoder.encode('TAG'), 0);
    const titleBytes = textEncoder.encode((title || file.name).slice(0, 30));
    id3v1.set(titleBytes, 3);
    const artistBytes = textEncoder.encode((artist || 'OmniDrive Artist').slice(0, 30));
    id3v1.set(artistBytes, 33);
    const albumBytes = textEncoder.encode((album || 'OmniDrive Collection').slice(0, 30));
    id3v1.set(albumBytes, 63);
    const yearBytes = textEncoder.encode(String(year || '2026').slice(0, 4));
    id3v1.set(yearBytes, 93);

    const combined = new Uint8Array(buffer.byteLength + 128);
    combined.set(new Uint8Array(buffer), 0);
    combined.set(id3v1, buffer.byteLength);

    return new Blob([combined], { type: 'audio/mp3' });
  },

  // Generate SRT Subtitles
  generateSRT(subtitles) {
    return subtitles.map((sub, idx) => {
      return `${idx + 1}\n${sub.start} --> ${sub.end}\n${sub.text.trim()}\n`;
    }).join('\n');
  }
};
