import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const INCIDENT_ID = "INC-2048";

function App() {
  const [state, setState] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function fetchData() {
    try {
      setError(null);

      const [stateRes, timelineRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/incidents/${INCIDENT_ID}/state`),
        fetch(`${API_BASE}/api/v1/incidents/${INCIDENT_ID}/timeline`),
        fetch(`${API_BASE}/api/v1/incidents/${INCIDENT_ID}/summary`),
      ]);

      if (!stateRes.ok || !timelineRes.ok || !summaryRes.ok) {
        throw new Error("Unable to connect to Sentinel backend");
      }

      const stateData = await stateRes.json();
      const timelineData = await timelineRes.json();
      const summaryData = await summaryRes.json();

      setState(stateData);
      setTimeline(timelineData.timeline || timelineData);
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={styles.center}>
        <h2>Sentinel</h2>
        <p>Connecting to Incident Intelligence...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.center}>
        <h2>Sentinel</h2>
        <p style={{ color: "red" }}>{error}</p>
        <p>Backend URL: {API_BASE}</p>
        <button onClick={fetchData}>Retry</button>
      </div>
    );
  }

  const incidentState = state?.incident_state || state || {};
  const facts = incidentState.facts || [];
  const hypotheses = incidentState.hypotheses || [];
  const conflicts = incidentState.conflicts || [];
  const actions = incidentState.actions || [];
  const decisions = incidentState.decisions || [];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1>🛡️ Sentinel</h1>
          <p>AI Incident Commander</p>
        </div>

        <div style={styles.status}>
          ● LIVE
        </div>
      </header>

      <main>
        <section style={styles.card}>
          <h2>Incident {INCIDENT_ID}</h2>

          <div style={styles.grid}>
            <div>
              <strong>Facts</strong>
              <h2>{facts.length}</h2>
            </div>

            <div>
              <strong>Hypotheses</strong>
              <h2>{hypotheses.length}</h2>
            </div>

            <div>
              <strong>Conflicts</strong>
              <h2>{conflicts.length}</h2>
            </div>

            <div>
              <strong>Actions</strong>
              <h2>{actions.length}</h2>
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <h2>Confirmed Facts</h2>

          {facts.length === 0 ? (
            <p>No facts extracted yet.</p>
          ) : (
            facts.map((fact) => (
              <div key={fact.id} style={styles.item}>
                <strong>{fact.statement}</strong>
                <p>Status: {fact.status}</p>
              </div>
            ))
          )}
        </section>

        <section style={styles.card}>
          <h2>Hypotheses</h2>

          {hypotheses.length === 0 ? (
            <p>No hypotheses identified yet.</p>
          ) : (
            hypotheses.map((hypothesis) => (
              <div key={hypothesis.id} style={styles.item}>
                <strong>{hypothesis.statement}</strong>
                <p>Status: {hypothesis.status}</p>
              </div>
            ))
          )}
        </section>

        <section style={styles.card}>
          <h2>Conflicts</h2>

          {conflicts.length === 0 ? (
            <p>No conflicts detected.</p>
          ) : (
            conflicts.map((conflict) => (
              <div key={conflict.id} style={styles.item}>
                <strong>{conflict.description}</strong>
                <p>Status: {conflict.status}</p>
              </div>
            ))
          )}
        </section>

        <section style={styles.card}>
          <h2>Actions</h2>

          {actions.length === 0 ? (
            <p>No actions identified yet.</p>
          ) : (
            actions.map((action) => (
              <div key={action.id} style={styles.item}>
                <strong>{action.title}</strong>
                <p>
                  Owner: {action.owner?.name || "Unassigned"}
                </p>
                <p>Status: {action.status}</p>

                {action.requires_human_approval && (
                  <p style={{ color: "orange" }}>
                    ⚠️ Human approval required
                  </p>
                )}
              </div>
            ))
          )}
        </section>

        <section style={styles.card}>
          <h2>Decisions</h2>

          {decisions.length === 0 ? (
            <p>No decisions recorded yet.</p>
          ) : (
            decisions.map((decision) => (
              <div key={decision.id} style={styles.item}>
                <strong>{decision.decision}</strong>
                <p>{decision.reason}</p>
              </div>
            ))
          )}
        </section>

        <section style={styles.card}>
          <h2>Incident Timeline</h2>

          {timeline.length === 0 ? (
            <p>No timeline events yet.</p>
          ) : (
            timeline.map((event) => (
              <div key={event.id} style={styles.item}>
                <strong>{event.event_type}</strong>
                <p>{event.description}</p>
                <small>{event.timestamp}</small>
              </div>
            ))
          )}
        </section>

        {summary && (
          <section style={styles.card}>
            <h2>Incident Summary</h2>
            <pre style={styles.pre}>
              {JSON.stringify(summary, null, 2)}
            </pre>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#111827",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    background: "#111827",
    color: "white",
    padding: "20px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  status: {
    color: "#22c55e",
    fontWeight: "bold",
  },

  card: {
    background: "white",
    margin: "20px auto",
    padding: "20px",
    maxWidth: "1000px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
  },

  item: {
    borderLeft: "3px solid #6366f1",
    padding: "10px 15px",
    margin: "10px 0",
    background: "#f9fafb",
  },

  pre: {
    whiteSpace: "pre-wrap",
    overflowX: "auto",
    background: "#111827",
    color: "#e5e7eb",
    padding: "15px",
    borderRadius: "6px",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "Arial, sans-serif",
  },
};

export default App;
