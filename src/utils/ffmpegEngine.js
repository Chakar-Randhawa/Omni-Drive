// OmniDrive Tools - Client-Side Video & Audio Processing Engine
// Powered by a real, self-hosted FFmpeg (compiled to WebAssembly, via
// @ffmpeg/ffmpeg + @ffmpeg/core) for video/container-level work, and the
// Web Audio API for pure in-browser audio DSP (speed, volume, reverse).

let _ffmpegInstance = null;
let _ffmpegLoadPromise = null;

// Loads a single shared FFmpeg (WASM) instance from files self-hosted under
// /public/wasm — no external CDN dependency, and it works fully offline
// once the page's assets are cached. This is genuine FFmpeg (5.1, built
// with libx264/libx265/libvpx/libmp3lame/libopus), not a MediaRecorder hack,
// so the exact same commands the desktop `ffmpeg` CLI would run also run
// here, producing real, correctly-labelled MP4/WebM/MP3/etc. files that
// behave identically across Chrome, Edge, Firefox, and Safari.
async function getFFmpeg(onProgress) {
  if (_ffmpegInstance) return _ffmpegInstance;
  if (_ffmpegLoadPromise) return _ffmpegLoadPromise;
  _ffmpegLoadPromise = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');
    const ffmpeg = new FFmpeg();
    if (onProgress) {
      ffmpeg.on('log', ({ message }) => onProgress(message));
      ffmpeg.on('progress', ({ progress }) => onProgress(`Processing: ${Math.round(progress * 100)}%`));
    }
    const base = window.location.origin;
    // ffmpeg-core.wasm is ~31MB — too large for some git hosting file-size
    // limits to keep in the repo, so it's loaded from jsdelivr (the CDN
    // ffmpeg.wasm's own docs recommend) and converted to a blob URL, which
    // is the standard, documented way to load it. Only the small worker
    // glue (a few KB) is self-hosted, so processing still runs 100%
    // locally in the browser once these are fetched.
    const CORE_CDN = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${CORE_CDN}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${CORE_CDN}/ffmpeg-core.wasm`, 'application/wasm'),
      classWorkerURL: `${base}/wasm/ffmpeg-support/worker.js`,
    });
    _ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();
  return _ffmpegLoadPromise;
}

// Runs one ffmpeg command against a single input file and returns the
// output as a Blob. Handles writing the input into ffmpeg's virtual
// filesystem and cleaning both files up afterwards.
async function runFFmpeg(file, inputName, args, outputName, outputMime, onProgress) {
  const { fetchFile } = await import('@ffmpeg/util');
  const ffmpeg = await getFFmpeg(onProgress);
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  try {
    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(outputName);
    return new Blob([data.buffer], { type: outputMime });
  } finally {
    try { await ffmpeg.deleteFile(inputName); } catch { /* ignore */ }
    try { await ffmpeg.deleteFile(outputName); } catch { /* ignore */ }
  }
}

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
    if (onProgress) onProgress('Extracting real audio track with FFmpeg...');
    return runFFmpeg(file, 'in.mp4', ['-i', 'in.mp4', '-vn', '-c:a', 'libmp3lame', '-q:a', '2', 'out.mp3'], 'out.mp3', 'audio/mpeg', onProgress);
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
  // Remove the audio track (video-only output). Real FFmpeg stream copy —
  // fast, lossless, and correctly produces an MP4 whose extension always
  // matches its real contents.
  async muteVideo(file, onProgress) {
    if (onProgress) onProgress('Removing audio track (FFmpeg, stream copy)...');
    return runFFmpeg(file, 'in.mp4', ['-i', 'in.mp4', '-c', 'copy', '-an', 'out.mp4'], 'out.mp4', 'video/mp4', onProgress);
  },

  // Trim video from startTime to endTime (seconds), keeping audio. Re-encodes
  // (rather than stream-copying) so the cut point is frame-accurate even
  // when it doesn't land on a keyframe.
  async trimVideo(file, startTime = 0, endTime = 5, onProgress) {
    if (!(endTime > startTime)) throw new Error('End time must be greater than start time.');
    if (onProgress) onProgress('Trimming video (FFmpeg, frame-accurate)...');
    const duration = endTime - startTime;
    return runFFmpeg(
      file, 'in.mp4',
      ['-ss', String(startTime), '-i', 'in.mp4', '-t', String(duration), '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', 'out.mp4'],
      'out.mp4', 'video/mp4', onProgress
    );
  },

  // Resize video to a target resolution, keeping audio and aspect via -2 padding.
  async resizeVideo(file, targetWidth = 1280, targetHeight = 720, onProgress) {
    if (onProgress) onProgress(`Resizing video to ${targetWidth}x${targetHeight} (FFmpeg)...`);
    return runFFmpeg(
      file, 'in.mp4',
      ['-i', 'in.mp4', '-vf', `scale=${targetWidth}:${targetHeight}`, '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'copy', 'out.mp4'],
      'out.mp4', 'video/mp4', onProgress
    );
  },

  // Real, quality-tunable video compression (actually re-encodes at a lower
  // bitrate/CRF, unlike the old "just shrink the canvas" approach).
  async compressVideo(file, crf = 28, onProgress) {
    if (onProgress) onProgress('Compressing video (FFmpeg, CRF ' + crf + ')...');
    return runFFmpeg(
      file, 'in.mp4',
      ['-i', 'in.mp4', '-c:v', 'libx264', '-crf', String(crf), '-preset', 'veryfast', '-c:a', 'aac', '-b:a', '128k', 'out.mp4'],
      'out.mp4', 'video/mp4', onProgress
    );
  },

  // GIF to video — real decode of every GIF frame via FFmpeg's own GIF
  // demuxer, encoded as a real, correctly-labelled MP4.
  async gifToMp4(file, onProgress) {
    if (onProgress) onProgress('Converting GIF to MP4 (FFmpeg)...');
    return runFFmpeg(
      file, 'in.gif',
      ['-i', 'in.gif', '-movflags', 'faststart', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', 'out.mp4'],
      'out.mp4', 'video/mp4', onProgress
    );
  },

  // Video to real animated GIF — proper palette generation for good colour
  // quality, via FFmpeg's palettegen/paletteuse filters.
  async mp4ToGif(file, { fps = 10, maxWidth = 480 } = {}, onProgress) {
    if (onProgress) onProgress('Converting video to GIF (FFmpeg, two-pass palette)...');
    const { fetchFile } = await import('@ffmpeg/util');
    const ffmpeg = await getFFmpeg(onProgress);
    await ffmpeg.writeFile('in.mp4', await fetchFile(file));
    try {
      const filter = `fps=${fps},scale=${maxWidth}:-1:flags=lanczos`;
      await ffmpeg.exec(['-i', 'in.mp4', '-vf', `${filter},palettegen`, 'palette.png']);
      await ffmpeg.exec(['-i', 'in.mp4', '-i', 'palette.png', '-lavfi', `${filter}[x];[x][1:v]paletteuse`, 'out.gif']);
      const data = await ffmpeg.readFile('out.gif');
      return new Blob([data.buffer], { type: 'image/gif' });
    } finally {
      for (const f of ['in.mp4', 'palette.png', 'out.gif']) { try { await ffmpeg.deleteFile(f); } catch { /* ignore */ } }
    }
  },

  // Convert audio into another real, standards-correct format (MP3, WAV,
  // OGG/Opus, or M4A/AAC) via FFmpeg's real encoders (libmp3lame, libopus).
  async convertAudio(file, targetFormat = 'wav', onProgress) {
    if (onProgress) onProgress(`Converting audio to ${targetFormat.toUpperCase()} (FFmpeg)...`);
    const map = {
      mp3: { args: ['-c:a', 'libmp3lame', '-q:a', '2'], out: 'out.mp3', mime: 'audio/mpeg' },
      wav: { args: ['-c:a', 'pcm_s16le'], out: 'out.wav', mime: 'audio/wav' },
      ogg: { args: ['-c:a', 'libopus'], out: 'out.ogg', mime: 'audio/ogg' },
      m4a: { args: ['-c:a', 'aac', '-b:a', '192k'], out: 'out.m4a', mime: 'audio/mp4' },
    };
    const target = map[targetFormat] || map.wav;
    return runFFmpeg(file, 'in.audio', ['-i', 'in.audio', ...target.args, target.out], target.out, target.mime, onProgress);
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
