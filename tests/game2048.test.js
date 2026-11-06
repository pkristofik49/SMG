(function () {
  'use strict';
  const rules = Game2048;
  const results = [];
  let failures = 0;
  function equal(actual, expected) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  function test(name, run) {
    try { run(); results.push(`PASS ${name}`); }
    catch (error) { failures++; results.push(`FAIL ${name}: ${error.message}`); }
  }
  const empty = () => Array(16).fill(0);
  test('Five cells merge without shortening the line', () => equal(rules.slide([2, 2, 4, 4, 8]), { line: [4, 8, 8, 0, 0], points: 12 }));
  test('Extended moves and merges correctly in all four directions', () => {
    for (const direction of ['left', 'right', 'up', 'down']) {
      const board = Array(25).fill(0);
      const vertical = direction === 'up' || direction === 'down';
      board[0] = 2; board[vertical ? 5 : 1] = 2;
      const result = rules.move(board, direction);
      const destination = direction === 'right' ? 4 : direction === 'down' ? 20 : 0;
      equal(result.board.length, 25); equal(result.board[destination], 4); equal(result.points, 4);
      equal(result.merges, [destination]); equal(result.movements.map(tile => tile.to), [destination, destination]);
    }
  });
  test('Extended validation rejects four by four saves', () => { equal(rules.validBoard(Array(25).fill(0), 5), true); equal(rules.validBoard(Array(16).fill(0), 5), false); equal(rules.validBoard(Array(25).fill(0)), false); });
  test('Extended game-over detection respects five-column row boundaries', () => {
    const board = Array.from({ length: 25 }, (_, index) => 2 ** (index + 1));
    equal(rules.canMove(board), false);
    board[5] = board[4]; equal(rules.canMove(board), false);
    board[24] = board[23]; equal(rules.canMove(board), true);
  });
  test('Four twos merge into two fours', () => equal(rules.slide([2, 2, 2, 2]), { line: [4, 4, 0, 0], points: 8 }));
  test('A newly merged tile cannot merge again in the same move', () => equal(rules.slide([2, 2, 4, 0]), { line: [4, 4, 0, 0], points: 4 }));
  test('Empty cells do not prevent merging', () => equal(rules.slide([2, 0, 2, 4]), { line: [4, 4, 0, 0], points: 4 }));
  test('Three matching tiles merge from the movement direction', () => equal(rules.slide([4, 4, 4, 0]), { line: [8, 4, 0, 0], points: 8 }));
  test('Moving left preserves the input board', () => {
    const input = [0, 2, 2, 0, ...Array(12).fill(0)];
    const result = rules.move(input, 'left');
    equal(result.board, [4, ...Array(15).fill(0)]); equal(result.points, 4); equal(result.changed, true); equal(input[1], 2);
  });
  test('Moving right', () => equal(rules.move([2, 2, 4, 0, ...Array(12).fill(0)], 'right').board, [0, 0, 4, 4, ...Array(12).fill(0)]));
  test('Moving up', () => {
    const input = empty(); input[4] = 2; input[12] = 2;
    equal(rules.move(input, 'up').board, [4, ...Array(15).fill(0)]);
  });
  test('Moving down', () => {
    const input = empty(); input[0] = 2; input[4] = 2; input[8] = 4;
    const expected = empty(); expected[8] = 4; expected[12] = 4;
    equal(rules.move(input, 'down').board, expected);
  });
  test('An invalid move reports no change or points', () => {
    const result = rules.move([2, 4, 0, 0, ...Array(12).fill(0)], 'left');
    equal(result.changed, false); equal(result.points, 0);
  });
  const full = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  test('A full alternating board ends the game', () => equal(rules.canMove(full), false));
  test('A vertical pair on a full board allows another move', () => { const input = full.slice(); input[4] = 2; equal(rules.canMove(input), true); });
  test('A horizontal pair on a full board allows another move', () => { const input = full.slice(); input[1] = 2; equal(rules.canMove(input), true); });
  test('Tiles cannot merge across row boundaries', () => { const input = [2, 4, 8, 16, 16, 8, 4, 2, 2, 4, 8, 16, 16, 8, 4, 2]; equal(rules.canMove(input), false); });
  test('An empty cell allows another move', () => { const input = full.slice(); input[5] = 0; equal(rules.canMove(input), true); });
  test('A new two spawns only in an empty cell', () => {
    const input = full.slice(); input[6] = 0;
    const result = rules.spawn(input, () => 0);
    equal(result.index, 6); equal(result.board[6], 2); equal(input[6], 0);
  });
  test('The ten-percent branch spawns a four', () => equal(rules.spawn(empty(), () => 0.95).board[15], 4));
  test('Spawning preserves a full board', () => { equal(rules.spawn(full).board, full); equal(rules.spawn(full).index, -1); });
  test('Merging into 2048 awards 2048 points', () => equal(rules.slide([1024, 1024, 0, 0]), { line: [2048, 0, 0, 0], points: 2048 }));
  test('Invalid saved boards are rejected', () => { equal(rules.validBoard([2]), false); const input = empty(); input[0] = 3; equal(rules.validBoard(input), false); input[0] = -2; equal(rules.validBoard(input), false); input[0] = '2'; equal(rules.validBoard(input), false); equal(rules.validBoard(empty()), true); });
  test('One thousand random moves preserve the sum before spawning', () => {
    let board = rules.spawn(rules.spawn(empty()).board).board;
    for (let i = 0; i < 1000; i++) {
      const result = rules.move(board, ['left', 'right', 'up', 'down'][i % 4]);
      equal(result.board.reduce((a, b) => a + b, 0), board.reduce((a, b) => a + b, 0));
      equal(rules.validBoard(result.board), true);
      board = result.changed ? rules.spawn(result.board).board : board;
      if (!rules.canMove(board)) board = rules.spawn(rules.spawn(empty()).board).board;
    }
  });
  test('Both merging tiles share an animation destination', () => {
    const input = [2, 0, 2, 4, ...Array(12).fill(0)];
    const result = rules.move(input, 'left');
    equal(result.movements, [
      { from: 0, to: 0, value: 2 }, { from: 2, to: 0, value: 2 }, { from: 3, to: 1, value: 4 }
    ]);
    equal(result.merges, [0]);
  });
  test('Two merges to the right have separate destinations', () => {
    const result = rules.move([2, 2, 2, 2, ...Array(12).fill(0)], 'right');
    equal(result.movements, [
      { from: 3, to: 3, value: 2 }, { from: 2, to: 3, value: 2 },
      { from: 1, to: 2, value: 2 }, { from: 0, to: 2, value: 2 }
    ]);
    equal(result.merges, [3, 2]);
  });
  test('Animation paths reconstruct the result in every direction', () => {
    const input = [2, 0, 2, 4, 2, 4, 4, 0, 8, 8, 4, 2, 8, 0, 0, 2];
    for (const direction of ['up', 'down', 'left', 'right']) {
      const result = rules.move(input, direction);
      const reconstructed = empty();
      result.movements.forEach(tile => {
        equal(tile.value, input[tile.from]);
        reconstructed[tile.to] += tile.value;
      });
      equal(reconstructed, result.board);
      equal(result.movements.length, input.filter(Boolean).length);
      equal(new Set(result.movements.map(tile => tile.from)).size, result.movements.length);
    }
  });
  results.push(`\n${results.length - failures}/${results.length} tests passed.`);
  globalThis.testResults = { failures, results };
  if (typeof document !== 'undefined') {
    document.getElementById('results').textContent = results.join('\n');
    document.title = failures ? 'FAIL – 2048' : 'PASS – 2048';
  }
})();
