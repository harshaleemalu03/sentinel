import "./App.css";
import { useMemo, useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cloud,
  Cpu,
  Database,
  FileText,
  GitBranch,
  LayoutDashboard,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Network,
  Play,
  Radio,
  Search,
  Server,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  Users,
  Zap,
  ArrowUpRight,
  Brain,
  CircleCheck,
  Gauge,
  Layers,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
const API_BASE = "";
/* =========================================================
   DATA
========================================================= */

const initialIncidents = [
  {
    id: "INC-2048",
    title: "Payment API degradation",
    service: "payments-api",
    severity: "Critical",
    status: "Investigating",
    time: "2 min ago",
    impact: "High",
    description:
      "Payment requests are experiencing elevated latency and intermittent failures.",
  },
  {
    id: "INC-2047",
    title: "Authentication latency spike",
    service: "auth-service",
    severity: "High",
    status: "Mitigated",
    time: "18 min ago",
    impact: "Medium",
    description:
      "Authentication requests briefly exceeded normal response-time thresholds.",
  },
  {
    id: "INC-2046",
    title: "Database connection pool",
    service: "postgres-primary",
    severity: "Medium",
    status: "Resolved",
    time: "42 min ago",
    impact: "Low",
    description:
      "Connection pool utilization temporarily exceeded the configured threshold.",
  },
  {
    id: "INC-2045",
    title: "Notification queue delay",
    service: "notification-worker",
    severity: "Low",
    status: "Resolved",
    time: "1 hr ago",
    impact: "Low",
    description:
      "Notification processing experienced a temporary queue backlog.",
  },
];

const initialTimeline = [
  {
    time: "18:32:04",
    actor: "Alice Chen",
    role: "SRE",
    message:
      "Payment failures increased significantly. Error rate is still climbing.",
    type: "human",
  },
  {
    time: "18:33:11",
    actor: "Sentinel AI",
    role: "AI Analyst",
    message:
      "Detected correlation between payment failures and elevated database latency.",
    type: "ai",
  },
  {
    time: "18:34:28",
    actor: "Rahul Mehta",
    role: "Backend Engineer",
    message:
      "Database health looks normal. I don't see a major database incident.",
    type: "human",
  },
  {
    time: "18:35:42",
    actor: "Sentinel AI",
    role: "AI Analyst",
    message:
      "Recommended rollback of payment-service deployment v4.8.2.",
    type: "ai",
  },
];

const services = [
  {
    name: "Payment API",
    value: 98,
    status: "Operational",
    latency: "84ms",
    uptime: "99.98%",
    icon: Cloud,
  },
  {
    name: "Auth Service",
    value: 96,
    status: "Degraded",
    latency: "142ms",
    uptime: "99.91%",
    icon: Shield,
  },
  {
    name: "Database",
    value: 99,
    status: "Operational",
    latency: "31ms",
    uptime: "99.99%",
    icon: Database,
  },
  {
    name: "Notifications",
    value: 94,
    status: "Degraded",
    latency: "218ms",
    uptime: "99.87%",
    icon: MessageSquare,
  },
];

const navItems = [
  {
    name: "Overview",
    icon: LayoutDashboard,
  },
  {
    name: "Incidents",
    icon: AlertTriangle,
  },
  {
    name: "Timeline",
    icon: Clock3,
  },
  {
    name: "Services",
    icon: Network,
  },
  {
    name: "Intelligence",
    icon: Sparkles,
  },
];

/* =========================================================
   APP
========================================================= */

function App() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  const [running, setRunning] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  const [incidents, setIncidents] = useState(initialIncidents);
  const [backendConnected, setBackendConnected] = useState(false);
  useEffect(() => {
  fetch(`${API_BASE}/api/health`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Backend not responding");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Sentinel Backend:", data);
      setBackendConnected(true);
    })
    .catch((error) => {
      console.error("Backend connection failed:", error);
      setBackendConnected(false);
    });
}, []);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [incidentSummary, setIncidentSummary] = useState(null);
  useEffect(() => {
  fetch(`${API_BASE}/api/v1/incidents/INC-2048/timeline`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch timeline");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Sentinel Timeline:", data);

      setTimeline(data.timeline);
    })
    .catch((error) => {
      console.error("Timeline fetch failed:", error);
    });
}, []);

