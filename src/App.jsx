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
  '#f28cb0'
];

const firstTaskId = tasks[0]?.id ?? null;

const loadQueue = () => {
  const stored = window.localStorage.getItem('nail-art-queue');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length) return parsed;
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
        status: 'restart'
      };
    }
    case 'solution': {
      const task = tasks.find((t) => t.id === state.currentTaskId);
      const solved = (task?.targets ?? []).reduce((map, target) => {
        map[target.stickerId] = { ...target.targetTransform, isCorrect: true };
        return map;
      }, {});
      return { ...state, placements: solved, status: 'solved' };
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

function TopBar() {
  return (
    <header className="top-bar">
      <div className="brand">Nail Art Match</div>
      <div className="subtitle">Prototype playground</div>
    </header>
  );
}

function LeftPanel({ app }) {
  return (
    <aside className="panel left-panel">
      <h2>Tasks</h2>
      <p className="muted">Choose a target to match.</p>
      <ul className="task-list">
        {app.tasks.map((task) => (
          <li key={task.id} className={task.id === app.state.currentTaskId ? 'active' : ''}>
            <button onClick={() => app.dispatch({ type: 'setTask', payload: task.id })}>
              <span className="task-name">{task.name}</span>
              <span className="task-desc">{task.description}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function RightPanel({ app, boardRef }) {
  const plannedCoverage = clamp(
    Math.round((Object.keys(app.state.placements).length / 5) * 100),
    0,
    100
  );

  const correctCount = Object.values(app.state.placements).filter((p) => p?.isCorrect).length;
  const totalTargets = app.currentTask?.targets?.length ?? 0;
  const elapsedSec = Math.round(app.state.elapsedMs / 1000);

  return (
    <aside className="panel right-panel">
      <h2>Palette</h2>
      <p className="muted">Pick a base color and decorate with stickers.</p>
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
      <div className="stat-grid">
        <div className="stat">
          <span className="label">Placed stickers</span>
          <span className="value">{Object.keys(app.state.placements).length}</span>
        </div>
        <div className="stat">
          <span className="label">Coverage plan</span>
          <span className="value">{plannedCoverage}%</span>
        </div>
        <div className="stat">
          <span className="label">Correct</span>
          <span className="value">{correctCount}/{totalTargets}</span>
        </div>
        <div className="stat">
          <span className="label">Timer</span>
          <span className="value">{elapsedSec}s</span>
        </div>
      </div>
      <div className="control-row">
        <button onClick={() => app.dispatch({ type: 'restart' })}>Restart</button>
        <button onClick={() => app.dispatch({ type: 'nextLevel' })}>Next Level</button>
      </div>
      <div className="control-row">
        <button onClick={() => app.dispatch({ type: 'toggleHints' })}>
          {app.state.showHints ? 'Hide hints' : 'Show hints'}
        </button>
        <button onClick={() => app.dispatch({ type: 'toggleTemplate' })}>
          {app.state.showTemplate ? 'Hide template' : 'Show template'}
        </button>
      </div>
      <div className="control-row">
        <button onClick={() => app.dispatch({ type: 'solution' })}>Solution</button>
        <button onClick={() => app.dispatch({ type: 'toggleLockCorrect' })}>
          {app.state.lockCorrect ? 'Unlock correct' : 'Lock correct'}
        </button>
      </div>
      <div className="control-row">
        <button onClick={() => app.dispatch({ type: 'timer:toggle' })}>
          {app.state.timerRunning ? 'Pause timer' : 'Resume timer'}
        </button>
        <button onClick={() => app.dispatch({ type: 'toggleStats' })}>Stats</button>
      </div>
      <div className="client-brief">
        <h3>Client request</h3>
        <p>{app.currentTask?.clientRequest}</p>
      </div>
      <Palette
        boardRef={boardRef}
        stickers={app.currentTask?.stickers ?? []}
        placements={app.state.placements}
        dispatch={app.dispatch}
        lockCorrect={app.state.lockCorrect}
      />
    </aside>
  );
}

export default function App() {
  const app = useAppState();
  const boardRef = useRef(null);

  return (
    <AppStateContext.Provider value={app}>
      <div className="app-shell">
        <TopBar />
        <div className="layout">
          <LeftPanel app={app} />
          <Board
            ref={boardRef}
            app={app}
            stickers={app.currentTask?.stickers ?? []}
          />
          <RightPanel app={app} boardRef={boardRef} />
        </div>
        {app.state.showStats ? (
          <div className="modal-backdrop" role="dialog" aria-modal>
            <div className="modal">
              <h3>Progress</h3>
              <div className="stat-grid">
                <div className="stat">
                  <span className="label">Task</span>
                  <span className="value">{app.currentTask?.name}</span>
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
