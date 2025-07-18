import React, { useState } from 'react';
import './App.css';

// --- Color Constants from requirements ---
const COLOR_PRIMARY = '#1e90ff';     // Primary (header, X)
const COLOR_ACCENT = '#32cd32';      // Accent (O, winner highlight)
const COLOR_SECONDARY = '#f5f5f5';   // Background

// PUBLIC_INTERFACE
function getInitialBoard() {
  // Returns a 3x3 array filled with nulls
  return Array(3)
    .fill(null)
    .map(() => Array(3).fill(null));
}

// PUBLIC_INTERFACE
function checkWinner(board) {
  /**
   * Returns "X"|"O" if a winner exists, null otherwise.
   * Also returns an array of [row, col] positions of the winning line if there is a winner.
   */
  const directions = [
    // rows
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    // cols
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    // diagonals
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]],
  ];
  for (let line of directions) {
    const [a, b, c] = line;
    const v1 = board[a[0]][a[1]];
    if (v1 && v1 === board[b[0]][b[1]] && v1 === board[c[0]][c[1]]) {
      return { winner: v1, line };
    }
  }
  return null;
}

// PUBLIC_INTERFACE
function isDraw(board) {
  // Returns true if the board is full and no winner
  return (
    board.flat().every((cell) => cell !== null) &&
    !checkWinner(board)
  );
}

// PUBLIC_INTERFACE
function simpleAIMove(board, aiMark = 'O', humanMark = 'X') {
  // Strategy: 1. Win if possible, 2. Block if needed, 3. Pick a random available cell
  // Clone the board for simulation
  // Try all cells: can AI win?
  for (let i = 0; i < 3; ++i) {
    for (let j = 0; j < 3; ++j) {
      if (board[i][j] === null) {
        board[i][j] = aiMark;
        if (checkWinner(board)?.winner === aiMark) {
          board[i][j] = null;
          return [i, j];
        }
        board[i][j] = null;
      }
    }
  }
  // Block human if possible
  for (let i = 0; i < 3; ++i) {
    for (let j = 0; j < 3; ++j) {
      if (board[i][j] === null) {
        board[i][j] = humanMark;
        if (checkWinner(board)?.winner === humanMark) {
          board[i][j] = null;
          return [i, j];
        }
        board[i][j] = null;
      }
    }
  }
  // Otherwise, pick a center if free, else random
  if (board[1][1] === null) return [1, 1];
  // Otherwise, pick a random available cell
  const empties = [];
  for (let i = 0; i < 3; ++i) for (let j = 0; j < 3; ++j)
    if (board[i][j] === null) empties.push([i, j]);
  return empties[Math.floor(Math.random() * empties.length)];
}

