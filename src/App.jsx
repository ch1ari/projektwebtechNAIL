import React, { createContext, useEffect, useMemo, useReducer, useRef } from 'react';
import Board from './components/Board.jsx';
import Palette from './components/Palette.jsx';
import tasks from './data/tasks.json';
import { clamp, rotationDeltaDegrees } from './lib/geometry.js';

export const AppStateContext = createContext();

const paletteColors = [
  '#f06292',
  '#f48fb1',
  '#ffb3c1',
  '#fce4ec',
  '#7ae0c5',
  '#9bf6e6',
  '#7ad6ff',
  '#ffcc80',
  '#ffd6a5',
  '#f28cb0',
  '#f5c1d8',
  '#bde0fe'
];

const firstTaskId = tasks[0]?.id ?? null;

const loadQueue = () => {
  const stored = window.localStorage.getItem('nail-art-queue');
  const validIds = new Set(tasks.map((task) => task.id));
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const filtered = Array.isArray(parsed)
        ? parsed.filter((id) => validIds.has(id))
        : null;
      if (filtered && filtered.length) return filtered;
    } catch (err) {
      return tasks.map((task) => task.id);
    }
  }
  return tasks.map((task) => task.id);
};

const loadStats = () => {
  const stored = window.localStorage.getItem('nail-art-stats');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (err) {
      return {};
    }
  }
  return {};
};

const initialTaskColors = tasks.find((task) => task.id === firstTaskId)?.nailTargets ?? {
  thumb: '#f5c1d8',
  index: '#f5c1d8',
  middle: '#f5c1d8',
  ring: '#f5c1d8',
  pinky: '#f5c1d8'
};

const initialState = {
  currentTaskId: firstTaskId,
  placements: {},
  selectedColor: paletteColors[0],
  nailColors: initialTaskColors,
  showHints: false,
  showTemplate: false,
  lockCorrect: false,
  showStats: false,
  status: 'idle',
  timerRunning: true,
  elapsedMs: 0,
  queue: loadQueue(),
  stats: loadStats()
};

function taskTargets(task) {
  return task?.targets ?? [];
}

function computePlacementCorrectness(task, stickerId, placement) {
  const target = taskTargets(task).find((t) => t.stickerId === stickerId);
  if (!target || !placement) return { placement, isCorrect: false };
  const dx = Math.abs((placement.x ?? 0) - target.targetTransform.x);
  const dy = Math.abs((placement.y ?? 0) - target.targetTransform.y);
  const drot = rotationDeltaDegrees(placement.rotation ?? 0, target.targetTransform.rotation ?? 0);
  const dscale = Math.abs((placement.scale ?? 1) - (target.targetTransform.scale ?? 1));
  const within =
    dx <= (target.tolerance.x ?? 0.02) &&
    dy <= (target.tolerance.y ?? 0.02) &&
    drot <= (target.tolerance.rotation ?? 10) &&
    dscale <= (target.tolerance.scale ?? 0.05);

  if (!within) return { placement, isCorrect: false };
  return { placement: { ...target.targetTransform, isCorrect: true }, isCorrect: true };
}

