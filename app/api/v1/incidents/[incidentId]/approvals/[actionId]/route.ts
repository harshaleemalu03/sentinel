import { NextRequest, NextResponse } from 'next/server';
import { stateManager } from '@/lib/truth-engine/engine';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ incidentId: string; actionId: string }> },
) {
  try {
    const { incidentId, actionId } = await params;
    const state = stateManager.getIncident(incidentId);

    if (!state) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const approval = state.approvals.find((a) => a.action_id === actionId);
    if (!approval) {
      return NextResponse.json({ error: 'Approval request not found' }, { status: 404 });
    }

    return NextResponse.json(approval);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
