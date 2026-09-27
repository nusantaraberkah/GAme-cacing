import React from 'react';
import { Trophy, Users, Volume2, VolumeX, Share2, Maximize2 } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';

interface LeaderboardHUDProps {
  leaderboard: LeaderboardEntry[];
  playerScore: number;
  playerLength: number;
  playerKills: number;
  playerRank: number;
  totalPlayers: number;
  arenaRadius: number;
  baseArenaRadius: number;
  roomCode: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenRoomModal: () => void;
}

export const LeaderboardHUD: React.FC<LeaderboardHUDProps> = ({
  leaderboard,
  playerScore,
  playerLength,
  playerKills,
  playerRank,
  totalPlayers,
  arenaRadius,
  baseArenaRadius,
  roomCode,
  isMuted,
  onToggleMute,
  onOpenRoomModal,
}) => {
  // Expansion percentage
  const expansionPct = Math.round(((arenaRadius - baseArenaRadius) / baseArenaRadius) * 100);

  return (
    <>
      {/* Top Left: Player Live Stats & Dynamic Arena Status */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none select-none">
        <div className="bg-slate-950/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4 text-xs font-semibold">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Skor Saya
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {playerScore.toLocaleString()}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Panjang
            </span>
            <span className="text-sm font-bold text-slate-200 font-mono">
              {playerLength}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Kills
            </span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              ⚡ {playerKills}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Peringkat
            </span>
            <span className="text-sm font-black text-sky-400">
              #{playerRank > 0 ? playerRank : '-'}{' '}
              <span className="text-[10px] text-slate-500 font-normal">/ {totalPlayers}</span>
            </span>
          </div>
        </div>

        {/* Dynamic Arena Size Indicator */}
        <div className="bg-slate-950/75 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-indigo-500/30 flex items-center gap-2 text-[11px] text-indigo-300 shadow-lg">
          <Maximize2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
          <span>
            Radius Arena: <strong className="text-white font-mono">{Math.round(arenaRadius)}m</strong>
          </span>
          {expansionPct > 0 && (
            <span className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 px-1.5 py-0.2 rounded text-[10px] font-bold">
              +{expansionPct}% Meluas!
            </span>
          )}
        </div>
      </div>

      {/* Top Right: Live Leaderboard */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 select-none">
        {/* Top Controls Row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenRoomModal}
            className="pointer-events-auto bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-1.5 shadow-lg transition-all"
            title="Main bersama teman / Salin Kode Room"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Room: {roomCode}</span>
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            className="pointer-events-auto bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 p-2 rounded-xl text-slate-300 hover:text-white shadow-lg transition-all"
            title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* Leaderboard Table Card */}
        <div className="w-64 sm:w-72 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-3">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Trophy className="w-4 h-4" />
              <span>Papan Peringkat Live</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <Users className="w-3.5 h-3.5" />
              <span>{totalPlayers} Cacing</span>
            </div>
          </div>

          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {leaderboard.slice(0, 10).map((entry, idx) => {
              const isFirst = idx === 0;
              const isTop3 = idx < 3;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between px-2 py-1 rounded-xl text-xs transition-all ${
                    entry.isCurrentPlayer
                      ? 'bg-emerald-500/25 border border-emerald-500/50 shadow-sm'
                      : isFirst
                      ? 'bg-amber-500/15 border border-amber-500/30'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`font-mono font-bold text-[11px] w-4 text-center ${
                        idx === 0
                          ? 'text-amber-400'
                          : idx === 1
                          ? 'text-slate-300'
                          : idx === 2
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {/* Face avatar */}
                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-slate-700 bg-slate-900">
                      <img
                        src={entry.avatarUrl}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <span
                      className={`truncate font-medium text-[11px] ${
                        entry.isCurrentPlayer
                          ? 'text-emerald-300 font-bold'
                          : isTop3
                          ? 'text-slate-100 font-semibold'
                          : 'text-slate-300'
                      }`}
                    >
                      {entry.name}
                      {entry.isCurrentPlayer && ' (Anda)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    {entry.kills > 0 && (
                      <span className="text-[10px] text-amber-400/90 font-mono">
                        ⚡{entry.kills}
                      </span>
                    )}
                    <span className="font-mono font-bold text-[11px] text-slate-200">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
