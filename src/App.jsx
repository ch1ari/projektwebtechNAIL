import React, { createContext, useEffect, useMemo, useReducer, useRef } from 'react';
import Board from './components/Board.jsx';
import Palette from './components/Palette.jsx';
import tasks from './data/tasks.json';
import { clamp, rotationDeltaDegrees } from './lib/geometry.js';

export const AppStateContext = createContext();

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
  selectedColor: paletteColors[0].value,
  selectedColorName: paletteColors[0].name,
  nailColors: initialTaskColors,
  activeToolTab: 'colors',
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
      return {
        ...state,
        currentTaskId: nextTask?.id ?? null,
        placements: {},
        nailColors: nextTask?.nailTargets ?? state.nailColors,
        selectedColor: paletteColors[0].value,
        selectedColorName: paletteColors[0].name,
        activeToolTab: 'colors',
        showHints: false,
        showTemplate: false,
        lockCorrect: false,
        timerRunning: true,
        elapsedMs: 0,
        status: 'task:selected'
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
        nailColors: task?.nailTargets ?? state.nailColors,
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
  const handleColorDragStart = (event, color) => {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('text/nail-color', color.value);
    event.dataTransfer.setData('text/plain', color.value);
    event.dataTransfer.effectAllowed = 'copy';
    selectColor(color);
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
                  onPointerDown={() => selectColor(color)}
                  onClick={() => selectColor(color)}
                  draggable
                  onDragStart={(event) => handleColorDragStart(event, color)}
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
              boardRef={boardRef}
              stickers={app.currentTask?.stickers ?? []}
              placements={app.state.placements}
              dispatch={app.dispatch}
              lockCorrect={app.state.lockCorrect}
            />
          </div>
        )}
      </div>
    </div>
  );
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
          <li>Šablóna a duchovia sú len náhľad – nezastavia ťahanie.</li>
          <li>Reštart vymaže lak aj ozdoby, Riešenie ťa naučí správny tvar.</li>
        </ul>
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
        <button onClick={() => app.dispatch({ type: 'nextLevel' })} disabled={!hasNext || nextLocked}>
          Ďalšia
        </button>
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
    if (done && !alreadyDone) {
      app.dispatch({
        type: 'stats:update',
        taskId: app.currentTask.id,
        payload: { ...(app.state.stats?.[app.currentTask.id] ?? {}), completed: true, completedAt: Date.now() }
      });
    }
  }, [app.currentTask, app.state.placements, app.state.nailColors, app.state.stats, app.dispatch]);

  return (
    <AppStateContext.Provider value={app}>
      <div className="app-shell">
        <TopBar app={app} completionMap={completionMap} />
        <div className="layout">
          <div className="main-column">
            <Board ref={boardRef} app={app} stickers={app.currentTask?.stickers ?? []} />
            <Toolbelt app={app} boardRef={boardRef} />
          </div>
          <RightPanel app={app} completionMap={completionMap} />
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
