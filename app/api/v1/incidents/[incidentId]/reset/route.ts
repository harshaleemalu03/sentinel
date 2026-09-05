import { NextRequest, NextResponse } from 'next/server';
import { stateManager } from '@/lib/truth-engine/engine';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ incidentId: string }> },
) {
  try {
    const { incidentId } = await params;
    const resetState = stateManager.resetIncident(incidentId);

    return NextResponse.json({
      status: 'reset',
      incident_id: incidentId,
      incident_state: resetState,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
