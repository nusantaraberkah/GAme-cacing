import React, { useEffect } from 'react';
import { Trophy, Skull, Swords, RotateCcw, Palette, Share2, Award, Clock, Users, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameOverStats, BestRecord, LeaderboardEntry } from '../types/game';

interface GameOverModalProps {
  stats: GameOverStats;
  bestRecord: BestRecord;
  leaderboard: LeaderboardEntry[];
  onRespawn: () => void;
  onOpenCustomize: () => void;
  roomCode: string;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  bestRecord,
  leaderboard = [],
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

  // Sort leaderboard entries descending by score
  const sortedLeaderboard = [...leaderboard].sort((a, b) => b.score - a.score);
  const topLeaderboard = sortedLeaderboard.slice(0, 10);
  const isPlayerInTop10 = topLeaderboard.some((entry) => entry.isCurrentPlayer);

  return (
    <div
      id="game-over-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative my-auto">
        {/* Top Decorative Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-4 sm:p-5 text-center text-white relative shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-2 shadow-inner">
            <Skull className="w-7 h-7 text-white animate-bounce" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Cacing Anda Gugur!</h2>
          <p className="text-xs text-white/85 mt-1 max-w-lg mx-auto">
            {stats.deathReason === 'boundary'
              ? 'Menabrak laser pembatas area arena!'
              : stats.killerName
              ? `Menabrak tubuh cacing ${stats.killerName}!`
              : 'Menabrak tubuh cacing lain!'}
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: Player Stats & Actions (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Highlight: Rangking Terbesar yang Pernah Dicapai */}
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/20 to-yellow-500/10 border border-amber-500/40 rounded-2xl p-4 text-center relative overflow-hidden">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Rangking Terbesar Dicapai:</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight flex items-center justify-center gap-2">
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
            <div className="grid grid-cols-2 gap-2.5 text-xs">
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
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                Main Lagi Sekarang (Respawn)
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onOpenCustomize}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Palette className="w-4 h-4 text-emerald-400" />
                  Ganti Skin / Foto
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-sky-400" />
                  Ajak Teman
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Papan Peringkat Arena (Leaderboard) (5 cols) */}
          <div className="lg:col-span-5 bg-slate-950/80 rounded-2xl border border-slate-800 p-3.5 flex flex-col min-h-[320px]">
            {/* Leaderboard Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Papan Peringkat Arena
                  </h3>
                  <p className="text-[10px] text-slate-400">Peringkat cacing saat ini</p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-medium">
                <Users className="w-3 h-3 text-emerald-400" />
                <span>{stats.totalPlayers} cacing</span>
              </div>
            </div>

            {/* Leaderboard Entries List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[340px]">
              {topLeaderboard.length > 0 ? (
                topLeaderboard.map((entry, idx) => {
                  const isFirst = idx === 0;
                  const isSecond = idx === 1;
                  const isThird = idx === 2;

                  return (
                    <div
                      key={entry.id || idx}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                        entry.isCurrentPlayer
                          ? 'bg-emerald-500/25 border border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                          : isFirst
                          ? 'bg-amber-500/15 border border-amber-500/30'
                          : 'bg-slate-900/40 hover:bg-slate-900/80 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Rank Badge */}
                        <div className="w-5 text-center flex items-center justify-center font-mono font-black text-xs shrink-0">
                          {isFirst ? (
                            <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                          ) : isSecond ? (
                            <span className="text-slate-300 font-bold">2</span>
                          ) : isThird ? (
                            <span className="text-amber-600 font-bold">3</span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">{idx + 1}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-slate-700 bg-slate-800">
                          <img
                            src={entry.avatarUrl}
                            alt={entry.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Name */}
                        <span
                          className={`truncate font-medium text-[11px] ${
                            entry.isCurrentPlayer
                              ? 'text-emerald-300 font-bold'
                              : isFirst
                              ? 'text-amber-200 font-semibold'
                              : 'text-slate-200'
                          }`}
                        >
                          {entry.name}
                          {entry.isCurrentPlayer && ' (Anda)'}
                        </span>
                      </div>

                      {/* Kills & Score */}
                      <div className="flex items-center gap-2 shrink-0 pl-1">
                        {entry.kills > 0 && (
                          <span className="text-[10px] text-amber-400/90 font-mono font-medium">
                            ⚡{entry.kills}
                          </span>
                        )}
                        <span className="font-mono font-bold text-xs text-slate-100">
                          {entry.score.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  Memuat data peringkat...
                </div>
              )}
            </div>

            {/* Pinned User Rank if player is outside top 10 */}
            {!isPlayerInTop10 && stats.peakRank > 10 && (
              <div className="mt-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-emerald-400 text-xs w-5 text-center">
                      #{stats.finalRank || stats.peakRank}
                    </span>
                    <span className="font-bold text-emerald-300 text-[11px]">
                      Peringkat Akhir Anda
                    </span>
                  </div>
                  <span className="font-mono font-black text-emerald-300 text-xs">
                    {stats.score.toLocaleString()} pts
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
