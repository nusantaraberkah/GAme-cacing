import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Smile, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { PRESET_AVATARS } from '../utils/skinPresets';

interface CameraCaptureProps {
  currentAvatar: string;
  onAvatarChange: (dataUrl: string) => void;
  wormColor?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  currentAvatar,
  onAvatarChange,
  wormColor = '#10b981',
}) => {
  const [mode, setMode] = useState<'camera' | 'upload' | 'preset'>('preset');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream safely
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start webcam
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser Anda tidak mendukung akses kamera langsung.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 480 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengakses kamera.';
      setCameraError(
        errorMsg.includes('Permission') || errorMsg.includes('denied')
          ? 'Izin kamera ditolak. Silakan izinkan akses kamera atau gunakan opsi Unggah Foto.'
          : 'Kamera tidak ditemukan atau sedang digunakan aplikasi lain.'
      );
      setCameraActive(false);
    }
  };

  // Switch modes
  const handleModeChange = (newMode: 'camera' | 'upload' | 'preset') => {
    if (newMode !== 'camera') {
      stopCamera();
    }
    setMode(newMode);
    if (newMode === 'camera') {
      startCamera();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Take selfie from webcam
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crop center square
    const minDim = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - minDim) / 2;
    const startY = (video.videoHeight - minDim) / 2;

    // Flip horizontally for natural selfie mirror
    ctx.translate(size, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, startX, startY, minDim, minDim, 0, 0, size, size);

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onAvatarChange(croppedDataUrl);
    stopCamera();
    setMode('preset');
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onAvatarChange(croppedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="camera-avatar-picker" className="space-y-4">
      {/* Tab Selector */}
      <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-sm font-medium">
        <button
          type="button"
          onClick={() => handleModeChange('preset')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
            mode === 'preset'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smile className="w-4 h-4" />
          <span>Avatar Cepat</span>
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('camera')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
            mode === 'camera'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Selfie Kamera</span>
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
            mode === 'upload'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Foto</span>
        </button>
      </div>

      {/* Mode 1: Selfie Camera */}
      {mode === 'camera' && (
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center space-y-3">
          {cameraError ? (
            <div className="w-full p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-semibold">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-red-800/60 hover:bg-red-700/80 rounded text-xs text-white"
                >
                  <RefreshCw className="w-3 h-3" /> Coba Lagi
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-emerald-500/60 shadow-xl bg-slate-950 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-emerald-300/40 rounded-full" />
            </div>
          )}

          {cameraActive && !cameraError && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 text-sm transition-all"
              >
                <Camera className="w-4 h-4" />
                Jepret Foto Wajah
              </button>
            </div>
          )}
          <p className="text-xs text-slate-400 text-center">
            Posisikan wajah Anda tepat di dalam lingkaran untuk menjadi kepala cacing!
          </p>
        </div>
      )}

      {/* Mode 2: Upload File */}
      {mode === 'upload' && (
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-xl bg-slate-950/60 hover:bg-emerald-950/10 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-slate-200">
              Pilih Foto Wajah Anda
            </span>
            <span className="text-xs text-slate-500">
              Mendukung format JPG, PNG, WEBP (Otomatis dibuat bulat)
            </span>
          </button>
        </div>
      )}

      {/* Mode 3: Presets */}
      {mode === 'preset' && (
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Pilihan Ekspresi Wajah Kepala:
          </span>
          <div className="grid grid-cols-5 gap-2">
            {PRESET_AVATARS.map((avatar) => {
              const isSelected = currentAvatar === avatar.svg;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => onAvatarChange(avatar.svg)}
                  className={`relative p-1.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-500/20 shadow-md ring-2 ring-emerald-400/30'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                  title={avatar.name}
                >
                  <img
                    src={avatar.svg}
                    alt={avatar.name}
                    className="w-10 h-10 rounded-full object-cover shadow"
                  />
                  <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center">
                    {avatar.name.split(' ')[0]}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-emerald-500 text-slate-950 rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Avatar Preview with Worm Body Glow */}
      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/90 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="relative w-14 h-14 rounded-full p-0.5 shadow-lg flex items-center justify-center"
            style={{ backgroundColor: wormColor }}
          >
            <img
              src={currentAvatar}
              alt="Kepala Cacing"
              className="w-full h-full rounded-full object-cover bg-slate-950 border-2 border-white/80"
            />
            <span className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold text-emerald-400">
              Kepala
            </span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Foto Kepala Aktif</h4>
            <p className="text-xs text-slate-400">
              Foto wajah menempel di kepala cacing dengan bagian bawah wajah selalu berada di depan mengikuti arah gerak cacing!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
