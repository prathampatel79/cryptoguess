(function (root) {
  "use strict";

  const RESULT = Object.freeze({
    CORRECT: "correct",
    PRESENT: "present",
    ABSENT: "absent"
  });

  const MODES = Object.freeze({
    easy: Object.freeze({
      key: "easy",
      label: "EASY",
      minLength: 4,
      maxLength: 5,
      attempts: 6,
      timeLimit: 120,
      hintTokens: 2,
      baseScore: 100,
      guessBonus: 12,
      timeBonus: 2,
      hintPenalty: 10,
      noHintBonus: 20,
      blurb: "Short words, clean clues, plenty of room to think."
    }),
    medium: Object.freeze({
      key: "medium",
      label: "MEDIUM",
      minLength: 5,
      maxLength: 6,
      attempts: 6,
      timeLimit: 100,
      hintTokens: 2,
      baseScore: 160,
      guessBonus: 18,
      timeBonus: 3,
      hintPenalty: 15,
      noHintBonus: 35,
      blurb: "Everyday words with a sharper edge and less time."
    }),
    hard: Object.freeze({
      key: "hard",
      label: "HARD",
      minLength: 6,
      maxLength: 7,
      attempts: 5,
      timeLimit: 80,
      hintTokens: 2,
      baseScore: 240,
      guessBonus: 25,
      timeBonus: 4,
      hintPenalty: 25,
      noHintBonus: 60,
      blurb: "Longer trails, fewer attempts, tighter clock."
    }),
    expert: Object.freeze({
      key: "expert",
      label: "EXPERT",
      minLength: 7,
      maxLength: 9,
      attempts: 5,
      timeLimit: 65,
      hintTokens: 2,
      baseScore: 340,
      guessBonus: 35,
      timeBonus: 5,
      hintPenalty: 40,
      noHintBonus: 90,
      blurb: "Maximum pressure. Longer words. No wasted moves."
    }),
    daily: Object.freeze({
      key: "daily",
      label: "DAILY",
      minLength: 4,
      maxLength: 9,
      attempts: 6,
      timeLimit: 110,
      hintTokens: 2,
      baseScore: 180,
      guessBonus: 15,
      timeBonus: 3,
      hintPenalty: 15,
      noHintBonus: 40,
      blurb: "One encrypted word shared by every player today."
    })
  });

  const MODE_ORDER = Object.freeze(["easy", "medium", "hard", "expert"]);

  function normalizeWord(value) {
    return String(value || "").toUpperCase().replace(/[^A-Z]/g, "");
  }

  function evaluateGuess(answer, guess) {
    const target = normalizeWord(answer);
    const attempt = normalizeWord(guess);

    if (!target.length || target.length !== attempt.length) {
      throw new Error("Answer and guess must be non-empty and the same length.");
    }

    const results = new Array(target.length).fill(RESULT.ABSENT);
    const remaining = Object.create(null);

    for (let index = 0; index < target.length; index += 1) {
      if (attempt[index] === target[index]) {
        results[index] = RESULT.CORRECT;
      } else {
        remaining[target[index]] = (remaining[target[index]] || 0) + 1;
      }
    }

    for (let index = 0; index < attempt.length; index += 1) {
      if (results[index] === RESULT.CORRECT) {
        continue;
      }
      const letter = attempt[index];
      if (remaining[letter] > 0) {
        results[index] = RESULT.PRESENT;
        remaining[letter] -= 1;
      }
    }

    return results;
  }

  function isSolved(results) {
    return results.length > 0 && results.every(function (result) {
      return result === RESULT.CORRECT;
    });
  }

  function buildDictionary(words, extraGuesses) {
    const dictionary = new Set();
    (words || []).forEach(function (word) {
      dictionary.add(word.answer);
    });
    (extraGuesses || []).forEach(function (word) {
      const normalized = normalizeWord(word);
      if (normalized) {
        dictionary.add(normalized);
      }
    });
    return dictionary;
  }

  function isValidGuess(dictionary, guess, expectedLength) {
    const normalized = normalizeWord(guess);
    return normalized.length === expectedLength && dictionary.has(normalized);
  }

  function isGuessFormatValid(guess, expectedLength) {
    const raw = String(guess == null ? "" : guess).toUpperCase();
    return raw.length === expectedLength && /^[A-Z]+$/.test(raw);
  }

  function getModePool(words, modeKey) {
    const mode = MODES[modeKey];
    if (!mode) {
      throw new Error("Unknown mode: " + modeKey);
    }
    return (words || []).filter(function (word) {
      return word.length >= mode.minLength && word.length <= mode.maxLength;
    });
  }

  function pickWord(pool, random, excluded) {
    if (!pool || !pool.length) {
      throw new Error("Word pool is empty.");
    }
    const excludedSet = new Set((excluded || []).map(function (word) {
      return word.answer;
    }));
    let available = pool.filter(function (word) {
      return !excludedSet.has(word.answer);
    });
    if (!available.length) {
      available = pool.slice();
    }
    const index = Math.floor((random || Math.random)() * available.length);
    return available[Math.min(index, available.length - 1)];
  }

  function shuffleList(list, random) {
    const source = (list || []).slice();
    const rng = typeof random === "function" ? random : Math.random;
    for (let index = source.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(rng() * (index + 1));
      const temp = source[index];
      source[index] = source[swapIndex];
      source[swapIndex] = temp;
    }
    return source;
  }

  function getQuestionId(word) {
    const answer = normalizeWord(word && word.answer);
    const clue = String((word && word.clue) || "");
    return (answer || "UNKNOWN") + "-" + hashString(answer + "|" + clue).toString(36);
  }

  function createQuestionDeck(words, options) {
    const opts = options || {};
    const sourceWords = Array.isArray(words) ? words : [];
    const random = typeof opts.random === "function" ? opts.random : Math.random;
    const storage = opts.storage || null;
    const storageKey = opts.storageKey || "cryptoguess.questionDeck.v1";
    const wordById = new Map();
    const decks = Object.create(null);

    sourceWords.forEach(function (word) {
      const id = getQuestionId(word);
      if (!wordById.has(id)) {
        wordById.set(id, word);
      }
    });

    function readDeck(modeKey) {
      if (decks[modeKey]) {
        return decks[modeKey];
      }
      if (!storage || typeof storage.getItem !== "function") {
        return null;
      }
      try {
        const raw = storage.getItem(storageKey + "." + modeKey);
        return raw ? JSON.parse(raw) : null;
      } catch (error) {
        return null;
      }
    }

    function writeDeck(modeKey, deck) {
      decks[modeKey] = deck;
      if (!storage || typeof storage.setItem !== "function") {
        return;
      }
      try {
        storage.setItem(storageKey + "." + modeKey, JSON.stringify(deck));
      } catch (error) {
        // In-memory deck still prevents repeats for this session.
      }
    }

    function poolIdsFor(modeKey) {
      const ids = [];
      const seen = new Set();
      getModePool(sourceWords, modeKey).forEach(function (word) {
        const id = getQuestionId(word);
        if (wordById.has(id) && !seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      });
      return ids;
    }

    function normalizeDeck(raw, poolIds) {
      if (!raw || typeof raw !== "object") {
        return {
          queue: shuffleList(poolIds, random),
          seen: [],
          lastId: null,
          cycle: 0
        };
      }

      const valid = new Set(poolIds);
      const seen = [];
      const seenSet = new Set();
      const queue = [];
      const queueSet = new Set();

      (Array.isArray(raw.seen) ? raw.seen : []).forEach(function (id) {
        if (valid.has(id) && !seenSet.has(id)) {
          seenSet.add(id);
          seen.push(id);
        }
      });
      (Array.isArray(raw.queue) ? raw.queue : []).forEach(function (id) {
        if (valid.has(id) && !seenSet.has(id) && !queueSet.has(id)) {
          queueSet.add(id);
          queue.push(id);
        }
      });

      const newIds = poolIds.filter(function (id) {
        return !seenSet.has(id) && !queueSet.has(id);
      });
      shuffleList(newIds, random).forEach(function (id) {
        queueSet.add(id);
        queue.push(id);
      });

      const lastId = valid.has(raw.lastId)
        ? raw.lastId
        : (seen.length ? seen[seen.length - 1] : null);
      const cycle = Number.isFinite(Number(raw.cycle))
        ? Math.max(0, Math.floor(Number(raw.cycle)))
        : 0;

      return {
        queue: queue,
        seen: seen,
        lastId: lastId,
        cycle: cycle
      };
    }

    function draw(modeKey) {
      const poolIds = poolIdsFor(modeKey);
      if (!poolIds.length) {
        return null;
      }

      const deck = normalizeDeck(readDeck(modeKey), poolIds);

      if (!deck.queue.length) {
        const lastId = deck.lastId;
        const candidates = shuffleList(poolIds, random);
        if (candidates.length > 1 && candidates[0] === lastId) {
          const swapIndex = 1 + Math.floor(random() * (candidates.length - 1));
          const temp = candidates[0];
          candidates[0] = candidates[swapIndex];
          candidates[swapIndex] = temp;
        }
        deck.queue = candidates;
        deck.seen = [];
        deck.cycle += 1;
      }

      let id = deck.queue.shift();
      if (id === deck.lastId && deck.queue.length) {
        deck.queue.push(id);
        id = deck.queue.shift();
      }
      if (!wordById.has(id)) {
        id = poolIds[0];
      }
      if (deck.seen.indexOf(id) === -1) {
        deck.seen.push(id);
      }
      deck.lastId = id;
      writeDeck(modeKey, deck);
      return wordById.get(id) || null;
    }

    return {
      draw: draw,
      getPoolIds: poolIdsFor
    };
  }

  function hashString(value) {
    let hash = 2166136261;
    const text = String(value);
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function getUtcDateKey(date) {
    const current = date || new Date();
    return current.toISOString().slice(0, 10);
  }

  function getDailyWord(words, date) {
    if (!words || !words.length) {
      throw new Error("Word bank is empty.");
    }
    const dateKey = typeof date === "string" ? date : getUtcDateKey(date);
    const ordered = words.slice().sort(function (a, b) {
      return a.answer.localeCompare(b.answer);
    });
    const index = hashString("cryptoguess:" + dateKey) % ordered.length;
    return {
      dateKey: dateKey,
      word: ordered[index]
    };
  }

  function calculateScore(modeKey, options) {
    const mode = MODES[modeKey];
    if (!mode) {
      throw new Error("Unknown mode: " + modeKey);
    }

    const solved = Boolean(options && options.solved);
    const attemptsRemaining = Math.max(0, Math.floor(Number(options && options.attemptsRemaining) || 0));
    const secondsRemaining = Math.max(0, Math.floor(Number(options && options.secondsRemaining) || 0));
    const hintsUsed = Math.max(0, Math.floor(Number(options && options.hintsUsed) || 0));

    if (!solved) {
      return {
        total: 0,
        base: 0,
        guessBonusPoints: 0,
        timeBonusPoints: 0,
        noHintBonusPoints: 0,
        hintPenaltyPoints: 0,
        solved: false
      };
    }

    const guessBonusPoints = attemptsRemaining * mode.guessBonus;
    const timeBonusPoints = Math.floor(secondsRemaining / 10) * mode.timeBonus;
    const noHintBonusPoints = hintsUsed === 0 ? mode.noHintBonus : 0;
    const hintPenaltyPoints = hintsUsed * mode.hintPenalty;
    const total = Math.max(0, mode.baseScore + guessBonusPoints + timeBonusPoints + noHintBonusPoints - hintPenaltyPoints);

    return {
      total: total,
      base: mode.baseScore,
      guessBonusPoints: guessBonusPoints,
      timeBonusPoints: timeBonusPoints,
      noHintBonusPoints: noHintBonusPoints,
      hintPenaltyPoints: hintPenaltyPoints,
      solved: true
    };
  }

  function formatTime(totalSeconds) {
    const safe = Math.max(0, Math.ceil(Number(totalSeconds) || 0));
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  }

  function mergeKeyboardState(previous, guess, results) {
    const state = Object.assign({}, previous || {});
    const rank = { absent: 1, present: 2, correct: 3 };
    for (let index = 0; index < guess.length; index += 1) {
      const letter = guess[index];
      const result = results[index];
      if (!state[letter] || rank[result] > rank[state[letter]]) {
        state[letter] = result;
      }
    }
    return state;
  }

  function validateWordBank(words) {
    const errors = [];
    const seen = new Set();
    const clues = new Set();
    (words || []).forEach(function (word) {
      const label = word && word.answer ? word.answer : "(missing answer)";
      if (!word || !/^[A-Z]{4,9}$/.test(word.answer || "")) {
        errors.push(label + ": answer must contain 4-9 uppercase letters");
      }
      if (word && word.length !== (word.answer || "").length) {
        errors.push(label + ": length does not match answer");
      }
      if (seen.has(word.answer)) {
        errors.push(label + ": duplicate answer");
      }
      seen.add(word.answer);
      ["clue", "hint", "definition"].forEach(function (field) {
        if (!word[field] || String(word[field]).trim().length < 8) {
          errors.push(label + ": " + field + " is missing or too short");
        }
      });
      if (clues.has(word.clue)) {
        errors.push(label + ": duplicate clue");
      }
      clues.add(word.clue);
      ["clue", "hint"].forEach(function (field) {
        if (word[field] && new RegExp("\\b" + word.answer + "\\b", "i").test(word[field])) {
          errors.push(label + ": " + field + " reveals the answer");
        }
      });
    });
    return errors;
  }

  const api = {
    RESULT: RESULT,
    MODES: MODES,
    MODE_ORDER: MODE_ORDER,
    normalizeWord: normalizeWord,
    evaluateGuess: evaluateGuess,
    isSolved: isSolved,
    buildDictionary: buildDictionary,
    isValidGuess: isValidGuess,
    isGuessFormatValid: isGuessFormatValid,
    getModePool: getModePool,
    pickWord: pickWord,
    shuffleList: shuffleList,
    getQuestionId: getQuestionId,
    createQuestionDeck: createQuestionDeck,
    hashString: hashString,
    getUtcDateKey: getUtcDateKey,
    getDailyWord: getDailyWord,
    calculateScore: calculateScore,
    formatTime: formatTime,
    mergeKeyboardState: mergeKeyboardState,
    validateWordBank: validateWordBank
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.CryptoGuessLogic = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
