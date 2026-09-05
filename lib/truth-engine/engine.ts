import type {
  IncidentState,
  TranscriptEvent,
  ExtractionResult,
  ExtractedItem,
  Fact,
  Hypothesis,
  Action,
  Decision,
  Conflict,
  InformationGap,
  ApprovalRequest,
  ApprovalDecision,
  TimelineEvent,
  Participant,
  SourceReference,
  PotentialConflict,
} from './types';

// In-memory store for incidents
class IncidentStateManager {
  private incidents: Map<string, IncidentState> = new Map();

  constructor() {
    this.seedDefaultIncident();
  }

  private seedDefaultIncident() {
    const defaultIncident: IncidentState = {
      incident_id: 'INC-2048',
      title: 'Payment API Degradation & Latency Spike',
      severity: 'SEV-1',
      status: 'INVESTIGATING',
      version: 1,
      participants: [
        {
          id: 'user-ic',
          name: 'Priya Sharma',
          role: 'Incident Commander',
          role_confidence: 1.0,
          active: true,
        },
        {
          id: 'user-devops',
          name: 'Rahul Mehta',
          role: 'DevOps Engineer',
          role_confidence: 1.0,
          active: true,
        },
        {
          id: 'sentinel-ai',
          name: 'Sentinel',
          role: 'AI Incident Commander',
          role_confidence: 1.0,
          active: true,
        },
      ],
      facts: [
        {
          id: 'fact-init-1',
          statement: 'Payment API latency has crossed 8.4 seconds (P99 normal baseline: 84ms).',
          status: 'CONFIRMED',
          source: {
            event_id: 'init-1',
            speaker_id: 'system',
            speaker_name: 'Telemetry Alert',
            speaker_role: 'Monitoring System',
          },
          evidence: ['Datadog APM Alert #4021', 'P99 Latency graph'],
        },
        {
          id: 'fact-init-2',
          statement: 'Payment service v4.8.2 was deployed 12 minutes ago.',
          status: 'CONFIRMED',
          source: {
            event_id: 'init-2',
            speaker_id: 'system',
            speaker_name: 'CI/CD Pipeline',
            speaker_role: 'Deployment Bot',
          },
          evidence: ['GitHub Actions deploy run #9842', 'Kubernetes pod rollout timestamp'],
        },
      ],
      hypotheses: [
        {
          id: 'hypo-init-1',
          statement: 'Deployment v4.8.2 introduced connection pool leakage leading to payment timeout cascades.',
          status: 'UNCONFIRMED',
          source: {
            event_id: 'init-3',
            speaker_id: 'sentinel-ai',
            speaker_name: 'Sentinel',
            speaker_role: 'AI Incident Commander',
          },
          supporting_evidence: ['Deploy timing correlates directly with latency spike onset'],
          contradicting_evidence: [],
          required_evidence: ['Database active connection metric', 'Connection leak stack traces'],
          confidence: 0.88,
        },
      ],
      conflicts: [],
      unknowns: [
        {
          id: 'gap-init-1',
          question: 'Are downstream payment gateways (Stripe / Adyen) reporting external degradation?',
          status: 'OPEN',
          related_hypothesis_id: 'hypo-init-1',
        },
      ],
      actions: [
        {
          id: 'action-init-1',
          title: 'Inspect payment-service pod logs and connection pool saturation',
          purpose: 'Determine if connection leak is occurring in production pods',
          owner: {
            id: 'user-devops',
            name: 'Rahul Mehta',
            role: 'DevOps Engineer',
          },
          priority: 'HIGH',
          requires_human_approval: false,
          status: 'IN_PROGRESS',
        },
        {
          id: 'action-init-2',
          title: 'Rollback payment-service deployment to v4.8.1',
          purpose: 'Revert recent deployment to restore customer checkout flow',
          owner: {
            id: 'user-devops',
            name: 'Rahul Mehta',
            role: 'DevOps Engineer',
          },
          priority: 'CRITICAL',
          requires_human_approval: true,
          status: 'PENDING',
        },
      ],
      decisions: [
        {
          id: 'dec-init-1',
          decision: 'Declared SEV-1 active incident and assembled response bridge',
          reason: 'Customer payment failures exceeded 5% threshold',
          proposed_by: 'Priya Sharma (Incident Commander)',
          timestamp: new Date(Date.now() - 600000).toISOString(),
        },
      ],
      approvals: [
        {
          action_id: 'action-init-2',
          incident_id: 'INC-2048',
          requested_by: 'Sentinel AI',
          reason: 'Production rollback affects live customer traffic and requires Incident Commander authorization.',
          status: 'PENDING',
          created_at: new Date(Date.now() - 300000).toISOString(),
        },
      ],
      timeline: [
        {
          id: 'time-init-1',
          timestamp: new Date(Date.now() - 720000).toISOString(),
          event_type: 'DEPLOYMENT',
          description: 'Payment Service v4.8.2 deployed to US-East production cluster.',
          related_entities: ['fact-init-2'],
          type: 'system',
        },
        {
          id: 'time-init-2',
          timestamp: new Date(Date.now() - 660000).toISOString(),
          event_type: 'ALERT_TRIGGERED',
          description: 'Critical Alert: Payment API P99 latency exceeded 8s threshold.',
          related_entities: ['fact-init-1'],
          type: 'system',
        },
        {
          id: 'time-init-3',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          event_type: 'INCIDENT_DECLARED',
          description: 'Priya Sharma (Incident Commander) declared SEV-1 and initiated voice bridge.',
          related_entities: ['dec-init-1'],
          type: 'human',
          actor: 'Priya Sharma',
          role: 'Incident Commander',
        },
        {
          id: 'time-init-4',
          timestamp: new Date(Date.now() - 480000).toISOString(),
          event_type: 'AI_CORRELATION',
          description: 'Sentinel correlated deployment v4.8.2 timing with incident onset latency spike.',
          related_entities: ['hypo-init-1'],
          type: 'ai',
          actor: 'Sentinel',
          role: 'AI Incident Commander',
        },
      ],
    };

    this.incidents.set('INC-2048', defaultIncident);
  }

