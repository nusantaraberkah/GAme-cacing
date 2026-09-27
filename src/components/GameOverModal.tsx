import React, { useEffect } from 'react';
import { Trophy, Skull, Swords, RotateCcw, Palette, Share2, Award, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameOverStats, BestRecord } from '../types/game';

interface GameOverModalProps {
  stats: GameOverStats;
  bestRecord: BestRecord;
  onRespawn: () => void;
  onOpenCustomize: () => void;
  roomCode: string;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  bestRecord,
  onRespawn,
  onOpenCustomize,
  roomCode,
}) => {
  const isNewHighScore = stats.score > (bestRecord.highScore || 0);
  const isTopRank = stats.peakRank === 1;

  useEffect(() => {
    if (isTopRank || isNewHighScore) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#fbbf24', '#38bdf8', '#f43f5e'],
        });
      } catch {
        // Ignore
      }
    }
  }, [isTopRank, isNewHighScore]);

  // Format survival time in mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleShare = () => {
    const text = `Saya bermain Game Cacing Multiplayer dan meraih Peringkat #${stats.peakRank} dengan skor ${stats.score}! Gabung main bareng di room: ${roomCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('Tautan dan skor berhasil disalin ke clipboard!');
    }
  };

  return (
    <div
      id="game-over-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 text-center text-white relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-3 shadow-inner">
            <Skull className="w-8 h-8 text-white animate-bounce" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Cacing Anda Gugur!</h2>
          <p className="text-xs text-white/80 mt-1">
            {stats.deathReason === 'boundary'
              ? 'Menabrak laser pembatas area arena!'
              : stats.killerName
              ? `Menabrak tubuh cacing ${stats.killerName}!`
              : 'Menabrak tubuh cacing lain!'}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Highlight: Rangking Terbesar yang Pernah Dicapai */}
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/20 to-yellow-500/10 border border-amber-500/40 rounded-2xl p-4 text-center relative overflow-hidden">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Rangking Terbesar Dicapai:</span>
            </div>
            <div className="text-4xl font-black text-amber-300 font-mono tracking-tight flex items-center justify-center gap-2">
              <span>#{stats.peakRank}</span>
              <span className="text-sm font-semibold text-amber-200/70">
                dari {stats.totalPlayers} cacing
              </span>
            </div>
            {stats.peakRank === 1 && (
              <div className="mt-1 text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                👑 Anda sempat menjadi Penguasa Arena Terbesar!
              </div>
            )}
          </div>

          {/* Detailed Match Statistics Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Skor Akhir</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {stats.score.toLocaleString()}
              </span>
              {isNewHighScore && (
                <span className="text-[10px] text-amber-300 font-bold block mt-0.5">
                  ★ Rekor Baru!
                </span>
              )}
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Panjang Tubuh</span>
              <span className="text-lg font-black text-slate-200 font-mono">
                {stats.length} segmen
              </span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] block flex items-center gap-1">
                <Swords className="w-3 h-3 text-amber-400" /> Cacing Dieliminasi
              </span>
              <span className="text-lg font-black text-amber-400 font-mono">
                {stats.kills} Kills
              </span>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] block flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-400" /> Waktu Bertahan
              </span>
              <span className="text-lg font-black text-sky-400 font-mono">
                {formatTime(stats.survivalSeconds)}
              </span>
            </div>
          </div>

          {/* Historical Record Card */}
          <div className="bg-slate-950/50 px-3.5 py-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Rekor Terbaik Anda:</span>
            </div>
            <div className="font-mono font-bold text-slate-300">
              Skor: {Math.max(bestRecord.highScore, stats.score).toLocaleString()} | Rank #{Math.min(bestRecord.highestRank || 999, stats.peakRank)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={onRespawn}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-98"
            >
              <RotateCcw className="w-5 h-5 stroke-[2.5]" />
              Main Lagi Sekarang (Respawn)
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenCustomize}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <Palette className="w-4 h-4 text-emerald-400" />
                Ganti Skin / Foto
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <Share2 className="w-4 h-4 text-sky-400" />
                Ajak Teman
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
