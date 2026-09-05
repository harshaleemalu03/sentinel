import { NextRequest, NextResponse } from 'next/server';
import { stateManager } from '@/lib/truth-engine/engine';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ incidentId: string }> },
) {
  try {
    const { incidentId } = await params;

    // Optional proxy to external FastAPI backend
    const externalUrl = process.env.SENTINEL_INTELLIGENCE_URL;
    if (externalUrl && externalUrl.startsWith('http')) {
      try {
        const upstream = await fetch(
          `${externalUrl.replace(/\/$/, '')}/api/v1/incidents/${encodeURIComponent(incidentId)}/state`,
        );
        if (upstream.ok) {
          const data = await upstream.json();
          return NextResponse.json(data);
        }
      } catch (err) {
        console.warn('Proxy state fetch failed, using embedded state:', err);
      }
    }

    const state = stateManager.getIncident(incidentId);
    if (!state) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
