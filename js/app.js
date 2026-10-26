(function () {
  "use strict";

  const Logic = window.CryptoGuessLogic;
  const DATA = window.CRYPTOGUESS_DATA;
  const PROFILE_KEY = "cryptoguess.profile.v1";
  const LEADERBOARD_KEY = "cryptoguess.leaderboard.v1";
  const SETTINGS_KEY = "cryptoguess.settings.v1";
  const DICTIONARY = DATA ? Logic.buildDictionary(DATA.words, DATA.extraGuesses) : new Set();
  const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const ACHIEVEMENTS = [
    { id: "first_case", name: "FIRST CONTACT", description: "Clear your first case.", icon: "01", check: (ctx) => ctx.stats.wins >= 1 },
    { id: "clean_signal", name: "CLEAN SIGNAL", description: "Clear a case without using a hint.", icon: "02", check: (ctx) => ctx.solved && ctx.hintsUsed === 0 },
    { id: "sharp_eye", name: "SHARP EYE", description: "Solve a case within two attempts.", icon: "03", check: (ctx) => ctx.solved && ctx.attemptsUsed <= 2 },
    { id: "speed_run", name: "SPEED RUN", description: "Finish a case with 45 seconds or more left.", icon: "04", check: (ctx) => ctx.solved && ctx.secondsRemaining >= 45 },
    { id: "triple_lock", name: "TRIPLE LOCK", description: "Win three cases in a row.", icon: "05", check: (ctx) => ctx.stats.currentStreak >= 3 },
    { id: "chain_reaction", name: "CHAIN REACTION", description: "Win five cases in a row.", icon: "06", check: (ctx) => ctx.stats.currentStreak >= 5 },
    { id: "deep_cover", name: "DEEP COVER", description: "Clear a case on Expert clearance.", icon: "07", check: (ctx) => ctx.solved && ctx.modeKey === "expert" },
    { id: "daily_decrypt", name: "DAILY DECRYPT", description: "Clear the daily cipher.", icon: "08", check: (ctx) => ctx.solved && ctx.isDaily },
    { id: "high_voltage", name: "HIGH VOLTAGE", description: "Score 500 or more in one case.", icon: "09", check: (ctx) => ctx.solved && ctx.score >= 500 },
    { id: "field_veteran", name: "FIELD VETERAN", description: "Clear ten cases in total.", icon: "10", check: (ctx) => ctx.stats.wins >= 10 }
  ];

  const elements = {
    landingView: document.getElementById("landing-view"),
    gameView: document.getElementById("game-view"),
    brandHome: document.getElementById("brand-home"),
    howButton: document.getElementById("how-button"),
    leaderboardButton: document.getElementById("leaderboard-button"),
    headerAchievementsButton: document.getElementById("header-achievements-button"),
    soundButton: document.getElementById("sound-button"),
    soundButtonGame: document.getElementById("sound-button-game"),
    bankCount: document.getElementById("bank-count"),
    dictionaryCount: document.getElementById("dictionary-count"),
    startForm: document.getElementById("start-form"),
    nickname: document.getElementById("nickname"),
    nicknameError: document.getElementById("nickname-error"),
    startButton: document.getElementById("start-button"),
    dailyStartButton: document.getElementById("daily-start-button"),
    dailyDate: document.getElementById("daily-date"),
    landingBest: document.getElementById("landing-best"),
    landingStreak: document.getElementById("landing-streak"),
    exitRoundButton: document.getElementById("exit-round-button"),
    gameModeName: document.getElementById("game-mode-name"),
    caseNumber: document.getElementById("case-number"),
    gameLeaderboardButton: document.getElementById("game-leaderboard-button"),
    achievementsButton: document.getElementById("achievements-button"),
    scoreValue: document.getElementById("score-value"),
    timerCell: document.getElementById("timer-cell"),
    timerValue: document.getElementById("timer-value"),
    timerFill: document.getElementById("timer-fill"),
    attemptValue: document.getElementById("attempt-value"),
    streakValue: document.getElementById("streak-value"),
    clueText: document.getElementById("clue-text"),
    wordLength: document.getElementById("word-length"),
    hintOutput: document.getElementById("hint-output"),
    hintOutputText: document.getElementById("hint-output-text"),
    hintTokenCount: document.getElementById("hint-token-count"),
    hintLetterButton: document.getElementById("hint-letter-button"),
    hintLetterCost: document.getElementById("hint-letter-cost"),
    hintClueButton: document.getElementById("hint-clue-button"),
    hintClueCost: document.getElementById("hint-clue-cost"),
    board: document.getElementById("board"),
    gameMessage: document.getElementById("game-message"),
    keyboard: document.getElementById("keyboard"),
    guessesLeft: document.getElementById("guesses-left"),
    hintsUsed: document.getElementById("hints-used"),
    maxScore: document.getElementById("max-score"),
    progressText: document.getElementById("progress-text"),
    progressDots: document.getElementById("progress-dots"),
    dailyBrief: document.getElementById("daily-brief"),
    dailyBriefDate: document.getElementById("daily-brief-date"),
    sideHowButton: document.getElementById("side-how-button"),
    toastRegion: document.getElementById("toast-region"),
    resultDialog: document.getElementById("result-dialog"),
    resultSignal: document.getElementById("result-signal"),
    resultTitle: document.getElementById("result-title"),
    resultSubtitle: document.getElementById("result-subtitle"),
    resultUnlocks: document.getElementById("result-unlocks"),
    resultUnlocksText: document.getElementById("result-unlocks-text"),
    resultWord: document.getElementById("result-word"),
    resultDefinition: document.getElementById("result-definition"),
    resultScore: document.getElementById("result-score"),
    resultTime: document.getElementById("result-time"),
    resultAttempts: document.getElementById("result-attempts"),
    breakdownToggle: document.getElementById("breakdown-toggle"),
    breakdownLines: document.getElementById("breakdown-lines"),
    nextRoundButton: document.getElementById("next-round-button"),
    shareResultButton: document.getElementById("share-result-button"),
    resultLeaderboardButton: document.getElementById("result-leaderboard-button"),
    resultHomeButton: document.getElementById("result-home-button"),
    leaderboardDialog: document.getElementById("leaderboard-dialog"),
    leaderboardBody: document.getElementById("leaderboard-body"),
    leaderboardEmpty: document.getElementById("leaderboard-empty"),
    cloudStatus: document.getElementById("cloud-status"),
    cloudStatusText: document.getElementById("cloud-status-text"),
    cloudNote: document.getElementById("cloud-note"),
    leaderboardPersonalBest: document.getElementById("leaderboard-personal-best"),
    leaderboardStreak: document.getElementById("leaderboard-streak"),
    achievementsDialog: document.getElementById("achievements-dialog"),
    achievementSummary: document.getElementById("achievement-summary"),
    achievementGrid: document.getElementById("achievement-grid"),
    howDialog: document.getElementById("how-dialog"),
    leaveDialog: document.getElementById("leave-dialog"),
    resumeRoundButton: document.getElementById("resume-round-button"),
    confirmLeaveButton: document.getElementById("confirm-leave-button")
  };

  let storageWarningShown = false;
  let profile = loadProfile();
  let settings = loadSettings();
  let localScores = loadLocalScores();
  let cloudEntries = [];
  let cloudLoading = false;
  let cloudBooted = false;
  let audioContext = null;
  let shareResetTimer = null;

  const state = {
    status: "idle",
    modeKey: null,
    mode: null,
    word: null,
    dateKey: null,
    isDaily: false,
    attempts: 0,
    timeLimit: 0,
    remaining: 0,
    endAt: 0,
    timerId: null,
    finishTimer: null,
    guesses: [],
    results: [],
    keyStates: {},
    currentGuess: "",
    hintsUsed: 0,
    hintTokens: 0,
    hintFlags: { letter: false, clue: false },
    finalScore: null,
    scoreBreakdown: null,
    secondsRemaining: 0,
    timeUsed: 0,
    endReason: null,
    scoreSaved: false,
    newBadges: [],
    lastEntry: null,
    animatedRows: new Set(),
    recentAnswers: [],
    caseNumber: 1,
    boardFilter: "all",
    reopenResultAfterLeaderboard: false,
    startInProgress: false
  };

  function readStorage(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      if (!storageWarningShown) {
        storageWarningShown = true;
        showToast("Local storage is unavailable. Progress will last for this session only.", "error");
      }
      return false;
    }
  }

  function cleanNickname(value) {
    return String(value || "")
      .replace(/[\u0000-\u001f\u007f<>]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 16);
  }

  function isValidNickname(value) {
    const nickname = cleanNickname(value);
    if (nickname.length < 2) {
      return { valid: false, message: "Use at least 2 characters." };
    }
    if (!/[\p{L}\p{N}]/u.test(nickname)) {
      return { valid: false, message: "Include at least one letter or number." };
    }
    if (!/^[\p{L}\p{N} _.-]+$/u.test(nickname)) {
      return { valid: false, message: "Use letters, numbers, spaces, dots, dashes, or underscores." };
    }
    return { valid: true, nickname: nickname };
  }

  function defaultProfile() {
    return {
      version: 1,
      nickname: "",
      lastMode: "easy",
      personalBests: {},
      stats: {
        rounds: 0,
        wins: 0,
        losses: 0,
        totalScore: 0,
        currentStreak: 0,
        bestStreak: 0
      },
      achievements: {},
      createdAt: new Date().toISOString(),
      lastPlayedAt: null
    };
  }

  function loadProfile() {
    const fallback = defaultProfile();
    const saved = readStorage(PROFILE_KEY, null);
    if (!saved || typeof saved !== "object") {
      return fallback;
    }
    const merged = Object.assign(fallback, saved);
    merged.nickname = cleanNickname(saved.nickname || "");
    merged.personalBests = saved.personalBests && typeof saved.personalBests === "object" ? saved.personalBests : {};
    merged.stats = Object.assign(fallback.stats, saved.stats && typeof saved.stats === "object" ? saved.stats : {});
    merged.achievements = saved.achievements && typeof saved.achievements === "object" ? saved.achievements : {};
    merged.stats.rounds = Math.max(0, Number(merged.stats.rounds) || 0);
    merged.stats.wins = Math.max(0, Number(merged.stats.wins) || 0);
    merged.stats.losses = Math.max(0, Number(merged.stats.losses) || 0);
    merged.stats.totalScore = Math.max(0, Number(merged.stats.totalScore) || 0);
    merged.stats.currentStreak = Math.max(0, Number(merged.stats.currentStreak) || 0);
    merged.stats.bestStreak = Math.max(merged.stats.currentStreak, Number(merged.stats.bestStreak) || 0);
    return merged;
  }

  function saveProfile() {
    writeStorage(PROFILE_KEY, profile);
  }

  function loadSettings() {
    const saved = readStorage(SETTINGS_KEY, null);
    return {
      muted: Boolean(saved && saved.muted)
    };
  }

  function saveSettings() {
    writeStorage(SETTINGS_KEY, settings);
  }

  function normalizeScoreEntry(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }
    const name = cleanNickname(entry.name || entry.nickname || "");
    const score = Math.max(0, Math.min(99999, Math.floor(Number(entry.score) || 0)));
    const difficulty = ["easy", "medium", "hard", "expert", "daily"].includes(entry.difficulty)
      ? entry.difficulty
      : "easy";
    if (!name || !score) {
      return null;
    }
    return {
      id: String(entry.id || "local-" + Math.random().toString(36).slice(2, 10)),
      name: name,
      score: score,
      difficulty: difficulty,
      time: Math.max(0, Math.min(3600, Math.floor(Number(entry.time) || 0))),
      attempts: Math.max(1, Math.min(20, Math.floor(Number(entry.attempts) || 1))),
      createdAt: Math.max(0, Number(entry.createdAt) || Date.parse(entry.date) || 0),
      dailyDate: entry.dailyDate ? String(entry.dailyDate).slice(0, 10) : null,
      source: "local"
    };
  }

  function loadLocalScores() {
    const saved = readStorage(LEADERBOARD_KEY, []);
    if (!Array.isArray(saved)) {
      return [];
    }
    return saved.map(normalizeScoreEntry).filter(Boolean).sort(compareScores).slice(0, 200);
  }

  function compareScores(a, b) {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.time !== b.time) {
      return a.time - b.time;
    }
    return a.createdAt - b.createdAt;
  }

  function saveLocalScores() {
    localScores = localScores.slice().sort(compareScores).slice(0, 200);
    writeStorage(LEADERBOARD_KEY, localScores);
  }

  function recordLocalScore(entry) {
    localScores.push(entry);
    saveLocalScores();
  }

  function formatDateShort(dateKey) {
    const parts = String(dateKey || "").split("-");
    if (parts.length !== 3) {
      return dateKey;
    }
    const month = MONTHS[Number(parts[1]) - 1] || "---";
    return Number(parts[2]) + " " + month;
  }

  function formatDateLong(dateKey) {
    const parts = String(dateKey || "").split("-");
    if (parts.length !== 3) {
      return dateKey;
    }
    const month = MONTHS_LONG[Number(parts[1]) - 1] || "";
    return Number(parts[2]) + " " + month + " " + parts[0];
  }

  function showToast(message, type) {
    if (!elements.toastRegion) {
      return;
    }
    const toast = document.createElement("div");
    toast.className = "toast" + (type ? " is-" + type : "");
    toast.textContent = message;
    elements.toastRegion.appendChild(toast);
    while (elements.toastRegion.children.length > 4) {
      elements.toastRegion.removeChild(elements.toastRegion.firstElementChild);
    }
    window.setTimeout(function () {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3800);
  }

  function ensureAudio() {
    if (audioContext) {
      return audioContext;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      return null;
    }
    try {
      audioContext = new AudioCtor();
    } catch (error) {
      audioContext = null;
    }
    return audioContext;
  }

  function playTone(frequency, duration, type, volume, delay) {
    if (settings.muted) {
      return;
    }
    const context = ensureAudio();
    if (!context) {
      return;
    }
    if (context.state === "suspended") {
      context.resume().catch(function () {});
    }
    const start = context.currentTime + (delay || 0);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type || "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume || 0.035, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function playSfx(name) {
    if (settings.muted) {
      return;
    }
    if (name === "submit") {
      playTone(430, 0.055, "square", 0.022);
    } else if (name === "invalid") {
      playTone(155, 0.12, "sawtooth", 0.035);
      playTone(112, 0.16, "sawtooth", 0.025, 0.06);
    } else if (name === "hint") {
      playTone(680, 0.08, "triangle", 0.035);
      playTone(920, 0.09, "triangle", 0.025, 0.07);
    } else if (name === "win") {
      playTone(523, 0.11, "triangle", 0.03);
      playTone(659, 0.11, "triangle", 0.03, 0.1);
      playTone(784, 0.18, "triangle", 0.035, 0.2);
    } else if (name === "lose") {
      playTone(220, 0.16, "sine", 0.03);
      playTone(165, 0.24, "sine", 0.028, 0.14);
    }
  }

  function syncSoundButtons() {
    [elements.soundButton, elements.soundButtonGame].forEach(function (button) {
      if (!button) {
        return;
      }
      button.setAttribute("aria-pressed", String(settings.muted));
      button.setAttribute("aria-label", settings.muted ? "Unmute sound effects" : "Mute sound effects");
    });
  }

  function toggleSound() {
    settings.muted = !settings.muted;
    saveSettings();
    syncSoundButtons();
    if (!settings.muted) {
      playSfx("hint");
    }
  }

  function getSelectedMode() {
    const checked = document.querySelector('input[name="difficulty"]:checked');
    return checked ? checked.value : "easy";
  }

  function setSelectedMode(modeKey) {
    const input = document.querySelector('input[name="difficulty"][value="' + modeKey + '"]');
    if (input) {
      input.checked = true;
    }
  }

  function getPersonalBest(modeKey) {
    if (modeKey === "all") {
      let best = null;
      Object.keys(profile.personalBests).forEach(function (key) {
        const candidate = profile.personalBests[key];
        if (candidate && Number(candidate.score) > 0) {
          if (!best || Number(candidate.score) > Number(best.score)) {
            best = Object.assign({ mode: key }, candidate);
          }
        }
      });
      return best;
    }
    const best = profile.personalBests[modeKey];
    return best ? Object.assign({ mode: modeKey }, best) : null;
  }

  function updateLandingStats() {
    const best = getPersonalBest("all");
    elements.landingBest.textContent = best
      ? String(best.score) + " PTS / " + String(best.mode || "ALL").toUpperCase()
      : "—";
    elements.landingStreak.textContent = String(profile.stats.currentStreak);
    elements.leaderboardStreak.textContent = profile.stats.currentStreak + (profile.stats.currentStreak === 1 ? " win" : " wins");
  }

  function updateDailyLabels() {
    const daily = Logic.getDailyWord(DATA.words);
    elements.dailyDate.textContent = formatDateShort(daily.dateKey);
    elements.dailyBriefDate.textContent = formatDateLong(daily.dateKey);
  }

  function clearNicknameError() {
    elements.nicknameError.textContent = "";
    elements.nickname.removeAttribute("aria-invalid");
  }

  function acceptNickname(fromDaily) {
    const result = isValidNickname(elements.nickname.value);
    if (!result.valid) {
      elements.nicknameError.textContent = result.message;
      elements.nickname.setAttribute("aria-invalid", "true");
      elements.nickname.focus();
      playSfx("invalid");
      return false;
    }
    clearNicknameError();
    elements.nickname.value = result.nickname;
    profile.nickname = result.nickname;
    if (!fromDaily) {
      profile.lastMode = getSelectedMode();
    }
    saveProfile();
    return true;
  }

  function setMessage(text, type) {
    elements.gameMessage.textContent = text || "";
    elements.gameMessage.className = "board-message" + (type ? " is-" + type : "");
  }

  function buildBoard() {
    const word = state.word;
    if (!word) {
      return;
    }
    elements.board.textContent = "";
    elements.board.style.setProperty("--cols", String(word.length));
    elements.board.setAttribute("aria-rowcount", String(state.attempts));
    elements.board.setAttribute("aria-label", "Guess board, " + word.length + " letters, " + state.attempts + " attempts");

    for (let rowIndex = 0; rowIndex < state.attempts; rowIndex += 1) {
      const row = document.createElement("div");
      row.className = "board-row";
      row.setAttribute("role", "row");
      row.setAttribute("aria-label", "Guess " + (rowIndex + 1) + ", empty");

      for (let cellIndex = 0; cellIndex < word.length; cellIndex += 1) {
        const tile = document.createElement("span");
        tile.className = "tile";
        tile.setAttribute("role", "gridcell");
        tile.setAttribute("aria-label", "Empty letter");
        tile.style.setProperty("--tile-index", String(cellIndex));
        row.appendChild(tile);
      }
      elements.board.appendChild(row);
    }
    renderBoard();
  }

  function statusWord(status) {
    if (status === "correct") {
      return "correct position";
    }
    if (status === "present") {
      return "present in a different position";
    }
    if (status === "absent") {
      return "not in the word";
    }
    return "empty";
  }

  function renderBoard() {
    if (!state.word || !elements.board.children.length) {
      return;
    }
    const rows = Array.from(elements.board.children);
    rows.forEach(function (row, rowIndex) {
      const guess = state.guesses[rowIndex] || "";
      const results = state.results[rowIndex] || null;
      const active = state.status === "active" && rowIndex === state.guesses.length;
      const preview = active ? state.currentGuess : "";
      const letters = results ? guess : preview;
      row.classList.toggle("is-active", active);
      row.setAttribute("aria-label", results ? "Guess " + (rowIndex + 1) + ": " + guess : active ? "Current guess" : "Guess " + (rowIndex + 1) + ", empty");

      Array.from(row.children).forEach(function (tile, cellIndex) {
        const letter = letters[cellIndex] || "";
        const result = results ? results[cellIndex] : "";
        tile.textContent = letter;
        tile.classList.toggle("is-filled", Boolean(letter));
        if (result) {
          tile.dataset.state = result;
          tile.setAttribute("aria-label", letter + ", " + statusWord(result));
        } else {
          delete tile.dataset.state;
          tile.setAttribute("aria-label", letter ? letter + ", unsubmitted" : "Empty letter");
        }
        if (result && !state.animatedRows.has(rowIndex)) {
          tile.classList.add("is-revealed");
        }
      });

      if (results) {
        state.animatedRows.add(rowIndex);
      }
    });
  }

  function buildKeyboard() {
    const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
    elements.keyboard.textContent = "";
    rows.forEach(function (letters, rowIndex) {
      const row = document.createElement("div");
      row.className = "keyboard-row";
      if (rowIndex === 2) {
        row.appendChild(createKey("ENTER", "ENTER", true));
      }
      letters.split("").forEach(function (letter) {
        row.appendChild(createKey(letter, letter, false));
      });
      if (rowIndex === 2) {
        row.appendChild(createKey("BACKSPACE", "BACK", true));
      }
      elements.keyboard.appendChild(row);
    });
  }

  function createKey(key, label, wide) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "key" + (wide ? " is-wide" : "");
    button.dataset.key = key;
    button.textContent = label;
    button.setAttribute("aria-label", key === "BACKSPACE" ? "Delete letter" : key === "ENTER" ? "Submit guess" : "Letter " + key);
    return button;
  }

  function renderKeyboardState() {
    Array.from(elements.keyboard.querySelectorAll(".key")).forEach(function (key) {
      const value = key.dataset.key;
      if (value && value.length === 1 && state.keyStates[value]) {
        key.dataset.state = state.keyStates[value];
      } else {
        delete key.dataset.state;
      }
    });
  }

  function setInputsEnabled(enabled) {
    Array.from(elements.keyboard.querySelectorAll(".key")).forEach(function (key) {
      key.disabled = !enabled;
    });
    updateHintButtons();
  }

  function updateHintButtons() {
    const active = state.status === "active";
    const noTokens = state.hintTokens <= 0;
    elements.hintTokenCount.textContent = String(state.hintTokens);
    elements.hintsUsed.textContent = String(state.hintsUsed);
    elements.hintLetterButton.disabled = !active || noTokens || state.hintFlags.letter;
    elements.hintClueButton.disabled = !active || noTokens || state.hintFlags.clue;
  }

  function updateProgressDots() {
    elements.progressDots.textContent = "";
    for (let index = 0; index < state.attempts; index += 1) {
      const dot = document.createElement("span");
      if (index < state.guesses.length) {
        dot.className = "is-complete";
      }
      elements.progressDots.appendChild(dot);
    }
    elements.progressText.textContent = state.guesses.length + " / " + state.attempts;
  }

  function updateStatusStrip() {
    const displayScore = state.status === "active"
      ? Logic.calculateScore(state.modeKey, {
          solved: true,
          attemptsRemaining: state.attempts - state.guesses.length,
          secondsRemaining: state.remaining,
          hintsUsed: state.hintsUsed
        }).total
      : state.finalScore
        ? state.finalScore.total
        : 0;
    elements.scoreValue.textContent = String(displayScore).padStart(4, "0");
    elements.attemptValue.textContent = state.guesses.length + " / " + state.attempts;
    elements.streakValue.textContent = String(profile.stats.currentStreak);
    elements.guessesLeft.textContent = String(Math.max(0, state.attempts - state.guesses.length));
    elements.hintsUsed.textContent = String(state.hintsUsed);
    updateHintButtons();
    updateProgressDots();
  }

  function renderTimer(seconds, ratio) {
    elements.timerValue.textContent = Logic.formatTime(seconds);
    const safeRatio = Math.max(0, Math.min(1, Number(ratio) || 0));
    elements.timerFill.style.transform = "scaleX(" + safeRatio + ")";
    elements.timerCell.classList.toggle("is-low", seconds <= 20 && seconds > 10);
    elements.timerCell.classList.toggle("is-critical", seconds <= 10);
  }

  function startTimer() {
    stopTimer();
    state.remaining = state.timeLimit;
    state.endAt = Date.now() + state.timeLimit * 1000;
    renderTimer(state.timeLimit, 1);
    state.timerId = window.setInterval(tickTimer, 200);
  }

  function stopTimer() {
    if (state.timerId) {
      window.clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function tickTimer() {
    if (state.status !== "active") {
      stopTimer();
      return;
    }
    const remainingMs = Math.max(0, state.endAt - Date.now());
    const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
    const ratio = state.timeLimit ? remainingMs / (state.timeLimit * 1000) : 0;
    renderTimer(remaining, ratio);
    if (remaining !== state.remaining) {
      state.remaining = remaining;
      updateStatusStrip();
    }
    if (remainingMs <= 0) {
      finishRound(false, "time");
    }
  }

  function updateCluePanel() {
    elements.clueText.textContent = state.word.clue;
    elements.wordLength.textContent = state.word.length + " LETTERS";
    elements.hintOutput.hidden = true;
    elements.hintOutputText.textContent = "";
    elements.hintLetterCost.textContent = "-" + state.mode.hintPenalty + " PTS";
    elements.hintClueCost.textContent = "-" + state.mode.hintPenalty + " PTS";
    elements.dailyBrief.hidden = !state.isDaily;
    elements.gameModeName.textContent = state.isDaily ? "DAILY" : state.mode.label;
    elements.caseNumber.textContent = state.isDaily
      ? "DAILY // " + formatDateShort(state.dateKey)
      : "CASE " + String(state.caseNumber).padStart(2, "0");
    elements.maxScore.textContent = String(
      state.mode.baseScore +
      state.mode.attempts * state.mode.guessBonus +
      Math.floor(state.mode.timeLimit / 10) * state.mode.timeBonus +
      state.mode.noHintBonus
    );
  }

  function startRound(modeKey) {
    if (!profile.nickname) {
      showLanding();
      showToast("Enter an operative name before starting.", "error");
      elements.nickname.focus();
      return;
    }
    if (state.status === "active") {
      return;
    }
    const mode = Logic.MODES[modeKey];
    if (!mode) {
      return;
    }

    if (state.finishTimer) {
      window.clearTimeout(state.finishTimer);
      state.finishTimer = null;
    }
    closeAllDialogs();
    state.reopenResultAfterLeaderboard = false;
    stopTimer();

    const isDaily = modeKey === "daily";
    let word = null;
    let dateKey = null;

    if (isDaily) {
      const daily = Logic.getDailyWord(DATA.words);
      word = daily.word;
      dateKey = daily.dateKey;
    } else {
      const pool = Logic.getModePool(DATA.words, modeKey);
      word = Logic.pickWord(pool, Math.random, state.recentAnswers);
    }

    state.status = "active";
    state.modeKey = modeKey;
    state.mode = mode;
    state.word = word;
    state.dateKey = dateKey;
    state.isDaily = isDaily;
    state.attempts = mode.attempts;
    state.timeLimit = mode.timeLimit;
    state.remaining = mode.timeLimit;
    state.guesses = [];
    state.results = [];
    state.keyStates = {};
    state.currentGuess = "";
    state.hintsUsed = 0;
    state.hintTokens = mode.hintTokens;
    state.hintFlags = { letter: false, clue: false };
    state.finalScore = null;
    state.scoreBreakdown = null;
    state.secondsRemaining = mode.timeLimit;
    state.timeUsed = 0;
    state.endReason = null;
    state.scoreSaved = false;
    state.newBadges = [];
    state.lastEntry = null;
    state.animatedRows = new Set();
    state.caseNumber = profile.stats.rounds + 1;

    state.recentAnswers.push(word.answer);
    if (state.recentAnswers.length > 24) {
      state.recentAnswers.shift();
    }

    elements.landingView.hidden = true;
    elements.gameView.hidden = false;
    document.title = "CryptoGuess // Case in progress";

    buildBoard();
    renderKeyboardState();
    renderTimer(state.timeLimit, 1);
    updateCluePanel();
    updateStatusStrip();
    setMessage("CASE OPEN // " + state.attempts + " ATTEMPTS // " + Logic.formatTime(state.timeLimit));
    setInputsEnabled(true);
    startTimer();

    elements.gameView.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function addLetter(letter) {
    if (state.status !== "active") {
      return;
    }
    if (state.currentGuess.length >= state.word.length) {
      return;
    }
    state.currentGuess += letter.toUpperCase();
    renderBoard();
    if (elements.gameMessage.classList.contains("is-error")) {
      setMessage("");
    }
  }

  function removeLetter() {
    if (state.status !== "active" || !state.currentGuess.length) {
      return;
    }
    state.currentGuess = state.currentGuess.slice(0, -1);
    renderBoard();
  }

  function shakeActiveRow() {
    const row = elements.board.children[state.guesses.length];
    if (!row) {
      return;
    }
    row.classList.remove("is-shaking");
    void row.offsetWidth;
    row.classList.add("is-shaking");
    window.setTimeout(function () {
      row.classList.remove("is-shaking");
    }, 380);
  }

  function submitGuess() {
    if (state.status !== "active") {
      return;
    }
    if (!state.currentGuess) {
      setMessage("TYPE A WORD TO BEGIN THE DECRYPTION.", "error");
      playSfx("invalid");
      return;
    }
    if (state.currentGuess.length < state.word.length) {
      setMessage("NOT ENOUGH LETTERS // " + state.currentGuess.length + " OF " + state.word.length, "error");
      shakeActiveRow();
      playSfx("invalid");
      return;
    }
    if (!Logic.isValidGuess(DICTIONARY, state.currentGuess, state.word.length)) {
      setMessage("WORD NOT IN THE DICTIONARY // ATTEMPT NOT USED", "error");
      shakeActiveRow();
      playSfx("invalid");
      return;
    }

    const guess = state.currentGuess;
    const results = Logic.evaluateGuess(state.word.answer, guess);
    const solved = Logic.isSolved(results);
    const rowIndex = state.guesses.length;

    state.guesses.push(guess);
    state.results.push(results);
    state.keyStates = Logic.mergeKeyboardState(state.keyStates, guess, results);
    state.currentGuess = "";
    state.animatedRows.add(rowIndex);

    renderKeyboardState();

    if (solved) {
      playSfx("win");
      finishRound(true, "solved");
      return;
    }

    if (state.guesses.length >= state.attempts) {
      finishRound(false, "attempts");
      return;
    }

    renderBoard();
    updateStatusStrip();
    const left = state.attempts - state.guesses.length;
    setMessage("SIGNAL LOGGED // " + left + (left === 1 ? " ATTEMPT" : " ATTEMPTS") + " REMAIN");
    playSfx("submit");
  }

  function useHint(type) {
    if (state.status !== "active" || state.hintTokens <= 0) {
      return;
    }
    if ((type === "letter" && state.hintFlags.letter) || (type === "clue" && state.hintFlags.clue)) {
      return;
    }

    state.hintTokens -= 1;
    state.hintsUsed += 1;
    let text = "";

    if (type === "letter") {
      state.hintFlags.letter = true;
      text = "The key begins with " + state.word.answer.charAt(0) + ".";
    } else {
      state.hintFlags.clue = true;
      text = state.word.hint;
    }

    if (state.hintFlags.letter && state.hintFlags.clue) {
      text = "First letter: " + state.word.answer.charAt(0) + ". Extra clue: " + state.word.hint;
    } else if (state.hintFlags.letter) {
      text = "First letter: " + state.word.answer.charAt(0) + ".";
    } else {
      text = "Extra clue: " + state.word.hint;
    }

    elements.hintOutputText.textContent = text;
    elements.hintOutput.hidden = false;
    updateStatusStrip();
    setMessage("DECRYPTION AID USED // SCORE PENALTY APPLIED");
    playSfx("hint");
  }

  function finishRound(solved, reason) {
    if (state.status !== "active") {
      return;
    }
    const secondsRemaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
    state.status = "ended";
    state.secondsRemaining = secondsRemaining;
    state.timeUsed = Math.max(0, state.timeLimit - secondsRemaining);
    state.endReason = reason;
    stopTimer();
    renderTimer(secondsRemaining, secondsRemaining / state.timeLimit);

    const attemptsRemaining = Math.max(0, state.attempts - state.guesses.length);
    const breakdown = Logic.calculateScore(state.modeKey, {
      solved: solved,
      attemptsRemaining: attemptsRemaining,
      secondsRemaining: secondsRemaining,
      hintsUsed: state.hintsUsed
    });
    state.finalScore = breakdown;
    state.scoreBreakdown = breakdown;
    state.scoreSaved = true;

    profile.stats.rounds += 1;
    if (solved) {
      profile.stats.wins += 1;
      profile.stats.totalScore += breakdown.total;
      profile.stats.currentStreak += 1;
      profile.stats.bestStreak = Math.max(profile.stats.bestStreak, profile.stats.currentStreak);

      const previousBest = profile.personalBests[state.modeKey];
      if (
        !previousBest ||
        breakdown.total > Number(previousBest.score) ||
        (breakdown.total === Number(previousBest.score) && state.timeUsed < Number(previousBest.time))
      ) {
        profile.personalBests[state.modeKey] = {
          score: breakdown.total,
          time: state.timeUsed,
          attempts: state.guesses.length,
          date: new Date().toISOString(),
          dateKey: state.isDaily ? state.dateKey : null
        };
      }
    } else {
      profile.stats.losses += 1;
      profile.stats.currentStreak = 0;
    }
    profile.lastPlayedAt = new Date().toISOString();

    const context = {
      solved: solved,
      hintsUsed: state.hintsUsed,
      attemptsUsed: state.guesses.length,
      secondsRemaining: secondsRemaining,
      modeKey: state.modeKey,
      isDaily: state.isDaily,
      score: breakdown.total,
      stats: profile.stats
    };
    const newBadges = evaluateAchievements(context);
    state.newBadges = newBadges;
    saveProfile();

    if (solved) {
      const entry = {
        id: "local-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        name: profile.nickname,
        score: breakdown.total,
        difficulty: state.modeKey,
        time: state.timeUsed,
        attempts: state.guesses.length,
        createdAt: Date.now(),
        dailyDate: state.isDaily ? state.dateKey : null,
        source: "local"
      };
      state.lastEntry = entry;
      recordLocalScore(entry);
      submitCloudScore(entry);
    }

    renderBoard();
    renderKeyboardState();
    setInputsEnabled(false);
    updateStatusStrip();
    updateLandingStats();
    elements.streakValue.textContent = String(profile.stats.currentStreak);

    if (solved) {
      setMessage("ACCESS GRANTED // CASE CLOSED", "good");
    } else if (reason === "time") {
      setMessage("SIGNAL LOST // TIME EXPIRED");
    } else {
      setMessage("SIGNAL LOST // ATTEMPTS EXHAUSTED");
    }

    if (!solved) {
      playSfx("lose");
    }

    state.finishTimer = window.setTimeout(function () {
      state.finishTimer = null;
      showResult();
    }, 620);
  }

  function evaluateAchievements(context) {
    const unlocked = [];
    ACHIEVEMENTS.forEach(function (achievement) {
      if (!profile.achievements[achievement.id] && achievement.check(context)) {
        profile.achievements[achievement.id] = new Date().toISOString();
        unlocked.push(achievement);
      }
    });
    return unlocked;
  }

  function submitCloudScore(entry) {
    const cloud = window.CryptoGuessCloud;
    if (!cloud) {
      return;
    }
    const cloudState = cloud.getStatus();
    if (!cloudState || cloudState.state !== "online") {
      return;
    }
    cloud.submit(entry).then(function (key) {
      if (key) {
        refreshCloudEntries();
      }
      updateCloudUi();
    });
  }

  function breakdownLine(label, value, total) {
    const line = document.createElement("div");
    line.className = "breakdown-line" + (total ? " is-total" : "");
    const labelNode = document.createElement("span");
    labelNode.textContent = label;
    const valueNode = document.createElement("strong");
    valueNode.textContent = value;
    line.appendChild(labelNode);
    line.appendChild(valueNode);
    return line;
  }

  function renderBreakdown() {
    elements.breakdownLines.textContent = "";
    const score = state.finalScore;
    if (!score) {
      return;
    }
    if (!score.solved) {
      elements.breakdownLines.appendChild(breakdownLine("Case not cleared", "0", false));
      elements.breakdownLines.appendChild(breakdownLine("Completion points", "0 PTS", true));
      return;
    }
    elements.breakdownLines.appendChild(breakdownLine("Base intrusion score", "+" + score.base, false));
    elements.breakdownLines.appendChild(breakdownLine("Unused attempts (" + (state.attempts - state.guesses.length) + ")", "+" + score.guessBonusPoints, false));
    elements.breakdownLines.appendChild(breakdownLine("Time blocks (" + Math.floor(state.secondsRemaining / 10) + " x 10s)", "+" + score.timeBonusPoints, false));
    if (score.noHintBonusPoints > 0) {
      elements.breakdownLines.appendChild(breakdownLine("No-hint bonus", "+" + score.noHintBonusPoints, false));
    }
    if (score.hintPenaltyPoints > 0) {
      elements.breakdownLines.appendChild(breakdownLine("Hints used (" + state.hintsUsed + ")", "-" + score.hintPenaltyPoints, false));
    }
    elements.breakdownLines.appendChild(breakdownLine("Round total", score.total + " PTS", true));
  }

  function showResult() {
    if (state.status !== "ended" || !state.word) {
      return;
    }
    closeAllDialogs();
    const solved = state.finalScore.solved;
    elements.resultDialog.classList.toggle("is-loss", !solved);
    elements.resultSignal.textContent = solved ? "ACCESS GRANTED" : "SIGNAL LOST";
    elements.resultTitle.textContent = solved ? "WORD DECRYPTED" : "CASE UNSOLVED";
    if (solved) {
      elements.resultSubtitle.textContent = "Clean work, operative. The case is closed.";
    } else if (state.endReason === "time") {
      elements.resultSubtitle.textContent = "The clock hit zero. The encrypted word survived.";
    } else {
      elements.resultSubtitle.textContent = "You ran out of attempts. The encrypted word survived.";
    }
    elements.resultWord.textContent = state.word.answer;
    elements.resultDefinition.textContent = state.word.definition;
    elements.resultScore.textContent = String(state.finalScore.total);
    elements.resultTime.textContent = Logic.formatTime(state.secondsRemaining);
    elements.resultAttempts.textContent = state.guesses.length + " / " + state.attempts;
    elements.breakdownLines.hidden = true;
    elements.breakdownToggle.setAttribute("aria-expanded", "false");
    elements.breakdownToggle.lastElementChild.textContent = "+";
    renderBreakdown();
    elements.nextRoundButton.innerHTML = state.isDaily
      ? 'RANDOM CASE <span aria-hidden="true">→</span>'
      : 'NEXT CASE <span aria-hidden="true">→</span>';

    if (state.newBadges.length) {
      elements.resultUnlocks.hidden = false;
      elements.resultUnlocksText.textContent = state.newBadges.map(function (badge) {
        return badge.name;
      }).join(" / ");
    } else {
      elements.resultUnlocks.hidden = true;
      elements.resultUnlocksText.textContent = "";
    }

    elements.resultDialog.showModal();
    elements.nextRoundButton.focus({ preventScroll: true });
  }

  function showLanding() {
    stopTimer();
    if (state.finishTimer) {
      window.clearTimeout(state.finishTimer);
      state.finishTimer = null;
    }
    if (state.status === "active") {
      state.status = "abandoned";
    }
    closeAllDialogs();
    elements.gameView.hidden = true;
    elements.landingView.hidden = false;
    document.title = "CryptoGuess // Crack the Clue";
    updateLandingStats();
    updateDailyLabels();
    syncSoundButtons();
    window.scrollTo({ top: 0, behavior: "auto" });
    if (elements.nickname) {
      elements.nickname.focus({ preventScroll: true });
    }
  }

  function returnToLanding() {
    closeAllDialogs();
    state.reopenResultAfterLeaderboard = false;
    state.status = state.status === "active" ? "abandoned" : "idle";
    showLanding();
  }

  function requestLeave() {
    if (state.status === "active") {
      elements.leaveDialog.showModal();
      elements.resumeRoundButton.focus({ preventScroll: true });
    } else {
      returnToLanding();
    }
  }

  function confirmLeave() {
    elements.leaveDialog.close();
    stopTimer();
    if (state.finishTimer) {
      window.clearTimeout(state.finishTimer);
      state.finishTimer = null;
    }
    state.status = "abandoned";
    showLanding();
    showToast("Case aborted. No score was recorded.");
  }

  function closeDialog(dialog) {
    if (dialog && dialog.open) {
      dialog.close();
    }
  }

  function closeAllDialogs() {
    Array.from(document.querySelectorAll("dialog[open]")).forEach(function (dialog) {
      dialog.close();
    });
  }

  function openHow() {
    if (!elements.howDialog.open) {
      elements.howDialog.showModal();
    }
  }

  function setBoardFilter(filter) {
    state.boardFilter = ["all", "easy", "medium", "hard", "expert", "daily"].includes(filter) ? filter : "all";
    Array.from(document.querySelectorAll("[data-board-filter]")).forEach(function (tab) {
      const active = tab.dataset.boardFilter === state.boardFilter;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
  }

  function fingerprint(entry) {
    return [
      String(entry.name || "").toLowerCase(),
      Number(entry.score) || 0,
      entry.difficulty || "",
      Number(entry.time) || 0,
      Number(entry.attempts) || 0,
      Number(entry.createdAt) || 0
    ].join("|");
  }

  function getFilteredScores(filter) {
    const merged = [];
    const seen = new Set();
    cloudEntries.concat(localScores).forEach(function (entry) {
      const key = fingerprint(entry);
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      if (filter === "all" || entry.difficulty === filter) {
        merged.push(entry);
      }
    });
    return merged.sort(compareScores).slice(0, 10);
  }

  function renderLeaderboard() {
    setBoardFilter(state.boardFilter);
    const rows = getFilteredScores(state.boardFilter);
    elements.leaderboardBody.textContent = "";
    elements.leaderboardEmpty.hidden = rows.length > 0;

    rows.forEach(function (entry, index) {
      const tr = document.createElement("tr");
      if (profile.nickname && entry.name.toLowerCase() === profile.nickname.toLowerCase()) {
        tr.classList.add("is-you");
      }

      const rank = document.createElement("td");
      rank.className = "rank" + (index === 0 ? " is-first" : "");
      rank.textContent = String(index + 1).padStart(2, "0");

      const name = document.createElement("td");
      name.className = "board-name";
      name.textContent = entry.name;
      if (entry.source === "cloud") {
        const dot = document.createElement("span");
        dot.className = "source-dot";
        dot.title = "Cloud score";
        dot.setAttribute("aria-label", "Cloud score");
        name.appendChild(dot);
      }

      const score = document.createElement("td");
      score.className = "board-score";
      score.textContent = String(entry.score);

      const mode = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = "mode-badge";
      badge.dataset.mode = entry.difficulty;
      badge.textContent = entry.difficulty.toUpperCase();
      mode.appendChild(badge);

      const time = document.createElement("td");
      time.textContent = Logic.formatTime(entry.time);

      tr.appendChild(rank);
      tr.appendChild(name);
      tr.appendChild(score);
      tr.appendChild(mode);
      tr.appendChild(time);
      elements.leaderboardBody.appendChild(tr);
    });

    const best = getPersonalBest(state.boardFilter);
    elements.leaderboardPersonalBest.textContent = best
      ? best.score + " PTS · " + String(best.mode).toUpperCase()
      : "No case cleared yet";
    elements.leaderboardStreak.textContent = profile.stats.currentStreak + (profile.stats.currentStreak === 1 ? " win" : " wins");
    updateCloudUi();
  }

  function updateCloudUi() {
    const cloud = window.CryptoGuessCloud;
    const status = cloud ? cloud.getStatus() : { state: "disabled", configured: false };
    let label = "Local archive active";
    let className = "";
    if (status.state === "online") {
      label = "Cloud and local archives connected";
      className = "is-online";
    } else if (status.state === "connecting") {
      label = "Connecting to cloud archive...";
      className = "is-offline";
    } else if (status.state === "error") {
      label = "Cloud unavailable — showing local scores";
      className = "is-offline";
    } else if (status.configured) {
      label = "Local archive active";
    } else {
      label = "Local archive active — cloud leaderboard not configured";
    }
    elements.cloudStatus.classList.remove("is-online", "is-offline");
    if (className) {
      elements.cloudStatus.classList.add(className);
    }
    elements.cloudStatusText.textContent = label;

    if (status.state === "online") {
      elements.cloudNote.textContent = "Shared cloud scores are merged with this device's local archive. Only nickname, score, difficulty, attempts, and timings are stored.";
    } else if (status.state === "error") {
      elements.cloudNote.textContent = "Cloud setup failed or is unreachable. Local scores still work. Check js/firebase-config.js and the Firebase rules in the README.";
    } else if (status.state === "connecting") {
      elements.cloudNote.textContent = "Attempting an optional Firebase connection. Core gameplay does not depend on it.";
    } else {
      elements.cloudNote.textContent = "Shared cloud rankings are optional. Configure js/firebase-config.js and Firebase Realtime Database to enable them. Until then this leaderboard is local to this device.";
    }
  }

  async function refreshCloudEntries() {
    const cloud = window.CryptoGuessCloud;
    if (!cloud || cloudLoading) {
      return;
    }
    const status = cloud.getStatus();
    if (status.state !== "online") {
      return;
    }
    cloudLoading = true;
    try {
      cloudEntries = await cloud.fetchTop(300);
    } finally {
      cloudLoading = false;
      updateCloudUi();
      if (elements.leaderboardDialog.open) {
        renderLeaderboard();
      }
    }
  }

  async function bootCloud() {
    const cloud = window.CryptoGuessCloud;
    if (!cloud || cloudBooted) {
      return;
    }
    cloudBooted = true;
    updateCloudUi();
    await cloud.init();
    updateCloudUi();
    if (cloud.getStatus().state === "online") {
      refreshCloudEntries();
    }
  }

  function openLeaderboard(options) {
    const opts = options || {};
    if (opts.fromResult) {
      state.reopenResultAfterLeaderboard = true;
      closeDialog(elements.resultDialog);
    }
    if (opts.mode) {
      setBoardFilter(opts.mode);
    } else {
      setBoardFilter("all");
    }
    renderLeaderboard();
    updateCloudUi();
    if (!elements.leaderboardDialog.open) {
      elements.leaderboardDialog.showModal();
    }
    refreshCloudEntries();
  }

  function renderAchievements() {
    elements.achievementGrid.textContent = "";
    let unlockedCount = 0;
    ACHIEVEMENTS.forEach(function (achievement) {
      const unlocked = Boolean(profile.achievements[achievement.id]);
      if (unlocked) {
        unlockedCount += 1;
      }
      const card = document.createElement("article");
      card.className = "achievement-card" + (unlocked ? " is-unlocked" : "");
      const icon = document.createElement("span");
      icon.className = "achievement-icon";
      icon.textContent = unlocked ? achievement.icon : "—";
      icon.setAttribute("aria-hidden", "true");
      const copy = document.createElement("div");
      copy.className = "achievement-copy";
      const title = document.createElement("strong");
      title.textContent = achievement.name;
      const description = document.createElement("p");
      description.textContent = achievement.description + (unlocked ? " Unlocked." : " Locked.");
      copy.appendChild(title);
      copy.appendChild(description);
      card.appendChild(icon);
      card.appendChild(copy);
      elements.achievementGrid.appendChild(card);
    });
    elements.achievementSummary.textContent = unlockedCount + " / " + ACHIEVEMENTS.length + " unlocked";
  }

  function openAchievements() {
    renderAchievements();
    if (!elements.achievementsDialog.open) {
      elements.achievementsDialog.showModal();
    }
  }

  function buildShareText() {
    if (!state.finalScore || !state.mode) {
      return "";
    }
    const solved = state.finalScore.solved;
    const lines = [
      "CRYPTOGUESS // " + (solved ? "CASE CLEARED" : "CASE UNSOLVED"),
      state.mode.label + " | " + state.finalScore.total + " PTS | " + state.guesses.length + "/" + state.attempts + " ATTEMPTS | " + Logic.formatTime(state.secondsRemaining) + " LEFT",
      "STREAK " + profile.stats.currentStreak + " | MGM SYNERGY 2026"
    ];
    if (state.isDaily) {
      lines.splice(2, 0, "DAILY CIPHER " + state.dateKey);
    }
    if (/^https?:$/.test(window.location.protocol)) {
      lines.push(window.location.href);
    }
    return lines.join("\n");
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () {
        return true;
      }).catch(function () {
        return fallbackCopy(text);
      });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    document.body.removeChild(textarea);
    return copied;
  }

  async function shareResult() {
    const text = buildShareText();
    if (!text) {
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: "CryptoGuess result", text: text });
        return;
      } catch (error) {
        if (error && error.name === "AbortError") {
          return;
        }
      }
    }
    const copied = await copyText(text);
    showToast(copied ? "Result copied to clipboard." : "Could not copy automatically. Select the score and copy it.", copied ? "" : "error");
    if (copied) {
      elements.shareResultButton.textContent = "COPIED";
      if (shareResetTimer) {
        window.clearTimeout(shareResetTimer);
      }
      shareResetTimer = window.setTimeout(function () {
        elements.shareResultButton.textContent = "SHARE RESULT";
      }, 1600);
    }
  }

  function handleKeyboardKey(event) {
    if (state.status !== "active" || !elements.gameView || elements.gameView.hidden) {
      return;
    }
    if (document.querySelector("dialog[open]")) {
      return;
    }
    const target = event.target;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      submitGuess();
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      removeLetter();
      return;
    }
    if (/^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault();
      addLetter(event.key);
    }
  }

  function handleKeyboardClick(event) {
    const key = event.target.closest(".key");
    if (!key || key.disabled) {
      return;
    }
    const value = key.dataset.key;
    if (value === "ENTER") {
      submitGuess();
    } else if (value === "BACKSPACE") {
      removeLetter();
    } else if (value && value.length === 1) {
      addLetter(value);
    }
    if (event.detail > 0) {
      key.blur();
    }
  }

  function bindEvents() {
    elements.startForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!acceptNickname(false)) {
        return;
      }
      startRound(getSelectedMode());
    });

    elements.dailyStartButton.addEventListener("click", function () {
      if (!acceptNickname(true)) {
        return;
      }
      startRound("daily");
    });

    elements.nickname.addEventListener("input", clearNicknameError);

    Array.from(document.querySelectorAll('input[name="difficulty"]')).forEach(function (input) {
      input.addEventListener("change", function () {
        profile.lastMode = input.value;
        saveProfile();
      });
    });

    elements.keyboard.addEventListener("click", handleKeyboardClick);
    document.addEventListener("keydown", handleKeyboardKey);

    elements.hintLetterButton.addEventListener("click", function () {
      useHint("letter");
    });
    elements.hintClueButton.addEventListener("click", function () {
      useHint("clue");
    });

    elements.howButton.addEventListener("click", openHow);
    elements.sideHowButton.addEventListener("click", openHow);
    elements.leaderboardButton.addEventListener("click", function () {
      openLeaderboard();
    });
    elements.gameLeaderboardButton.addEventListener("click", function () {
      openLeaderboard({ mode: state.modeKey });
    });
    elements.resultLeaderboardButton.addEventListener("click", function () {
      openLeaderboard({ fromResult: true, mode: state.modeKey });
    });
    elements.headerAchievementsButton.addEventListener("click", openAchievements);
    elements.achievementsButton.addEventListener("click", openAchievements);

    elements.soundButton.addEventListener("click", toggleSound);
    elements.soundButtonGame.addEventListener("click", toggleSound);

    elements.exitRoundButton.addEventListener("click", requestLeave);
    elements.brandHome.addEventListener("click", function () {
      if (state.status === "active") {
        requestLeave();
      } else {
        returnToLanding();
      }
    });
    elements.resumeRoundButton.addEventListener("click", function () {
      elements.leaveDialog.close();
    });
    elements.confirmLeaveButton.addEventListener("click", confirmLeave);

    elements.nextRoundButton.addEventListener("click", function () {
      const nextMode = state.isDaily ? (profile.lastMode || "easy") : state.modeKey;
      state.reopenResultAfterLeaderboard = false;
      elements.resultDialog.close();
      startRound(nextMode);
    });
    elements.shareResultButton.addEventListener("click", shareResult);
    elements.resultHomeButton.addEventListener("click", function () {
      state.reopenResultAfterLeaderboard = false;
      returnToLanding();
    });

    elements.breakdownToggle.addEventListener("click", function () {
      const expanded = elements.breakdownToggle.getAttribute("aria-expanded") === "true";
      elements.breakdownToggle.setAttribute("aria-expanded", String(!expanded));
      elements.breakdownLines.hidden = expanded;
      elements.breakdownToggle.lastElementChild.textContent = expanded ? "+" : "−";
    });

    Array.from(document.querySelectorAll("[data-board-filter]")).forEach(function (tab) {
      tab.addEventListener("click", function () {
        setBoardFilter(tab.dataset.boardFilter);
        renderLeaderboard();
      });
    });

    elements.leaderboardDialog.addEventListener("close", function () {
      if (state.reopenResultAfterLeaderboard && state.status === "ended") {
        state.reopenResultAfterLeaderboard = false;
        elements.resultDialog.showModal();
        elements.nextRoundButton.focus({ preventScroll: true });
      }
    });

    Array.from(document.querySelectorAll("[data-close-dialog]")).forEach(function (button) {
      button.addEventListener("click", function () {
        const dialog = button.closest("dialog");
        if (dialog && dialog.id === "result-dialog") {
          returnToLanding();
        } else {
          closeDialog(dialog);
        }
      });
    });

    elements.resultDialog.addEventListener("cancel", function (event) {
      event.preventDefault();
    });

    [elements.leaderboardDialog, elements.achievementsDialog, elements.howDialog, elements.leaveDialog].forEach(function (dialog) {
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) {
          dialog.close();
        }
      });
    });

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && state.status === "active") {
        tickTimer();
      }
    });
  }

  function init() {
    if (!DATA || !Array.isArray(DATA.words) || !DATA.words.length || !Logic) {
      elements.clueText.textContent = "Game data failed to load.";
      showToast("Game data failed to load. Check the js folder.", "error");
      return;
    }

    buildKeyboard();
    bindEvents();
    setInputsEnabled(false);
    syncSoundButtons();
    setSelectedMode(profile.lastMode || "easy");
    elements.nickname.value = profile.nickname || "";
    elements.bankCount.textContent = String(DATA.words.length);
    elements.dictionaryCount.textContent = new Intl.NumberFormat("en-US").format(DICTIONARY.size);
    updateLandingStats();
    updateDailyLabels();
    updateCloudUi();
    setBoardFilter("all");

    window.setTimeout(bootCloud, 450);
  }

  init();
})();
