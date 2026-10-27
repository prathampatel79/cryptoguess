"use strict";

const assert = require("assert");
const logic = require("../js/game-logic.js");
const data = require("../js/words.js");

function results(answer, guess) {
  return logic.evaluateGuess(answer, guess).join(",");
}

assert.strictEqual(results("APPLE", "APPLE"), "correct,correct,correct,correct,correct");
assert.strictEqual(results("APPLE", "ALLEY"), "correct,present,absent,present,absent");
assert.strictEqual(results("SPEED", "ERASE"), "present,absent,absent,present,present");
assert.strictEqual(results("LEVEL", "ELDER"), "present,present,absent,correct,absent");
assert.strictEqual(results("ROBOT", "BROOM"), "present,present,present,correct,absent");
assert.strictEqual(results("LEMON", "LLAMA"), "correct,absent,absent,present,absent");
assert.strictEqual(results("CIVIC", "CIVIC"), "correct,correct,correct,correct,correct");
assert.strictEqual(logic.isSolved(logic.evaluateGuess("CRANE", "CRANE")), true);
assert.strictEqual(logic.isSolved(logic.evaluateGuess("CRANE", "CRANK")), false);

const dictionary = logic.buildDictionary(data.words, data.extraGuesses);
assert.strictEqual(logic.isValidGuess(dictionary, "crane", 5), true);
assert.strictEqual(logic.isValidGuess(dictionary, "zzzzz", 5), false);
assert.strictEqual(logic.isValidGuess(dictionary, "APPLE", 6), false);

const score = logic.calculateScore("easy", {
  solved: true,
  attemptsRemaining: 4,
  secondsRemaining: 63,
  hintsUsed: 0
});
assert.deepStrictEqual(score, {
  total: 180,
  base: 100,
  guessBonusPoints: 48,
  timeBonusPoints: 12,
  noHintBonusPoints: 20,
  hintPenaltyPoints: 0,
  solved: true
});

const hintedScore = logic.calculateScore("hard", {
  solved: true,
  attemptsRemaining: 2,
  secondsRemaining: 31,
  hintsUsed: 2
});
assert.strictEqual(hintedScore.total, 240 + 50 + 12 - 50);

const failedScore = logic.calculateScore("expert", {
  solved: false,
  attemptsRemaining: 3,
  secondsRemaining: 20,
  hintsUsed: 0
});
assert.strictEqual(failedScore.total, 0);

assert.strictEqual(logic.formatTime(65), "01:05");
assert.strictEqual(logic.formatTime(0), "00:00");
assert.strictEqual(logic.getUtcDateKey(new Date("2026-10-28T12:00:00Z")), "2026-10-28");
const dailyA = logic.getDailyWord(data.words, "2026-10-28");
const dailyB = logic.getDailyWord(data.words, "2026-10-28");
assert.strictEqual(dailyA.word.answer, dailyB.word.answer);
assert.notStrictEqual(
  logic.getDailyWord(data.words, "2026-10-28").word.answer,
  logic.getDailyWord(data.words, "2026-10-29").word.answer
);

const pools = {
  easy: logic.getModePool(data.words, "easy").length,
  medium: logic.getModePool(data.words, "medium").length,
  hard: logic.getModePool(data.words, "hard").length,
  expert: logic.getModePool(data.words, "expert").length
};
assert.ok(pools.easy >= 30 && pools.medium >= 30 && pools.hard >= 30 && pools.expert >= 30);

const keyboard = logic.mergeKeyboardState({}, "CRANE", ["correct", "present", "absent", "absent", "absent"]);
assert.strictEqual(keyboard.C, "correct");
assert.strictEqual(keyboard.R, "present");
assert.strictEqual(keyboard.X, undefined);