// PUBLIC_INTERFACE
function App() {
  // Game state
  const [board, setBoard] = useState(getInitialBoard());
  const [xIsNext, setXIsNext] = useState(true); // X always starts
  const [mode, setMode] = useState(null); // 'ai' | 'two-player' | null
  const [status, setStatus] = useState('Choose Game Mode');
  const [winnerInfo, setWinnerInfo] = useState(null); // {winner, line}
  const [disableBoard, setDisableBoard] = useState(false);

  // Handle square click
  const handleClick = (row, col) => {
    if (disableBoard || board[row][col] !== null || winnerInfo) return;
    if (mode === null) return;
    if (mode === 'ai' && !xIsNext) return; // Player is always X vs AI

    const newBoard = board.map(r => r.slice());
    newBoard[row][col] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);

    // Check for winner
    const winner = checkWinner(newBoard);
    if (winner) {
      setWinnerInfo(winner);
      setStatus(`Winner: ${winner.winner}`);
      setDisableBoard(true);
    } else if (isDraw(newBoard)) {
      setWinnerInfo(null);
      setStatus('Draw!');
      setDisableBoard(true);
    } else {
      if (mode === 'ai') {
        setXIsNext(false); // AI "O" next
        setDisableBoard(true);
        setTimeout(() => {
          aiMove(newBoard);
        }, 400); // Small delay for realism
      } else {
        setXIsNext(!xIsNext);
        setStatus(`Next: ${!xIsNext ? 'X' : 'O'}`);
      }
    }
  };

  // PUBLIC_INTERFACE
  function aiMove(currentBoard) {
    // Only triggers after player (X) moves and game not ended
    if (winnerInfo) return;
    const [aiRow, aiCol] = simpleAIMove(currentBoard, 'O', 'X');
    const newBoard = currentBoard.map(r => r.slice());
    newBoard[aiRow][aiCol] = 'O';
    setBoard(newBoard);

    const winner = checkWinner(newBoard);
    if (winner) {
      setWinnerInfo(winner);
      setStatus(`Winner: ${winner.winner}`);
      setDisableBoard(true);
    } else if (isDraw(newBoard)) {
      setWinnerInfo(null);
      setStatus('Draw!');
      setDisableBoard(true);
    } else {
      setXIsNext(true);
      setStatus(`Next: X`);
      setDisableBoard(false);
    }
  }

  // PUBLIC_INTERFACE
  function handleStart(modeVal) {
    setBoard(getInitialBoard());
    setXIsNext(true);
    setMode(modeVal);
    setWinnerInfo(null);
    setDisableBoard(false);
    setStatus(`Next: X`);
  }

  // PUBLIC_INTERFACE
  function handleRestart() {
    setBoard(getInitialBoard());
    setXIsNext(true);
    setWinnerInfo(null);
    setDisableBoard(false);
    setStatus(mode ? `Next: X` : 'Choose Game Mode');
  }

  // Key event for better accessibility
  function handleSquareKey(row, col, e) {
    if (e.key === ' ' || e.key === 'Enter') {
      handleClick(row, col);
    }
  }

  // Render helpers
  function renderSquare(row, col) {
    const mark = board[row][col];
    let winnerSquare = false;
    if (winnerInfo && winnerInfo.line.some(([r, c]) => r === row && c === col)) {
      winnerSquare = true;
    }
    return (
      <button
        className={`ttt-square${winnerSquare ? ' winner' : ''}`}
        key={`${row}-${col}`}
        onClick={() => handleClick(row, col)}
        onKeyDown={(e) => handleSquareKey(row, col, e)}
        tabIndex={0}
        aria-label={`Row ${row + 1}, Col ${col + 1}, ${mark ? mark : "empty"}`}
        style={{
          color: mark === 'X' ? COLOR_PRIMARY : mark === 'O' ? COLOR_ACCENT : undefined,
          background: winnerSquare ? (mark === 'X' ? '#eaf6ff' : '#eaffea') : COLOR_SECONDARY,
          borderColor: winnerSquare ? (mark === 'X' ? COLOR_PRIMARY : COLOR_ACCENT) : '#e0e0e0'
        }}
        disabled={disableBoard || mark !== null || !!winnerInfo}
      >
        {mark}
      </button>
    );
  }

  // UI

  return (
    <div className="ttt-app-root" style={{ background: COLOR_SECONDARY }}>
      <h1
        className="ttt-title"
        style={{
          color: COLOR_PRIMARY,
          fontWeight: 700,
          margin: '32px 0 18px 0',
          letterSpacing: '0.01em',
        }}
      >
        Tic Tac Toe
      </h1>
      <div className="ttt-status">
        {status}
      </div>
      <div className="ttt-board-container">
        <div className="ttt-board" role="group" aria-label="Tic Tac Toe Board">
          {
            [0, 1, 2].map(row =>
              <div className="ttt-row" key={row}>
                {[0, 1, 2].map(col => renderSquare(row, col))}
              </div>
            )
          }
        </div>
      </div>
      <div className="ttt-controls">
        {
          mode === null &&
          <>
            <button
              className="ttt-btn"
              style={{ background: COLOR_PRIMARY, color: "#fff", marginRight: 8 }}
              onClick={() => handleStart('two-player')}
            >
              Two Player
            </button>
            <button
              className="ttt-btn"
              style={{ background: COLOR_ACCENT, color: "#fff" }}
              onClick={() => handleStart('ai')}
            >
              Play vs AI
            </button>
          </>
        }
        {
          mode && (
            <button
              className="ttt-btn"
              style={{
                background: "#fff",
                color: COLOR_PRIMARY,
                border: `2px solid ${COLOR_PRIMARY}`,
                marginRight: 8,
              }}
              onClick={handleRestart}
            >
              Restart
            </button>
          )
        }
        <span className="ttt-mode-label">
          {mode === 'two-player' && 'Mode: Two Player'}
          {mode === 'ai' && 'Mode: vs AI (You=X, Bot=O)'}
        </span>
      </div>
      <footer className="ttt-footer">
        <small>
          Minimalist theme. <span style={{ color: COLOR_ACCENT }}>#32cd32</span> &middot; <span style={{ color: COLOR_PRIMARY }}>#1e90ff</span>
        </small>
      </footer>
    </div>
  );
}

export default App;
