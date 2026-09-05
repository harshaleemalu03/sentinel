export type FactStatus = 'CONFIRMED' | 'UNVERIFIED';
export type HypothesisStatus = 'UNCONFIRMED' | 'SUPPORTED' | 'CONTRADICTED' | 'RESOLVED';
export type ActionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
export type ConflictStatus = 'OPEN' | 'RESOLVED';
export type EntityPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Speaker {
  id: string;
  name: string;
  role: string;
}

export interface TranscriptEvent {
  event_id: string;
  event_type?: string;
  incident_id: string;
  session_id?: string;
  speaker: Speaker;
  text: string;
  timestamp: string;
  is_final?: boolean;
  source?: string;
}

export interface SourceReference {
  event_id: string;
  speaker_id: string;
  speaker_name: string;
  speaker_role: string;
}

export interface Fact {
  id: string;
  statement: string;
  status: FactStatus;
  source: SourceReference;
  evidence: string[];
}


export interface Hypothesis {
  id: string;
  statement: string;
  status: HypothesisStatus;
  source: SourceReference;
  supporting_evidence: string[];
  contradicting_evidence: string[];
  required_evidence: string[];
  confidence?: number;
}

export interface Conflict {
  id: string;
  description: string;
  related_items: string[];
  status: ConflictStatus;
  detected_at?: string;
}

export interface InformationGap {
  id: string;
  question: string;
  status: 'OPEN' | 'RESOLVED';
  related_hypothesis_id?: string | null;
  detected_at?: string;
}

export interface ActionOwner {
  id?: string | null;
  name: string;
  role?: string | null;
}

export interface Action {
  id: string;
  title: string;
  purpose: string;
  owner?: ActionOwner | null;
  priority: EntityPriority;
  requires_human_approval: boolean;
  status: ActionStatus;
}

export interface Decision {
  id: string;
  decision: string;
  reason: string;
  proposed_by: string;
  timestamp?: string;
}

export interface ApprovalRequest {
  action_id: string;
  incident_id: string;
  requested_by: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at?: string;
}

export interface ApprovalDecision {
  action_id: string;
  incident_id: string;
  decided_by: string;
  decision: 'APPROVED' | 'REJECTED';
  comment?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  event_type: string;
  description: string;
  related_entities: string[];
  source_event_id?: string;
  actor?: string;
  role?: string;
  type?: 'human' | 'ai' | 'system';
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  role_confidence: number;
  last_seen_event_id?: string;
  active: boolean;
}

export interface IncidentState {
  incident_id: string;
  title: string;
  severity: string;
  status: string;
  version: number;
  participants: Participant[];
  facts: Fact[];
  hypotheses: Hypothesis[];
  conflicts: Conflict[];
  unknowns: InformationGap[];
  actions: Action[];
  decisions: Decision[];
  approvals: ApprovalRequest[];
  timeline: TimelineEvent[];
}

export interface ExtractedItem {
  type: 'FACT' | 'HYPOTHESIS' | 'DECISION' | 'ACTION' | 'EVIDENCE';
  statement: string;
  confidence: number;
  supporting_evidence?: string[];
  contradicting_evidence?: string[];
  required_evidence?: string[];
  action?: {
    title: string;
    purpose: string;
    owner?: ActionOwner | null;
    priority: EntityPriority;
    requires_human_approval: boolean;
  };
}

export interface PotentialConflict {
  new_statement: string;
  existing_statement: string;
  explanation: string;
  confidence: number;
}

export interface ExtractionResult {
  items: ExtractedItem[];
  potential_conflicts?: PotentialConflict[];
}
