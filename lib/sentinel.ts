export interface SentinelTranscriptEvent {
  event_id: string;
  event_type: 'transcript';
  incident_id: string;
  session_id: string;

  speaker: {
    id: string;
    name: string;
    role: string;
  };

  text: string;
  timestamp: string;
  is_final: boolean;
  source: 'agora';
}

export interface SendTranscriptResult {
  success: boolean;
  status: number;
  data?: unknown;
  error?: string;
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 10)}`;
}

export function createTranscriptEvent(params: {
  incidentId: string;
  sessionId: string;
  speakerId: string;
  speakerName: string;
  speakerRole: string;
  text: string;
  isFinal: boolean;
}): SentinelTranscriptEvent {
  return {
    event_id: generateEventId(),
    event_type: 'transcript',
    incident_id: params.incidentId,
    session_id: params.sessionId,
    speaker: {
      id: params.speakerId,
      name: params.speakerName,
      role: params.speakerRole,
    },
    text: params.text,
    timestamp: new Date().toISOString(),
    is_final: params.isFinal,
    source: 'agora',
  };
}

import { truthEngine } from './truth-engine/engine';
import type { TranscriptEvent } from './truth-engine/types';

export async function sendTranscriptToIntelligence(
  event: SentinelTranscriptEvent,
): Promise<SendTranscriptResult> {
  const externalUrl = process.env.SENTINEL_INTELLIGENCE_URL;

  if (externalUrl && externalUrl.startsWith('http')) {
    const url = `${externalUrl.replace(/\/$/, '')}/api/v1/incidents/${encodeURIComponent(event.incident_id)}/events`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: `External Intelligence returned HTTP ${response.status}`,
        };
      }
      return { success: true, status: 200, data };
    } catch (error) {
      console.warn('External intelligence call failed, using embedded TruthEngine:', error);
    }
  }

  // Embedded Truth Engine execution
  try {
    const internalEvent: TranscriptEvent = {
      event_id: event.event_id,
      event_type: 'transcript',
      incident_id: event.incident_id,
      session_id: event.session_id,
      speaker: event.speaker,
      text: event.text,
      timestamp: event.timestamp,
      is_final: event.is_final,
      source: event.source,
    };

    const state = await truthEngine.process(internalEvent);

    return {
      success: true,
      status: 200,
      data: {
        incident_id: event.incident_id,
        event_id: event.event_id,
        state_version: state.version,
        incident_state: state,
      },
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      error: error instanceof Error ? error.message : 'TruthEngine processing error',
    };
  }
}

