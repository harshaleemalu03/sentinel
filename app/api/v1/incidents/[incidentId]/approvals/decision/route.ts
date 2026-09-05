import { NextRequest, NextResponse } from 'next/server';
import { decideApproval } from '@/lib/truth-engine/engine';
import type { ApprovalDecision } from '@/lib/truth-engine/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ incidentId: string }> },
) {
  try {
    const { incidentId } = await params;
    const body = await request.json();

    const decision: ApprovalDecision = {
      incident_id: incidentId,
      action_id: body.action_id,
      decided_by: body.decided_by || 'Incident Commander',
      decision: body.decision === 'REJECTED' ? 'REJECTED' : 'APPROVED',
      comment: body.comment || body.notes || '',
    };

    if (!decision.action_id) {
      return NextResponse.json({ error: 'action_id is required' }, { status: 400 });
    }

    const externalUrl = process.env.SENTINEL_INTELLIGENCE_URL;
    if (externalUrl && externalUrl.startsWith('http')) {
      try {
        const upstream = await fetch(
          `${externalUrl.replace(/\/$/, '')}/api/v1/incidents/${encodeURIComponent(incidentId)}/approvals/decision`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(decision),
          },
        );
        if (upstream.ok) {
          const data = await upstream.json();
          return NextResponse.json(data);
        }
      } catch (err) {
        console.warn('Proxy approval decision failed, using embedded engine:', err);
      }
    }

    const result = decideApproval(decision);

    return NextResponse.json({
      status: 'approval_updated',
      approval: result.approval,
      action: result.action,
      incident_state: result.state,
    });
  } catch (error) {
    console.error('Error processing approval decision:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
