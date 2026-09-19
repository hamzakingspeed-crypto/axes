import { useEffect, useMemo, useState } from 'react';

type Artifact = {
  id: number;
  type: string;
  title: string;
  content: string;
};

const starterArtifacts: Artifact[] = [
  { id: 1, type: 'menu', title: 'Primary menu', content: 'Overview / Notes / Search / Automations / Security' },
  { id: 2, type: 'web', title: 'Web result', content: 'OpenAI Realtime + agentic desktop workflows are functional for a focused companion UI.' },
  { id: 3, type: 'graphics', title: 'Orb status', content: 'Signal clean / voice ready / background tool threads stable / no blockers.' },
  { id: 4, type: 'notes', title: 'Quick note', content: 'Keep the UX simple: calm operator voice, clear status, fast tasks, minimal friction.' },
  { id: 5, type: 'table', title: 'Database table', content: 'notes | tasks | progress | session_state' },
  { id: 6, type: 'code', title: 'Code snippet', content: 'const session = await openai.beta.realtime.sessions.create({ model: "gpt-realtime-2" });' },
  { id: 7, type: 'task', title: 'Task progress', content: 'Research 100% • Voice session 96% • Computer use 72% • Artifact panel 90%' },
];

export default function App() {
  const [mode, setMode] = useState<'display' | 'computer'>('display');
  const [listening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [artifacts, setArtifacts] = useState<Artifact[]>(starterArtifacts);
  const [expanded, setExpanded] = useState(false);
  const [pendingRisk, setPendingRisk] = useState<string | null>(null);
  const [status, setStatus] = useState('Standby');
  const [backendReady, setBackendReady] = useState(false);

  useEffect(() => {
    const axesApi = (window as any).axes;

    const hydrate = async () => {
      try {
        if (axesApi?.getConfig) {
          const config = await axesApi.getConfig();
          if (config?.mode === 'computer') setMode('computer');
        }
      } catch {
        // This page also runs in the browser, where Electron preload is absent.
      }

      try {
        const res = await fetch('http://localhost:3001/api/config');
        if (!res.ok) throw new Error('backend unavailable');
        const config = await res.json();
        setBackendReady(Boolean(config.hasOpenAIKey));
        setStatus(config.hasOpenAIKey ? 'OpenAI key detected' : 'Key missing: add OPENAI_API_KEY to .env');
      } catch {
        setBackendReady(false);
        setStatus('Backend not ready');
      }
    };

    hydrate();
  }, []);

  useEffect(() => {
    const loadArtifacts = async () => {
      try {
        const [notesRes, tasksRes] = await Promise.all([
          fetch('http://localhost:3001/api/notes'),
          fetch('http://localhost:3001/api/tasks'),
        ]);

        if (!notesRes.ok || !tasksRes.ok) return;

        const notes = await notesRes.json();
        const tasks = await tasksRes.json();

        const mapped: Artifact[] = [
          ...notes.slice(0, 2).map((note: any) => ({
            id: Number(note.id),
            type: 'notes',
            title: note.title,
            content: note.content,
          })),
          ...tasks.slice(0, 2).map((task: any) => ({
            id: Number(task.id),
            type: 'task',
            title: task.title,
            content: `${task.status} • ${task.detail || 'No detail'} `,
          })),
        ];

        if (mapped.length > 0) {
          setArtifacts(mapped);
        }
      } catch {
        // Ignore local backend startup failures here; the app still renders with starter cards.
      }
    };

    loadArtifacts();
  }, []);

  const orbStyle = useMemo(() => ({
    transform: isSpeaking ? 'scale(1.08)' : 'scale(1)',
    boxShadow: isSpeaking
      ? '0 0 42px rgba(86, 185, 255, 0.9), 0 0 90px rgba(118, 102, 255, 0.65)'
      : '0 0 26px rgba(86, 185, 255, 0.4)',
  }), [isSpeaking]);

  const handleRiskAction = (actionLabel: string) => setPendingRisk(actionLabel);

  const confirmRisk = () => {
    if (!pendingRisk) return;
    setArtifacts((current) => [{
      id: Date.now(),
      type: 'task',
      title: 'Permission granted',
      content: `${pendingRisk} was paused for approval and then confirmed.`,
    }, ...current]);
    setPendingRisk(null);
  };

  const handleAddNote = async () => {
    const title = 'Follow-up';
    const content = 'Axes logged a follow-up for the next work cycle.';

    try {
      const res = await fetch('http://localhost:3001/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (res.ok) {
        const created = await res.json();
        setArtifacts((current) => [{
          id: Number(created.id),
          type: 'notes',
          title: created.title,
          content: created.content,
        }, ...current]);
      }
    } catch {
      setArtifacts((current) => [{
        id: Date.now(),
        type: 'notes',
        title,
        content,
      }, ...current]);
    }
  };

  const handleTaskUpdate = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Live test pass',
          status: 'in_progress',
          detail: 'Voice session, artifact panel, and desktop shell are being validated.',
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setArtifacts((current) => [{
          id: Number(created.id),
          type: 'task',
          title: created.title,
          content: `${created.status} • ${created.detail}`,
        }, ...current]);
      }
    } catch {
      setArtifacts((current) => current.map((artifact) =>
        artifact.type === 'task'
          ? { ...artifact, content: 'Research 100% • Voice session 98% • Computer use 78% • Artifact panel 92%' }
          : artifact
      ));
    }
  };

  const handleListen = async () => {
    const nextState = !listening;
    setListening(nextState);

    if (!nextState) {
      setStatus('Listening stopped');
      setIsSpeaking(false);
      return;
    }

    setStatus('Creating realtime session...');
    try {
      const res = await fetch('http://localhost:3001/api/openai/realtime/session', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Realtime session failed');
      }

      setStatus('Realtime session ready');
      setIsSpeaking(true);
      setTranscript((current) => current || 'Session ready. Say: “Give me a quick status update.”');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Session could not start');
      setListening(false);
      setIsSpeaking(false);
    }
  };

  return (
    <div className={`app-shell ${expanded ? 'expanded' : ''}`}>
      <aside className="companion-panel">
        <div className="topbar">
          <div><div className="eyebrow">AI COMPANION</div><h1>Axes</h1></div>
          <div className="mode-toggle">
            <button className={mode === 'display' ? 'active' : ''} onClick={() => setMode('display')}>Display</button>
            <button className={mode === 'computer' ? 'active' : ''} onClick={() => setMode('computer')}>Computer use</button>
          </div>
        </div>

        <div className="orb-wrap">
          <div className="orb-ring" />
          <div className="orb-core" style={orbStyle}><div className="orb-glow" /></div>
        </div>

        <div className="voice-controls">
          <button className="primary" onClick={handleListen}>{listening ? 'Mute mic' : 'Listen'}</button>
          <button onClick={() => setIsSpeaking((value) => !value)}>Toggle voice</button>
          <button onClick={() => handleRiskAction('Send a message to someone')}>Risk action</button>
        </div>

        <div className="status-box">
          <span>System</span>
          <strong>{mode === 'display' ? 'Display mode' : 'Computer use'}</strong>
          <small>{status}</small>
          <small>{backendReady ? 'Backend connected' : 'Add OPENAI_API_KEY in .env to enable live voice'}</small>
        </div>

        <textarea value={transcript || 'Ask Axes for a summary, a search, or a workflow update.'} onChange={(event) => setTranscript(event.target.value)} rows={6} />

        <div className="quick-actions">
          <button onClick={handleAddNote}>New note</button>
          <button onClick={handleTaskUpdate}>Update task</button>
          <button onClick={() => setExpanded((value) => !value)}>{expanded ? 'Collapse panel' : 'Expand panel'}</button>
        </div>
      </aside>

      <main className="artifact-panel">
        <div className="panel-header"><h2>Artifacts</h2><span>{artifacts.length} active</span></div>
        <div className="artifact-grid">
          {artifacts.map((artifact) => (
            <article key={artifact.id} className={`artifact ${artifact.type}`}>
              <div className="artifact-tag">{artifact.type}</div>
              <h3>{artifact.title}</h3>
              <p>{artifact.content}</p>
            </article>
          ))}
        </div>
      </main>

      {pendingRisk && (
        <div className="risk-modal">
          <div className="risk-card">
            <h3>Confirmation needed</h3>
            <p>This action is risky: {pendingRisk}. Axes should pause and ask before proceeding.</p>
            <div className="risk-actions">
              <button className="primary" onClick={confirmRisk}>Confirm</button>
              <button onClick={() => setPendingRisk(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
