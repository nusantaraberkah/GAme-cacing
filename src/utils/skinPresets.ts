import { SkinConfig, AccessoryType, SkinPatternType } from '../types/game';

export interface SkinOption {
  id: string;
  name: string;
  pattern: SkinPatternType;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  description: string;
}

export const SKIN_PRESETS: SkinOption[] = [
  {
    id: 'neon-emerald',
    name: 'Emerald Neon',
    pattern: 'neon_glow',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    glowColor: '#34d399',
    description: 'Hijau bersinar terang dengan aura energi alam'
  },
  {
    id: 'cyber-cyan',
    name: 'Cyberpunk Cyan',
    pattern: 'neon_glow',
    primaryColor: '#06b6d4',
    secondaryColor: '#0284c7',
    glowColor: '#38bdf8',
    description: 'Biru listrik futuristik bercahaya'
  },
  {
    id: 'rainbow-rush',
    name: 'Rainbow Spektrum',
    pattern: 'rainbow',
    primaryColor: '#ec4899',
    secondaryColor: '#8b5cf6',
    glowColor: '#f43f5e',
    description: 'Warna pelangi bergulir spektakuler'
  },
  {
    id: 'lava-dragon',
    name: 'Lava Dragon',
    pattern: 'stripes',
    primaryColor: '#ef4444',
    secondaryColor: '#f97316',
    glowColor: '#fbbf24',
    description: 'Garis-garis api magma membara'
  },
  {
    id: 'bumblebee',
    name: 'Tawon Emas',
    pattern: 'bumblebee',
    primaryColor: '#eab308',
    secondaryColor: '#18181b',
    glowColor: '#fde047',
    description: 'Kuning emas bergaris hitam kontras tinggi'
  },
  {
    id: 'royal-purple',
    name: 'Royal Nebula',
    pattern: 'cosmic',
    primaryColor: '#8b5cf6',
    secondaryColor: '#4f46e5',
    glowColor: '#c084fc',
    description: 'Ungu bangsawan misterius kosmik'
  },
  {
    id: 'candy-sweet',
    name: 'Candy Bubblegum',
    pattern: 'stripes',
    primaryColor: '#f472b6',
    secondaryColor: '#38bdf8',
    glowColor: '#fbcfe8',
    description: 'Perpaduan manis merah muda dan biru permen'
  },
  {
    id: 'batik-emas',
    name: 'Batik Nusantara',
    pattern: 'batik',
    primaryColor: '#d97706',
    secondaryColor: '#78350f',
    glowColor: '#fbbf24',
    description: 'Motif batik elegan nusantara'
  },
  {
    id: 'toxic-acid',
    name: 'Toxic Acid',
    pattern: 'toxic',
    primaryColor: '#84cc16',
    secondaryColor: '#15803d',
    glowColor: '#a3e635',
    description: 'Pendar asam radioaktif mematikan'
  }
];

export interface AccessoryOption {
  id: AccessoryType;
  name: string;
  icon: string;
  description: string;
}

export const ACCESSORY_OPTIONS: AccessoryOption[] = [
  { id: 'none', name: 'Tanpa Aksesoris', icon: '✨', description: 'Tampil polos dan lincah' },
  { id: 'crown', name: 'Mahkota Emas', icon: '👑', description: 'Mahkota raja penguasa arena' },
  { id: 'sunglasses', name: 'Kacamata Hitam', icon: '🕶️', description: 'Gaya keren penuh wibawa' },
  { id: 'cowboy', name: 'Topi Koboi', icon: '🤠', description: 'Petualang liar tangguh' },
  { id: 'party', name: 'Topi Pesta', icon: '🎉', description: 'Selalu siap berpesta dan makan' },
  { id: 'wizard', name: 'Topi Penyihir', icon: '🧙', description: 'Memiliki sihir pelindung' },
  { id: 'devil', name: 'Tanduk Naga', icon: '😈', description: 'Menakutkan dan garang' },
  { id: 'halo', name: 'Lingkaran Malaikat', icon: '😇', description: 'Suci dan berwibawa' },
  { id: 'viking', name: 'Helm Viking', icon: '🪓', description: 'Pejuang tak kenal takut' }
];

export const PRESET_AVATARS = [
  {
    id: 'avatar-1',
    name: 'Senyum Bahagia',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23fbbf24"/><circle cx="35" cy="40" r="7" fill="%231f2937"/><circle cx="65" cy="40" r="7" fill="%231f2937"/><circle cx="37" cy="38" r="2.5" fill="%23ffffff"/><circle cx="67" cy="38" r="2.5" fill="%23ffffff"/><path d="M 28 60 Q 50 82 72 60" stroke="%231f2937" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="25" cy="52" r="6" fill="%23f87171" opacity="0.6"/><circle cx="75" cy="52" r="6" fill="%23f87171" opacity="0.6"/></svg>`
  },
  {
    id: 'avatar-2',
    name: 'Gamer Keren',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%2338bdf8"/><path d="M 20 40 L 80 40 L 75 55 L 25 55 Z" fill="%230f172a"/><rect x="25" y="38" width="22" height="15" rx="3" fill="%2306b6d4"/><rect x="53" y="38" width="22" height="15" rx="3" fill="%2306b6d4"/><path d="M 35 70 Q 50 78 65 70" stroke="%230f172a" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`
  },
  {
    id: 'avatar-3',
    name: 'Raja Cacing',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23a855f7"/><circle cx="35" cy="42" r="7" fill="%23ffffff"/><circle cx="65" cy="42" r="7" fill="%23ffffff"/><circle cx="37" cy="42" r="4" fill="%234c1d95"/><circle cx="67" cy="42" r="4" fill="%234c1d95"/><polygon points="25,25 35,5 50,20 65,5 75,25" fill="%23fbbf24" stroke="%23b45309" stroke-width="2"/><path d="M 32 66 Q 50 54 68 66" stroke="%23ffffff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`
  },
  {
    id: 'avatar-4',
    name: 'Muka Seram',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23ef4444"/><polygon points="28,32 45,42 28,45" fill="%23111827"/><polygon points="72,32 55,42 72,45" fill="%23111827"/><circle cx="38" cy="42" r="3" fill="%23ef4444"/><circle cx="62" cy="42" r="3" fill="%23ef4444"/><path d="M 30 68 Q 50 55 70 68" stroke="%23111827" stroke-width="5" fill="none"/><polygon points="40,65 44,72 48,65" fill="%23ffffff"/><polygon points="52,65 56,72 60,65" fill="%23ffffff"/></svg>`
  },
  {
    id: 'avatar-5',
    name: 'Meme Kaget',
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%234ade80"/><circle cx="34" cy="38" r="10" fill="%23ffffff"/><circle cx="66" cy="38" r="10" fill="%23ffffff"/><circle cx="35" cy="38" r="4" fill="%23052e16"/><circle cx="67" cy="38" r="4" fill="%23052e16"/><ellipse cx="50" cy="68" rx="12" ry="16" fill="%23052e16"/></svg>`
  }
];

export function getDefaultSkin(): SkinConfig {
  const preset = SKIN_PRESETS[0];
  return {
    id: preset.id,
    name: preset.name,
    pattern: preset.pattern,
    primaryColor: preset.primaryColor,
    secondaryColor: preset.secondaryColor,
    glowColor: preset.glowColor,
    accessory: 'none',
    eyeType: 'cute'
  };
}
