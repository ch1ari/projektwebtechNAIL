// Level Manager - Handles level progression with sequential levels
// Tasks progress from easy -> medium -> hard

/**
 * Task order by difficulty - defines sequential level progression
 * Levels 1-3: Easy tasks
 * Levels 4-7: Medium tasks
 * Levels 8-12: Hard tasks
 */
export const TASK_ORDER = [
  // Easy tasks (Levels 1-3)
  'easy-berry',
  'easy-rainbow',
  'easy-bloom',
  // Medium tasks (Levels 4-7)
  'medium-ice',
  'medium-fiesta',
  'medium-romance',
  'medium-garden',
  // Hard tasks (Levels 8-12)
  'hard-neon',
  'hard-breakup',
  'hard-cosmos',
  'hard-ultimate'
];

/**
 * Gets the level number for a specific task ID
 * @param {string} taskId - Task ID
 * @returns {number} Level number (1-based)
 */
export function getLevelForTask(taskId) {
  const index = TASK_ORDER.indexOf(taskId);
  return index >= 0 ? index + 1 : 1;
}

/**
 * Gets the task ID for a specific level number
 * @param {number} level - Level number (1-based)
 * @returns {string} Task ID
 */
export function getTaskForLevel(level) {
  const index = level - 1;
  return TASK_ORDER[index] || TASK_ORDER[0];
}

/**
 * Gets difficulty for a specific level
 * @param {number} level - Level number (1-based)
 * @returns {string} Difficulty: 'easy', 'medium', or 'hard'
 */
export function getDifficultyForLevel(level) {
  if (level <= 3) return 'easy';
  if (level <= 7) return 'medium';
  return 'hard';
}

/**
 * Creates initial level state with sequential task progression
 * @param {Array} tasks - All available tasks
 * @returns {Object} Level state
 */
export function createInitialLevelState(tasks) {
  const firstTaskId = TASK_ORDER[0];
  const firstTask = tasks.find(t => t.id === firstTaskId);

  return {
    currentLevel: 1,
    currentTaskId: firstTaskId,
    currentDifficulty: firstTask?.difficulty || 'easy',
    completedLevels: []
  };
}

/**
 * Gets the next task in sequential order
 * @param {Object} levelState - Current level state
 * @param {Array} tasks - All available tasks
 * @returns {Object} { taskId, levelState, levelComplete, allLevelsComplete }
 */
export function getNextTask(levelState, tasks) {
  const { currentLevel } = levelState;
  const nextLevel = currentLevel + 1;

  // Check if we've completed all levels
  if (nextLevel > TASK_ORDER.length) {
    // All levels complete - restart from beginning
    const newState = createInitialLevelState(tasks);
    return {
      taskId: newState.currentTaskId,
      levelState: newState,
      levelComplete: true,
      allLevelsComplete: true
    };
  }

  // Progress to next level
  const nextTaskId = getTaskForLevel(nextLevel);
  const nextTask = tasks.find(t => t.id === nextTaskId);
  const nextDifficulty = nextTask?.difficulty || getDifficultyForLevel(nextLevel);

  const newState = {
    ...levelState,
    currentLevel: nextLevel,
    currentTaskId: nextTaskId,
    currentDifficulty: nextDifficulty,
    completedLevels: [...levelState.completedLevels, currentLevel]
  };

  return {
    taskId: nextTaskId,
    levelState: newState,
    levelComplete: true,
    allLevelsComplete: false
  };
}

/**
 * Gets level info for a specific task or difficulty
 * @param {string} taskIdOrDifficulty - Task ID or difficulty string
 * @returns {Object} Level info
 */
export function getLevelInfo(taskIdOrDifficulty) {
  // Check if it's a task ID
  const levelNumber = getLevelForTask(taskIdOrDifficulty);
  if (levelNumber > 0) {
    const difficulty = getDifficultyForLevel(levelNumber);
    return {
      level: levelNumber,
      difficulty: difficulty,
      taskId: taskIdOrDifficulty
    };
  }

  // Otherwise treat it as a difficulty and return first level of that difficulty
  const difficulty = taskIdOrDifficulty;
  if (difficulty === 'easy') return { level: 1, difficulty: 'easy', taskId: TASK_ORDER[0] };
  if (difficulty === 'medium') return { level: 4, difficulty: 'medium', taskId: TASK_ORDER[3] };
  if (difficulty === 'hard') return { level: 8, difficulty: 'hard', taskId: TASK_ORDER[7] };

  return { level: 1, difficulty: 'easy', taskId: TASK_ORDER[0] };
}

/**
 * Loads level state from localStorage or creates new one
 * @param {Array} tasks - All available tasks
 * @returns {Object} Level state
 */
export function loadLevelState(tasks) {
  // Always create fresh state - don't load from localStorage to avoid issues
  // The main game state will handle persistence
  return createInitialLevelState(tasks);
}

/**
 * Saves level state to localStorage
 * @param {Object} levelState - Level state to save
 */
export function saveLevelState(levelState) {
  window.localStorage.setItem('nail-art-level-state', JSON.stringify(levelState));
}

/**
 * Gets progress info for current difficulty group
 * @param {Object} levelState
 * @param {Array} completedTaskIds - Array of completed task IDs
 * @returns {Object} { completed, total, percentage }
 */
export function getLevelProgress(levelState, completedTaskIds = []) {
  const { currentDifficulty } = levelState;

  // Count tasks in current difficulty group
  let total = 0;
  let completed = 0;

  TASK_ORDER.forEach(taskId => {
    const taskDifficulty = taskId.split('-')[0]; // Extract difficulty from task ID
    if (taskDifficulty === currentDifficulty) {
      total++;
      if (completedTaskIds.includes(taskId)) {
        completed++;
      }
    }
  });

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}

/**
 * Resets level state - creates fresh shuffled queues
 * @param {Array} tasks - All available tasks
 * @returns {Object} Fresh level state
 */
export function resetLevelState(tasks) {
  return createInitialLevelState(tasks);
}

/**
 * Selects a specific task and updates level state accordingly
 * @param {string} taskId - Task ID to select
 * @param {Object} levelState - Current level state
 * @param {Array} tasks - All available tasks
 * @returns {Object} { levelState, valid } - Updated state and validity flag
 */
export function selectSpecificTask(taskId, levelState, tasks) {
  // Find the task
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return { levelState, valid: false };
  }

  const taskDifficulty = task.difficulty || 'easy';
  const levelNumber = getLevelForTask(taskId);

  // Update level state to match the selected task
  const newState = {
    ...levelState,
    currentLevel: levelNumber,
    currentTaskId: taskId,
    currentDifficulty: taskDifficulty
  };

  return { levelState: newState, valid: true };
}
