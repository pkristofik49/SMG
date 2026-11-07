/* Pure Sudoku rules and unique-puzzle generation, without dependencies. */
(function (root) {
  'use strict';
  const units = [];
  for (let i = 0; i < 9; i++) {
    units.push(Array.from({ length: 9 }, (_, j) => i * 9 + j));
    units.push(Array.from({ length: 9 }, (_, j) => j * 9 + i));
    units.push(Array.from({ length: 9 }, (_, j) => (Math.floor(i / 3) * 3 + Math.floor(j / 3)) * 9 + i % 3 * 3 + j % 3));
  }
  const peers = Array.from({ length: 81 }, (_, cell) => [...new Set(units.filter(unit => unit.includes(cell)).flat())].filter(index => index !== cell));
  function validBoard(board) { return Array.isArray(board) && board.length === 81 && board.every(value => Number.isInteger(value) && value >= 0 && value <= 9); }
  function conflicts(board) {
    const found = new Set();
    for (const unit of units) for (const index of unit) if (board[index] && unit.some(other => other !== index && board[other] === board[index])) found.add(index);
    return found;
  }
  function search(input, limit = 2) {
    if (!validBoard(input) || conflicts(input).size) return { count: 0, solution: null };
    const board = input.slice(); let count = 0, solution = null;
    function visit() {
      if (count >= limit) return;
      let cell = -1, choices = null;
      for (let i = 0; i < 81; i++) if (!board[i]) {
        const options = [1,2,3,4,5,6,7,8,9].filter(value => !peers[i].some(other => board[other] === value));
        if (!options.length) return;
        if (!choices || options.length < choices.length) { cell = i; choices = options; if (choices.length === 1) break; }
      }
      if (cell < 0) { count++; if (!solution) solution = board.slice(); return; }
      for (const value of choices) { board[cell] = value; visit(); if (count >= limit) break; }
      board[cell] = 0;
    }
    visit(); return { count, solution };
  }
  function shuffle(values, random) {
    const result = values.slice();
    for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  }
  function generate(difficulty = 'medium', random = Math.random) {
    const target = { easy: 42, medium: 34, hard: 28 }[difficulty] || 34;
    const groups = () => shuffle([0,1,2], random).flatMap(band => shuffle([0,1,2], random).map(row => band * 3 + row));
    const rows = groups(), columns = groups(), digits = shuffle([1,2,3,4,5,6,7,8,9], random);
    const solution = rows.flatMap(row => columns.map(column => digits[(row * 3 + Math.floor(row / 3) + column) % 9]));
    const puzzle = solution.slice(); let clues = 81;
    for (const index of shuffle(Array.from({ length: 81 }, (_, i) => i), random)) {
      if (clues <= target) break;
      const value = puzzle[index]; puzzle[index] = 0;
      if (search(puzzle).count === 1) clues--; else puzzle[index] = value;
    }
    return { puzzle, solution };
  }
  function validState(state) {
    return !!state && ['easy','medium','hard'].includes(state.difficulty) && validBoard(state.puzzle) && validBoard(state.values) && state.puzzle.filter(Boolean).length >= 17 &&
      state.puzzle.every((value, index) => !value || state.values[index] === value) && Array.isArray(state.notes) && state.notes.length === 81 && state.notes.every(value => Number.isInteger(value) && value >= 0 && value <= 511) && search(state.puzzle).count === 1;
  }
  root.SudokuRules = Object.freeze({ generate, search, conflicts, validBoard, validState, peers });
})(globalThis);