function appReducer(state, action) {
  switch (action.type) {
    case 'setTask': {
      const nextTask = tasks.find((task) => task.id === action.payload) ?? null;
      return {
        ...state,
        currentTaskId: nextTask?.id ?? null,
        placements: {},
        nailColors: nextTask?.nailTargets ?? state.nailColors,
        selectedColor: paletteColors[0],
        showHints: false,
        showTemplate: false,
        lockCorrect: false,
        timerRunning: true,
        elapsedMs: 0,
        status: 'task:selected'
      };
    }
    case 'setColor': {
      return { ...state, selectedColor: action.payload };
    }
    case 'paintNail': {
      const { nail, color } = action.payload;
      return {
        ...state,
        nailColors: { ...state.nailColors, [nail]: color }
      };
    }
    case 'placeSticker': {
      const { stickerId, position } = action.payload;
      const nextPlacements = { ...state.placements, [stickerId]: position };
      return {
        ...state,
        placements: nextPlacements,
        status: 'editing'
      };
    }
    case 'finalizePlacement': {
      const { stickerId, taskId } = action.payload;
      const task = tasks.find((t) => t.id === taskId);
      const placement = state.placements[stickerId];
      if (!placement) return state;
      const result = computePlacementCorrectness(task, stickerId, placement);
      const updated = { ...state.placements, [stickerId]: { ...placement, ...result.placement } };
      return { ...state, placements: updated };
    }
    case 'removeSticker': {
      const updated = { ...state.placements };
      delete updated[action.payload];
      return { ...state, placements: updated };
    }
    case 'toggleHints':
      return { ...state, showHints: !state.showHints };
    case 'toggleTemplate':
      return { ...state, showTemplate: !state.showTemplate };
    case 'toggleLockCorrect':
      return { ...state, lockCorrect: !state.lockCorrect };
    case 'restart': {
      const task = tasks.find((t) => t.id === state.currentTaskId);
      return {
        ...state,
        placements: {},
        nailColors: task?.nailTargets ?? state.nailColors,
        selectedColor: paletteColors[0],
        elapsedMs: 0,
        timerRunning: true,
        showHints: false,
        showTemplate: false,
        lockCorrect: false,
        status: 'restart'
      };
    }
    case 'solution': {
      const task = tasks.find((t) => t.id === state.currentTaskId);
      const solved = (task?.targets ?? []).reduce((map, target) => {
        map[target.stickerId] = { ...target.targetTransform, isCorrect: true };
        return map;
      }, {});
      return {
        ...state,
        placements: solved,
        nailColors: task?.nailTargets ?? state.nailColors,
        status: 'solved'
      };
    }
    case 'nextLevel': {
      const queue = state.queue.length ? state.queue.slice(1) : loadQueue();
      const nextId = queue[0] ?? tasks[0]?.id;
      return {
        ...state,
        queue,
        currentTaskId: nextId,
        placements: {},
        nailColors: tasks.find((t) => t.id === nextId)?.nailTargets ?? state.nailColors,
        selectedColor: paletteColors[0],
        elapsedMs: 0,
        timerRunning: true
      };
    }
    case 'queue:update':
      return { ...state, queue: action.payload };
    case 'toggleStats':
      return { ...state, showStats: !state.showStats };
    case 'timer:tick':
      if (!state.timerRunning) return state;
      return { ...state, elapsedMs: state.elapsedMs + (action.deltaMs ?? 0) };
    case 'timer:toggle':
      return { ...state, timerRunning: !state.timerRunning };
    case 'stats:update': {
      const { taskId, payload } = action;
      return { ...state, stats: { ...state.stats, [taskId]: payload } };
    }
    default:
      return state;
  }
}

function useAppState() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const currentTask = useMemo(
    () => tasks.find((task) => task.id === state.currentTaskId) ?? null,
    [state.currentTaskId]
  );

  useEffect(() => {
    window.localStorage.setItem('nail-art-queue', JSON.stringify(state.queue));
  }, [state.queue]);

  useEffect(() => {
    window.localStorage.setItem('nail-art-stats', JSON.stringify(state.stats));
  }, [state.stats]);

  useEffect(() => {
    const handle = setInterval(() => {
      dispatch({ type: 'timer:tick', deltaMs: 500 });
    }, 500);
    return () => clearInterval(handle);
  }, []);

  return useMemo(
    () => ({ state, dispatch, currentTask, tasks, paletteColors }),
    [state, dispatch, currentTask]
  );
}

function TopBar({ app }) {
  const elapsedSec = Math.round(app.state.elapsedMs / 1000);
  const totalTargets = app.currentTask?.targets?.length ?? 0;
  const correctCount = Object.values(app.state.placements).filter((p) => p?.isCorrect).length;
  const nailsCorrect = Object.entries(app.currentTask?.nailTargets ?? {}).filter(
    ([key, target]) => app.state.nailColors[key] === target
  ).length;

  return (
    <header className="top-bar">
      <div className="brand-block">
        <div className="brand">Nail Art Match</div>
        <div className="subtitle">Nail salon puzzle pre dievčatá</div>
      </div>
      <div className="top-progress">
        <span className="pill">{app.currentTask?.title ?? app.currentTask?.name}</span>
        <span className="pill muted">{app.currentTask?.difficulty ?? 'easy'}</span>
        <span className="pill">
          ⏱ {elapsedSec}s
        </span>
        <span className="pill">✨ Stickers {correctCount}/{totalTargets}</span>
        <span className="pill">🎨 Nechty {nailsCorrect}/5</span>
      </div>
    </header>
  );
}

