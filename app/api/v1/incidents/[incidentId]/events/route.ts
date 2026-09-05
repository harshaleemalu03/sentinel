import { NextRequest, NextResponse } from 'next/server';
import { truthEngine, stateManager } from '@/lib/truth-engine/engine';
import type { TranscriptEvent } from '@/lib/truth-engine/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ incidentId: string }> },
) {
  try {
    const { incidentId } = await params;
    const body = await request.json();

    const event: TranscriptEvent = {
      event_id: body.event_id || `evt_${Date.now()}`,
      incident_id: incidentId,
      session_id: body.session_id,
      speaker: {
        id: body.speaker?.id || 'unknown',
        name: body.speaker?.name || 'Unknown Speaker',
        role: body.speaker?.role || 'Responder',
      },
      text: body.text || '',
      timestamp: body.timestamp || new Date().toISOString(),
      is_final: body.is_final ?? true,
      source: body.source || 'agora',
    };

    if (!event.text.trim()) {
      return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400 });
    }

    // Optional proxy to external FastAPI backend if configured
    const externalUrl = process.env.SENTINEL_INTELLIGENCE_URL;
    if (externalUrl && externalUrl.startsWith('http')) {
      try {
        const upstream = await fetch(
          `${externalUrl.replace(/\/$/, '')}/api/v1/incidents/${encodeURIComponent(incidentId)}/events`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
          },
        );
        if (upstream.ok) {
          const data = await upstream.json();
          return NextResponse.json(data);
        }
      } catch (err) {
        console.warn('Proxy to external intelligence failed, using embedded TruthEngine:', err);
      }
    }

    // Embedded TruthEngine
    const updatedState = await truthEngine.process(event);

    return NextResponse.json({
      incident_id: incidentId,
      event_id: event.event_id,
      state_version: updatedState.version,
      incident_state: updatedState,
    });
  } catch (error) {
    console.error('Error processing transcript event:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