assert.strictEqual(logic.isGuessFormatValid("WALD", 4), true);
assert.strictEqual(logic.isGuessFormatValid("QXYZ", 4), true);
assert.strictEqual(logic.isGuessFormatValid("wxyz", 4), true);
assert.strictEqual(logic.isGuessFormatValid("ABCD", 4), true);
assert.strictEqual(logic.isGuessFormatValid("ZZZZ", 4), true);
assert.strictEqual(logic.isGuessFormatValid("WAL", 4), false);
assert.strictEqual(logic.isGuessFormatValid("WALD!", 4), false);
assert.strictEqual(logic.isGuessFormatValid("W4LD", 4), false);
assert.strictEqual(logic.isGuessFormatValid("WALD ", 4), false);

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    }
  };
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return function () {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const deckWords = ["ALFA", "BETA", "GAMA", "DELTA", "EPSI"].map((answer, index) => ({
  answer: answer,
  clue: "Synthetic clue number " + (index + 1) + ".",
  length: answer.length
}));

const firstId = logic.getQuestionId(deckWords[0]);
assert.strictEqual(firstId, logic.getQuestionId(Object.assign({}, deckWords[0])));
assert.notStrictEqual(
  logic.getQuestionId({ answer: "SAME", clue: "First synthetic clue." }),
  logic.getQuestionId({ answer: "SAME", clue: "Second synthetic clue." })
);

const deckStorage = createMemoryStorage();
const deck = logic.createQuestionDeck(deckWords, {
  random: seededRandom(7),
  storage: deckStorage,
  storageKey: "test.deck"
});
const poolIds = deck.getPoolIds("easy");
const cycleSeen = new Set();
let previousWord = null;
for (let index = 0; index < poolIds.length; index += 1) {
  const word = deck.draw("easy");
  assert.ok(word, "Question deck returned undefined during a full cycle.");
  const id = logic.getQuestionId(word);
  assert.ok(!cycleSeen.has(id), "Question repeated before the pool was exhausted.");
  cycleSeen.add(id);
  previousWord = word;
}
assert.strictEqual(cycleSeen.size, poolIds.length);
const boundaryWord = deck.draw("easy");
assert.ok(boundaryWord, "Question deck returned undefined at a cycle boundary.");
assert.notStrictEqual(boundaryWord.answer, previousWord.answer, "Question deck immediately repeated at a cycle boundary.");
const secondCycleSeen = new Set([logic.getQuestionId(boundaryWord)]);
for (let index = 1; index < poolIds.length; index += 1) {
  const word = deck.draw("easy");
  const id = logic.getQuestionId(word);
  assert.ok(!secondCycleSeen.has(id), "Question deck repeated during the second cycle.");
  secondCycleSeen.add(id);
}
assert.strictEqual(secondCycleSeen.size, poolIds.length, "Second cycle skipped a question.");

const persistedStorage = createMemoryStorage();
const persistedIds = [];
const firstDeck = logic.createQuestionDeck(deckWords, {
  random: seededRandom(11),
  storage: persistedStorage,
  storageKey: "test.persist"
});
for (let index = 0; index < 2; index += 1) {
  persistedIds.push(logic.getQuestionId(firstDeck.draw("easy")));
}
const refreshedDeck = logic.createQuestionDeck(deckWords, {
  random: seededRandom(99),
  storage: persistedStorage,
  storageKey: "test.persist"
});
for (let index = 0; index < 3; index += 1) {
  persistedIds.push(logic.getQuestionId(refreshedDeck.draw("easy")));
}
assert.strictEqual(new Set(persistedIds).size, deckWords.length, "Persisted deck repeated a question before exhaustion.");

const singleDeck = logic.createQuestionDeck([{ answer: "SOLO", clue: "Only synthetic clue.", length: 4 }], {
  random: seededRandom(3),
  storage: createMemoryStorage(),
  storageKey: "test.single"
});
assert.strictEqual(singleDeck.draw("easy").answer, "SOLO");
assert.strictEqual(singleDeck.draw("easy").answer, "SOLO");

const mixedWords = [
  { answer: "FOUR", clue: "Synthetic four letter clue.", length: 4 },
  { answer: "FIVE", clue: "Synthetic five letter clue.", length: 5 },
  { answer: "SIXER", clue: "Synthetic six letter clue.", length: 5 },
  { answer: "SEVENS", clue: "Synthetic seven letter clue.", length: 6 }
];
const mixedDeck = logic.createQuestionDeck(mixedWords, {
  random: seededRandom(5),
  storage: createMemoryStorage(),
  storageKey: "test.mixed"
});
const mediumIds = mixedDeck.getPoolIds("medium");
const mediumSeen = new Set();
for (let index = 0; index < mediumIds.length; index += 1) {
  mediumSeen.add(logic.getQuestionId(mixedDeck.draw("medium")));
}
assert.strictEqual(mediumSeen.size, mediumIds.length, "Difficulty-specific deck repeated before exhaustion.");

console.log("Logic tests passed: feedback, repeats, guess format, question deck, scoring, daily word, modes, keyboard.");
console.log("Mode pools:", pools);
