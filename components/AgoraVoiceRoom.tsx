'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  Bot,
  AlertCircle,
  CheckCircle2,
  PhoneOff,
  Sparkles,
} from 'lucide-react';

interface AgoraVoiceRoomProps {
  channelName: string;
  incidentId: string;
  onTranscriptTurn: (text: string, speaker: string, isAi?: boolean) => void;
  onConnectionChange?: (connected: boolean) => void;
  onAgentStateChange?: (state: 'idle' | 'listening' | 'speaking' | 'joined') => void;
}

export default function AgoraVoiceRoom({
  channelName,
  incidentId,
  onTranscriptTurn,
  onConnectionChange,
  onAgentStateChange,
}: AgoraVoiceRoomProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'listening' | 'speaking' | 'joined'>('idle');
  const [micVolume, setMicVolume] = useState(0);
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);

  // Agora client and track refs
  const rtcClientRef = useRef<any>(null);
  const localAudioTrackRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const isLiveRef = useRef<boolean>(false);

  // Audio level visualizer analyzer
  const setupAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!isLiveRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
        requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err: any) {
      console.warn('Audio visualizer init error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone access was denied. Please allow microphone permissions in your browser.');
      }
    }
  };

  // Browser speech recognition fallback for seamless real-time mic turns
  const setupSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (interimTranscript) {
          setCurrentTurn(interimTranscript);
        }

        if (finalTranscript.trim()) {
          setCurrentTurn(null);
          onTranscriptTurn(finalTranscript.trim(), 'Incident Responder', false);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition status:', e.error);
        if (e.error === 'not-allowed') {
          setErrorMsg('Microphone permission denied. Click the lock icon in your browser URL bar to allow microphone.');
        }
      };

      recognition.onend = () => {
        if (isLiveRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            // Already started or busy
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Speech recognition init note:', err);
    }
  };

  // Initialize and Join Channel
  const handleJoin = useCallback(async () => {
    setConnecting(true);
    setErrorMsg(null);
    isLiveRef.current = true;
    setIsJoined(true);
    onConnectionChange?.(true);

    // 1. Immediately request microphone access and start audio visualizer
    await setupAudioVisualizer();

    // 2. Set up speech recognition
    setupSpeechRecognition();

    try {
      // 3. Fetch Agora token from our API route
      const tokenRes = await fetch(
        `/api/generate-agora-token?channel=${encodeURIComponent(channelName)}&incidentId=${encodeURIComponent(incidentId)}`,
      );

      const tokenData = await tokenRes.json();

      if (tokenData.demo_mode) {
        setAgentStatus('listening');
        onAgentStateChange?.('listening');
        return;
      }

      if (!tokenRes.ok || !tokenData.token) {
        throw new Error(tokenData.error || 'Failed to obtain Agora token.');
      }

      // 4. Dynamically import Agora RTC SDK in browser
      const { default: AgoraRTC } = await import('agora-rtc-sdk-ng');

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      rtcClientRef.current = client;

      // Remote user published listener
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack?.play();
          setAgentStatus('speaking');
          onAgentStateChange?.('speaking');
        }
      });

      client.on('user-unpublished', () => {
        setAgentStatus('listening');
        onAgentStateChange?.('listening');
      });

      // Join RTC channel
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';
      await client.join(appId, channelName, tokenData.token, parseInt(tokenData.uid, 10));

      // Create local microphone track
      try {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = audioTrack;
        await client.publish([audioTrack]);
      } catch (micErr) {
        console.warn('Could not publish mic audio track:', micErr);
      }

      setAgentStatus('joined');
      onAgentStateChange?.('joined');

      // Invite Agora Cloud AI Voice Agent
      fetch('/api/invite-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_id: tokenData.uid,
          channel_name: channelName,
        }),
      })
        .then((res) => {
          if (res.ok) {
            setAgentStatus('listening');
            onAgentStateChange?.('listening');
          }
        })
        .catch((err) => {
          console.warn('Agora agent invite note:', err);
        });
    } catch (err: any) {
      console.error('Agora join error:', err);
      // Fallback is already active via setupAudioVisualizer and setupSpeechRecognition
    } finally {
      setConnecting(false);
    }
  }, [channelName, incidentId, onConnectionChange, onAgentStateChange]);

  // Leave Channel
  const handleLeave = async () => {
    isLiveRef.current = false;
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
      }
      if (rtcClientRef.current) {
        await rtcClientRef.current.leave();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    } catch (e) {
      console.warn('Leave error:', e);
    } finally {
      setIsJoined(false);
      setIsMuted(false);
      setAgentStatus('idle');
      onConnectionChange?.(false);
      onAgentStateChange?.('idle');
    }
  };

  // Toggle Mute
  const toggleMute = async () => {
    if (localAudioTrackRef.current) {
      const nextMute = !isMuted;
      await localAudioTrackRef.current.setEnabled(!nextMute);
      setIsMuted(nextMute);
    } else {
      setIsMuted(!isMuted);
    }
  };

  // Auto connect when component mounts
  useEffect(() => {
    handleJoin();
    return () => {
      handleLeave();
    };
  }, []);

  return (
    <div className="bg-[#0d1117] border border-indigo-500/30 rounded-xl p-4 shadow-inner">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-3">
          {/* RTC Channel Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs">
            <Radio className={`w-3.5 h-3.5 ${isJoined ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
            <span className="text-zinc-400">Channel:</span>
            <strong className="text-white font-mono">{channelName}</strong>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>

          {/* AI Voice Agent Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs">
            <Bot className={`w-3.5 h-3.5 ${agentStatus !== 'idle' ? 'text-indigo-400' : 'text-zinc-500'}`} />
            <span className="text-zinc-400">AI Voice Agent:</span>
            <span
              className={`font-semibold ${
                agentStatus === 'speaking'
                  ? 'text-purple-400 animate-pulse'
                  : agentStatus === 'listening'
                  ? 'text-emerald-400'
                  : 'text-zinc-300'
              }`}
            >
              {agentStatus === 'speaking' ? '🗣️ Sentinel Speaking' : agentStatus === 'listening' ? '🎙️ Sentinel Listening' : 'Active'}
            </span>
          </div>

          {/* Audio Visualizer Level Bar */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs">
            <Volume2 className={`w-3.5 h-3.5 ${micVolume > 10 ? 'text-indigo-400' : 'text-zinc-500'}`} />
            <div className="flex items-end gap-0.5 h-4 w-16">
              {[15, 30, 45, 60, 80, 100].map((threshold, i) => (
                <div
                  key={i}
                  className={`w-2 rounded-t transition-all ${
                    micVolume >= threshold
                      ? 'bg-gradient-to-t from-indigo-500 to-purple-400'
                      : 'bg-zinc-800'
                  }`}
                  style={{ height: `${(i + 1) * 16}%` }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-zinc-400 ml-1">{micVolume}%</span>
          </div>
        </div>

        {/* Live Mic Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isMuted
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-[#21262d] text-zinc-200 border border-[#30363d] hover:bg-[#30363d]'
            }`}
          >
            {isMuted ? (
              <>
                <MicOff className="w-3.5 h-3.5 text-red-400" /> Unmute Mic
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-400" /> Mic Active
              </>
            )}
          </button>

          <button
            onClick={() => {
              onTranscriptTurn(
                "Payment API latency has spiked to 8400ms across US-East checkout pods. Connection pool is saturated.",
                "Incident Responder",
                false
              );
            }}
            title="Simulate a spoken voice statement into the incident room"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> Speak Test Phrase
          </button>

          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600/80 hover:bg-red-600 text-white transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" /> Disconnect
          </button>
        </div>
      </div>

      {/* In-progress speaking turn preview */}
      {currentTurn && (
        <div className="mt-3 pt-2 border-t border-[#21262d] text-xs text-indigo-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          <span className="font-semibold text-zinc-400">Hearing:</span>
          <span className="italic">&ldquo;{currentTurn}&rdquo;</span>
        </div>
      )}

      {/* Configuration Advisory Notice if Agora credentials are missing */}
      {errorMsg && (
        <div className="mt-3 p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-amber-300 font-semibold">Live Agora Connection Notice:</strong>
            <p>{errorMsg}</p>
            <p className="text-[11px] text-zinc-400 mt-1">
              Local speech capture and the deterministic incident simulator remain fully active and will feed the Truth Engine.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
