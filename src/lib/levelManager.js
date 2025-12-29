// Level Manager - Handles level progression and random task generation
// Based on difficulty levels: easy -> medium -> hard

/**
 * Difficulty levels configuration
 * Level 1: Easy tasks
 * Level 2: Medium tasks
 * Level 3: Hard tasks
 */
export const DIFFICULTY_LEVELS = [
  { level: 1, difficulty: 'easy', name: 'Level 1 - Začiatočník' },
  { level: 2, difficulty: 'medium', name: 'Level 2 - Pokročilý' },
  { level: 3, difficulty: 'hard', name: 'Level 3 - Expert' }
];

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
 * Creates initial level state with shuffled tasks for each difficulty
 * @param {Array} tasks - All available tasks
 * @returns {Object} Level state
 */
export function createInitialLevelState(tasks) {
  const grouped = groupTasksByDifficulty(tasks);

  // Shuffle tasks for each difficulty level
  const shuffledQueues = {
    easy: shuffleArray(grouped.easy || []),
    medium: shuffleArray(grouped.medium || []),
    hard: shuffleArray(grouped.hard || [])
  };

  return {
    currentLevel: 1,
    currentDifficulty: 'easy',
    queues: {
      easy: shuffledQueues.easy.map(t => t.id),
      medium: shuffledQueues.medium.map(t => t.id),
      hard: shuffledQueues.hard.map(t => t.id)
    },
    playedInCurrentLevel: [],
    completedLevels: []
  };
}

/**
 * Gets the next task for the current difficulty level
 * @param {Object} levelState - Current level state
 * @param {Array} tasks - All available tasks
 * @returns {Object} { taskId, levelState, levelComplete, allLevelsComplete }
 */
export function getNextTask(levelState, tasks) {
  const { currentDifficulty, queues, playedInCurrentLevel } = levelState;
  const currentQueue = queues[currentDifficulty] || [];

  // Get unplayed tasks from current difficulty
  const unplayedTasks = currentQueue.filter(
    taskId => !playedInCurrentLevel.includes(taskId)
  );

  // If all tasks in current difficulty are played
  if (unplayedTasks.length === 0) {
    // Move to next difficulty level
    const nextLevelInfo = getNextDifficultyLevel(currentDifficulty);

    if (!nextLevelInfo) {
      // All levels complete - restart from easy with new shuffle
      const newState = createInitialLevelState(tasks);
      return {
        taskId: newState.queues.easy[0],
        levelState: {
          ...newState,
          playedInCurrentLevel: [newState.queues.easy[0]]
        },
        levelComplete: true,
        allLevelsComplete: true
      };
    }

    // Progress to next level
    const newState = {
      ...levelState,
      currentLevel: nextLevelInfo.level,
      currentDifficulty: nextLevelInfo.difficulty,
      playedInCurrentLevel: [],
      completedLevels: [...levelState.completedLevels, levelState.currentLevel]
    };

    const nextTaskId = newState.queues[nextLevelInfo.difficulty][0];

    return {
      taskId: nextTaskId,
      levelState: {
        ...newState,
        playedInCurrentLevel: [nextTaskId]
      },
      levelComplete: true,
      allLevelsComplete: false
    };
  }

  // Pick random task from unplayed tasks
  const randomIndex = Math.floor(Math.random() * unplayedTasks.length);
  const nextTaskId = unplayedTasks[randomIndex];

  return {
    taskId: nextTaskId,
    levelState: {
      ...levelState,
      playedInCurrentLevel: [...playedInCurrentLevel, nextTaskId]
    },
    levelComplete: false,
    allLevelsComplete: false
  };
}

/**
 * Gets the next difficulty level info
 * @param {string} currentDifficulty
 * @returns {Object|null} Next level info or null if at max level
 */
function getNextDifficultyLevel(currentDifficulty) {
  const currentIndex = DIFFICULTY_LEVELS.findIndex(
    level => level.difficulty === currentDifficulty
  );

  if (currentIndex === -1 || currentIndex === DIFFICULTY_LEVELS.length - 1) {
    return null;
  }

  return DIFFICULTY_LEVELS[currentIndex + 1];
}

/**
 * Gets level info for a specific difficulty
 * @param {string} difficulty
 * @returns {Object} Level info
 */
export function getLevelInfo(difficulty) {
  return DIFFICULTY_LEVELS.find(level => level.difficulty === difficulty) || DIFFICULTY_LEVELS[0];
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
 * Gets progress info for current level
 * @param {Object} levelState
 * @returns {Object} { completed, total, percentage }
 */
export function getLevelProgress(levelState) {
  const { currentDifficulty, queues, playedInCurrentLevel } = levelState;
  const total = queues[currentDifficulty]?.length || 0;
  const completed = playedInCurrentLevel.length;
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
 * Gets task by ID and marks it as played
 * @param {string} taskId - Task ID to select
 * @param {Object} levelState - Current level state
 * @param {Array} tasks - All available tasks
 * @returns {Object} { levelState, valid } - Updated state and validity flag
 */
export function selectSpecificTask(taskId, levelState, tasks) {
  // Find the task and its difficulty
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return { levelState, valid: false };
  }

  const taskDifficulty = task.difficulty || 'easy';
  const levelInfo = getLevelInfo(taskDifficulty);

  // Update level state to match the selected task's difficulty
  const newState = {
    ...levelState,
    currentLevel: levelInfo.level,
    currentDifficulty: taskDifficulty
  };

  // Add to played list if not already there
  if (!newState.playedInCurrentLevel.includes(taskId)) {
    newState.playedInCurrentLevel = [...newState.playedInCurrentLevel, taskId];
  }

  return { levelState: newState, valid: true };
}
