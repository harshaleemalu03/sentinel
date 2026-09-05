export function createSessionId(): string {
  return `session_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 10)}`;
}

export function createIncidentId(): string {
  return `incident_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 10)}`;
}