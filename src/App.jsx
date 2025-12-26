// Nail Art Match - Main App Component
import React, { createContext, useEffect, useMemo, useReducer, useRef } from 'react';
import Board from './components/Board.jsx';
import Palette from './components/Palette.jsx';
import tasks from './data/tasks.json';
import { clamp, rotationDeltaDegrees } from './lib/geometry.js';

export const AppStateContext = createContext();

// Natural nail color - default for all nails
const NATURAL_NAIL_COLOR = '#F5E6D3';
const DEFAULT_NAIL_COLORS = {
  thumb: NATURAL_NAIL_COLOR,
  index: NATURAL_NAIL_COLOR,
  middle: NATURAL_NAIL_COLOR,
  ring: NATURAL_NAIL_COLOR,
  pinky: NATURAL_NAIL_COLOR
};

const paletteColors = [
  { name: 'Horúca ružová', value: '#f06292' },
  { name: 'Lesklá ružová', value: '#f48fb1' },
  { name: 'Candy ružová', value: '#ffb3c1' },
  { name: 'Púdrová ružová', value: '#fce4ec' },
  { name: 'Tyrkysová', value: '#7ae0c5' },
  { name: 'Mentolová', value: '#9bf6e6' },
  { name: 'Nebesky modrá', value: '#7ad6ff' },
  { name: 'Broskyňová', value: '#ffcc80' },
  { name: 'Zlatá broskyňa', value: '#ffd6a5' },
  { name: 'Jahodová', value: '#f28cb0' },
  { name: 'Bavlnená ružová', value: '#f5c1d8' },
  { name: 'Ľadová modrá', value: '#bde0fe' }
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

// Always start with natural nail color
const initialTaskColors = DEFAULT_NAIL_COLORS;

const initialState = {
  currentTaskId: firstTaskId,
  placements: {},
  selectedColor: paletteColors[0].value,
  selectedColorName: paletteColors[0].name,
  nailColors: initialTaskColors,
  activeToolTab: 'colors',
  showHints: false,
  showTemplate: false,
  lockCorrect: false,
  showStats: false,
  showCompletionModal: false,
  showSolutionModal: false,
  status: 'idle',
  timerRunning: true,
  elapsedMs: 0,
  queue: loadQueue(),
  stats: loadStats(),
  dragState: null
};

function taskTargets(task) {
  return task?.targets ?? [];
}

function computePlacementCorrectness(task, stickerId, placement) {
  const target = taskTargets(task).find((t) => t.stickerId === stickerId);
  if (!target || !placement) return { placement, isCorrect: false };

  // Check if sticker is on the correct nail
  const onCorrectNail = placement.nailId === target.nailName;
  if (!onCorrectNail) return { placement, isCorrect: false };

  const xPos = placement.boardX ?? placement.x ?? 0;
  const yPos = placement.boardY ?? placement.y ?? 0;
  const dx = Math.abs(xPos - target.targetTransform.x);
  const dy = Math.abs(yPos - target.targetTransform.y);
  const drot = rotationDeltaDegrees(placement.rotation ?? 0, target.targetTransform.rotation ?? 0);
  const dscale = Math.abs((placement.scale ?? 1) - (target.targetTransform.scale ?? 1));
  const within =
    dx <= (target.tolerance.x ?? 0.02) &&
    dy <= (target.tolerance.y ?? 0.02) &&
    drot <= (target.tolerance.rotation ?? 10) &&
    dscale <= (target.tolerance.scale ?? 0.05);

  if (!within) return { placement, isCorrect: false };
  return { placement: { ...placement, isCorrect: true }, isCorrect: true };
}

function isTaskComplete(task, placements, nailColors) {
  if (!task) return false;
  const stickerTargets = task.targets ?? [];
  const allStickersPlaced = stickerTargets.every(
    (target) => placements[target.stickerId]?.isCorrect
  );
  const allNailsPainted = Object.entries(task.nailTargets ?? {}).every(
    ([nail, color]) => nailColors[nail] === color
  );
  return allStickersPlaced && allNailsPainted;
}

function appReducer(state, action) {
  switch (action.type) {
    case 'setTask': {
      const nextTask = tasks.find((task) => task.id === action.payload) ?? null;
      const taskId = nextTask?.id;
      // Increment attempts when starting a new task
      const currentStats = state.stats?.[taskId] ?? {};
      const updatedStats = taskId ? {
        ...state.stats,
        [taskId]: {
          ...currentStats,
          attempts: (currentStats.attempts ?? 0) + 1
        }
      } : state.stats;

      return {
        ...state,
        currentTaskId: taskId ?? null,
        placements: {},
        nailColors: DEFAULT_NAIL_COLORS,
        selectedColor: paletteColors[0].value,
        selectedColorName: paletteColors[0].name,
        activeToolTab: 'colors',
        showHints: false,
        showTemplate: false,
        lockCorrect: false,
        timerRunning: true,
        elapsedMs: 0,
        status: 'task:selected',
        stats: updatedStats
      };
    }
    case 'setColor': {
      return { ...state, selectedColor: action.payload.value, selectedColorName: action.payload.name };
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
    case 'setToolTab': {
      return { ...state, activeToolTab: action.payload };
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
        nailColors: DEFAULT_NAIL_COLORS,
        selectedColor: paletteColors[0].value,
        selectedColorName: paletteColors[0].name,
        activeToolTab: 'colors',
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
        map[target.stickerId] = {
          ...target.targetTransform,
          nailId: target.nailName,
          boardX: target.targetTransform.x,
          boardY: target.targetTransform.y,
          isCorrect: true
        };
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
        nailColors: DEFAULT_NAIL_COLORS,
        selectedColor: paletteColors[0].value,
        selectedColorName: paletteColors[0].name,
        activeToolTab: 'colors',
        elapsedMs: 0,
        timerRunning: true
      };
    }
    case 'queue:update':
      return { ...state, queue: action.payload };
    case 'toggleStats':
      return { ...state, showStats: !state.showStats };
    case 'showCompletionModal':
      return { ...state, showCompletionModal: true, timerRunning: false };
    case 'hideCompletionModal':
      return { ...state, showCompletionModal: false };
    case 'showSolutionModal':
      return { ...state, showSolutionModal: true };
    case 'hideSolutionModal':
      return { ...state, showSolutionModal: false };
    case 'timer:tick':
      if (!state.timerRunning) return state;
      return { ...state, elapsedMs: state.elapsedMs + (action.deltaMs ?? 0) };
    case 'timer:toggle':
      return { ...state, timerRunning: !state.timerRunning };
    case 'stats:update': {
      const { taskId, payload } = action;
      const currentStats = state.stats?.[taskId] ?? {};
      // Track best time - keep the lowest timeMs
      const newBestTime = payload.timeMs && (!currentStats.bestTime || payload.timeMs < currentStats.bestTime)
        ? payload.timeMs
        : currentStats.bestTime;

      const updatedTaskStats = {
        ...currentStats,
        ...payload,
        bestTime: newBestTime
      };

      return { ...state, stats: { ...state.stats, [taskId]: updatedTaskStats } };
    }
    case 'startColorDrag': {
      const { color, colorName, startX, startY } = action.payload;
      return {
        ...state,
        dragState: {
          isDragging: true,
          color,
          colorName,
          startX,
          startY,
          currentX: startX,
          currentY: startY
        }
      };
    }
    case 'updateColorDrag': {
      if (!state.dragState) return state;
      const { currentX, currentY } = action.payload;
      return {
        ...state,
        dragState: {
          ...state.dragState,
          currentX,
          currentY
        }
      };
    }
    case 'endColorDrag': {
      return { ...state, dragState: null };
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

function TopBar({ app, completionMap }) {
  const elapsedSec = Math.round(app.state.elapsedMs / 1000);
  const totalTargets = app.currentTask?.targets?.length ?? 0;
  const correctCount = Object.values(app.state.placements).filter((p) => p?.isCorrect).length;
  const nailsCorrect = Object.entries(app.currentTask?.nailTargets ?? {}).filter(
    ([key, target]) => app.state.nailColors[key] === target
  ).length;
  const activeColorName = app.state.selectedColorName;

  return (
    <header className="top-bar">
      <div className="brand-block">
        <div className="brand">Nail Art Match</div>
        <div className="subtitle">Nail salon puzzle pre dievčatá</div>
      </div>
      <div className="level-bar" aria-label="Level navigation">
        {app.tasks.map((task, index) => {
          const locked = index > 0 && !completionMap[app.tasks[index - 1].id];
          const active = task.id === app.state.currentTaskId;
          const completed = completionMap[task.id];
          return (
            <button
              key={task.id}
              className={`level-chip ${active ? 'active' : ''} ${locked ? 'locked' : ''} ${completed ? 'completed' : ''}`}
              onClick={() => {
                if (locked) return;
                app.dispatch({ type: 'setTask', payload: task.id });
              }}
              disabled={locked}
              aria-label={`Level ${index + 1} ${task.title} ${locked ? 'locked' : 'playable'}`}
            >
              <span className="level-index">Lv {index + 1}</span>
              <span className="level-name">{task.title ?? task.name}</span>
              <span className="level-meta">{task.difficulty}</span>
              <span className="level-state" aria-hidden>
                {locked ? '🔒' : completed ? '✔' : '▶'}
              </span>
            </button>
          );
        })}
      </div>
      <div className="top-progress">
        <span className="pill">{app.currentTask?.title ?? app.currentTask?.name}</span>
        <span className="pill muted">{app.currentTask?.difficulty ?? 'easy'}</span>
        <span className="pill">
          ⏱ {elapsedSec}s
        </span>
        <span className="pill">✨ Stickers {correctCount}/{totalTargets}</span>
        <span className="pill">🎨 Nechty {nailsCorrect}/5</span>
        <span className="pill">🖌 {activeColorName}</span>
      </div>
    </header>
  );
}

function Toolbelt({ app, boardRef }) {
  const selectColor = (color) => app.dispatch({ type: 'setColor', payload: color });

  const handlePointerDown = (event, color) => {
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);

    app.dispatch({
      type: 'startColorDrag',
      payload: {
        color: color.value,
        colorName: color.name,
        startX: event.clientX,
        startY: event.clientY
      }
    });
    selectColor(color);
  };

  const handlePointerMove = (event) => {
    if (!app.state.dragState) return;

    app.dispatch({
      type: 'updateColorDrag',
      payload: {
        currentX: event.clientX,
        currentY: event.clientY
      }
    });
  };

  const handlePointerUp = (event) => {
    if (!app.state.dragState) return;

    const target = event.currentTarget;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    const { startX, startY, currentX, currentY, color } = app.state.dragState;
    const dx = currentX - startX;
    const dy = currentY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If moved less than 6px, treat as click (already selected)
    if (distance >= 6 && boardRef?.current) {
      // Hit-test nails
      const hit = nailHitTest(boardRef.current, currentX, currentY);
      if (hit) {
        app.dispatch({ type: 'paintNail', payload: { nail: hit.id, color } });
      }
    }

    app.dispatch({ type: 'endColorDrag' });
  };

  const handlePointerCancel = (event) => {
    if (!app.state.dragState) return;

    const target = event.currentTarget;
    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    app.dispatch({ type: 'endColorDrag' });
  };

  return (
    <div className="toolbelt panel">
      <div className="tool-tabs">
        <button
          className={`tab-button ${app.state.activeToolTab === 'colors' ? 'active' : ''}`}
          onClick={() => app.dispatch({ type: 'setToolTab', payload: 'colors' })}
        >
          🎨 Farby
        </button>
        <button
          className={`tab-button ${app.state.activeToolTab === 'stickers' ? 'active' : ''}`}
          onClick={() => app.dispatch({ type: 'setToolTab', payload: 'stickers' })}
        >
          ✨ Nálepky
        </button>
      </div>
      <div className="tool-strip">
        {app.state.activeToolTab === 'colors' ? (
          <>
            <div className="color-shelf scroll-row" aria-label="Color palette">
              {app.paletteColors.map((color) => (
                <button
                  key={color.value}
                  className={`swatch nail-chip ${app.state.selectedColor === color.value ? 'active' : ''}`}
                  onClick={() => selectColor(color)}
                  onPointerDown={(event) => handlePointerDown(event, color)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerCancel}
                  aria-label={`Vybrať farbu ${color.name}`}
                >
                  <span className="nail-cap" style={{ backgroundColor: color.value }} />
                  <span className="nail-bed" style={{ backgroundColor: color.value }} />
                </button>
              ))}
            </div>
            <div className="selected-color-readout">
              <span>Aktuálna farba:</span>
              <strong>{app.state.selectedColorName}</strong>
            </div>
          </>
        ) : (
          <div className="scroll-row sticker-row" aria-label="Sticker box">
            <Palette
              stickers={app.currentTask?.stickers ?? []}
              placements={app.state.placements}
              dispatch={app.dispatch}
              lockCorrect={app.state.lockCorrect}
              currentTask={app.currentTask}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Nail hit-test function (duplicated from Board for use in Toolbelt)
// Hit detection areas (larger for easier interaction)
const NAILS = [
  { id: 'thumb', shape: { cx: 229, cy: 130, rx: 15, ry: 30, rotation: -8 } },
  { id: 'index', shape: { cx: 315, cy: 78, rx: 20, ry: 30, rotation: -5 } },
  { id: 'middle', shape: { cx: 369, cy: 72, rx: 22, ry: 30, rotation: 0 } },
  { id: 'ring', shape: { cx: 397, cy: 106, rx: 24, ry: 32, rotation: 5 } },
  { id: 'pinky', shape: { cx: 409, cy: 167, rx: 22, ry: 26, rotation: 10 } }
];

const VIEWBOX = { width: 612, height: 408 };

function nailHitTest(boardElement, clientX, clientY) {
  const nailMapSvg = boardElement.querySelector('.nail-map');
  if (!nailMapSvg) return null;

  const rect = nailMapSvg.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * VIEWBOX.width;
  const y = ((clientY - rect.top) / rect.height) * VIEWBOX.height;

  for (const nail of NAILS) {
    const { cx, cy, rx, ry } = nail.shape;
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    if (dx * dx + dy * dy <= 1) {
      return { id: nail.id };
    }
  }
  return null;
}

function RightPanel({ app, completionMap }) {
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

  const requirements = app.currentTask?.clientRequirements ?? [];
  const currentIndex = app.tasks.findIndex((task) => task.id === app.state.currentTaskId);
  const currentComplete = completionMap[app.state.currentTaskId];
  const hasNext = currentIndex >= 0 && currentIndex < app.tasks.length - 1;
  const nextLocked = hasNext && !currentComplete;

  return (
    <aside className="panel right-panel">
      <h2>Popis & návod</h2>
      <div className="helper-card">
        <ul>
          <li>Porovnaj s klientskou kartou a udrž farby aj ozdoby presne.</li>
          <li>Nápoveda a duchovia sú len náhľad – nezastavia ťahanie.</li>
          <li>Reštart vymaže lak aj ozdoby, Riešenie ťa naučí správny tvar.</li>
        </ul>
        <a href="/instructions.html" style={{ display: 'block', marginTop: '0.75rem', padding: '0.5rem', textAlign: 'center', background: 'linear-gradient(135deg, #d946b5, #f472b6)', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
          📖 Kompletný návod
        </a>
      </div>
      <div className="client-brief">
        <h3>Klientsky request</h3>
        {requirements.length ? (
          <ul className="client-steps">
            {requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>{app.currentTask?.clientRequest}</p>
        )}
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
        <button onClick={() => app.dispatch({ type: 'toggleTemplate' })}>
          {app.state.showTemplate ? 'Skryť nápovedu' : 'Nápoveda'}
        </button>
      </div>
      <div className="control-row">
        <button onClick={() => {
          app.dispatch({ type: 'solution' });
          app.dispatch({ type: 'showSolutionModal' });
        }}>Riešenie</button>
        <button onClick={() => app.dispatch({ type: 'nextLevel' })} disabled={!hasNext || nextLocked}>
          Ďalšia
        </button>
      </div>
      <div className="control-row">
        <button onClick={() => app.dispatch({ type: 'timer:toggle' })}>
          {app.state.timerRunning ? 'Pauza' : 'Pokračuj'}
        </button>
        <button onClick={() => app.dispatch({ type: 'toggleStats' })}>Štatistiky</button>
      </div>
    </aside>
  );
}

export default function App() {
  const app = useAppState();
  const boardRef = useRef(null);
  const completionMap = useMemo(
    () =>
      app.tasks.reduce((acc, task) => {
        acc[task.id] = Boolean(app.state.stats?.[task.id]?.completed);
        return acc;
      }, {}),
    [app.state.stats, app.tasks]
  );

  useEffect(() => {
    if (!app.currentTask) return;
    const done = isTaskComplete(app.currentTask, app.state.placements, app.state.nailColors);
    const alreadyDone = app.state.stats?.[app.currentTask.id]?.completed;
    // Don't show completion modal if user clicked "Riešenie" button
    if (done && !alreadyDone && app.state.status !== 'solved') {
      app.dispatch({
        type: 'stats:update',
        taskId: app.currentTask.id,
        payload: { ...(app.state.stats?.[app.currentTask.id] ?? {}), completed: true, completedAt: Date.now(), timeMs: app.state.elapsedMs }
      });
      // Show completion modal
      setTimeout(() => {
        app.dispatch({ type: 'showCompletionModal' });
      }, 500);
    }
  }, [app.currentTask, app.state.placements, app.state.nailColors, app.state.stats, app.state.elapsedMs, app.state.status, app.dispatch]);

  return (
    <AppStateContext.Provider value={app}>
      <div className="app-shell">
        <TopBar app={app} completionMap={completionMap} />
        <div className="layout">
          <div className="main-column">
            <Board
              ref={boardRef}
              app={app}
              stickers={app.currentTask?.stickers ?? []}
            />
            <Toolbelt app={app} boardRef={boardRef} />
          </div>
          <RightPanel app={app} completionMap={completionMap} />
        </div>
        {app.state.showCompletionModal ? (
          <div className="modal-backdrop" role="dialog" aria-modal>
            <div className="modal completion-modal">
              <h2>🎉 Výborne!</h2>
              <p className="completion-message">Dokončil si level <strong>{app.currentTask?.title}</strong>!</p>
              <div className="completion-stats">
                <div className="stat">
                  <span className="label">⏱ Čas</span>
                  <span className="value">{Math.round(app.state.elapsedMs / 1000)}s</span>
                </div>
                <div className="stat">
                  <span className="label">✨ Nálepky</span>
                  <span className="value">{app.currentTask?.targets?.length ?? 0}/{app.currentTask?.targets?.length ?? 0}</span>
                </div>
                <div className="stat">
                  <span className="label">🎨 Nechty</span>
                  <span className="value">5/5</span>
                </div>
              </div>
              <div className="completion-buttons">
                <button
                  className="btn-primary"
                  onClick={() => {
                    app.dispatch({ type: 'hideCompletionModal' });
                    app.dispatch({ type: 'nextLevel' });
                  }}
                >
                  Ďalší level →
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => app.dispatch({ type: 'hideCompletionModal' })}
                >
                  Zostať tu
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {app.state.showSolutionModal ? (
          <div className="modal-backdrop" role="dialog" aria-modal>
            <div className="modal completion-modal">
              <h2>💡 Toto je riešenie!</h2>
              <p className="completion-message">
                Pozri si, ako vyzerá správne umiestnenie nálepiek a nechty s lak na nechty.
              </p>
              <p className="completion-message" style={{ marginTop: '1rem', fontWeight: 600 }}>
                Teraz skús level dokončiť <strong>sám ručne</strong>!
              </p>
              <div className="completion-buttons">
                <button
                  className="btn-primary"
                  style={{ color: '#d946b5' }}
                  onClick={() => {
                    app.dispatch({ type: 'hideSolutionModal' });
                    app.dispatch({ type: 'restart' });
                  }}
                >
                  Reštart a skúsim sám
                </button>
                <button
                  className="btn-secondary"
                  style={{ color: '#d946b5' }}
                  onClick={() => app.dispatch({ type: 'hideSolutionModal' })}
                >
                  Zostať tu
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {app.state.showStats ? (
          <div className="modal-backdrop" role="dialog" aria-modal>
            <div className="modal stats-modal">
              <h2>📊 Štatistiky</h2>
              <p className="completion-message">Tvoje výsledky pre všetky levely</p>
              <div className="stats-table" style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                    <tr style={{ borderBottom: '2px solid #f472b6', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem', color: '#d946b5' }}>Level</th>
                      <th style={{ padding: '0.75rem', color: '#d946b5', textAlign: 'center' }}>Pokusy</th>
                      <th style={{ padding: '0.75rem', color: '#d946b5', textAlign: 'center' }}>Najrýchlejší</th>
                      <th style={{ padding: '0.75rem', color: '#d946b5', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {app.tasks.map((task) => {
                      const stats = app.state.stats?.[task.id] ?? {};
                      const attempts = stats.attempts ?? 0;
                      const bestTime = stats.bestTime ? Math.round(stats.bestTime / 1000) : null;
                      const completed = stats.completed ?? false;

                      return (
                        <tr key={task.id} style={{ borderBottom: '1px solid #ffd0e5' }}>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ fontWeight: 500 }}>{task.title}</div>
                            <div style={{ fontSize: '0.85rem', color: '#999', textTransform: 'capitalize' }}>
                              {task.difficulty}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                            {attempts > 0 ? attempts : '—'}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, color: '#d946b5' }}>
                            {bestTime ? `${bestTime}s` : '—'}
                          </td>
                          <td style={{ padding: '0.75rem', textAlign: 'center', fontSize: '1.2rem' }}>
                            {completed ? '✅' : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="completion-buttons" style={{ marginTop: '1.5rem' }}>
                <button
                  className="btn-primary"
                  onClick={() => app.dispatch({ type: 'toggleStats' })}
                >
                  Zavrieť
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {app.state.dragState ? (
          <div
            className="brush-ghost"
            style={{
              left: `${app.state.dragState.currentX}px`,
              top: `${app.state.dragState.currentY}px`,
              backgroundColor: app.state.dragState.color
            }}
          />
        ) : null}
      </div>
    </AppStateContext.Provider>
  );
}