function Toolbelt({ app, boardRef }) {
  return (
    <div className="toolbelt panel">
      <div className="tool-section color-section">
        <div className="section-heading">Paleta lakov</div>
        <p className="muted">Potiahni alebo klikni na necht pre zafarbenie.</p>
        <div className="color-shelf">
          {app.paletteColors.map((color) => (
            <button
              key={color}
              className={`swatch ${app.state.selectedColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => app.dispatch({ type: 'setColor', payload: color })}
              aria-label={`Select ${color}`}
            />
          ))}
        </div>
      </div>
      <div className="tool-section sticker-section">
        <div className="section-heading">Box s nálepkami</div>
        <p className="muted">Potiahni nálepku na nechty, klepnutie ju otočí o 15°.</p>
        <Palette
          boardRef={boardRef}
          stickers={app.currentTask?.stickers ?? []}
          placements={app.state.placements}
          dispatch={app.dispatch}
          lockCorrect={app.state.lockCorrect}
        />
      </div>
    </div>
  );
}

function RightPanel({ app }) {
  const plannedCoverage = clamp(
    Math.round((Object.keys(app.state.placements).length / 5) * 100),
    0,
    100
  );

  const correctCount = Object.values(app.state.placements).filter((p) => p?.isCorrect).length;
  const totalTargets = app.currentTask?.targets?.length ?? 0;
  const elapsedSec = Math.round(app.state.elapsedMs / 1000);
  const nailsCorrect = Object.entries(app.currentTask?.nailTargets ?? {}).filter(
    ([key, target]) => app.state.nailColors[key] === target
  ).length;

  return (
    <aside className="panel right-panel">
      <h2>Popis & návod</h2>
      <div className="helper-card">
        <ul>
          <li>Porovnaj s klientskou kartou a udrž farby aj ozdoby presne.</li>
          <li>Šablóna a duchovia sú len náhľad – nezastavia ťahanie.</li>
          <li>Reštart vymaže lak aj ozdoby, Riešenie ťa naučí správny tvar.</li>
        </ul>
      </div>
      <div className="client-brief">
        <h3>Klientsky request</h3>
        <p>{app.currentTask?.clientRequest}</p>
      </div>
      <div className="stat-grid">
        <div className="stat">
          <span className="label">Stickers</span>
          <span className="value">{correctCount}/{totalTargets}</span>
        </div>
        <div className="stat">
          <span className="label">Nechty</span>
          <span className="value">{nailsCorrect}/5</span>
        </div>
        <div className="stat">
          <span className="label">Rozmiestnené</span>
          <span className="value">{Object.keys(app.state.placements).length}</span>
        </div>
        <div className="stat">
          <span className="label">Čas</span>
          <span className="value">{elapsedSec}s</span>
        </div>
        <div className="stat">
          <span className="label">Plán pokrytia</span>
          <span className="value">{plannedCoverage}%</span>
        </div>
      </div>
      <div className="control-row">
        <button onClick={() => app.dispatch({ type: 'restart' })}>Reštart</button>
        <button onClick={() => app.dispatch({ type: 'nextLevel' })}>Ďalšia</button>
      </div>
      <div className="control-row">
        <button onClick={() => app.dispatch({ type: 'toggleHints' })}>
          {app.state.showHints ? 'Skryť hint' : 'Hint duch'}
        </button>
        <button onClick={() => app.dispatch({ type: 'toggleTemplate' })}>
          {app.state.showTemplate ? 'Skryť šablónu' : 'Šablóna'}
        </button>
      </div>
      <div className="control-row">
        <button onClick={() => app.dispatch({ type: 'solution' })}>Riešenie</button>
        <button onClick={() => app.dispatch({ type: 'toggleLockCorrect' })}>
          {app.state.lockCorrect ? 'Odomkni správne' : 'Lock correct'}
        </button>
      </div>
      <div className="control-row">
        <button onClick={() => app.dispatch({ type: 'timer:toggle' })}>
          {app.state.timerRunning ? 'Pauza' : 'Pokračuj'}
        </button>
        <button onClick={() => app.dispatch({ type: 'toggleStats' })}>Štatistiky</button>
      </div>
      <h3>Výber levelu</h3>
      <ul className="task-list">
        {app.tasks.map((task) => (
          <li key={task.id} className={task.id === app.state.currentTaskId ? 'active' : ''}>
            <button onClick={() => app.dispatch({ type: 'setTask', payload: task.id })}>
              <span className="task-name">{task.title ?? task.name}</span>
              <span className="task-desc">{task.difficulty}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default function App() {
  const app = useAppState();
  const boardRef = useRef(null);

  return (
    <AppStateContext.Provider value={app}>
      <div className="app-shell">
        <TopBar app={app} />
        <div className="layout">
          <div className="main-column">
            <Board ref={boardRef} app={app} stickers={app.currentTask?.stickers ?? []} />
            <Toolbelt app={app} boardRef={boardRef} />
          </div>
          <RightPanel app={app} />
        </div>
        {app.state.showStats ? (
          <div className="modal-backdrop" role="dialog" aria-modal>
            <div className="modal">
              <h3>Progress</h3>
              <div className="stat-grid">
                <div className="stat">
                  <span className="label">Task</span>
                  <span className="value">{app.currentTask?.title ?? app.currentTask?.name}</span>
                </div>
                <div className="stat">
                  <span className="label">Elapsed</span>
                  <span className="value">{Math.round(app.state.elapsedMs / 1000)}s</span>
                </div>
                <div className="stat">
                  <span className="label">Stickers correct</span>
                  <span className="value">
                    {Object.values(app.state.placements).filter((p) => p?.isCorrect).length}/
                    {app.currentTask?.targets?.length ?? 0}
                  </span>
                </div>
              </div>
              <button onClick={() => app.dispatch({ type: 'toggleStats' })}>Close</button>
            </div>
          </div>
        ) : null}
      </div>
    </AppStateContext.Provider>
  );
}