  getIncident(id: string): IncidentState | null {
    const existing = this.incidents.get(id);
    if (existing) return existing;

    // Auto-create blank incident if not found
    return this.createIncident(id, `Incident ${id}`, 'SEV-2');
  }

  createIncident(id: string, title: string, severity: string): IncidentState {
    const incident: IncidentState = {
      incident_id: id,
      title,
      severity,
      status: 'INVESTIGATING',
      version: 1,
      participants: [],
      facts: [],
      hypotheses: [],
      conflicts: [],
      unknowns: [],
      actions: [],
      decisions: [],
      approvals: [],
      timeline: [],
    };
    this.incidents.set(id, incident);
    return incident;
  }

  updateIncident(state: IncidentState): void {
    this.incidents.set(state.incident_id, state);
  }

  resetIncident(id: string): IncidentState {
    if (id === 'INC-2048') {
      this.seedDefaultIncident();
      return this.incidents.get('INC-2048')!;
    }
    const fresh = this.createIncident(id, `Incident ${id}`, 'SEV-1');
    return fresh;
  }
}

export const stateManager = new IncidentStateManager();

// Pattern-based extraction fallback & rule engine
export class RuleBasedExtractor {
  extract(event: TranscriptEvent, context = ''): ExtractionResult {
    const text = event.text.trim();
    const lower = text.toLowerCase();
    const items: ExtractedItem[] = [];
    const conflicts: PotentialConflict[] = [];

    // 1. Actions & Approvals
    const actionKeywords = [
      'rollback', 'roll back', 'revert', 'restart', 'deploy', 'check',
      'inspect', 'investigate', 'verify', 'monitor', 'mitigate', 'kill', 'scale',
    ];
    const isAction = actionKeywords.some((k) => lower.includes(k)) || lower.includes('please') || lower.includes("i'll") || lower.includes('i will');

    if (isAction) {
      const requiresApproval = [
        'rollback', 'roll back', 'revert', 'restart', 'terminate', 'kill', 'drop', 'drain',
      ].some((k) => lower.includes(k));

      const priority = requiresApproval ? 'CRITICAL' : (lower.includes('check') || lower.includes('inspect') ? 'HIGH' : 'MEDIUM');

      let owner = null;
      const speakerName = event.speaker?.name || 'Unknown';
      const speakerRole = event.speaker?.role || 'Responder';

      const nameMatch = text.match(/^([A-Z][a-z]+)[,\s]+/);
      if (nameMatch) {
        owner = {
          name: nameMatch[1],
          role: 'Engineer',
        };
      } else if (lower.includes("i'll") || lower.includes('i will')) {
        owner = {
          id: event.speaker?.id,
          name: speakerName,
          role: speakerRole,
        };
      }

      let title = text;
      if (nameMatch) {
        title = text.slice(nameMatch[0].length).trim();
        title = title.charAt(0).toUpperCase() + title.slice(1);
      }

      items.push({
        type: 'ACTION',
        statement: text,
        confidence: 0.96,
        action: {
          title,
          purpose: 'Incident mitigation and triage task',
          owner,
          priority,
          requires_human_approval: requiresApproval,
        },
      });
    }

    // 2. Hypotheses
    const hypothesisKeywords = [
      'i think', 'maybe', 'probably', 'might be', 'could be', 'suspect',
      'hypothesis', 'candidate', 'potential root cause', 'possibly', 'seems like',
    ];
    const isHypothesis = hypothesisKeywords.some((k) => lower.includes(k));
    if (isHypothesis) {
      items.push({
        type: 'HYPOTHESIS',
        statement: text,
        confidence: 0.89,
        supporting_evidence: [`Reported by ${event.speaker.name} (${event.speaker.role})`],
        required_evidence: ['Validation against production metrics', 'Log confirmation'],
      });
    }

    // 3. Decisions
    const decisionKeywords = ['approved', 'decided', 'decision:', 'agreed to', "let's proceed with", 'confirming rollback'];
    const isDecision = decisionKeywords.some((k) => lower.includes(k)) && !isAction;
    if (isDecision) {
      items.push({
        type: 'DECISION',
        statement: text,
        confidence: 0.95,
      });
    }

    // 4. Facts
    const factKeywords = [
      'latency', 'error', 'failure', 'cpu', 'memory', 'deployed', 'completed',
      'returned to normal', 'elevated', 'spike', 'outage', 'status', 'version',
      'database', 'payment', 'service', 'recovering', 'recovered',
    ];
    const isFact = factKeywords.some((k) => lower.includes(k)) && !isHypothesis;
    if (isFact) {
      items.push({
        type: 'FACT',
        statement: text,
        confidence: 0.95,
        supporting_evidence: [`Observed by ${event.speaker.name} (${event.speaker.role})`],
      });
    }

    // 5. Conflict Detection
    if (context) {
      const lowerContext = context.toLowerCase();
      // Case A: Speaker reports system healthy/normal, but incident telemetry indicates active failure
      if (
        (lower.includes('healthy') || lower.includes('normal') || lower.includes('no major issue') || lower.includes('looks fine')) &&
        (lowerContext.includes('error') || lowerContext.includes('elevated') || lowerContext.includes('degraded') || lowerContext.includes('latency'))
      ) {
        conflicts.push({
          new_statement: text,
          existing_statement: 'Incident telemetry and previous reports document elevated error rates & latency.',
          explanation: `${event.speaker.name} (${event.speaker.role}) reports infrastructure is normal, directly conflicting with ongoing telemetry showing payment degradation.`,
          confidence: 0.93,
        });
      }
      // Case B: Speaker reports errors still elevated after a fix/rollback was reported done
      else if (
        (lower.includes('still elevated') || lower.includes('still failing') || lower.includes('not fixed')) &&
        (lowerContext.includes('completed') || lowerContext.includes('rollback') || lowerContext.includes('fixed'))
      ) {
        conflicts.push({
          new_statement: text,
          existing_statement: 'Remediation step (rollback/mitigation) was previously executed.',
          explanation: `${event.speaker.name} reports error rates are still elevated even after remediation action completed.`,
          confidence: 0.95,
        });
      }
    }

    return { items, potential_conflicts: conflicts };
  }
}

