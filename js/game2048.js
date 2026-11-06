/* Pure game rules; no UI, storage or framework dependency. */
(function (root) {
  'use strict';
  const SIZE = 4;
  function collapse(line) {
    const values = line.flatMap((value, from) => value ? [{ value, from }] : []);
    const result = [];
    const movements = [];
    const merges = [];
    let points = 0;
    for (let i = 0; i < values.length; i++) {
      const to = result.length;
      if (values[i].value === values[i + 1]?.value) {
        const merged = values[i].value * 2;
        result.push(merged);
        movements.push({ ...values[i], to }, { ...values[i + 1], to });
        merges.push(to);
        points += merged;
        i++;
      } else {
        result.push(values[i].value);
        movements.push({ ...values[i], to });
      }
    }
    while (result.length < SIZE) result.push(0);
    return { line: result, points, movements, merges };
  }
  function slide(line) {
    const { line: result, points } = collapse(line);
    return { line: result, points };
  }
  function move(board, direction) {
    if (!['left', 'right', 'up', 'down'].includes(direction)) throw new Error('Unknown direction');
    const next = board.slice();
    const movements = [], merges = [];
    let points = 0;
    for (let outer = 0; outer < SIZE; outer++) {
      const indices = Array.from({ length: SIZE }, (_, inner) => {
        if (direction === 'left') return outer * SIZE + inner;
        if (direction === 'right') return outer * SIZE + SIZE - 1 - inner;
        if (direction === 'up') return inner * SIZE + outer;
        return (SIZE - 1 - inner) * SIZE + outer;
      });
      const result = collapse(indices.map(index => board[index]));
      indices.forEach((index, position) => { next[index] = result.line[position]; });
      result.movements.forEach(tile => movements.push({
        from: indices[tile.from], to: indices[tile.to], value: tile.value
      }));
      merges.push(...result.merges.map(index => indices[index]));
      points += result.points;
    }
    return { board: next, points, movements, merges, changed: next.some((value, index) => value !== board[index]) };
  }
  function spawn(board, random = Math.random) {
    const empty = board.flatMap((value, index) => value === 0 ? [index] : []);
    const next = board.slice();
    if (!empty.length) return { board: next, index: -1 };
    const index = empty[Math.floor(random() * empty.length)];
    next[index] = random() < 0.9 ? 2 : 4;
    return { board: next, index };
  }
  function canMove(board) {
    return board.some((value, index) => value === 0 ||
      (index % SIZE < SIZE - 1 && value === board[index + 1]) ||
      (index < SIZE * (SIZE - 1) && value === board[index + SIZE]));
  }
  function validBoard(board) {
    return Array.isArray(board) && board.length === 16 && board.every(value =>
      Number.isSafeInteger(value) && (value === 0 || (value >= 2 && Number.isInteger(Math.log2(value)))));
  }
  root.Game2048 = Object.freeze({ slide, move, spawn, canMove, validBoard });
})(globalThis);
