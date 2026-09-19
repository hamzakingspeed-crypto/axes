import { useEffect, useMemo, useState } from 'react';

const initialArtifacts = [
  { id: 1, type: 'notes', title: 'Morning brief', content: 'Check priorities, review inbox, and prep launch notes.' },
  { id: 2, type: 'web', title: 'Web result', content: 'OpenAI Realtime + desktop AI companion strategies were reviewed.' },
  { id: 3, type: 'code', title: 'Snippet', content: 'const voiceSession = await openai.beta.realtime.sessions.create({ model: "gpt-realtime-2" });' },
  { id: 4, type: 'table', title: 'Task progress', content: 'Research 80% • Draft UI 60% • Voice setup 90%' },
];

type Artifact = {
  id: number;
  type: string;
  title: string;
  content: string;
};

export default function App() {
  const [mode, setMode] = useState<'display' | 'computer'>('display');
  const [listening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [artifacts, setArtifacts] = useState<Artifact[]>(initialArtifacts);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await window.axes.getConfig();
      if (config.mode === 'computer') {
        setMode('computer');
      }
    };

    fetchConfig().catch(() => {});
  }, []);

  const orbStyle = useMemo(
    () => ({
      transform: isSpeaking ? 'scale(1.08)' : 'scale(1)',
      boxShadow: isSpeaking
        ? '0 0 40px rgba(86, 185, 255, 0.9), 0 0 90px rgba(118, 102, 255, 0.65)'
        : '0 0 26px rgba(86, 185, 255, 0.4)',
    }),
    [isSpeaking]
  );

  const handleAddNote = () => {
    setArtifacts((current) => [
      {
        id: Date.now(),
        type: 'notes',
        title: 'New note',
        content: 'Axes logged a follow-up for the next work cycle.',
      },
      ...current,
    ]);
  };

  const handleTaskUpdate = () => {
    setArtifacts((current) => current.map((artifact) =>
      artifact.type === 'table'
        ? {
            ...artifact,
            content: 'Research 100% • Draft UI 75% • Voice setup 95% • Ready for live test',
          }
        : artifact
    ));
  };

  return (
    <div className={`app-shell ${expanded ? 'expanded' : ''}`}>
      <aside className="companion-panel">
        <div className="topbar">
          <div>
            <div className="eyebrow">AI COMPANION</div>
            <h1>Axes</h1>
          </div>
          <div className="mode-toggle">
            <button
              className={mode === 'display' ? 'active' : ''}
              onClick={() => setMode('display')}
            >
              Display
            </button>
            <button
              className={mode === 'computer' ? 'active' : ''}
              onClick={() => setMode('computer')}
            >
              Computer use
            </button>
          </div>
        </div>

        <div className="orb-wrap">
          <div className="orb-ring" />
          <div className="orb-core" style={orbStyle}>
            <div className="orb-glow" />
          </div>
        </div>

        <div className="voice-controls">
          <button className="primary" onClick={() => setListening((value) => !value)}>
            {listening ? 'Mute mic' : 'Listen'}
          </button>
          <button onClick={() => setIsSpeaking((value) => !value)}>Toggle voice</button>
        </div>

        <div className="status-box">
          <span>Mode</span>
          <strong>{mode === 'display' ? 'Display mode' : 'Computer use'}</strong>
          <small>{listening ? 'Listening for input' : 'Standby'}</small>
        </div>

        <textarea
          value={transcript || 'Ask Axes for a summary, a search, or a workflow update.'}
          onChange={(event) => setTranscript(event.target.value)}
          rows={6}
        />

        <div className="quick-actions">
          <button onClick={handleAddNote}>New note</button>
          <button onClick={handleTaskUpdate}>Update task</button>
          <button onClick={() => setExpanded((value) => !value)}>
            {expanded ? 'Collapse panel' : 'Expand panel'}
          </button>
        </div>
      </aside>

      <main className="artifact-panel">
        <div className="panel-header">
          <h2>Artifacts</h2>
          <span>{artifacts.length} active</span>
        </div>

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
    </div>
  );
}
