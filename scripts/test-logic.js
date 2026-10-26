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

console.log("Logic tests passed: feedback, repeats, dictionary, scoring, daily word, modes, keyboard.");
console.log("Mode pools:", pools);
