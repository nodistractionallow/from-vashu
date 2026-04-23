// Logger — stores all session data in localStorage as text
// Each session gets its own entry under a unique key

const SESSION_ID = `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const STORAGE_KEY = 'vashu_logs';

function getTimestamp(): string {
  return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
}

function getElapsed(start: number): string {
  const sec = Math.round((Date.now() - start) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface SessionData {
  id: string;
  startTime: string;
  startTs: number;
  events: string[];
  endTime?: string;
  duration?: string;
}

let _session: SessionData | null = null;

function loadAll(): Record<string, SessionData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, SessionData>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Logger: localStorage full or unavailable', e);
  }
}

export const logger = {
  sessionStart() {
    _session = {
      id: SESSION_ID,
      startTime: getTimestamp(),
      startTs: Date.now(),
      events: [],
    };
    this.log('SESSION_START');
    this._persist();
  },

  log(message: string) {
    if (!_session) return;
    const ts = getTimestamp();
    const elapsed = getElapsed(_session.startTs);
    const entry = `[${ts}] (+${elapsed}) ${message}`;
    _session.events.push(entry);
    this._persist();
  },

  sessionEnd(durationMs: number) {
    if (!_session) return;
    const sec = Math.round(durationMs / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    _session.endTime = getTimestamp();
    _session.duration = m > 0 ? `${m}m ${s}s` : `${s}s`;
    this.log(`SESSION_END | Total time: ${_session.duration}`);
    this._persist();
  },

  _persist() {
    if (!_session) return;
    const all = loadAll();
    all[SESSION_ID] = _session;
    saveAll(all);
  },

  getAllAsText(): string {
    const all = loadAll();
    const sessions = Object.values(all).sort((a, b) => a.startTs - b.startTs);
    if (sessions.length === 0) return 'No sessions recorded yet.';

    return sessions
      .map((s, idx) => {
        const header = `═══════════════════════════════════════\n  SESSION ${idx + 1} | ${s.id}\n  Started: ${s.startTime}${s.endTime ? `\n  Ended:   ${s.endTime}` : ''}${s.duration ? `\n  Duration: ${s.duration}` : ''}\n═══════════════════════════════════════`;
        const events = s.events.map(e => `  ${e}`).join('\n');
        return `${header}\n${events}`;
      })
      .join('\n\n');
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