useEffect(() => {
  fetch(`${API_BASE}/api/v1/incidents/INC-2048/summary`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch incident summary");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Sentinel Incident Summary:", JSON.stringify(data, null, 2));
      setIncidentSummary(data);
    })
    .catch((error) => {
      console.error("Incident summary fetch failed:", error);
    });
}, []);



  useEffect(() => {
  fetch(`${API_BASE}/api/v1/incidents/INC-2048/state`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch incident state");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Sentinel Incident State:", data);

      setIncidents((currentIncidents) =>
        currentIncidents.map((incident) =>
          incident.id === data.incident_id
            ? {
                ...incident,
                title: data.title,
                severity: data.severity,
                status: data.status,
              }
            : incident
        )
      );
    })
    .catch((error) => {
      console.error("Incident state fetch failed:", error);
    });
}, []);

  const [systemHealth, setSystemHealth] = useState(98.7);
  const [responseTime, setResponseTime] = useState("4m 12s");
  const [resolvedToday, setResolvedToday] = useState(27);
  const [aiScore, setAiScore] = useState(94);
  const [aiStatus, setAiStatus] = useState("High confidence");

  const [selectedIncident, setSelectedIncident] = useState(
    initialIncidents[0]
  );

  const [showIncidentDetails, setShowIncidentDetails] =
    useState(false);

  /* =========================================================
     FILTERING
  ========================================================= */

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) =>
      `${incident.id} ${incident.title} ${incident.service} ${incident.status}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search, incidents]);

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navigate = (page) => {
    setActiveNav(page);
    setSearch("");
  };

  /* =========================================================
     BACKEND EVENT INGESTION
  ========================================================= */

  const sendTranscriptEvent = async ({ eventId, text, speaker }) => {
    const response = await fetch(
      `${API_BASE}/api/v1/incidents/INC-2048/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId,
          incident_id: "INC-2048",
          timestamp: new Date().toISOString(),
          speaker,
          text,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Backend event failed (${response.status}): ${errorText}`
      );
    }

    const data = await response.json();

    if (data.incident_state) {
      const state = data.incident_state;

      setIncidents((currentIncidents) =>
        currentIncidents.map((incident) =>
          incident.id === state.incident_id
            ? {
                ...incident,
                title: state.title,
                severity: state.severity,
                status: state.status,
                time: "now",
              }
            : incident
        )
      );

      setSelectedIncident((current) =>
        current.id === state.incident_id
          ? {
              ...current,
              title: state.title,
              severity: state.severity,
              status: state.status,
              time: "now",
            }
          : current
      );
    }

    try {
      const [timelineResponse, summaryResponse] = await Promise.all([
        fetch(`${API_BASE}/api/v1/incidents/INC-2048/timeline`),
        fetch(`${API_BASE}/api/v1/incidents/INC-2048/summary`),
      ]);

      if (timelineResponse.ok) {
        const timelineData = await timelineResponse.json();
        setTimeline(timelineData.timeline || []);
      }

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setIncidentSummary(summaryData);
      }
    } catch (refreshError) {
      console.error("Failed to refresh incident intelligence:", refreshError);
    }

    return data;
  };

  /* =========================================================
     LIVE SIMULATION
  ========================================================= */

  const runSimulation = () => {
    if (running) return;

    setRunning(true);
    setSimulationStep(1);
    setAiStatus("Analyzing signals...");
    setAiScore(87);

    sendTranscriptEvent({
      eventId: `SIM-${Date.now()}-1`,
      speaker: { id: "sentinel-ai", name: "Sentinel AI", role: "AI Analyst" },
      text: "Simulation started. Correlating application, infrastructure and deployment signals.",
    }).catch((error) => console.error("Simulation event 1 failed:", error));

    setTimeline((previous) => [
      ...previous,
      {
        time: "18:36:03",
        actor: "Sentinel AI",
        role: "AI Analyst",
        message:
          "Simulation started. Correlating application, infrastructure and deployment signals.",
        type: "ai",
      },
    ]);

    setIncidents((previous) =>
      previous.map((incident) =>
        incident.id === "INC-2048"
          ? {
              ...incident,
              status: "Analyzing",
              time: "now",
            }
          : incident
      )
    );

    setSelectedIncident((previous) => ({
      ...previous,
      status: "Analyzing",
      time: "now",
    }));

    /* STEP 2 */
    setTimeout(() => {
      setSimulationStep(2);
      setAiStatus("Correlating evidence...");
      setAiScore(91);
      setSystemHealth(96.8);

      sendTranscriptEvent({
        eventId: `SIM-${Date.now()}-2`,
        speaker: { id: "sentinel-ai", name: "Sentinel AI", role: "AI Analyst" },
        text: "Correlated deployment v4.8.2 with elevated payment error rates across multiple signals.",
      }).catch((error) => console.error("Simulation event 2 failed:", error));
      setResponseTime("3m 48s");

      setTimeline((previous) => [
        ...previous,
        {
          time: "18:36:27",
          actor: "Sentinel AI",
          role: "AI Analyst",
          message:
            "Correlated deployment v4.8.2 with elevated payment error rates across multiple signals.",
          type: "ai",
        },
      ]);
    }, 1800);

    /* STEP 3 */
    setTimeout(() => {
      setSimulationStep(3);
      setAiStatus("Root cause identified");
      setAiScore(96);
      setSystemHealth(97.9);

      sendTranscriptEvent({
        eventId: `SIM-${Date.now()}-3`,
        speaker: { id: "sentinel-ai", name: "Sentinel AI", role: "AI Analyst" },
        text: "Root cause candidate identified: payment-service deployment v4.8.2.",
      }).catch((error) => console.error("Simulation event 3 failed:", error));

      setTimeline((previous) => [
        ...previous,
        {
          time: "18:36:51",
          actor: "Sentinel AI",
          role: "AI Analyst",
          message:
            "Root cause candidate identified: payment-service deployment v4.8.2.",
          type: "ai",
        },
      ]);

      setIncidents((previous) =>
        previous.map((incident) =>
          incident.id === "INC-2048"
            ? {
                ...incident,
                status: "Mitigated",
                time: "now",
              }
            : incident
        )
      );

      setSelectedIncident((previous) => ({
        ...previous,
        status: "Mitigated",
        time: "now",
      }));
    }, 3600);

    /* STEP 4 */
    setTimeout(() => {
      setSimulationStep(4);
      setAiStatus("Resolution verified");
      setAiScore(98);
      setSystemHealth(99.2);

      sendTranscriptEvent({
        eventId: `SIM-${Date.now()}-4`,
        speaker: { id: "sentinel-ai", name: "Sentinel AI", role: "AI Analyst" },
        text: "Recovery verified. Payment API error rate returned to normal operating range.",
      }).catch((error) => console.error("Simulation event 4 failed:", error));
      setResponseTime("3m 21s");
      setResolvedToday((value) => value + 1);

      setTimeline((previous) => [
        ...previous,
        {
          time: "18:37:19",
          actor: "Sentinel AI",
          role: "AI Analyst",
          message:
            "Recovery verified. Payment API error rate returned to normal operating range.",
          type: "ai",
        },
      ]);

      setIncidents((previous) =>
        previous.map((incident) =>
          incident.id === "INC-2048"
            ? {
                ...incident,
                status: "Resolved",
                time: "just now",
              }
            : incident
        )
      );

      setSelectedIncident((previous) => ({
        ...previous,
        status: "Resolved",
        time: "just now",
      }));

      setTimeout(() => {
        setRunning(false);
        setSimulationStep(0);
      }, 1400);
    }, 5600);
  };

  /* =========================================================
     RESET
  ========================================================= */

  const resetSimulation = () => {
    setRunning(false);
    setSimulationStep(0);
    setIncidents(initialIncidents);
    setTimeline(initialTimeline);
    setSelectedIncident(initialIncidents[0]);
    setSystemHealth(98.7);
    setResponseTime("4m 12s");
    setResolvedToday(27);
    setAiScore(94);
    setAiStatus("High confidence");
  };

  /* =========================================================
     INCIDENT SELECT
  ========================================================= */

  const selectIncident = (incident) => {
    setSelectedIncident(incident);
    setShowIncidentDetails(true);
  };

  /* =========================================================
     CURRENT PAGE
  ========================================================= */

  const pageDescription = {
    Overview:
      "Real-time visibility across incidents, infrastructure and AI-assisted response.",
    Incidents:
      "Investigate, prioritize and coordinate active operational incidents.",
    Timeline:
      "Unified stream of human and AI actions across your incident lifecycle.",
    Services:
      "Monitor health, latency and availability across critical services.",
    Intelligence:
      "AI-powered evidence correlation, root-cause analysis and response recommendations.",
  };

  return (
    <div
      className={
        darkMode
          ? "app dark sentinel-app"
          : "app light sentinel-app"
      }
    >
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="background-grid" />
      <div className="ambient-one" />
      <div className="ambient-two" />

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Shield size={21} />
          </div>

          <div>
            <h1>Sentinel</h1>
            <span>Incident Command Center</span>
          </div>
        </div>

        <div className="environment">
          <span className="pulse-dot" />

          {running ? "Simulation" : "Production"}

          <ChevronRight size={14} />
        </div>

        <nav>
          <div className="nav-label">COMMAND</div>

          {navItems.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${
                activeNav === name ? "active" : ""
              }`}
              onClick={() => navigate(name)}
            >
              <Icon size={18} />

              <span>{name}</span>

              {name === "Incidents" && (
                <span className="nav-count">
                  {
                    incidents.filter(
                      (item) => item.status !== "Resolved"
                    ).length
                  }
                </span>
              )}
            </button>
          ))}

          <div className="nav-label second">SYSTEM</div>

          <button
            className="nav-item"
            onClick={() => navigate("Timeline")}
          >
            <Terminal size={18} />
            <span>Logs</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("Intelligence")}
          >
            <GitBranch size={18} />
            <span>Deployments</span>
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("Services")}
          >
            <Database size={18} />
            <span>Infrastructure</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="ai-status">
            <div className="ai-icon">
              <Bot size={19} />
            </div>

            <div>
              <strong>Sentinel AI</strong>
              <span>{aiStatus}</span>
            </div>

            <span className="online-dot" />
          </div>

          <button className="nav-item">
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <div className="user-card">
            <div className="avatar">YM</div>

            <div>
              <strong>Command Operator</strong>
              <span>Admin</span>
            </div>

            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="main">
        {/* TOPBAR */}

        <header className="topbar">
          <div>
            <div className="breadcrumb">
              Operations
              <ChevronRight size={13} />
              {activeNav}
            </div>

            <h2>{activeNav}</h2>
          </div>

          <div className="top-actions">
            <div className="search-box">
              <Search size={17} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder={
                  activeNav === "Incidents"
                    ? "Search incidents..."
                    : "Search..."
                }
              />

              <kbd>⌘ K</kbd>
            </div>

            <button
              className="icon-button"
              title="Notifications"
              onClick={() => navigate("Incidents")}
            >
              <Bell size={18} />
              <span className="notification-dot" />
            </button>

            <button
              className="icon-button"
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle theme"
            >
              <Moon size={18} />
            </button>

            <button className="operator-button">
              <span className="pulse-dot" />
              Live
            </button>
          </div>
        </header>

        {/* =====================================================
            PAGE INTRO
        ===================================================== */}

        {activeNav !== "Overview" && (
          <section className="page-intro">
            <div>
              <div className="eyebrow">
                <Activity size={14} />
                SENTINEL OPERATIONS
              </div>

              <h3>{activeNav}</h3>

              <p>{pageDescription[activeNav]}</p>
            </div>

            <button
              className={`run-button ${
                running ? "running" : ""
              }`}
              onClick={running ? undefined : runSimulation}
            >
              {running ? (
                <>
                  <Activity size={17} />
                  Running
                </>
              ) : (
                <>
                  <Play size={17} />
                  Run Simulation
                </>
              )}
            </button>
          </section>
        )}

        {/* =====================================================
            OVERVIEW
        ===================================================== */}

        {activeNav === "Overview" && (
          <>
            <section className="hero">
              <div>
                <div className="eyebrow">
                  <Radio size={14} />

                  {running
                    ? "LIVE INCIDENT SIMULATION"
                    : "LIVE OPERATIONS"}
                </div>

                <h3>
                  System health is{" "}
                  <span className="gradient-text">
                    {systemHealth >= 99
                      ? "excellent"
                      : systemHealth >= 97
                      ? "stable"
                      : "recovering"}
                  </span>
                </h3>

                <p>
                  Sentinel is continuously monitoring your
                  infrastructure, detecting anomalies and
                  coordinating incident response.
                </p>

                {running && (
                  <div className="simulation-status">
                    <span className="pulse-dot" />

                    {simulationStep === 1 &&
                      "Collecting telemetry signals..."}

                    {simulationStep === 2 &&
                      "Correlating incident evidence..."}

                    {simulationStep === 3 &&
                      "Executing response workflow..."}

                    {simulationStep === 4 &&
                      "Verifying recovery..."}
                  </div>
                )}
              </div>

              <div className="hero-actions">
                <button
                  className={`run-button ${
                    running ? "running" : ""
                  }`}
                  onClick={
                    running ? undefined : runSimulation
                  }
                >
                  {running ? (
                    <>
                      <Activity size={17} />
                      Simulation Running
                    </>
                  ) : (
                    <>
                      <Play size={17} />
                      Run Simulation
                    </>
                  )}
                </button>

                <button
                  className="secondary-button"
                  onClick={resetSimulation}
                >
                  <FileText size={17} />
                  Reset Demo
                </button>
              </div>
            </section>

            <Metrics
              incidents={incidents}
              systemHealth={systemHealth}
              responseTime={responseTime}
              resolvedToday={resolvedToday}
              running={running}
            />

            <section className="dashboard-grid">
              <IncidentPanel
                incidents={filteredIncidents}
                selectedIncident={selectedIncident}
                onSelect={selectIncident}
              />

              <IntelligencePanel
                aiScore={aiScore}
                aiStatus={aiStatus}
                running={running}
                simulationStep={simulationStep}
                onRun={runSimulation}
                incidentSummary={incidentSummary}
              />
            </section>

            <section className="dashboard-grid lower">
              <TimelinePanel
                timeline={timeline}
                selectedIncident={selectedIncident}
              />

              <ServicesPanel
                running={running}
                simulationStep={simulationStep}
              />
            </section>
          </>
        )}

        {/* =====================================================
            INCIDENTS
        ===================================================== */}

        {activeNav === "Incidents" && (
          <IncidentsView
            incidents={filteredIncidents}
            selectedIncident={selectedIncident}
            onSelect={selectIncident}
            onRun={runSimulation}
            running={running}
          />
        )}

        {/* =====================================================
            TIMELINE
        ===================================================== */}

        {activeNav === "Timeline" && (
          <TimelineView
            timeline={timeline}
            selectedIncident={selectedIncident}
          />
        )}

        {/* =====================================================
            SERVICES
        ===================================================== */}

        {activeNav === "Services" && (
          <ServicesView
            running={running}
            simulationStep={simulationStep}
          />
        )}

        {/* =====================================================
            INTELLIGENCE
        ===================================================== */}

        {activeNav === "Intelligence" && (
          <IntelligenceView
            aiScore={aiScore}
            aiStatus={aiStatus}
            running={running}
            simulationStep={simulationStep}
            onRun={runSimulation}
          />
        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer>
          <div>
            <span className="pulse-dot" />

            {running
              ? "Sentinel is actively responding"
              : "All systems operational"}
          </div>

          <div className="footer-right">
            <span>Sentinel v1.0</span>
            <span>•</span>
            <span>
              {running
                ? "Live simulation"
                : "Last updated just now"}
            </span>
          </div>
        </footer>
      </main>

      {/* =====================================================
          INCIDENT DETAIL MODAL
      ===================================================== */}

      {showIncidentDetails && (
        <IncidentModal
          incident={selectedIncident}
          onClose={() => setShowIncidentDetails(false)}
          onRun={runSimulation}
          running={running}
        />
      )}
    </div>
  );
}

