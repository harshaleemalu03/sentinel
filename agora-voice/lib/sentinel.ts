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

export async function sendTranscriptToIntelligence(
  event: SentinelTranscriptEvent,
): Promise<SendTranscriptResult> {
  // Frontend and Incident Intelligence are deployed
  // under the same Vercel project/domain.
  const url =
    `/api/v1/incidents/` +
    `${encodeURIComponent(event.incident_id)}/events`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    const responseText = await response.text();

    let data: unknown;

    try {
      data = responseText
        ? JSON.parse(responseText)
        : undefined;
    } catch {
      data = responseText;
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        data,
        error:
          `Incident Intelligence returned HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error while contacting Incident Intelligence',
    };
  }
}
