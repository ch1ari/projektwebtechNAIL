import React, { createContext, useMemo, useReducer } from 'react';
import tasks from './data/tasks.json';
import { clamp } from './lib/geometry.js';

export const AppStateContext = createContext();

const initialState = {
  currentTaskId: tasks[0]?.id ?? null,
  placements: {},
  selectedColor: '#f06292',
  stickers: [],
  status: 'idle'
};

function appReducer(state, action) {
  switch (action.type) {
    case 'setTask': {
      return {
        ...state,
        currentTaskId: action.payload,
        placements: {},
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

function Board({ app }) {
  const { selectedColor } = app.state;
  const activeTask = app.currentTask;
  return (
    <div className="board-shell">
      <div className="board" aria-label="Nail art workspace">
        <div
          className="board-surface"
          style={{ backgroundImage: "url('/bakground.png')" }}
          aria-hidden
        />
        <img className="board-hand" src="/hand.png" alt="Hand with nails" />
        <div
          className="nails-layer"
          style={{
            backgroundColor: selectedColor,
            maskImage: "url('/mask_nails.png')",
            WebkitMaskImage: "url('/mask_nails.png')"
          }}
          aria-hidden
        />
      </div>
      <div className="board-footer">
        <div className="tag">Active task: {activeTask?.name ?? 'none'}</div>
        <div className="tag tone" style={{ backgroundColor: selectedColor }}>
          Selected tone
        </div>
      </div>
    </div>
  );
}

function RightPanel({ app }) {
  const plannedCoverage = clamp(Math.round((Object.keys(app.state.placements).length / 5) * 100), 0, 100);

  return (
    <aside className="panel right-panel">
      <h2>Palette</h2>
      <p className="muted">Pick a base color for the nail layer.</p>
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
    </aside>
  );
}

export default function App() {
  const app = useAppState();

  return (
    <AppStateContext.Provider value={app}>
      <div className="app-shell">
        <TopBar />
        <div className="layout">
          <LeftPanel app={app} />
          <Board app={app} />
          <RightPanel app={app} />
        </div>
      </div>
    </AppStateContext.Provider>
  );
}
