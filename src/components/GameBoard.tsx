'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './GameBoard.module.css';

type Player = 'X' | 'O';
type Cell = Player | null;
type Board = Cell[];

interface GameRecord {
  id: number;
  winner: string;
  createdAt: string;
}

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calculateWinner(board: Board): { winner: Player; line: number[] } | null {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line: [a, b, c] };
    }
  }
  return null;
}

function isDraw(board: Board): boolean {
  return board.every((cell) => cell !== null) && calculateWinner(board) === null;
}

export default function GameBoard() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winnerInfo, setWinnerInfo] = useState<{ winner: Player; line: number[] } | null>(null);
  const [draw, setDraw] = useState(false);
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch('/api/games');
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setGameHistory(data.games || []);
    } catch (err) {
      setHistoryError('Could not load game history.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveGame = useCallback(async (winner: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner }),
      });
      if (res.ok) {
        await fetchHistory();
      }
    } catch (err) {
      console.error('Failed to save game:', err);
    } finally {
      setSaving(false);
    }
  }, [fetchHistory]);

  const handleCellClick = useCallback((index: number) => {
    if (board[index] || winnerInfo || draw) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const result = calculateWinner(newBoard);
    if (result) {
      setWinnerInfo(result);
      saveGame(result.winner);
    } else if (isDraw(newBoard)) {
      setDraw(true);
      saveGame('Draw');
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  }, [board, currentPlayer, winnerInfo, draw, saveGame]);

  const handleReset = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinnerInfo(null);
    setDraw(false);
  }, []);

  const getStatusMessage = () => {
    if (winnerInfo) return `Player ${winnerInfo.winner} wins! 🎉`;
    if (draw) return "It's a draw! 🤝";
    return `Player ${currentPlayer}'s turn`;
  };

  const isWinningCell = (index: number) =>
    winnerInfo?.line.includes(index) ?? false;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getWinnerBadgeClass = (winner: string) => {
    if (winner === 'X') return styles.badgeX;
    if (winner === 'O') return styles.badgeO;
    return styles.badgeDraw;
  };

  return (
    <div className={styles.container}>
      <div className={styles.gameSection}>
        {/* Status */}
        <div
          className={`${styles.status} ${
            winnerInfo ? styles.statusWinner : draw ? styles.statusDraw : styles.statusTurn
          }`}
        >
          {getStatusMessage()}
        </div>

        {/* Board */}
        <div className={styles.board} role="grid" aria-label="Tic Tac Toe Board">
          {board.map((cell, index) => (
            <button
              key={index}
              className={`${styles.cell} ${
                cell === 'X' ? styles.cellX : cell === 'O' ? styles.cellO : ''
              } ${isWinningCell(index) ? styles.cellWinning : ''} ${
                !cell && !winnerInfo && !draw ? styles.cellHoverable : ''
              }`}
              onClick={() => handleCellClick(index)}
              aria-label={`Cell ${index + 1}${cell ? `, ${cell}` : ''}`}
              disabled={!!cell || !!winnerInfo || draw}
            >
              <span className={styles.cellContent}>{cell}</span>
            </button>
          ))}
        </div>

        {/* Reset Button */}
        <button className={styles.resetButton} onClick={handleReset}>
          New Game
        </button>

        {/* Current player indicator */}
        {!winnerInfo && !draw && (
          <div className={styles.playerIndicator}>
            <span className={currentPlayer === 'X' ? styles.indicatorX : styles.indicatorO}>
              {currentPlayer === 'X' ? '✕' : '○'}
            </span>
            <span className={styles.indicatorLabel}>Current Player</span>
          </div>
        )}
      </div>

      {/* Game History */}
      <div className={styles.historySection}>
        <h2 className={styles.historyTitle}>Game History</h2>
        {saving && <p className={styles.savingText}>Saving game...</p>}
        {historyLoading ? (
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner}></div>
            <p>Loading history...</p>
          </div>
        ) : historyError ? (
          <p className={styles.errorText}>{historyError}</p>
        ) : gameHistory.length === 0 ? (
          <p className={styles.emptyText}>No games played yet. Start playing!</p>
        ) : (
          <div className={styles.historyList}>
            {gameHistory.map((game, idx) => (
              <div key={game.id} className={styles.historyItem}>
                <span className={styles.historyIndex}>#{idx + 1}</span>
                <span className={`${styles.winnerBadge} ${getWinnerBadgeClass(game.winner)}`}>
                  {game.winner === 'Draw' ? 'Draw' : `${game.winner} Won`}
                </span>
                <span className={styles.historyDate}>{formatDate(game.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