/* =========================================================
   METRICS
========================================================= */

function Metrics({
  incidents,
  systemHealth,
  responseTime,
  resolvedToday,
  running,
}) {
  const activeCount = incidents.filter(
    (incident) => incident.status !== "Resolved"
  ).length;

  return (
    <section className="metrics">
      <Metric
        icon={<AlertTriangle />}
        label="Active Incidents"
        value={String(activeCount).padStart(2, "0")}
        change={running ? "-1" : "+2"}
        negative={!running}
      />

      <Metric
        icon={<Zap />}
        label="System Health"
        value={`${systemHealth.toFixed(1)}%`}
        change={running ? "+0.5%" : "+1.4%"}
      />

      <Metric
        icon={<Clock3 />}
        label="Avg. Response"
        value={responseTime}
        change={running ? "-21%" : "-18%"}
      />

      <Metric
        icon={<CheckCircle2 />}
        label="Resolved Today"
        value={resolvedToday}
        change={running ? "+1" : "+12%"}
      />
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  change,
  negative,
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>

      <div className="metric-content">
        <span>{label}</span>

        <strong>{value}</strong>

        <small className={negative ? "negative" : ""}>
          {change} from yesterday
        </small>
      </div>

      <Activity
        className="metric-activity"
        size={28}
      />
    </div>
  );
}

