"use strict";

const data = require("../js/words.js");
const logic = require("../js/game-logic.js");

const words = data.words;
const errors = [];
const answers = new Set();
const clues = new Set();
const difficultyCounts = { easy: 0, medium: 0, advanced: 0 };
const lengthCounts = {};

if (words.length < 200) {
  errors.push("Word bank must contain at least 200 answers.");
}
if (words.length > 500) {
  errors.push("Word bank exceeds the 500-answer target.");
}

words.forEach((word, index) => {
  const label = word.answer || "entry " + (index + 1);

  if (!/^[A-Z]{4,9}$/.test(word.answer || "")) {
    errors.push(label + ": answer must be 4-9 uppercase letters only.");
  }
  if (word.length !== word.answer.length) {
    errors.push(label + ": stored length does not match the answer.");
  }
  if (answers.has(word.answer)) {
    errors.push(label + ": duplicate answer.");
  }
  answers.add(word.answer);
  if (clues.has(word.clue)) {
    errors.push(label + ": duplicate clue.");
  }
  clues.add(word.clue);

  if (!["easy", "medium", "advanced"].includes(word.difficulty)) {
    errors.push(label + ": difficulty must be easy, medium, or advanced.");
  }
  if (!word.clue || word.clue.trim().length < 15 || !/[.!?]$/.test(word.clue)) {
    errors.push(label + ": clue must be a complete sentence.");
  }
  if (!word.hint || word.hint.trim().length < 10 || !/[.!?]$/.test(word.hint)) {
    errors.push(label + ": hint must be a complete sentence.");
  }
  if (!word.definition || word.definition.trim().length < 15) {
    errors.push(label + ": definition is missing or too short.");
  }

  ["clue", "hint"].forEach((field) => {
    if (new RegExp("\\b" + word.answer + "\\b", "i").test(word[field])) {
      errors.push(label + ": " + field + " contains the answer.");
    }
  });

  const allowed = {
    easy: word.answer.length >= 4 && word.answer.length <= 5,
    medium: word.answer.length >= 5 && word.answer.length <= 8,
    advanced: word.answer.length >= 8 && word.answer.length <= 9
  };
  if (!allowed[word.difficulty]) {
    errors.push(label + ": length does not fit its " + word.difficulty + " assignment.");
  }

  difficultyCounts[word.difficulty] += 1;
  lengthCounts[word.answer.length] = (lengthCounts[word.answer.length] || 0) + 1;
});

const total = words.length;
const easyShare = difficultyCounts.easy / total;
const intermediateShare = difficultyCounts.medium / total;
const advancedShare = difficultyCounts.advanced / total;

if (easyShare < 0.55 || easyShare > 0.65) {
  errors.push("Easy share should be approximately 60%, found " + (easyShare * 100).toFixed(1) + "%.");
}
if (intermediateShare < 0.36 || intermediateShare > 0.41) {
  errors.push("Intermediate share should be approximately 38-39%, found " + (intermediateShare * 100).toFixed(1) + "%.");
}
if (advancedShare < 0.01 || advancedShare > 0.02) {
  errors.push("Advanced share should be 1-2%, found " + (advancedShare * 100).toFixed(1) + "%.");
}

const pools = {};
["easy", "medium", "hard", "expert", "daily"].forEach((mode) => {
  pools[mode] = logic.getModePool(words, mode).length;
  if (pools[mode] < 30) {
    errors.push("Mode " + mode + " has fewer than 30 playable answers.");
  }
});

const extraDupes = data.extraGuesses.filter((word, index, list) => list.indexOf(word) !== index);
if (extraDupes.length) {
  errors.push("Extra guess dictionary contains duplicates: " + extraDupes.slice(0, 5).join(", "));
}
if (data.extraGuesses.some((word) => !/^[A-Z]{4,8}$/.test(word))) {
  errors.push("Every extra guess must be 4-8 uppercase letters.");
}
const dictionary = logic.buildDictionary(words, data.extraGuesses);
if (dictionary.size < 500) {
  errors.push("Combined guess dictionary is too small.");
}

if (errors.length) {
  console.error("Content validation failed:");
  errors.forEach((error) => console.error("- " + error));
  process.exit(1);
}

console.log("Content validation passed.");
console.log("Answers: " + total + " unique words");
console.log("Vocabulary: easy " + (easyShare * 100).toFixed(1) + "%, intermediate " + (intermediateShare * 100).toFixed(1) + "%, advanced " + (advancedShare * 100).toFixed(1) + "%");
console.log("Lengths: " + JSON.stringify(lengthCounts));
console.log("Playable pools: " + JSON.stringify(pools));
console.log("Guess dictionary: " + dictionary.size + " words");
