import React, { useState } from 'react';
import { X, Copy, Check, Users, ArrowRight } from 'lucide-react';

interface RoomModalProps {
  currentRoom: string;
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (roomCode: string) => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  currentRoom,
  isOpen,
  onClose,
  onJoinRoom,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', currentRoom);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (clean) {
      onJoinRoom(clean);
      onClose();
    }
  };

  return (
    <div
      id="room-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Bermain Bersama Teman</h3>
              <p className="text-xs text-slate-400">Multiplayer Online Real-time</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Room Info & Link Sharing */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Kode Room Anda Saat Ini:</span>
            <span className="font-mono font-black text-emerald-400 text-sm px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {currentRoom}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Tautan Berhasil Disalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-emerald-400" />
                <span>Salin Tautan Room untuk Teman</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-500 text-center">
            Kirimkan tautan atau kode room di atas ke teman Anda agar bisa masuk ke arena permainan yang sama.
          </p>
        </div>

        {/* Join Other Room Form */}
        <form onSubmit={handleJoin} className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">
            Atau Gabung ke Room Lain:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: MABAR-123"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              maxLength={12}
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={!inputCode.trim()}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition-all"
            >
              <span>Masuk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              onJoinRoom('ARENA-PUBLIC');
              onClose();
            }}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition-all"
          >
            Kembali ke Arena Publik Utama
          </button>
        </div>
      </div>
    </div>
  );
};