/* =========================================================
   PANEL HEADER
========================================================= */

function PanelHeader({
  icon,
  title,
  subtitle,
  action,
  onAction,
}) {
  return (
    <div className="panel-header">
      <div className="panel-title">
        <div className="panel-icon">{icon}</div>

        <div>
          <h4>{title}</h4>
          <span>{subtitle}</span>
        </div>
      </div>

      {action && (
        <button
          className="panel-action"
          onClick={onAction}
        >
          {action}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

/* =========================================================
   INCIDENT PANEL
========================================================= */

function IncidentPanel({
  incidents,
  selectedIncident,
  onSelect,
}) {
  return (
    <div className="panel incidents-panel">
      <PanelHeader
        icon={<AlertTriangle />}
        title="Active Incidents"
        subtitle="Real-time incident queue"
        action="View all"
      />

      <div className="incident-list">
        {incidents.length === 0 ? (
          <div className="empty-state">
            <Search size={22} />
            <strong>No incidents found</strong>
            <span>
              Try searching by incident ID, service or title.
            </span>
          </div>
        ) : (
          incidents.map((incident) => (
            <button
              key={incident.id}
              className={`incident-row ${
                selectedIncident.id === incident.id
                  ? "selected"
                  : ""
              }`}
              onClick={() => onSelect(incident)}
            >
              <div
                className={`severity ${incident.severity.toLowerCase()}`}
              >
                <span />
              </div>

              <div className="incident-main">
                <div className="incident-title">
                  {incident.title}
                </div>

                <div className="incident-meta">
                  <span>{incident.id}</span>
                  <span>•</span>
                  <span>{incident.service}</span>
                </div>
              </div>

              <div className="incident-right">
                <span
                  className={`status ${incident.status
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                >
                  {incident.status}
                </span>

                <span className="incident-time">
                  {incident.time}
                </span>
              </div>

              <ChevronRight size={17} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* =========================================================
   INCIDENTS VIEW
========================================================= */

function IncidentsView({
  incidents,
  selectedIncident,
  onSelect,
  onRun,
  running,
}) {
  return (
    <section className="full-view">
      <div className="view-toolbar">
        <div>
          <strong>{incidents.length} incidents</strong>
          <span>Current incident queue</span>
        </div>

        <button
          className={`run-button ${running ? "running" : ""}`}
          onClick={running ? undefined : onRun}
        >
          {running ? (
            <>
              <Activity size={16} />
              Processing
            </>
          ) : (
            <>
              <Play size={16} />
              Simulate Incident
            </>
          )}
        </button>
      </div>

      <div className="incident-detail-grid">
        <div className="panel">
          <PanelHeader
            icon={<AlertTriangle />}
            title="Incident Queue"
            subtitle="All detected operational events"
          />

          <div className="large-incident-list">
            {incidents.map((incident) => (
              <button
                className={`large-incident ${
                  selectedIncident.id === incident.id
                    ? "selected"
                    : ""
                }`}
                key={incident.id}
                onClick={() => onSelect(incident)}
              >
                <div
                  className={`severity ${incident.severity.toLowerCase()}`}
                >
                  <span />
                </div>

                <div className="large-incident-content">
                  <div className="large-incident-top">
                    <strong>{incident.title}</strong>

                    <span
                      className={`status ${incident.status
                        .toLowerCase()
                        .replaceAll(" ", "-")}`}
                    >
                      {incident.status}
                    </span>
                  </div>

                  <p>{incident.description}</p>

                  <div className="incident-meta">
                    <span>{incident.id}</span>
                    <span>•</span>
                    <span>{incident.service}</span>
                    <span>•</span>
                    <span>Impact: {incident.impact}</span>
                  </div>
                </div>

                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </div>

        <div className="panel incident-summary-panel">
          <PanelHeader
            icon={<Target />}
            title="Incident Focus"
            subtitle="Selected incident"
          />

          <div className="incident-focus">
            <div
              className={`focus-severity ${selectedIncident.severity.toLowerCase()}`}
            >
              {selectedIncident.severity}
            </div>

            <h3>{selectedIncident.title}</h3>

            <span className="focus-id">
              {selectedIncident.id}
            </span>

            <p>{selectedIncident.description}</p>

            <div className="focus-stats">
              <FocusStat
                label="Status"
                value={selectedIncident.status}
              />

              <FocusStat
                label="Impact"
                value={selectedIncident.impact}
              />

              <FocusStat
                label="Service"
                value={selectedIncident.service}
              />

              <FocusStat
                label="Detected"
                value={selectedIncident.time}
              />
            </div>

            <button
              className="action-button wide"
              onClick={onRun}
              disabled={running}
            >
              {running
                ? "Sentinel is responding..."
                : "Start AI Response Workflow"}

              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FocusStat({ label, value }) {
  return (
    <div className="focus-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   TIMELINE PANEL
========================================================= */

function TimelinePanel({
  timeline,
  selectedIncident,
}) {
  return (
    <div className="panel timeline-panel">
      <PanelHeader
        icon={<MessageSquare />}
        title="Incident Timeline"
        subtitle={`${selectedIncident.id} • ${selectedIncident.title}`}
        action="View timeline"
      />

      <div className="timeline">
        {timeline.slice(-6).map((item, index) => (
          <TimelineItem
            key={`${item.time}-${index}`}
            item={item}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({ item, index }) {
  return (
    <div className="timeline-item" key={index}>
      <div className={`timeline-dot ${item.type}`}>
        {item.type === "ai" ? (
          <Bot size={14} />
        ) : (
          <Users size={14} />
        )}
      </div>

      <div className="timeline-line" />

      <div className="timeline-content">
        <div className="timeline-header">
          <strong>{item.actor}</strong>

          <span>{item.role}</span>

          <time>{item.time}</time>
        </div>

        <p>{item.message}</p>
      </div>
    </div>
  );
}

/* =========================================================
   TIMELINE VIEW
========================================================= */

function TimelineView({
  timeline,
  selectedIncident,
}) {
  return (
    <section className="full-view">
      <div className="timeline-overview">
        <div className="mini-stat">
          <Clock3 size={19} />
          <div>
            <strong>{timeline.length}</strong>
            <span>Events recorded</span>
          </div>
        </div>

        <div className="mini-stat">
          <Bot size={19} />
          <div>
            <strong>
              {timeline.filter(
                (item) => item.type === "ai"
              ).length}
            </strong>
            <span>AI actions</span>
          </div>
        </div>

        <div className="mini-stat">
          <Users size={19} />
          <div>
            <strong>
              {timeline.filter(
                (item) => item.type === "human"
              ).length}
            </strong>
            <span>Human actions</span>
          </div>
        </div>
      </div>

      <div className="panel full-timeline-panel">
        <PanelHeader
          icon={<Clock3 />}
          title="Unified Incident Timeline"
          subtitle={`${selectedIncident.id} • All operational events`}
        />

        <div className="full-timeline">
          {timeline.map((item, index) => (
            <TimelineItem
              key={`${item.time}-${index}`}
              item={item}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   SERVICES PANEL
========================================================= */

function ServicesPanel({
  running,
  simulationStep,
}) {
  return (
    <div className="panel services-panel">
      <PanelHeader
        icon={<Server />}
        title="Service Health"
        subtitle="Current infrastructure status"
      />

      <div className="service-list">
        {services.map((service, index) => {
          const currentValue = getServiceValue(
            service.value,
            index,
            running,
            simulationStep
          );

          const currentStatus =
            currentValue >= 98
              ? "Operational"
              : "Degraded";

          return (
            <Service
              key={service.name}
              service={service}
              value={currentValue}
              status={currentStatus}
            />
          );
        })}
      </div>
    </div>
  );
}

function Service({
  service,
  value,
  status,
}) {
  const Icon = service.icon;

  return (
    <div className="service">
      <div className="service-info">
        <div className="service-icon">
          <Icon size={16} />
        </div>

        <div>
          <strong>{service.name}</strong>
          <span>{status}</span>
        </div>
      </div>

      <div className="service-health">
        <div className="health-bar">
          <span style={{ width: `${value}%` }} />
        </div>

        <strong>{value}%</strong>
      </div>
    </div>
  );
}

function getServiceValue(
  original,
  index,
  running,
  step
) {
  if (!running) return original;

  if (index === 0) {
    return step >= 3 ? 99 : 96;
  }

  if (index === 1) {
    return step >= 2 ? 98 : 95;
  }

  if (index === 2) {
    return 99;
  }

  if (index === 3) {
    return step >= 3 ? 97 : 93;
  }

  return original;
}

/* =========================================================
   SERVICES VIEW
========================================================= */

function ServicesView({
  running,
  simulationStep,
}) {
  return (
    <section className="full-view">
      <div className="service-summary-grid">
        <ServiceSummary
          icon={<Gauge />}
          title="Overall Health"
          value={
            running
              ? simulationStep >= 3
                ? "99.2%"
                : "96.8%"
              : "98.7%"
          }
          subtitle="Across monitored services"
        />

        <ServiceSummary
          icon={<Activity />}
          title="Requests / sec"
          value="18.4K"
          subtitle="+8.2% from baseline"
        />

        <ServiceSummary
          icon={<Clock3 />}
          title="Avg. Latency"
          value={running ? "91ms" : "84ms"}
          subtitle="P95 response time"
        />

        <ServiceSummary
          icon={<CircleCheck />}
          title="Availability"
          value="99.96%"
          subtitle="Last 30 days"
        />
      </div>

      <div className="panel service-table-panel">
        <PanelHeader
          icon={<Server />}
          title="Infrastructure Health"
          subtitle="Live service telemetry"
        />

        <div className="service-detail-list">
          {services.map((service, index) => {
            const value = getServiceValue(
              service.value,
              index,
              running,
              simulationStep
            );

            const status =
              value >= 98
                ? "Operational"
                : "Degraded";

            const Icon = service.icon;

            return (
              <div
                className="service-detail-row"
                key={service.name}
              >
                <div className="service-detail-name">
                  <div className="service-icon">
                    <Icon size={17} />
                  </div>

                  <div>
                    <strong>{service.name}</strong>
                    <span>{service.status}</span>
                  </div>
                </div>

                <div className="service-detail-health">
                  <div className="health-bar">
                    <span
                      style={{
                        width: `${value}%`,
                      }}
                    />
                  </div>

                  <strong>{value}%</strong>
                </div>

                <div className="service-detail-stat">
                  <span>Latency</span>
                  <strong>{service.latency}</strong>
                </div>

                <div className="service-detail-stat">
                  <span>Uptime</span>
                  <strong>{service.uptime}</strong>
                </div>

                <span
                  className={`service-status ${
                    status === "Operational"
                      ? "operational"
                      : "degraded"
                  }`}
                >
                  {status}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ServiceSummary({
  icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div className="panel service-summary-card">
      <div className="service-summary-icon">
        {icon}
      </div>

      <span>{title}</span>

      <strong>{value}</strong>

      <small>{subtitle}</small>
    </div>
  );
}

/* =========================================================
   INTELLIGENCE PANEL
========================================================= */

function IntelligencePanel({
  aiScore,
  aiStatus,
  running,
  simulationStep,
  onRun,
  incidentSummary,
}) {
  return (
    <div className="panel intelligence-panel">
      <PanelHeader
        icon={<Sparkles />}
        title="AI Intelligence"
        subtitle="Sentinel analysis engine"
      />

      <div className="ai-score">
        <div className="score-ring">
          <div>
            <strong>{aiScore}</strong>
            <span>/100</span>
          </div>
        </div>

        <div>
          <strong>{aiStatus}</strong>

          <p>
            Sentinel has correlated{" "}
            {running ? 23 : 17} signals across 6
            services.
          </p>
        </div>
      </div>

      <div className="insight">
        <div className="insight-icon">
          <Cpu size={18} />
        </div>

        <div>
          <strong>
            {running
              ? "Live root cause analysis"
              : "Root cause candidate"}
          </strong>

          <p>
            {incidentSummary?.facts?.[0]?.statement ||
               "Recent payment-service deployment is the most probable source of the current degradation."}
          </p>
        </div>
      </div>

      <div className="recommendation">
        <div className="recommendation-top">
          <span>
            {running
              ? "RESPONSE WORKFLOW"
              : "RECOMMENDED ACTION"}
          </span>

          <Sparkles size={15} />
        </div>

        <strong>
          {running
            ? simulationStep >= 3
              ? "Rollback verified successfully"
              : "Rollback deployment v4.8.2"
            : "Rollback deployment v4.8.2"}
        </strong>

        <p>
          Estimated recovery probability:{" "}
          <b>{running ? "96%" : "91%"}</b>
        </p>

        <button
          className="action-button"
          onClick={onRun}
          disabled={running}
        >
          {running
            ? "Processing..."
            : "Review action"}

          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   INTELLIGENCE VIEW
========================================================= */

function IntelligenceView({
  aiScore,
  aiStatus,
  running,
  simulationStep,
  onRun,
}) {
  return (
    <section className="full-view">
      <div className="ai-dashboard-grid">
        <div className="panel ai-command-panel">
          <div className="ai-command-content">
            <div className="ai-large-icon">
              <Brain size={30} />
            </div>

            <div>
              <div className="eyebrow">
                <Sparkles size={13} />
                SENTINEL AI ENGINE
              </div>

              <h3>{aiStatus}</h3>

              <p>
                Sentinel continuously evaluates telemetry,
                deployment changes, historical incidents and
                human observations to generate evidence-backed
                recommendations.
              </p>
            </div>
          </div>

          <button
            className={`run-button ${
              running ? "running" : ""
            }`}
            onClick={running ? undefined : onRun}
          >
            {running ? (
              <>
                <Activity size={16} />
                AI Analysis Running
              </>
            ) : (
              <>
                <Play size={16} />
                Start Analysis
              </>
            )}
          </button>
        </div>

        <div className="panel ai-confidence-panel">
          <div className="score-ring large">
            <div>
              <strong>{aiScore}</strong>
              <span>CONFIDENCE</span>
            </div>
          </div>

          <strong>Evidence confidence</strong>

          <p>
            Based on correlated signals, historical patterns and
            current system telemetry.
          </p>
        </div>
      </div>

      <div className="ai-insight-grid">
        <AIInsight
          icon={<Target />}
          title="Root Cause Analysis"
          value="Deployment v4.8.2"
          description="Strong correlation detected between deployment timing and payment degradation."
          confidence="94%"
        />

        <AIInsight
          icon={<Network />}
          title="Signal Correlation"
          value="23 signals"
          description="Application, infrastructure and deployment signals are currently aligned."
          confidence="91%"
        />

        <AIInsight
          icon={<TrendingUp />}
          title="Recovery Forecast"
          value="96% likely"
          description="Current remediation path has a high probability of restoring normal service."
          confidence="96%"
        />
      </div>

      <div className="panel evidence-panel">
        <PanelHeader
          icon={<Layers />}
          title="Evidence Graph"
          subtitle="How Sentinel reached the current conclusion"
        />

        <div className="evidence-flow">
          <EvidenceNode
            icon={<Server />}
            title="Telemetry"
            value="18 signals"
          />

          <ChevronRight className="evidence-arrow" />

          <EvidenceNode
            icon={<GitBranch />}
            title="Deployment"
            value="v4.8.2"
          />

          <ChevronRight className="evidence-arrow" />

          <EvidenceNode
            icon={<AlertTriangle />}
            title="Incident"
            value="INC-2048"
          />

          <ChevronRight className="evidence-arrow" />

          <EvidenceNode
            icon={<Sparkles />}
            title="AI Decision"
            value="Rollback"
          />
        </div>
      </div>
    </section>
  );
}

function AIInsight({
  icon,
  title,
  value,
  description,
  confidence,
}) {
  return (
    <div className="panel ai-insight-card">
      <div className="ai-insight-icon">
        {icon}
      </div>

      <span>{title}</span>

      <strong>{value}</strong>

      <p>{description}</p>

      <div className="confidence-row">
        <span>Confidence</span>
        <b>{confidence}</b>
      </div>
    </div>
  );
}

function EvidenceNode({
  icon,
  title,
  value,
}) {
  return (
    <div className="evidence-node">
      <div>{icon}</div>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   INCIDENT MODAL
========================================================= */

function IncidentModal({
  incident,
  onClose,
  onRun,
  running,
}) {
  return (
    <div className="modal-overlay">
      <div className="incident-modal">
        <div className="modal-header">
          <div>
            <span className="modal-kicker">
              INCIDENT DETAILS
            </span>

            <h3>{incident.title}</h3>

            <span className="modal-id">
              {incident.id}
            </span>
          </div>

          <button
            className="icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-status-row">
          <span
            className={`status ${incident.status
              .toLowerCase()
              .replaceAll(" ", "-")}`}
          >
            {incident.status}
          </span>

          <span className="modal-service">
            {incident.service}
          </span>

          <span className="modal-impact">
            Impact: {incident.impact}
          </span>
        </div>

        <p className="modal-description">
          {incident.description}
        </p>

        <div className="modal-grid">
          <FocusStat
            label="Severity"
            value={incident.severity}
          />

          <FocusStat
            label="Status"
            value={incident.status}
          />

          <FocusStat
            label="Service"
            value={incident.service}
          />

          <FocusStat
            label="Detected"
            value={incident.time}
          />
        </div>

        <div className="modal-ai">
          <div className="ai-icon">
            <Bot size={19} />
          </div>

          <div>
            <strong>Sentinel recommendation</strong>

            <p>
              Rollback deployment v4.8.2 and monitor payment
              error rate for recovery confirmation.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="secondary-button"
            onClick={onClose}
          >
            Close
          </button>

          <button
            className="run-button"
            onClick={onRun}
            disabled={running}
          >
            {running ? (
              <>
                <Activity size={16} />
                Processing
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Run AI Response
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