// Full Truth Engine implementation
export class TruthEngine {
  private extractor = new RuleBasedExtractor();

  async process(
    event: TranscriptEvent,
    extractionResult?: ExtractionResult,
    stateInput?: IncidentState,
  ): Promise<IncidentState> {
    const state = stateInput || stateManager.getIncident(event.incident_id)!;

    // 1. Build context string from current state
    const context = [
      `Active Incident: ${state.title} (${state.severity})`,
      `Facts: ${state.facts.map((f) => f.statement).join(' | ')}`,
      `Hypotheses: ${state.hypotheses.map((h) => h.statement).join(' | ')}`,
      `Actions: ${state.actions.map((a) => a.title).join(' | ')}`,
    ].join('\n');

    // 2. Extract items if not already provided
    const extraction = extractionResult || this.extractor.extract(event, context);

    // 3. Upsert participant
    let participant = state.participants.find((p) => p.id === event.speaker.id);
    if (!participant) {
      participant = {
        id: event.speaker.id,
        name: event.speaker.name,
        role: event.speaker.role,
        role_confidence: 0.95,
        last_seen_event_id: event.event_id,
        active: true,
      };
      state.participants.push(participant);
    } else {
      participant.name = event.speaker.name;
      participant.role = event.speaker.role;
      participant.last_seen_event_id = event.event_id;
      participant.active = true;
    }

    const source: SourceReference = {
      event_id: event.event_id,
      speaker_id: event.speaker.id,
      speaker_name: event.speaker.name,
      speaker_role: event.speaker.role,
    };

    const newEntityIds: string[] = [];

    // 4. Ingest extracted items
    for (let i = 0; i < extraction.items.length; i++) {
      const item = extraction.items[i];
      const entityId = `${item.type.toLowerCase()}-${event.event_id}-${i}`;

      if (item.type === 'FACT') {
        const fact: Fact = {
          id: entityId,
          statement: item.statement,
          status: 'CONFIRMED',
          source,
          evidence: item.supporting_evidence || [],
        };
        // Avoid identical duplicate facts
        if (!state.facts.some((f) => f.statement.toLowerCase() === fact.statement.toLowerCase())) {
          state.facts.unshift(fact);
          newEntityIds.push(entityId);
        }
      } else if (item.type === 'HYPOTHESIS') {
        const hypothesis: Hypothesis = {
          id: entityId,
          statement: item.statement,
          status: 'UNCONFIRMED',
          source,
          supporting_evidence: item.supporting_evidence || [],
          contradicting_evidence: item.contradicting_evidence || [],
          required_evidence: item.required_evidence || [],
          confidence: item.confidence || 0.85,
        };
        if (!state.hypotheses.some((h) => h.statement.toLowerCase() === hypothesis.statement.toLowerCase())) {
          state.hypotheses.unshift(hypothesis);
          newEntityIds.push(entityId);
        }
      } else if (item.type === 'ACTION') {
        const actionData = item.action;
        const requiresApproval = actionData?.requires_human_approval ?? false;

        const action: Action = {
          id: entityId,
          title: actionData?.title || item.statement,
          purpose: actionData?.purpose || 'Incident operational action',
          owner: actionData?.owner || null,
          priority: actionData?.priority || 'MEDIUM',
          requires_human_approval: requiresApproval,
          status: requiresApproval ? 'PENDING' : 'IN_PROGRESS',
        };

        if (!state.actions.some((a) => a.title.toLowerCase() === action.title.toLowerCase())) {
          state.actions.unshift(action);
          newEntityIds.push(entityId);

          if (requiresApproval) {
            const approvalReq: ApprovalRequest = {
              action_id: action.id,
              incident_id: state.incident_id,
              requested_by: 'Sentinel AI',
              reason: 'High-risk production mitigation action requires Incident Commander authorization.',
              status: 'PENDING',
              created_at: new Date().toISOString(),
            };
            state.approvals.unshift(approvalReq);
          }
        }
      } else if (item.type === 'DECISION') {
        const decision: Decision = {
          id: entityId,
          decision: item.statement,
          reason: 'Agreed in live incident conversation',
          proposed_by: event.speaker.name,
          timestamp: new Date().toISOString(),
        };
        state.decisions.unshift(decision);
        newEntityIds.push(entityId);
      }
    }

    // 5. Ingest potential conflicts
    if (extraction.potential_conflicts) {
      for (const pc of extraction.potential_conflicts) {
        const conflictId = `conflict-${event.event_id}-${state.conflicts.length + 1}`;
        const conflict: Conflict = {
          id: conflictId,
          description: pc.explanation,
          related_items: newEntityIds,
          status: 'OPEN',
          detected_at: new Date().toISOString(),
        };
        state.conflicts.unshift(conflict);

        state.timeline.unshift({
          id: `timeline-${conflictId}`,
          timestamp: new Date().toISOString(),
          event_type: 'CONFLICT_DETECTED',
          description: `⚠️ Conflict Detected: ${pc.explanation}`,
          related_entities: [conflictId],
          type: 'ai',
          actor: 'Sentinel AI',
          role: 'Truth Engine',
        });
      }
    }

    // 6. Record timeline event for speech / extraction
    state.timeline.unshift({
      id: `timeline-event-${event.event_id}`,
      timestamp: event.timestamp || new Date().toISOString(),
      event_type: 'VOICE_TRANSCRIPT',
      description: `${event.speaker.name} (${event.speaker.role}): "${event.text}"`,
      related_entities: newEntityIds,
      type: event.speaker.id.includes('ai') ? 'ai' : 'human',
      actor: event.speaker.name,
      role: event.speaker.role,
    });

    state.version += 1;
    stateManager.updateIncident(state);
    return state;
  }
}

