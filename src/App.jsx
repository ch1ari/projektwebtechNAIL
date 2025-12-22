import React, { createContext, useMemo, useReducer, useRef } from 'react';
import Board from './components/Board.jsx';
import Palette from './components/Palette.jsx';
import tasks from './data/tasks.json';
import { clamp } from './lib/geometry.js';

export const AppStateContext = createContext();

const firstTaskId = tasks[0]?.id ?? null;

const initialState = {
  currentTaskId: firstTaskId,
  placements: {},
  selectedColor: tasks.find((task) => task.id === firstTaskId)?.goalColor ?? '#f06292',
  status: 'idle'
};

function appReducer(state, action) {
  switch (action.type) {
    case 'setTask': {
      const nextTask = tasks.find((task) => task.id === action.payload) ?? null;
      return {
        ...state,
        currentTaskId: nextTask?.id ?? null,
        placements: {},
        selectedColor: nextTask?.goalColor ?? state.selectedColor,
        status: 'task:selected'
      };
    }
    case 'setColor': {
      return { ...state, selectedColor: action.payload };
    }
    case 'placeSticker': {
      const { stickerId, position } = action.payload;
      return {
        ...state,
        placements: { ...state.placements, [stickerId]: position },
        status: 'editing'
      };
    }
    case 'removeSticker': {
      const updated = { ...state.placements };
      delete updated[action.payload];
      return { ...state, placements: updated };
    }
    case 'rotateSticker': {
      const { stickerId, delta } = action.payload;
      const current = state.placements[stickerId];
      if (!current) return state;
      const rotation = ((current.rotation ?? 0) + delta + 360) % 360;
      return {
        ...state,
        placements: { ...state.placements, [stickerId]: { ...current, rotation } }
      };
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

  return useMemo(
    () => ({ state, dispatch, currentTask, tasks }),
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

  return (
    <aside className="panel right-panel">
      <h2>Palette</h2>
      <p className="muted">Pick a base color and decorate with stickers.</p>
      <input
        aria-label="Pick nail color"
        type="color"
        value={app.state.selectedColor}
        onChange={(event) => app.dispatch({ type: 'setColor', payload: event.target.value })}
      />
      <div className="stat">
        <span className="label">Placed stickers</span>
        <span className="value">{Object.keys(app.state.placements).length}</span>
      </div>
      <div className="stat">
        <span className="label">Coverage plan</span>
        <span className="value">{plannedCoverage}%</span>
      </div>
      <Palette
        boardRef={boardRef}
        stickers={app.currentTask?.stickers ?? []}
        placements={app.state.placements}
        dispatch={app.dispatch}
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
      </div>
    </AppStateContext.Provider>
  );
}
