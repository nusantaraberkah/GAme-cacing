import React from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { SkinConfig, AccessoryType } from '../types/game';
import { SKIN_PRESETS, ACCESSORY_OPTIONS } from '../utils/skinPresets';

interface SkinCustomizerProps {
  skin: SkinConfig;
  onSkinChange: (skin: SkinConfig) => void;
  avatarUrl: string;
}

export const SkinCustomizer: React.FC<SkinCustomizerProps> = ({
  skin,
  onSkinChange,
  avatarUrl,
}) => {
  const handlePresetSelect = (preset: typeof SKIN_PRESETS[0]) => {
    onSkinChange({
      ...skin,
      id: preset.id,
      name: preset.name,
      pattern: preset.pattern,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      glowColor: preset.glowColor,
    });
  };

  const handleAccessorySelect = (accId: AccessoryType) => {
    onSkinChange({
      ...skin,
      accessory: accId,
    });
  };

  return (
    <div id="skin-customizer" className="space-y-4">
      {/* Live Preview of Worm with Segments and Face Head */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Preview Cacing Anda
        </div>

        {/* Animated Worm visual */}
        <div className="relative h-24 flex items-center justify-center">
          <div className="flex items-center space-x-[-8px]">
            {/* Tail & Body Segments */}
            {[5, 4, 3, 2, 1].map((segIndex) => {
              const isAlternate = segIndex % 2 === 1;
              const bg = isAlternate ? skin.primaryColor : skin.secondaryColor;
              const size = 32 - segIndex * 2;
              return (
                <div
                  key={segIndex}
                  className="rounded-full shadow-md animate-pulse"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: bg,
                    boxShadow: `0 0 10px ${skin.glowColor}55`,
                    animationDelay: `${segIndex * 120}ms`,
                  }}
                />
              );
            })}

            {/* Head Segment with Avatar */}
            <div
              className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-10"
              style={{
                backgroundColor: skin.primaryColor,
                boxShadow: `0 0 16px ${skin.glowColor}`,
              }}
            >
              <img
                src={avatarUrl}
                alt="Wajah Cacing"
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm -rotate-90 transition-transform"
                title="Bagian bawah wajah menghadap ke depan arah cacing"
              />

              {/* Head Accessory overlay */}
              {skin.accessory === 'crown' && (
                <span className="absolute -top-4 text-2xl filter drop-shadow-md select-none animate-bounce">
                  👑
                </span>
              )}
              {skin.accessory === 'sunglasses' && (
                <span className="absolute top-1 text-xl filter drop-shadow select-none">
                  🕶️
                </span>
              )}
              {skin.accessory === 'cowboy' && (
                <span className="absolute -top-4 text-2xl filter drop-shadow select-none">
                  🤠
                </span>
              )}
              {skin.accessory === 'party' && (
                <span className="absolute -top-4 -right-1 text-2xl filter drop-shadow select-none">
                  🎉
                </span>
              )}
              {skin.accessory === 'wizard' && (
                <span className="absolute -top-4 text-2xl filter drop-shadow select-none">
                  🧙
                </span>
              )}
              {skin.accessory === 'devil' && (
                <span className="absolute -top-3 text-2xl filter drop-shadow select-none">
                  😈
                </span>
              )}
              {skin.accessory === 'halo' && (
                <span className="absolute -top-4 text-2xl filter drop-shadow select-none">
                  😇
                </span>
              )}
              {skin.accessory === 'viking' && (
                <span className="absolute -top-3 text-2xl filter drop-shadow select-none">
                  🪓
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-1 text-center">
          <span className="text-xs font-bold text-slate-200">
            {skin.name}
          </span>
          {skin.accessory !== 'none' && (
            <span className="text-xs text-amber-300 ml-1.5 font-medium">
              +{ACCESSORY_OPTIONS.find((a) => a.id === skin.accessory)?.name}
            </span>
          )}
        </div>
      </div>

      {/* Skin Theme Palette Presets */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-emerald-400" />
          Corak & Warna Skin Tubuh:
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SKIN_PRESETS.map((preset) => {
            const isSelected = skin.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-400 bg-emerald-500/15 shadow-sm ring-1 ring-emerald-400/40'
                    : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <div
                    className="w-4 h-4 rounded-full border border-white/40"
                    style={{ backgroundColor: preset.primaryColor }}
                  />
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/20"
                    style={{ backgroundColor: preset.secondaryColor }}
                  />
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: preset.glowColor }}
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">
                    {preset.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accessory Selector */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">
          Aksesoris Kepala:
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {ACCESSORY_OPTIONS.map((acc) => {
            const isSelected = skin.accessory === acc.id;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleAccessorySelect(acc.id)}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50'
                    : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className="text-xl">{acc.icon}</span>
                <span className="text-[10px] font-medium truncate w-full text-center">
                  {acc.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