export const truthEngine = new TruthEngine();

// Human-in-the-loop approval decision handler
export function decideApproval(decision: ApprovalDecision): {
  success: boolean;
  approval: ApprovalRequest | null;
  action: Action | null;
  state: IncidentState;
} {
  const state = stateManager.getIncident(decision.incident_id);
  if (!state) {
    throw new Error(`Incident ${decision.incident_id} not found.`);
  }

  const approval = state.approvals.find((a) => a.action_id === decision.action_id);
  if (!approval) {
    throw new Error(`Approval request for action ${decision.action_id} not found.`);
  }

  approval.status = decision.decision;

  const action = state.actions.find((a) => a.id === decision.action_id);
  if (action) {
    action.status = decision.decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  }

  state.timeline.unshift({
    id: `timeline-decision-${Date.now()}`,
    timestamp: new Date().toISOString(),
    event_type: decision.decision === 'APPROVED' ? 'ACTION_APPROVED' : 'ACTION_REJECTED',
    description: `✓ Action "${action?.title || decision.action_id}" was ${decision.decision.toLowerCase()} by ${decision.decided_by}.${decision.comment ? ` Note: "${decision.comment}"` : ''}`,
    related_entities: [decision.action_id],
    type: 'human',
    actor: decision.decided_by,
    role: 'Incident Commander',
  });

  state.version += 1;
  stateManager.updateIncident(state);

  return {
    success: true,
    approval,
    action: action || null,
    state,
  };
}
