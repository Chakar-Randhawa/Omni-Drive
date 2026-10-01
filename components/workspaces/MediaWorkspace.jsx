'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ffmpegEngine } from '../../utils/ffmpegEngine';
import { FileDropZone } from '../FileDropZone';
import { Icon } from '../Icons';

export const MediaWorkspace = ({ tool }) => {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [resultBlob, setResultBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  // Settings
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(10);
  const [volumeGain, setVolumeGain] = useState(1.5);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.25);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [mp3Title, setMp3Title] = useState('My Track');
  const [mp3Artist, setMp3Artist] = useState('Studio Producer');
  const [videoResolution, setVideoResolution] = useState('720p');
  const [audioTargetFormat, setAudioTargetFormat] = useState('mp3');
  const [subtitles, setSubtitles] = useState([
    { start: '00:00:01,000', end: '00:00:04,000', text: 'Welcome to OmniDrive Tools.' },
    { start: '00:00:04,500', end: '00:00:08,000', text: '100% Client-Side Processing.' }
  ]);

  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const isRecorder = tool.id === 'av-browser-voice-recorder';
  const isTranscriber = tool.id === 'av-audio-transcriber';
  const isSrtGenerator = tool.id === 'av-srt-subtitle-generator';
  const isMultiFile = tool.id === 'av-audio-merger';

  // Voice recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        setResultBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
    } catch {
      setError('Microphone access was denied or is not supported by your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Transcriber Web Speech API
  const startTranscribing = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Web Speech Recognition is not supported in this browser version. Try Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setTranscript(text);
    };
    recognition.onerror = (e) => setError(`Speech error: ${e.error}`);
    recognition.start();
  };

  const handleFilesSelected = (selected) => {
    setError(null);
    setResultBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);

    if (Array.isArray(selected)) {
      setFiles(selected);
      setFile(selected[0]);
    } else {
      setFile(selected);
      setFiles([selected]);
    }
  };

  const handleExecute = async () => {
    if (!file && !isRecorder && !isTranscriber && !isSrtGenerator && files.length === 0) {
      setError('Please select an audio/video file to process.');
      return;
    }

    setProcessing(true);
    setError(null);
    setProgressMsg('Processing media in browser...');

    try {
      let outputBlob = null;

      switch (tool.id) {
        case 'av-audio-cutter-trimmer':
          outputBlob = await ffmpegEngine.trimAudio(file, trimStart, trimEnd, setProgressMsg);
          break;
        case 'av-video-cutter-trimmer':
          outputBlob = await ffmpegEngine.trimVideo(file, trimStart, trimEnd, setProgressMsg);
          break;
        case 'av-audio-reverse-tool':
          outputBlob = await ffmpegEngine.reverseAudio(file, setProgressMsg);
          break;
        case 'av-audio-volume-booster':
          outputBlob = await ffmpegEngine.boostVolume(file, volumeGain, setProgressMsg);
          break;
        case 'av-playback-speed-changer':
          outputBlob = await ffmpegEngine.changePlaybackSpeed(file, speedMultiplier, setProgressMsg);
          break;
        case 'av-audio-merger':
          outputBlob = await ffmpegEngine.mergeAudio(files, setProgressMsg);
          break;
        case 'av-video-mute-utility':
          outputBlob = await ffmpegEngine.muteVideo(file, setProgressMsg);
          break;
        case 'av-video-to-audio-mp3':
          outputBlob = await ffmpegEngine.videoToAudio(file, setProgressMsg);
          break;
        case 'av-audio-format-converter':
          outputBlob = await ffmpegEngine.convertAudio(file, audioTargetFormat, setProgressMsg);
          break;
        case 'av-video-compressor':
          outputBlob = await ffmpegEngine.compressVideo(file, 28, setProgressMsg);
          break;
        case 'av-video-resizer-dimensions': {
          const [w, h] = videoResolution === '1080p' ? [1920, 1080] : videoResolution === '1:1' ? [720, 720] : [1280, 720];
          outputBlob = await ffmpegEngine.resizeVideo(file, w, h, setProgressMsg);
          break;
        }
        case 'av-mp3-metadata-editor':
          outputBlob = await ffmpegEngine.editMP3Tags(file, { title: mp3Title, artist: mp3Artist, album: 'OmniDrive Media', year: 2026 }, setProgressMsg);
          break;
        case 'av-srt-subtitle-generator': {
          const srtText = ffmpegEngine.generateSRT(subtitles);
          outputBlob = new Blob([srtText], { type: 'text/plain' });
          break;
        }
        default:
          throw new Error(`Unsupported or unhandled media tool operation: ${tool.id}`);
      }

      if (outputBlob) {
        setResultBlob(outputBlob);
        const url = URL.createObjectURL(outputBlob);
        setAudioUrl(url);
      }
    } catch (err) {
      setError(err.message || 'Error occurred during media processing.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    // Extension follows the real container that was produced
    const t = resultBlob.type || '';
    let ext = tool.output;
    if (t.includes('webm')) ext = 'webm';
    else if (t === 'video/mp4') ext = 'mp4';
    else if (t === 'audio/mp4') ext = 'm4a';
    else if (t === 'audio/wav') ext = 'wav';
    else if (t === 'audio/mpeg') ext = 'mp3';
    else if (t === 'audio/ogg') ext = 'ogg';
    else if (t === 'image/gif') ext = 'gif';
    a.download = `omnidrive-${tool.id}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleReset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setFile(null);
    setFiles([]);
    setResultBlob(null);
    setAudioUrl(null);
    setError(null);
    setProgressMsg('');
    setTranscript('');
  };

  return (
    <div className="space-y-6">
      {/* Microphone Voice Recorder */}
      {isRecorder ? (
        <div className="p-8 rounded-2xl bg-[#F7F8FC] border border-[#EEF0F4] text-center space-y-4">
          <div className="text-3xl font-mono font-extrabold text-[#111827]">
            {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:{(recordingSeconds % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="px-6 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-sm cursor-pointer shadow-xs flex items-center gap-2"
              >
                <span className="w-3 h-3 rounded-full bg-white animate-ping"></span>
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="px-6 py-2.5 rounded-xl bg-[#111827] text-white font-bold text-sm cursor-pointer shadow-xs"
              >
                Stop & Save Audio
              </button>
            )}
          </div>
        </div>
      ) : isTranscriber ? (
        <div className="p-6 rounded-2xl bg-[#F7F8FC] border border-[#EEF0F4] space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827]">Speech Recognition Engine</h4>
            <button
              type="button"
              onClick={startTranscribing}
              className="px-4 py-2 bg-[#5B5BD6] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Start Listening
            </button>
          </div>
          <textarea
            readOnly
            rows={5}
            value={transcript || 'Click "Start Listening" and begin speaking into your microphone...'}
            className="w-full p-4 bg-white border border-[#E5E7EB] rounded-xl text-sm"
          />
          {transcript && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard && navigator.clipboard.writeText(transcript)}
                className="px-4 py-2 bg-white border border-[#E5E7EB] text-[#111827] rounded-xl text-xs font-bold cursor-pointer"
              >
                Copy Transcript
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = URL.createObjectURL(new Blob([transcript], { type: 'text/plain;charset=utf-8' }));
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'omnidrive-transcript.txt';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
                className="px-4 py-2 bg-[#111827] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Download .txt
              </button>
            </div>
          )}
        </div>
      ) : isSrtGenerator ? (
        <div className="p-6 rounded-2xl bg-[#F7F8FC] border border-[#EEF0F4] space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827]">Subtitles Timeline</h4>
          <div className="space-y-3">
            {subtitles.map((sub, idx) => (
              <div key={idx} className="p-3 bg-white border border-[#E5E7EB] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <input
                  type="text"
                  value={sub.start}
                  onChange={(e) => {
                    const next = [...subtitles];
                    next[idx].start = e.target.value;
                    setSubtitles(next);
                  }}
                  className="p-1 border border-[#E5E7EB] rounded font-mono"
                />
                <input
                  type="text"
                  value={sub.end}
                  onChange={(e) => {
                    const next = [...subtitles];
                    next[idx].end = e.target.value;
                    setSubtitles(next);
                  }}
                  className="p-1 border border-[#E5E7EB] rounded font-mono"
                />
                <input
                  type="text"
                  value={sub.text}
                  onChange={(e) => {
                    const next = [...subtitles];
                    next[idx].text = e.target.value;
                    setSubtitles(next);
                  }}
                  className="p-1 border border-[#E5E7EB] rounded font-medium"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleExecute}
            className="px-5 py-2.5 bg-[#5B5BD6] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Generate SRT File
          </button>
        </div>
      ) : (
        <FileDropZone
          selectedFiles={isMultiFile ? files : file}
          onFilesSelected={handleFilesSelected}
          onClear={handleReset}
          disabled={processing}
          accept={tool.input}
          multiple={isMultiFile}
          label={isMultiFile ? 'Choose multiple audio tracks or drag & drop here' : 'Choose an audio or video file'}
        />
      )}

      {/* Tool-specific Controls */}
      <div className="space-y-4">
        {tool.id === 'av-audio-format-converter' && (
          <div className="p-6 bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl">
            <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Output Format</label>
            <select
              value={audioTargetFormat}
              onChange={(e) => setAudioTargetFormat(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm"
            >
              <option value="mp3">MP3 (most compatible)</option>
              <option value="wav">WAV (lossless)</option>
              <option value="ogg">OGG / Opus</option>
              <option value="m4a">M4A / AAC</option>
            </select>
          </div>
        )}
        {(tool.id === 'av-audio-cutter-trimmer' || tool.id === 'av-video-cutter-trimmer') && (
          <div className="p-6 bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Start Time (seconds)</label>
              <input
                type="number"
                value={trimStart}
                onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#111827] mb-1">End Time (seconds)</label>
              <input
                type="number"
                value={trimEnd}
                onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm"
              />
            </div>
          </div>
        )}

        {tool.id === 'av-audio-volume-booster' && (
          <div className="p-6 bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl">
            <label className="block text-xs font-bold uppercase text-[#111827] mb-2">Volume Gain: {Math.round(volumeGain * 100)}%</label>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={volumeGain}
              onChange={(e) => setVolumeGain(parseFloat(e.target.value))}
              className="w-full accent-[#5B5BD6]"
            />
          </div>
        )}

        {tool.id === 'av-playback-speed-changer' && (
          <div className="p-6 bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl">
            <label className="block text-xs font-bold uppercase text-[#111827] mb-3">Playback Rate</label>
            <div className="flex gap-2">
              {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeedMultiplier(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    speedMultiplier === s ? 'bg-[#5B5BD6] text-white shadow-xs' : 'bg-white border border-[#E5E7EB] text-[#4B5563]'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        )}

        {tool.id === 'av-video-resizer-dimensions' && (
          <div className="p-6 bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl">
            <label className="block text-xs font-bold uppercase text-[#111827] mb-3">Target Dimension</label>
            <div className="flex gap-2">
              {['720p', '1080p', '1:1'].map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setVideoResolution(res)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    videoResolution === res ? 'bg-[#5B5BD6] text-white shadow-xs' : 'bg-white border border-[#E5E7EB] text-[#4B5563]'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>
        )}

        {tool.id === 'av-mp3-metadata-editor' && (
          <div className="p-6 bg-[#F7F8FC] border border-[#EEF0F4] rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Track Title</label>
              <input
                type="text"
                value={mp3Title}
                onChange={(e) => setMp3Title(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#111827] mb-1">Artist Name</label>
              <input
                type="text"
                value={mp3Artist}
                onChange={(e) => setMp3Artist(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Process Button */}
      {(file || files.length > 0) && !resultBlob && !isRecorder && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleExecute}
            disabled={processing}
            className="px-6 py-3 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-semibold text-sm cursor-pointer shadow-xs disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {processing && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            )}
            <span>{processing ? 'Processing Audio/Video...' : `Execute ${tool.name}`}</span>
          </button>
        </div>
      )}

      {/* Progress */}
      {processing && (
        <div className="p-4 rounded-xl bg-[#F7F8FC] border border-[#EEF0F4] text-xs font-medium text-[#4B5563] flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse"></span>
          <span>{progressMsg}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#B91C1C] text-sm flex items-center gap-2">
          <Icon name="x" className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card & Audio Player */}
      {resultBlob && (
        <div className="p-6 rounded-2xl bg-white border-2 border-[#D97706]/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Processing Ready</h4>
                <p className="text-xs text-[#6B7280]">
                  Size: {(resultBlob.size / 1024).toFixed(1)} KB
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
                className="px-5 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Icon name="download" className="w-4 h-4" />
                <span>Download Result</span>
              </button>
            </div>
          </div>

          {audioUrl && tool.output !== 'mp4' && (
            <div className="pt-2">
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default MediaWorkspace;
