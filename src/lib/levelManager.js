// Level Manager - Handles level progression with sequential levels and random tasks
// Tasks progress from easy -> medium -> hard with shuffled selection

/**
 * Level ranges by difficulty
 * Levels 1-3: Easy tasks (3 tasks)
 * Levels 4-7: Medium tasks (4 tasks)
 * Levels 8-12: Hard tasks (5 tasks)
 */
const LEVEL_RANGES = {
  easy: { start: 1, end: 3, count: 3 },
  medium: { start: 4, end: 7, count: 4 },
  hard: { start: 8, end: 12, count: 5 }
};

/**
 * Fisher-Yates shuffle algorithm for random array shuffling
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Groups tasks by difficulty level
 * @param {Array} tasks - All available tasks
 * @returns {Object} Tasks grouped by difficulty: { easy: [...], medium: [...], hard: [...] }
 */
export function groupTasksByDifficulty(tasks) {
  return tasks.reduce((groups, task) => {
    const difficulty = task.difficulty || 'easy';
    if (!groups[difficulty]) {
      groups[difficulty] = [];
    }
    groups[difficulty].push(task);
    return groups;
  }, {});
}

/**
 * Gets difficulty for a specific level number
 * @param {number} level - Level number (1-based)
 * @returns {string} Difficulty: 'easy', 'medium', or 'hard'
 */
export function getDifficultyForLevel(level) {
  if (level >= LEVEL_RANGES.easy.start && level <= LEVEL_RANGES.easy.end) return 'easy';
  if (level >= LEVEL_RANGES.medium.start && level <= LEVEL_RANGES.medium.end) return 'medium';
  if (level >= LEVEL_RANGES.hard.start && level <= LEVEL_RANGES.hard.end) return 'hard';
  return 'easy';
}

/**
 * Creates initial level state with shuffled tasks for each difficulty
 * @param {Array} tasks - All available tasks
 * @returns {Object} Level state
 */
export function createInitialLevelState(tasks) {
  const grouped = groupTasksByDifficulty(tasks);

  // Shuffle tasks for each difficulty level to ensure random order
  const shuffledQueues = {
    easy: shuffleArray(grouped.easy || []),
    medium: shuffleArray(grouped.medium || []),
    hard: shuffleArray(grouped.hard || [])
  };

  // Start at level 1 with first easy task from shuffled queue
  const firstTaskId = shuffledQueues.easy[0]?.id || tasks[0]?.id;

  return {
    currentLevel: 1,
    currentTaskId: firstTaskId,
    currentDifficulty: 'easy',
    queues: {
      easy: shuffledQueues.easy.map(t => t.id),
      medium: shuffledQueues.medium.map(t => t.id),
      hard: shuffledQueues.hard.map(t => t.id)
    },
    playedInCurrentDifficulty: {
      easy: [firstTaskId],
      medium: [],
      hard: []
    },
    completedLevels: []
  };
}

/**
 * Gets the next task with random selection from current difficulty
 * @param {Object} levelState - Current level state
 * @param {Array} tasks - All available tasks
 * @returns {Object} { taskId, levelState, levelComplete, allLevelsComplete }
 */
export function getNextTask(levelState, tasks) {
  const { currentLevel, currentDifficulty, queues, playedInCurrentDifficulty } = levelState;
  const currentQueue = queues[currentDifficulty] || [];
  const playedInDifficulty = playedInCurrentDifficulty[currentDifficulty] || [];

  // Get unplayed tasks from current difficulty queue
  const unplayedTasks = currentQueue.filter(
    taskId => !playedInDifficulty.includes(taskId)
  );

  // If all tasks in current difficulty are played, move to next difficulty
  if (unplayedTasks.length === 0) {
    const nextLevel = currentLevel + 1;
    const nextDifficulty = getDifficultyForLevel(nextLevel);

    // Check if we've completed all levels
    if (nextLevel > LEVEL_RANGES.hard.end) {
      // All levels complete - restart with new shuffle
      const newState = createInitialLevelState(tasks);
      return {
        taskId: newState.currentTaskId,
        levelState: newState,
        levelComplete: true,
        allLevelsComplete: true
      };
    }

    // Moving to next difficulty - pick first task from shuffled queue
    const nextQueue = queues[nextDifficulty] || [];
    const nextTaskId = nextQueue[0];

    const newState = {
      ...levelState,
      currentLevel: nextLevel,
      currentTaskId: nextTaskId,
      currentDifficulty: nextDifficulty,
      playedInCurrentDifficulty: {
        ...playedInCurrentDifficulty,
        [nextDifficulty]: [nextTaskId]
      },
      completedLevels: [...levelState.completedLevels, currentLevel]
    };

    return {
      taskId: nextTaskId,
      levelState: newState,
      levelComplete: true,
      allLevelsComplete: false
    };
  }

  // Pick random task from unplayed tasks in current difficulty
  const randomIndex = Math.floor(Math.random() * unplayedTasks.length);
  const nextTaskId = unplayedTasks[randomIndex];
  const nextLevel = currentLevel + 1;

  const newState = {
    ...levelState,
    currentLevel: nextLevel,
    currentTaskId: nextTaskId,
    playedInCurrentDifficulty: {
      ...playedInCurrentDifficulty,
      [currentDifficulty]: [...playedInDifficulty, nextTaskId]
    },
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
 * Gets level info for a specific difficulty
 * @param {string} difficulty - Difficulty level
 * @returns {Object} Level info
 */
export function getLevelInfo(difficulty) {
  const ranges = {
    'easy': { level: 1, difficulty: 'easy' },
    'medium': { level: 4, difficulty: 'medium' },
    'hard': { level: 8, difficulty: 'hard' }
  };
  return ranges[difficulty] || ranges['easy'];
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
  const { currentDifficulty, queues } = levelState;
  const currentQueue = queues[currentDifficulty] || [];

  // Count completed tasks in current difficulty
  const completed = currentQueue.filter(taskId =>
    completedTaskIds.includes(taskId)
  ).length;

  const total = currentQueue.length;
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
  const levelInfo = getLevelInfo(taskDifficulty);

  // Find the position of this task in the queue for this difficulty
  const queue = levelState.queues[taskDifficulty] || [];
  const taskIndex = queue.indexOf(taskId);

  // Calculate level number based on difficulty and tasks played
  const playedInDifficulty = levelState.playedInCurrentDifficulty[taskDifficulty] || [];
  const levelOffset = playedInDifficulty.length;
  const levelNumber = levelInfo.level + levelOffset;

  // Update level state to match the selected task
  const newState = {
    ...levelState,
    currentLevel: levelNumber,
    currentTaskId: taskId,
    currentDifficulty: taskDifficulty,
    playedInCurrentDifficulty: {
      ...levelState.playedInCurrentDifficulty,
      [taskDifficulty]: playedInDifficulty.includes(taskId)
        ? playedInDifficulty
        : [...playedInDifficulty, taskId]
    }
  };

  return { levelState: newState, valid: true };
}
