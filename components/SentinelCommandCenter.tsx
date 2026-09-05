'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Shield,
  Radio,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Zap,
  Users,
  Bot,
  Activity,
  ChevronRight,
  Mic,
  MicOff,
  Volume2,
  RefreshCw,
  Download,
  Sparkles,
  Layers,
  ArrowUpRight,
  Check,
  X,
  FileText,
  AlertCircle,
  Server,
  Database,
  Send,
  HelpCircle,
  Pause,
} from 'lucide-react';
import type {
  IncidentState,
  Fact,
  Hypothesis,
  Action,
  Conflict,
  InformationGap,
  TimelineEvent,
  TranscriptEvent,
} from '@/lib/truth-engine/types';

// Dynamically import Agora voice call component with SSR disabled
const AgoraVoiceRoom = dynamic(() => import('./AgoraVoiceRoom'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-6 text-sm text-muted-foreground animate-pulse">
      <Radio className="w-4 h-4 mr-2 animate-spin" /> Loading Agora Voice Bridge...
    </div>
  ),
});

interface TranscriptMessage {
  id: string;
  speaker: string;
  role: string;
  text: string;
  time: string;
  isAi?: boolean;
}

export default function SentinelCommandCenter() {
  // Incident State
  const [incidentState, setIncidentState] = useState<IncidentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Voice & Agora Room State
  const [isVoiceRoomOpen, setIsVoiceRoomOpen] = useState(false);
  const [agoraConnected, setAgoraConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'listening' | 'speaking' | 'joined'>('idle');

  // Transcripts Stream
  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([
    {
      id: 'init-t1',
      speaker: 'Telemetry Alert',
      role: 'Monitoring System',
      text: 'Payment API P99 latency exceeded 8400ms. Error rates elevated on /v2/checkout.',
      time: '18:32:04',
      isAi: false,
    },
    {
      id: 'init-t2',
      speaker: 'Priya Sharma',
      role: 'Incident Commander',
      text: 'Payment failures are spiking across US-East checkout flows. Assembling incident bridge now.',
      time: '18:32:30',
      isAi: false,
    },
    {
      id: 'init-t3',
      speaker: 'Sentinel',
      role: 'AI Incident Commander',
      text: 'I have joined the incident room. Monitoring conversation, tracking hypotheses, and correlating telemetry.',
      time: '18:32:45',
      isAi: true,
    },
  ]);

  // Simulation State
  const [simRunning, setSimRunning] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simPaused, setSimPaused] = useState(false);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Manual input state
  const [manualText, setManualText] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<'Priya Sharma' | 'Rahul Mehta' | 'Sentinel'>('Priya Sharma');
  const [isRecording, setIsRecording] = useState(false);
  const inlineRecognitionRef = useRef<any>(null);

  // Metrics
  const [systemHealth, setSystemHealth] = useState(96.4);
  const [decisionPending, setDecisionPending] = useState(false);

  // Fetch live incident state
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/incidents/INC-2048/state');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: IncidentState = await res.json();
      setIncidentState(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch incident state:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3500);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Send a transcript event into Sentinel's TruthEngine
  const sendEvent = async (text: string, speakerName: string, speakerRole: string) => {
    const isAi = speakerName.toLowerCase().includes('sentinel');
    const newMsg: TranscriptMessage = {
      id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      speaker: speakerName,
      role: speakerRole,
      text,
      time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()),
      isAi,
    };

    setTranscripts((prev) => [...prev, newMsg]);

    try {
      const res = await fetch('/api/v1/incidents/INC-2048/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: `evt_${Date.now()}`,
          incident_id: 'INC-2048',
          timestamp: new Date().toISOString(),
          speaker: {
            id: speakerName.toLowerCase().replace(/\s+/g, '-'),
            name: speakerName,
            role: speakerRole,
          },
          text,
          is_final: true,
          source: 'agora',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.incident_state) {
          setIncidentState(data.incident_state);
        }
      }
    } catch (error) {
      console.error('Failed to send transcript event:', error);
    }
  };

  // Human-in-the-loop approval action
  const handleApprovalDecision = async (actionId: string, decision: 'APPROVED' | 'REJECTED') => {
    setDecisionPending(true);
    try {
      const res = await fetch('/api/v1/incidents/INC-2048/approvals/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: 'INC-2048',
          action_id: actionId,
          decision,
          decided_by: 'Priya Sharma (Incident Commander)',
          comment: decision === 'APPROVED' ? 'Approved for emergency mitigation.' : 'Rejected by IC.',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.incident_state) {
          setIncidentState(data.incident_state);
        }
        if (decision === 'APPROVED') {
          setSystemHealth(99.4);
        }
      }
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setDecisionPending(false);
    }
  };

  // Reset demo
  const handleReset = async () => {
    if (simTimerRef.current) clearTimeout(simTimerRef.current);
    setSimRunning(false);
    setSimStep(0);
    setSystemHealth(96.4);

    try {
      const res = await fetch('/api/v1/incidents/INC-2048/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIncidentState(data.incident_state);
      }
    } catch (err) {
      console.error('Reset failed:', err);
    }

    setTranscripts([
      {
        id: 'init-t1',
        speaker: 'Telemetry Alert',
        role: 'Monitoring System',
        text: 'Payment API P99 latency exceeded 8400ms. Error rates elevated on /v2/checkout.',
        time: '18:32:04',
        isAi: false,
      },
      {
        id: 'init-t2',
        speaker: 'Priya Sharma',
        role: 'Incident Commander',
        text: 'Payment failures are spiking across US-East checkout flows. Assembling incident bridge now.',
        time: '18:32:30',
        isAi: false,
      },
      {
        id: 'init-t3',
        speaker: 'Sentinel',
        role: 'AI Incident Commander',
        text: 'I have joined the incident room. Monitoring conversation, tracking hypotheses, and correlating telemetry.',
        time: '18:32:45',
        isAi: true,
      },
    ]);
  };

  // Deterministic live incident simulation steps
  const simulationSteps = [
    {
      step: 1,
      speaker: 'Rahul Mehta',
      role: 'DevOps Engineer',
      text: 'Checking the infrastructure. Database CPU is at 24%, so database health looks completely normal.',
      delay: 2400,
    },
    {
      step: 2,
      speaker: 'Priya Sharma',
      role: 'Incident Commander',
      text: 'Wait, checkout logs show connection pool timeouts. Could the recent payment-service deployment v4.8.2 be causing the leak?',
      delay: 2800,
    },
    {
      step: 3,
      speaker: 'Sentinel',
      role: 'AI Incident Commander',
      text: '⚠️ Discrepancy detected: Rahul reported database infrastructure is normal, but connection pool exhaustion correlates with deployment v4.8.2 onset. Recommending immediate rollback of payment-service to v4.8.1.',
      delay: 3200,
    },
    {
      step: 4,
      speaker: 'Rahul Mehta',
      role: 'DevOps Engineer',
      text: 'Confirmed. Connection leak identified in v4.8.2. Rollback is prepared, but requires Incident Commander approval.',
      delay: 2800,
    },
    {
      step: 5,
      speaker: 'Sentinel',
      role: 'AI Incident Commander',
      text: 'Critical Action Pending: Rollback payment-service v4.8.2. Awaiting human authorization.',
      delay: 3000,
    },
    {
      step: 6,
      speaker: 'Priya Sharma',
      role: 'Incident Commander',
      text: 'Rollback approved. Executing rollback to v4.8.1 now.',
      delay: 3500,
    },
    {
      step: 7,
      speaker: 'Rahul Mehta',
      role: 'DevOps Engineer',
      text: 'Rollback complete. Pods restarted. Error rates dropped to zero and latency normalized.',
      delay: 3200,
    },
    {
      step: 8,
      speaker: 'Sentinel',
      role: 'AI Incident Commander',
      text: 'Incident Mitigated. All telemetry verifies recovery. Final incident postmortem summary generated.',
      delay: 2500,
    },
  ];

  const runSimulation = () => {
    if (simRunning) return;
    setSimRunning(true);
    setSimStep(0);

    const executeStep = (index: number) => {
      if (index >= simulationSteps.length) {
        setSimRunning(false);
        setSimStep(simulationSteps.length);
        return;
      }

      const item = simulationSteps[index];
      setSimStep(index + 1);

      sendEvent(item.text, item.speaker, item.role);

      if (index === 4) {
        // Auto trigger health improvement on rollback step
        setSystemHealth(97.8);
      } else if (index === 6) {
        setSystemHealth(99.6);
      }

      simTimerRef.current = setTimeout(() => {
        executeStep(index + 1);
      }, item.delay);
    };

    executeStep(0);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    let role = 'Incident Commander';
    if (selectedSpeaker === 'Rahul Mehta') role = 'DevOps Engineer';
    if (selectedSpeaker === 'Sentinel') role = 'AI Incident Commander';

    sendEvent(manualText, selectedSpeaker, role);
    setManualText('');
  };

  // Inline microphone voice recording toggle (Speech-to-Text)
  const toggleInlineRecording = () => {
    if (isRecording) {
      if (inlineRecognitionRef.current) {
        try {
          inlineRecognitionRef.current.stop();
        } catch (e) {
          console.warn('Recognition stop error:', e);
        }
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Your browser does not support Web Speech API. Please use Chrome, Edge, or join the Agora Incident Room at the top.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setManualText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Inline recording status:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      inlineRecognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  const facts = incidentState?.facts || [];
  const hypotheses = incidentState?.hypotheses || [];
  const conflicts = incidentState?.conflicts || [];
  const unknowns = incidentState?.unknowns || [];
  const actions = incidentState?.actions || [];
  const approvals = incidentState?.approvals || [];
  const timeline = incidentState?.timeline || [];

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');

  // Export Postmortem markdown
  const exportPostmortem = () => {
    const content = `# Incident Postmortem: ${incidentState?.incident_id || 'INC-2048'}
**Title**: ${incidentState?.title || 'Payment Service Degradation'}
**Severity**: ${incidentState?.severity || 'SEV-1'}
**Status**: ${incidentState?.status || 'INVESTIGATING'}
**Generated By**: Sentinel AI Incident Commander
**Date**: ${new Date().toISOString()}

---

## 1. Confirmed Facts (${facts.length})
${facts.map((f, i) => `${i + 1}. **${f.statement}** (Status: ${f.status}, Source: ${f.source.speaker_name})`).join('\n')}

## 2. Hypotheses Tracked (${hypotheses.length})
${hypotheses.map((h, i) => `${i + 1}. **${h.statement}** (Status: ${h.status}, Confidence: ${Math.round((h.confidence || 0.8) * 100)}%)`).join('\n')}

## 3. Discrepancies & Conflicts Surfaced (${conflicts.length})
${conflicts.map((c, i) => `${i + 1}. **${c.description}**`).join('\n') || 'None recorded.'}

## 4. Remediation Actions (${actions.length})
${actions.map((a, i) => `${i + 1}. **${a.title}** - Owner: ${a.owner?.name || 'Unassigned'} | Approval Required: ${a.requires_human_approval ? 'Yes' : 'No'} | Status: ${a.status}`).join('\n')}

## 5. Incident Timeline (${timeline.length} Events)
${timeline.map((t) => `- **${t.timestamp}** [${t.event_type}]: ${t.description}`).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentinel-postmortem-${incidentState?.incident_id || 'INC-2048'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans antialiased selection:bg-indigo-500/30">
      {/* =========================================================================
          TOP COMMAND BAR & INCIDENT HEADER
      ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#161b22]/95 backdrop-blur border-b border-[#30363d] px-4 py-3 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand & Incident Meta */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white font-bold">
              <Shield className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">SENTINEL</h1>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  SEV-1 CRITICAL
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE OPERATIONAL
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                <span className="font-semibold text-zinc-200">INC-2048</span> • Payment API Degradation & Latency Spike • US-East Cluster
              </p>
            </div>
          </div>

          {/* Primary Operations Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Agora Voice Bridge Toggle */}
            <button
              onClick={() => setIsVoiceRoomOpen(!isVoiceRoomOpen)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                isVoiceRoomOpen
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20 hover:shadow-indigo-500/40'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${isVoiceRoomOpen ? 'animate-pulse text-red-400' : ''}`} />
              {isVoiceRoomOpen ? 'Exit Voice Room' : '🎙️ Join Agora Incident Room'}
            </button>

            {/* Live Simulation / Demo Mode */}
            <button
              onClick={runSimulation}
              disabled={simRunning}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                simRunning
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-[#21262d] text-zinc-200 border-[#30363d] hover:bg-[#30363d] hover:text-white'
              }`}
            >
              {simRunning ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  Step {simStep}/8 Running...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-indigo-400" />
                  ⚡ Simulate Incident (Demo)
                </>
              )}
            </button>

            {/* Reset Demo */}
            <button
              onClick={handleReset}
              title="Reset state to initial scenario"
              className="p-1.5 rounded-lg bg-[#21262d] text-zinc-400 hover:text-zinc-200 border border-[#30363d] hover:bg-[#30363d] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Export Postmortem */}
            <button
              onClick={exportPostmortem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#21262d] text-zinc-300 border border-[#30363d] hover:bg-[#30363d] hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Postmortem
            </button>
          </div>
        </div>

        {/* Live Operational Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 mt-3 border-t border-[#21262d] text-xs">
          <div className="flex items-center gap-2 bg-[#0d1117] px-3 py-1.5 rounded-md border border-[#21262d]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Confirmed Facts</span>
              <strong className="text-white text-sm font-bold">{facts.length}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#0d1117] px-3 py-1.5 rounded-md border border-[#21262d]">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Active Hypotheses</span>
              <strong className="text-white text-sm font-bold">{hypotheses.length}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#0d1117] px-3 py-1.5 rounded-md border border-[#21262d]">
            <AlertTriangle className={`w-4 h-4 shrink-0 ${conflicts.length > 0 ? 'text-amber-400 animate-bounce' : 'text-zinc-500'}`} />
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Surfaced Conflicts</span>
              <strong className={`text-sm font-bold ${conflicts.length > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                {conflicts.length}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#0d1117] px-3 py-1.5 rounded-md border border-[#21262d]">
            <Clock3 className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Pending Approvals</span>
              <strong className={`text-sm font-bold ${pendingApprovals.length > 0 ? 'text-red-400 animate-pulse' : 'text-zinc-400'}`}>
                {pendingApprovals.length}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#0d1117] px-3 py-1.5 rounded-md border border-[#21262d] col-span-2 sm:col-span-1">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">System Health</span>
              <strong className="text-white text-sm font-bold">{systemHealth.toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          EMBEDDED AGORA VOICE BRIDGE PANEL (WHEN ACTIVE)
      ========================================================================= */}
      {isVoiceRoomOpen && (
        <div className="border-b border-[#30363d] bg-[#161b22] px-4 py-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  Agora RTC Live Voice Incident Room
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                    Channel: ai-incident-2048
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setIsVoiceRoomOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Minimize
              </button>
            </div>

            <AgoraVoiceRoom
              channelName="ai-incident-2048"
              incidentId="INC-2048"
              onTranscriptTurn={(text, speaker, isAi) => {
                sendEvent(text, speaker, isAi ? 'ai_agent' : 'incident_responder');
              }}
              onConnectionChange={(connected) => setAgoraConnected(connected)}
              onAgentStateChange={(state) => setAgentStatus(state)}
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          THREE-COLUMN COMMAND CONSOLE
      ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =====================================================================
            LEFT COLUMN (4 Cols): Live Conversation & Voice Stream
        ===================================================================== */}
        <section className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col h-[680px] overflow-hidden shadow-md">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#30363d] bg-[#1c2128] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Live Voice & Transcripts
                </h2>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Agora STT
              </span>
            </div>

            {/* Transcript stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800">
              {transcripts.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col p-3 rounded-lg border text-xs leading-relaxed transition-all ${
                    item.isAi
                      ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-100 shadow-sm'
                      : item.speaker.includes('Priya')
                      ? 'bg-purple-950/20 border-purple-500/30 text-purple-100'
                      : 'bg-[#21262d]/70 border-[#30363d] text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {item.isAi ? (
                        <Bot className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                      <strong className="font-semibold text-white">{item.speaker}</strong>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-400 font-mono">
                        {item.role}
                      </span>
                    </div>
                    <time className="text-[10px] text-zinc-500 font-mono">{item.time}</time>
                  </div>
                  <p className="whitespace-pre-wrap">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Manual test speech input & voice recorder */}
            <form onSubmit={handleManualSubmit} className="p-3 bg-[#1c2128] border-t border-[#30363d]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-400">Speak as:</label>
                  <select
                    value={selectedSpeaker}
                    onChange={(e) => setSelectedSpeaker(e.target.value as any)}
                    className="text-xs bg-[#0d1117] border border-[#30363d] rounded px-2 py-0.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Priya Sharma">Priya Sharma (Incident Commander)</option>
                    <option value="Rahul Mehta">Rahul Mehta (DevOps)</option>
                    <option value="Sentinel">Sentinel (AI Incident Commander)</option>
                  </select>
                </div>

                {isRecording && (
                  <span className="flex items-center gap-1.5 text-[11px] text-red-400 font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    Recording Voice...
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder={
                    isRecording
                      ? '🎙️ Listening... speak clearly into your mic'
                      : 'Type or click Record to speak into bridge...'
                  }
                  className={`flex-1 text-xs bg-[#0d1117] border rounded-lg px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors ${
                    isRecording
                      ? 'border-red-500/60 ring-1 ring-red-500/30'
                      : 'border-[#30363d] focus:border-indigo-500'
                  }`}
                />

                {/* Direct Voice Recording Button */}
                <button
                  type="button"
                  onClick={toggleInlineRecording}
                  title={isRecording ? 'Stop voice recording' : 'Click to record voice with microphone'}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                      : 'bg-[#21262d] hover:bg-[#30363d] text-zinc-200 border border-[#30363d] hover:text-white'
                  }`}
                >
                  <Mic className={`w-3.5 h-3.5 ${isRecording ? 'text-white' : 'text-indigo-400'}`} />
                  <span className="hidden sm:inline">{isRecording ? 'Stop' : 'Record'}</span>
                </button>

                <button
                  type="submit"
                  disabled={!manualText.trim()}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold flex items-center justify-center transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* =====================================================================
            CENTER COLUMN (5 Cols): Structured Incident Intelligence (Truth Engine)
        ===================================================================== */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          {/* Confirmed Facts Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Confirmed Facts
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {facts.length} Verified
              </span>
            </div>

            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {facts.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No confirmed facts extracted yet.</p>
              ) : (
                facts.map((fact) => (
                  <div key={fact.id} className="p-2.5 rounded-lg bg-[#0d1117] border border-emerald-500/20 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-zinc-100">{fact.statement}</p>
                        {fact.evidence?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {fact.evidence.map((ev, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 font-mono">
                                ↳ {ev}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Hypotheses Card */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Hypotheses & Root Cause Candidates
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {hypotheses.length} Active
              </span>
            </div>

            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {hypotheses.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No hypotheses formed yet.</p>
              ) : (
                hypotheses.map((h) => (
                  <div key={h.id} className="p-2.5 rounded-lg bg-[#0d1117] border border-indigo-500/20 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-zinc-100">{h.statement}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 bg-indigo-500/20 text-indigo-300">
                        {Math.round((h.confidence || 0.85) * 100)}% Conf
                      </span>
                    </div>
                    {h.required_evidence?.length > 0 && (
                      <p className="text-[10px] text-zinc-400 mt-1">
                        <span className="text-zinc-500 font-semibold">Verification Needed:</span> {h.required_evidence.join(', ')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Surfaced Conflicts & Discrepancies (CRITICAL) */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Detected Discrepancies & Conflicts
                </h3>
              </div>
              {conflicts.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  ⚠️ Action Required
                </span>
              )}
            </div>

            <div className="space-y-2">
              {conflicts.length === 0 ? (
                <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] text-xs text-zinc-400 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  No contradictory statements detected across responders.
                </div>
              ) : (
                conflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/40 text-xs text-amber-200"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <strong className="block font-semibold text-amber-300 mb-0.5">
                          Contradiction Surfaced by TruthEngine:
                        </strong>
                        <p className="text-amber-100">{conflict.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Items & Human-in-the-Loop Approvals (CRITICAL) */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Remediation Actions & Human Approval
                </h3>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {actions.length} Tasks
              </span>
            </div>

            <div className="space-y-3">
              {actions.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No actions identified yet.</p>
              ) : (
                actions.map((action) => {
                  const isApprovalNeeded = action.requires_human_approval && action.status === 'PENDING';
                  const isApproved = action.status === 'APPROVED';

                  return (
                    <div
                      key={action.id}
                      className={`p-3 rounded-lg border transition-all text-xs ${
                        isApprovalNeeded
                          ? 'bg-red-950/20 border-red-500/40 shadow-sm'
                          : isApproved
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-[#0d1117] border-[#30363d]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-semibold text-zinc-100 text-sm block">
                            {action.title}
                          </span>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                            <span>Owner: <strong className="text-zinc-200">{action.owner?.name || 'Unassigned'}</strong></span>
                            <span>•</span>
                            <span className={`font-mono font-bold ${action.priority === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`}>
                              {action.priority} Priority
                            </span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase font-mono ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isApprovalNeeded
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {action.status}
                        </span>
                      </div>

                      {/* Human-in-the-loop Approval Interaction Bar */}
                      {isApprovalNeeded && (
                        <div className="mt-3 pt-2.5 border-t border-red-500/30 flex items-center justify-between gap-3">
                          <span className="text-red-300 text-[11px] font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            Production Impact: Human IC Authorization Required
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprovalDecision(action.id, 'APPROVED')}
                              disabled={decisionPending}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                            >
                              <Check className="w-3 h-3" /> Approve Rollback
                            </button>
                            <button
                              onClick={() => handleApprovalDecision(action.id, 'REJECTED')}
                              disabled={decisionPending}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-medium transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {isApproved && (
                        <div className="mt-2 text-emerald-400 text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved by Incident Commander. Rollback in execution.
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* =====================================================================
            RIGHT COLUMN (3 Cols): Incident Timeline & State Intelligence
        ===================================================================== */}
        <section className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col h-[680px] overflow-hidden shadow-md">
            <div className="px-4 py-3 border-b border-[#30363d] bg-[#1c2128] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-purple-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Incident Timeline
                </h2>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                v{incidentState?.version || 1}
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-zinc-800">
              {timeline.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No timeline events recorded.</p>
              ) : (
                timeline.map((event, idx) => (
                  <div key={event.id || idx} className="relative pl-4 border-l-2 border-indigo-500/30 pb-2 text-xs">
                    <span className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-indigo-400 ring-4 ring-[#161b22]" />
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-1">
                      <span className="font-bold text-indigo-300">{event.event_type}</span>
                      <span>
                        {event.timestamp
                          ? new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          : ''}
                      </span>
                    </div>
                    <p className="text-zinc-200 leading-snug">{event.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
