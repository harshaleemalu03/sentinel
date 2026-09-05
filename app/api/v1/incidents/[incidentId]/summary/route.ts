import { NextRequest, NextResponse } from 'next/server';
import { stateManager } from '@/lib/truth-engine/engine';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ incidentId: string }> },
) {
  try {
    const { incidentId } = await params;

    const externalUrl = process.env.SENTINEL_INTELLIGENCE_URL;
    if (externalUrl && externalUrl.startsWith('http')) {
      try {
        const upstream = await fetch(
          `${externalUrl.replace(/\/$/, '')}/api/v1/incidents/${encodeURIComponent(incidentId)}/summary`,
        );
        if (upstream.ok) {
          const data = await upstream.json();
          return NextResponse.json(data);
        }
      } catch (err) {
        console.warn('Proxy summary fetch failed, using embedded state:', err);
      }
    }

    const state = stateManager.getIncident(incidentId);
    if (!state) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({
      incident_id: state.incident_id,
      title: state.title,
      severity: state.severity,
      status: state.status,
      facts: state.facts,
      hypotheses: state.hypotheses,
      open_conflicts: state.conflicts.filter((c) => c.status === 'OPEN'),
      open_information_gaps: state.unknowns.filter((u) => u.status === 'OPEN'),
      actions: state.actions,
      decisions: state.decisions,
      pending_approvals: state.approvals.filter((a) => a.status === 'PENDING'),
      timeline: state.timeline,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
