import React, { useState, useEffect } from 'react';
import { X, Sparkles, Trophy, RotateCcw, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface UpgradePuzzleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockPro: () => void;
  isProUnlocked: boolean;
}

// 24 pieces (6 columns x 4 rows)
const COLS = 6;
const ROWS = 4;
const TOTAL_PIECES = COLS * ROWS; // 24

interface Piece {
  id: number;
  correctIndex: number;
  currentIndex: number;
}

export const UpgradePuzzleModal: React.FC<UpgradePuzzleModalProps> = ({
  isOpen,
  onClose,
  onUnlockPro,
  isProUnlocked,
}) => {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Initialize and shuffle the 24 pieces
  const initializePuzzle = () => {
    // Generate indices 0..23
    const indices = Array.from({ length: TOTAL_PIECES }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Ensure it's not accidentally solved already
    const isAlreadySolved = indices.every((val, idx) => val === idx);
    if (isAlreadySolved) {
      // swap first two
      [indices[0], indices[1]] = [indices[1], indices[0]];
    }

    const newPieces: Piece[] = indices.map((correctIdx, currentSlot) => ({
      id: correctIdx,
      correctIndex: correctIdx,
      currentIndex: currentSlot,
    }));

    setPieces(newPieces);
    setSelectedPieceId(null);
    setMoves(0);
    setIsCompleted(false);
  };

  useEffect(() => {
    if (isOpen) {
      initializePuzzle();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle clicking a piece to swap
  const handlePieceClick = (clickedPiece: Piece) => {
    if (isCompleted) return;

    if (selectedPieceId === null) {
      setSelectedPieceId(clickedPiece.id);
    } else if (selectedPieceId === clickedPiece.id) {
      // Deselect
      setSelectedPieceId(null);
    } else {
      // Swap selected piece and clicked piece's currentIndex
      const firstPiece = pieces.find((p) => p.id === selectedPieceId);
      if (!firstPiece) return;

      const newPieces = pieces.map((p) => {
        if (p.id === firstPiece.id) {
          return { ...p, currentIndex: clickedPiece.currentIndex };
        }
        if (p.id === clickedPiece.id) {
          return { ...p, currentIndex: firstPiece.currentIndex };
        }
        return p;
      });

      setPieces(newPieces);
      setSelectedPieceId(null);
      setMoves((m) => m + 1);

      // Check if solved
      const allCorrect = newPieces.every((p) => p.correctIndex === p.currentIndex);
      if (allCorrect) {
        setIsCompleted(true);
        onUnlockPro();
      }
    }
  };

  // Instant solve for convenience/testing if desired
  const handleAutoSolve = () => {
    const solvedPieces = pieces.map((p) => ({
      ...p,
      currentIndex: p.correctIndex,
    }));
    setPieces(solvedPieces);
    setSelectedPieceId(null);
    setIsCompleted(true);
    onUnlockPro();
  };

  // Count correctly placed pieces
  const correctCount = pieces.filter((p) => p.correctIndex === p.currentIndex).length;

  // Sort pieces by their current grid slot index so they display in order 0..23
  const displayGrid = [...pieces].sort((a, b) => a.currentIndex - b.currentIndex);

  return (
    <div
      id="upgrade-puzzle-modal-backdrop"
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in select-none"
    >
      <div
        id="upgrade-puzzle-dialog"
        className="bg-[#18191c] border border-[#2e3138] rounded-3xl w-full max-w-2xl p-5 md:p-7 shadow-2xl overflow-hidden relative text-[#e3e3e3] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#27292f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Upgrade to Blob Pro
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  24-Piece Jigsaw
                </span>
              </div>
              <p className="text-xs text-[#9ca3af]">
                Solve the 24-piece jigsaw puzzle to unlock <strong>Blob Pro</strong> engine!
              </p>
            </div>
          </div>

          <button
            id="btn-close-upgrade-puzzle"
            onClick={onClose}
            className="p-2 rounded-xl text-[#9ca3af] hover:text-white hover:bg-[#25272e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Puzzle Status Bar */}
        <div className="mt-4 flex items-center justify-between px-3 py-2 bg-[#202227] rounded-xl border border-[#2b2e35] text-xs">
          <div className="flex items-center gap-4">
            <span className="text-[#9ca3af]">
              Placed: <strong className="text-pink-400">{correctCount}</strong>/24
            </span>
            <span className="text-[#9ca3af]">
              Swaps: <strong className="text-white">{moves}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHint((prev) => !prev)}
              className="px-2.5 py-1 rounded-lg bg-[#2b2d35] hover:bg-[#343740] text-xs text-[#d1d5db] transition-colors"
            >
              {showHint ? 'Hide Numbers' : 'Show Numbers'}
            </button>
            <button
              onClick={initializePuzzle}
              title="Shuffle"
              className="p-1.5 rounded-lg bg-[#2b2d35] hover:bg-[#343740] text-[#9ca3af] hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Jigsaw Canvas / Grid (6 cols x 4 rows) */}
        <div className="mt-4 relative flex justify-center">
          <div
            id="jigsaw-board"
            className="w-full max-w-[540px] aspect-[3/2] bg-[#0d0e11] border-2 border-[#2b2e35] rounded-2xl p-2 grid grid-cols-6 grid-rows-4 gap-1.5 relative overflow-hidden shadow-inner"
          >
            {displayGrid.map((piece) => {
              const isSelected = selectedPieceId === piece.id;
              const isCorrect = piece.correctIndex === piece.currentIndex;

              // Calculate background offset for 6 columns x 4 rows
              // correctIndex goes from 0 to 23
              const col = piece.correctIndex % COLS;
              const row = Math.floor(piece.correctIndex / COLS);
              const posX = (col / (COLS - 1)) * 100;
              const posY = (row / (ROWS - 1)) * 100;

              return (
                <div
                  key={piece.id}
                  onClick={() => handlePieceClick(piece)}
                  className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-150 transform active:scale-95 ${
                    isSelected
                      ? 'ring-4 ring-pink-500 scale-105 z-20 shadow-xl'
                      : isCorrect
                      ? 'ring-1 ring-emerald-500/40'
                      : 'hover:ring-2 hover:ring-white/40 opacity-90 hover:opacity-100'
                  }`}
                  style={{
                    backgroundImage: `linear-gradient(135deg, rgba(236,72,153,0.9), rgba(99,102,241,0.9), rgba(14,165,233,0.9)), radial-gradient(circle at 50% 50%, #f43f5e 0%, #3b82f6 100%)`,
                    backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
                    backgroundPosition: `${posX}% ${posY}%`,
                  }}
                >
                  {/* Subtle inner artwork overlay: blob star illustration pattern */}
                  <div
                    className="w-full h-full flex flex-col items-center justify-center text-white font-bold text-xs"
                    style={{
                      background: isCorrect
                        ? 'rgba(0, 0, 0, 0.15)'
                        : 'rgba(0, 0, 0, 0.35)',
                    }}
                  >
                    {/* Pink Blob Star motif on middle pieces */}
                    {piece.correctIndex === 9 || piece.correctIndex === 14 ? (
                      <span className="text-base drop-shadow-md">✨</span>
                    ) : null}

                    {/* Show piece number if hint is on */}
                    {showHint && (
                      <span className="text-[10px] bg-black/60 px-1 rounded text-white/80 font-mono">
                        #{piece.correctIndex + 1}
                      </span>
                    )}

                    {isCorrect && !showHint && (
                      <span className="absolute bottom-1 right-1 text-[9px] text-emerald-400">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Solved Overlay Celebration */}
            {isCompleted && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in zoom-in-95 duration-300 z-30">
                <div className="w-14 h-14 rounded-full bg-pink-500 flex items-center justify-center text-white mb-2 shadow-xl shadow-pink-500/50 animate-bounce">
                  <Trophy className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-extrabold text-white">Puzzle Solved! 🎉</h3>
                <p className="text-xs text-pink-300 mt-1 text-center max-w-sm">
                  Congratulations! You've assembled all 24 pieces. <strong>Blob Pro</strong> is
                  now completely unlocked.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold transition-all shadow-lg active:scale-95"
                  >
                    Start Using Blob Pro
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Helper instructions / Quick solve */}
        <div className="mt-4 flex items-center justify-between text-xs text-[#9ca3af] px-1">
          <p>Click any two pieces to swap their positions.</p>
          <div className="flex items-center gap-2">
            {!isCompleted && !isProUnlocked && (
              <button
                onClick={handleAutoSolve}
                className="text-[11px] text-[#71717a] hover:text-pink-400 transition-colors underline"
              >
                Instant solve (skip)
              </button>
            )}
            {isProUnlocked && (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Blob Pro Unlocked
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
