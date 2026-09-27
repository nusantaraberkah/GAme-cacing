import React, { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Users, Trophy, Zap, Volume2, VolumeX, Shuffle, ArrowLeft } from 'lucide-react';
import { GameEngine } from './game/GameEngine';
import { SkinConfig, LeaderboardEntry, GameOverStats, BestRecord } from './types/game';
import { getDefaultSkin, PRESET_AVATARS } from './utils/skinPresets';
import { sound } from './utils/sound';
import { CameraCapture } from './components/CameraCapture';
import { SkinCustomizer } from './components/SkinCustomizer';
import { LeaderboardHUD } from './components/LeaderboardHUD';
import { GameOverModal } from './components/GameOverModal';
import { RoomModal } from './components/RoomModal';

const RANDOM_NAMES = [
  'Cacing Naga',
  'Garuda Sakti',
  'Super Slither',
  'Batik Kilat',
  'Raja Rimba',
  'Cacing Petir',
  'Si Gesit',
  'Toxic King',
  'Mega Cobra',
  'Bintang Emas',
];

export default function App() {
  // Screen state
  const [gameState, setGameState] = useState<'lobby' | 'playing'>('lobby');
  const [lobbyTab, setLobbyTab] = useState<'profile' | 'skin'>('profile');

  // Player configurations
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('worm_player_name') || 'Cacing Sakti';
  });
  const [playerAvatar, setPlayerAvatar] = useState(() => {
    return localStorage.getItem('worm_player_avatar') || PRESET_AVATARS[0].svg;
  });
  const [playerSkin, setPlayerSkin] = useState<SkinConfig>(() => {
    const saved = localStorage.getItem('worm_player_skin');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return getDefaultSkin();
  });

  // Room state
  const [roomCode, setRoomCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || 'ARENA-PUBLIC';
  });
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // In-Game Live HUD stats
  const [playerScore, setPlayerScore] = useState(10);
  const [playerLength, setPlayerLength] = useState(16);
  const [playerKills, setPlayerKills] = useState(0);
  const [playerRank, setPlayerRank] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(1);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [arenaRadius, setArenaRadius] = useState(1800);
  const [isMuted, setIsMuted] = useState(false);

  // Game over state
  const [gameOverStats, setGameOverStats] = useState<GameOverStats | null>(null);

  // Best Record
  const [bestRecord, setBestRecord] = useState<BestRecord>(() => {
    const saved = localStorage.getItem('worm_best_record');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback
      }
    }
    return {
      highScore: 0,
      highestRank: 999,
      maxKills: 0,
      longestSurvival: 0,
      totalGames: 0,
    };
  });

  // Canvas & Game Engine Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Save profile to localStorage
  useEffect(() => {
    localStorage.setItem('worm_player_name', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('worm_player_avatar', playerAvatar);
  }, [playerAvatar]);

  useEffect(() => {
    localStorage.setItem('worm_player_skin', JSON.stringify(playerSkin));
  }, [playerSkin]);

  // Handle Resize for Canvas
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  // Start game handler
  const handleStartGame = () => {
    sound.playEat(10);
    setGameOverStats(null);
    setGameState('playing');
  };

  // Initialize Game Engine when entering 'playing' state
  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const engine = new GameEngine(
      canvas,
      {
        onScoreUpdate: (score, length, kills, rank, total) => {
          setPlayerScore(score);
          setPlayerLength(length);
          setPlayerKills(kills);
          setPlayerRank(rank);
          setTotalPlayers(total);
        },
        onLeaderboardUpdate: (entries) => {
          setLeaderboard(entries);
        },
        onArenaSizeUpdate: (radius) => {
          setArenaRadius(radius);
        },
        onGameOver: (stats) => {
          setGameOverStats(stats);

          // Update best record
          setBestRecord((prev) => {
            const updated: BestRecord = {
              highScore: Math.max(prev.highScore, stats.score),
              highestRank: Math.min(prev.highestRank || 999, stats.peakRank),
              maxKills: Math.max(prev.maxKills, stats.kills),
              longestSurvival: Math.max(prev.longestSurvival, stats.survivalSeconds),
              totalGames: prev.totalGames + 1,
            };
            localStorage.setItem('worm_best_record', JSON.stringify(updated));
            return updated;
          });
        },
      },
      playerName,
      playerAvatar,
      playerSkin,
      roomCode
    );

    engineRef.current = engine;
    engine.start();

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, [gameState, roomCode]);

  // Update engine if skin/avatar changed mid-game
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updatePlayerDetails(playerName, playerAvatar, playerSkin);
    }
  }, [playerName, playerAvatar, playerSkin]);

  // Respawn after game over
  const handleRespawn = () => {
    setGameOverStats(null);
    if (engineRef.current) {
      engineRef.current.respawn();
    } else {
      setGameState('playing');
    }
  };

  // Switch to customization from game over
  const handleOpenCustomize = () => {
    setGameOverStats(null);
    setGameState('lobby');
    setLobbyTab('skin');
  };

  // Toggle Sound
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Randomize nickname
  const handleRandomName = () => {
    const rnd = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const num = Math.floor(10 + Math.random() * 89);
    setPlayerName(`${rnd} ${num}`);
  };

  // Handle Mobile Boost Button
  const handleTouchBoostStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (engineRef.current) {
      engineRef.current.isBoosting = true;
    }
  };

  const handleTouchBoostEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (engineRef.current) {
      engineRef.current.isBoosting = false;
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 1. LOBBY & CHARACTER LOGIN / CUSTOMIZATION SCREEN */}
      {gameState === 'lobby' && (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Ambient background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl" />
          </div>

          <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
            {/* Header Title */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Multiplayer Online Real-time
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                <span>GAME CACING</span>
                <span className="text-emerald-400">ONLINE</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Buat nama dan masukkan foto wajah Anda untuk menjadi kepala cacing! Tabrak cacing lain, kumpulkan makanan, dan jadilah yang terbesar!
              </p>
            </div>

            {/* Tab Navigation: Profil & Foto vs Kustomisasi Skin */}
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-sm font-semibold">
              <button
                type="button"
                onClick={() => setLobbyTab('profile')}
                className={`flex-1 py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  lobbyTab === 'profile'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Foto Kepala & Nama</span>
              </button>
              <button
                type="button"
                onClick={() => setLobbyTab('skin')}
                className={`flex-1 py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  lobbyTab === 'skin'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Kustomisasi Skin & Corak</span>
              </button>
            </div>

            {/* Tab 1: Nama & Foto Kepala Wajah */}
            {lobbyTab === 'profile' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Nickname Input with Random Generator */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                    Nama Pemain Cacing:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Masukkan nama pemain..."
                      maxLength={20}
                      className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white font-bold text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleRandomName}
                      className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                      title="Buat Nama Acak"
                    >
                      <Shuffle className="w-4 h-4 text-emerald-400" />
                      <span className="hidden sm:inline">Acak</span>
                    </button>
                  </div>
                </div>

                {/* Face Photo Capture / Upload / Preset Avatar */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                    Foto Wajah Kepala Cacing:
                  </label>
                  <CameraCapture
                    currentAvatar={playerAvatar}
                    onAvatarChange={(newAvatar) => setPlayerAvatar(newAvatar)}
                    wormColor={playerSkin.primaryColor}
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Skin & Aksesoris */}
            {lobbyTab === 'skin' && (
              <div className="animate-in fade-in duration-150">
                <SkinCustomizer
                  skin={playerSkin}
                  onSkinChange={(newSkin) => setPlayerSkin(newSkin)}
                  avatarUrl={playerAvatar}
                />
              </div>
            )}

            {/* Room & Friend Mabar Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <button
                type="button"
                onClick={() => setIsRoomModalOpen(true)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 font-medium transition-colors"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>
                  Room: <strong className="text-white font-mono">{roomCode}</strong>
                </span>
                <span className="text-emerald-400 underline ml-1">Ganti / Ajak Teman</span>
              </button>

              {/* Best Record Badge */}
              {bestRecord.highScore > 0 && (
                <div className="flex items-center gap-1.5 text-amber-400 font-mono font-semibold">
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Rekor: {bestRecord.highScore.toLocaleString()} pts</span>
                </div>
              )}
            </div>

            {/* Main Play Action Button */}
            <button
              type="button"
              onClick={handleStartGame}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current" />
              <span>MASUK KE ARENA & MAIN!</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. IN-GAME CANVAS & HUD SCREEN */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full block cursor-crosshair touch-none ${
          gameState === 'playing' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {gameState === 'playing' && (
        <>
          {/* Top HUD: Stats, Leaderboard & Dynamic Arena Info */}
          <LeaderboardHUD
            leaderboard={leaderboard}
            playerScore={playerScore}
            playerLength={playerLength}
            playerKills={playerKills}
            playerRank={playerRank}
            totalPlayers={totalPlayers}
            arenaRadius={arenaRadius}
            baseArenaRadius={1800}
            roomCode={roomCode}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenRoomModal={() => setIsRoomModalOpen(true)}
          />

          {/* Top Center Quick Button to Return to Lobby/Customization */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <button
              type="button"
              onClick={() => setGameState('lobby')}
              className="bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Menu</span>
            </button>
          </div>

          {/* Bottom Right Floating Boost Button (Touch Screen & Mouse) */}
          <div className="absolute bottom-6 right-6 z-20 select-none">
            <button
              type="button"
              onMouseDown={handleTouchBoostStart}
              onMouseUp={handleTouchBoostEnd}
              onTouchStart={handleTouchBoostStart}
              onTouchEnd={handleTouchBoostEnd}
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black flex flex-col items-center justify-center shadow-2xl shadow-amber-500/40 border-4 border-white/20 active:scale-90 transition-transform cursor-pointer"
            >
              <Zap className="w-8 h-8 fill-current stroke-[2]" />
              <span className="text-[10px] uppercase tracking-wider font-extrabold -mt-1">
                BOOST
              </span>
            </button>
            <div className="text-[10px] text-slate-400 text-center mt-1.5 font-medium hidden sm:block">
              Spasi / Klik Kiri
            </div>
          </div>

          {/* Control Hint at bottom center */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden md:block">
            <span className="bg-slate-950/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-800 text-[11px] text-slate-400">
              Arahkan mouse untuk belok • Spasi / Tahan Klik untuk meluncur cepat (Boost)
            </span>
          </div>
        </>
      )}

      {/* 3. GAME OVER MODAL (Rangking Terbesar & Statistik Lengkap + Papan Peringkat) */}
      {gameOverStats && (
        <GameOverModal
          stats={gameOverStats}
          bestRecord={bestRecord}
          leaderboard={leaderboard}
          onRespawn={handleRespawn}
          onOpenCustomize={handleOpenCustomize}
          roomCode={roomCode}
        />
      )}

      {/* 4. ROOM / MABAR BERSAMA TEMAN MODAL */}
      <RoomModal
        currentRoom={roomCode}
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onJoinRoom={(newRoom) => {
          setRoomCode(newRoom);
          const url = new URL(window.location.href);
          url.searchParams.set('room', newRoom);
          window.history.replaceState({}, '', url.toString());
        }}
      />
    </div>
  );
}
