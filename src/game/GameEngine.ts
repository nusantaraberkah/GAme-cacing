import { Point, Food, Worm, SkinConfig, LeaderboardEntry, GameOverStats } from '../types/game';
import { sound } from '../utils/sound';
import { PRESET_AVATARS, SKIN_PRESETS } from '../utils/skinPresets';

export interface GameEngineCallbacks {
  onScoreUpdate: (score: number, length: number, kills: number, rank: number, total: number) => void;
  onLeaderboardUpdate: (leaderboard: LeaderboardEntry[]) => void;
  onArenaSizeUpdate: (radius: number) => void;
  onGameOver: (stats: GameOverStats) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameEngineCallbacks;

  // Arena
  public readonly BASE_ARENA_RADIUS = 1800;
  public arenaRadius = 1800;

  // Game state
  public worms: Map<string, Worm> = new Map();
  public foods: Food[] = [];
  public particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    alpha: number;
    radius: number;
  }> = [];

  // Player state
  public playerId: string = 'player-1';
  public playerName: string = 'Cacing Juara';
  public playerAvatarUrl: string = '';
  public playerSkin!: SkinConfig;
  private playerAvatarImg: HTMLImageElement | null = null;
  private avatarCache: Map<string, HTMLImageElement> = new Map();

  // Control inputs
  public mousePos: Point = { x: 0, y: 0 };
  public screenMousePos: Point = { x: 0, y: 0 };
  private hasInput: boolean = false;
  public isBoosting: boolean = false;
  private keysPressed: Set<string> = new Set();

  // Camera
  public camera: Point = { x: 0, y: 0 };
  public zoom: number = 1.0;

  // Game stats
  private matchStartTime: number = 0;
  private peakRank: number = 999;
  private nextFoodId: number = 1;
  private isRunning: boolean = false;
  private animFrameId: number = 0;
  private lastTickTime: number = 0;

  // Network / WebSocket
  private ws: WebSocket | null = null;
  public roomCode: string = 'ARENA-PUBLIC';
  public isConnectedToServer: boolean = false;
  private lastNetworkSendTime: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: GameEngineCallbacks,
    name: string,
    avatarUrl: string,
    skin: SkinConfig,
    roomCode: string = 'ARENA-PUBLIC'
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;
    this.playerName = name || 'Pemain Cacing';
    this.playerAvatarUrl = avatarUrl;
    this.playerSkin = skin;
    this.roomCode = roomCode;

    this.initAvatar(avatarUrl);
    this.setupListeners();
    this.connectWebSocket();
  }

  private initAvatar(url: string) {
    if (!url) return;
    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.playerAvatarImg = img;
      this.avatarCache.set(url, img);
    };
  }

  private getAvatarImage(url: string): HTMLImageElement | null {
    if (!url) return null;
    if (this.avatarCache.has(url)) {
      return this.avatarCache.get(url)!;
    }
    const img = new Image();
    img.src = url;
    img.onload = () => {
      this.avatarCache.set(url, img);
    };
    return img;
  }

  // Connect to live WebSocket multiplayer server
  private connectWebSocket() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnectedToServer = true;
        this.sendJoinRoom();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch {
          // Ignore
        }
      };

      this.ws.onclose = () => {
        this.isConnectedToServer = false;
      };

      this.ws.onerror = () => {
        this.isConnectedToServer = false;
      };
    } catch {
      this.isConnectedToServer = false;
    }
  }

  private sendJoinRoom() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'join',
          room: this.roomCode,
          name: this.playerName,
          avatarUrl: this.playerAvatarUrl,
          skin: this.playerSkin,
        })
      );
    }
  }

  private handleServerMessage(data: Record<string, unknown>) {
    if (data.type === 'init' && typeof data.id === 'string') {
      const oldId = this.playerId;
      const newId = data.id;
      if (oldId !== newId) {
        // Crucial: preserve and migrate player worm in Map when server assigns new socket ID
        const playerWorm = this.worms.get(oldId);
        this.playerId = newId;
        if (playerWorm) {
          playerWorm.id = newId;
          this.worms.delete(oldId);
          this.worms.set(newId, playerWorm);
        }
      }
    } else if (data.type === 'sync' && Array.isArray(data.worms)) {
      // Sync other real online players from server
      const serverWorms = data.worms as Worm[];
      serverWorms.forEach((sw) => {
        if (sw.id !== this.playerId) {
          const existing = this.worms.get(sw.id);
          if (existing) {
            existing.segments = sw.segments;
            existing.angle = sw.angle;
            existing.score = sw.score;
            existing.thickness = sw.thickness;
            existing.isAlive = sw.isAlive;
            existing.isBoosting = sw.isBoosting;
          } else {
            this.worms.set(sw.id, sw);
          }
        }
      });
      if (typeof data.arenaRadius === 'number') {
        this.arenaRadius = data.arenaRadius;
        this.callbacks.onArenaSizeUpdate(this.arenaRadius);
      }
    }
  }

  private setupListeners() {
    const updatePointerDirection = (clientX: number, clientY: number) => {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      this.screenMousePos = { x: screenX, y: screenY };
      this.hasInput = true;

      const centerX = rect.width > 0 ? rect.width / 2 : this.canvas.width / 2;
      const centerY = rect.height > 0 ? rect.height / 2 : this.canvas.height / 2;

      this.mousePos = {
        x: this.camera.x + (screenX - centerX) / this.zoom,
        y: this.camera.y + (screenY - centerY) / this.zoom,
      };

      // Immediately steer player worm to eliminate any input lag
      const player = this.worms.get(this.playerId);
      if (player && player.isAlive) {
        const dx = screenX - centerX;
        const dy = screenY - centerY;
        if (Math.hypot(dx, dy) > 4) {
          player.targetAngle = Math.atan2(dy, dx);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePointerDirection(e.clientX, e.clientY);
    };

    const handlePointerMove = (e: PointerEvent) => {
      updatePointerDirection(e.clientX, e.clientY);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        this.isBoosting = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        this.isBoosting = false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      this.keysPressed.add(e.code);
      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.isBoosting = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      this.keysPressed.delete(e.code);
      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.isBoosting = false;
      }
    };

    // Touch support for mobile / touch devices
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updatePointerDirection(touch.clientX, touch.clientY);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updatePointerDirection(touch.clientX, touch.clientY);
      }
    };

    // Attach to both window and canvas for guaranteed capture
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    this.canvas.addEventListener('mousemove', handleMouseMove, { passive: true });
    this.canvas.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Store listeners to clean up if needed
    this.cleanupListeners = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
      this.canvas.removeEventListener('mousemove', handleMouseMove);
      this.canvas.removeEventListener('pointermove', handlePointerMove);
    };
  }

  private cleanupListeners: () => void = () => {};

  public start() {
    this.isRunning = true;
    this.matchStartTime = Date.now();
    this.peakRank = 999;
    this.arenaRadius = this.BASE_ARENA_RADIUS;
    this.foods = [];
    this.worms.clear();

    // Initialize screen mouse pos to right of center so worm has initial heading
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : window.innerWidth;
    const h = rect.height > 0 ? rect.height : window.innerHeight;
    this.screenMousePos = { x: w / 2 + 120, y: h / 2 };
    this.hasInput = true;

    // Spawn player worm
    this.spawnPlayer();

    // Spawn AI bots to guarantee active lively multiplayer arena
    this.spawnBots(14);

    // Populate arena with initial food
    this.populateInitialFood();

    this.lastTickTime = performance.now();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);
    this.cleanupListeners();
    if (this.ws) {
      this.ws.close();
    }
  }

  public updatePlayerDetails(name: string, avatarUrl: string, skin: SkinConfig) {
    this.playerName = name;
    this.playerAvatarUrl = avatarUrl;
    this.playerSkin = skin;
    this.initAvatar(avatarUrl);

    const player = this.worms.get(this.playerId);
    if (player) {
      player.name = name;
      player.avatarUrl = avatarUrl;
      player.skin = skin;
      player.color = skin.primaryColor;
    }

    this.sendJoinRoom();
  }

  public respawn() {
    this.matchStartTime = Date.now();
    this.peakRank = 999;
    this.spawnPlayer();
  }

  private spawnPlayer() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * (this.arenaRadius * 0.4);
    const startX = Math.cos(angle) * distance;
    const startY = Math.sin(angle) * distance;

    const initialLength = 16;
    const segments: Point[] = [];
    for (let i = 0; i < initialLength; i++) {
      segments.push({ x: startX - i * 8, y: startY });
    }

    const playerWorm: Worm = {
      id: this.playerId,
      name: this.playerName,
      avatarUrl: this.playerAvatarUrl,
      skin: this.playerSkin,
      segments,
      angle: 0,
      targetAngle: 0,
      speed: 3.8,
      isBoosting: false,
      score: 10,
      length: initialLength,
      thickness: 18,
      isAlive: true,
      isBot: false,
      kills: 0,
      foodEaten: 0,
      color: this.playerSkin.primaryColor,
    };

    this.worms.set(this.playerId, playerWorm);
    this.camera = { x: startX, y: startY };
  }

  private spawnBots(count: number) {
    const botNames = [
      'Naga Merah',
      'Cacing Sakti',
      'Petir Biru',
      'Raja Rimba',
      'Super Slither',
      'Batik Kilat',
      'Si Gesit',
      'Garuda Hitam',
      'Mega Anaconda',
      'Toxic Cobra',
      'Bintang Emas',
      'Cacing Hantu',
      'Sang Juara',
      'Laskar Hijau',
      'Python Pro',
    ];

    for (let i = 0; i < count; i++) {
      const botId = `bot-${i + 1}`;
      const name = botNames[i % botNames.length];
      const preset = SKIN_PRESETS[i % SKIN_PRESETS.length];
      const avatarPreset = PRESET_AVATARS[i % PRESET_AVATARS.length];

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * (this.arenaRadius * 0.75);
      const startX = Math.cos(angle) * distance;
      const startY = Math.sin(angle) * distance;

      const initialLength = 14 + Math.floor(Math.random() * 18);
      const segments: Point[] = [];
      for (let s = 0; s < initialLength; s++) {
        segments.push({ x: startX - s * 8, y: startY });
      }

      const botSkin: SkinConfig = {
        id: preset.id,
        name: preset.name,
        pattern: preset.pattern,
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        glowColor: preset.glowColor,
        accessory: (['none', 'crown', 'sunglasses', 'cowboy', 'devil'] as const)[i % 5],
        eyeType: 'cute',
      };

      const botWorm: Worm = {
        id: botId,
        name,
        avatarUrl: avatarPreset.svg,
        skin: botSkin,
        segments,
        angle: Math.random() * Math.PI * 2,
        targetAngle: Math.random() * Math.PI * 2,
        speed: 3.5,
        isBoosting: false,
        score: initialLength * 5 + Math.floor(Math.random() * 40),
        length: initialLength,
        thickness: 16,
        isAlive: true,
        isBot: true,
        kills: Math.floor(Math.random() * 3),
        foodEaten: 0,
        color: botSkin.primaryColor,
      };

      this.worms.set(botId, botWorm);
    }
  }

  private populateInitialFood() {
    const foodCount = 700;
    const colors = ['#f43f5e', '#ec4899', '#a855f7', '#6366f1', '#38bdf8', '#34d399', '#fbbf24', '#f97316'];

    for (let i = 0; i < foodCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * (this.arenaRadius - 30);
      this.foods.push({
        id: this.nextFoodId++,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        val: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: 4.5,
      });
    }
  }

  // Spawn corpse food when a worm dies
  private spawnCorpseFood(worm: Worm) {
    const step = 2; // drop food every 2 segments
    const colors = [worm.skin.primaryColor, worm.skin.secondaryColor, '#fbbf24', '#ffffff'];

    for (let i = 0; i < worm.segments.length; i += step) {
      const seg = worm.segments[i];
      const scatterX = seg.x + (Math.random() - 0.5) * worm.thickness * 1.6;
      const scatterY = seg.y + (Math.random() - 0.5) * worm.thickness * 1.6;

      this.foods.push({
        id: this.nextFoodId++,
        x: scatterX,
        y: scatterY,
        val: Math.max(3, Math.min(10, Math.floor(worm.thickness / 3))),
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: 7 + Math.min(worm.thickness * 0.25, 6),
        isCorpseFood: true,
      });
    }

    // Spawn visual explosion particles
    for (let p = 0; p < 25; p++) {
      const pAngle = Math.random() * Math.PI * 2;
      const pSpeed = 2 + Math.random() * 5;
      const head = worm.segments[0];
      this.particles.push({
        x: head.x,
        y: head.y,
        vx: Math.cos(pAngle) * pSpeed,
        vy: Math.sin(pAngle) * pSpeed,
        color: worm.skin.glowColor || '#fbbf24',
        alpha: 1.0,
        radius: 3 + Math.random() * 4,
      });
    }
  }

  // Core Game Loop
  private loop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastTickTime) / 1000, 0.1);
    this.lastTickTime = now;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    // 1. Dynamic Arena Radius:
    // "arena permainan semakin luas jika cacing semakin besar"
    let totalScore = 0;
    let highestScore = 0;
    this.worms.forEach((w) => {
      if (w.isAlive) {
        totalScore += w.score;
        if (w.score > highestScore) highestScore = w.score;
      }
    });

    // Arena expands based on total worms mass and highest worm growth
    const targetRadius = Math.min(
      this.BASE_ARENA_RADIUS + Math.sqrt(totalScore) * 18 + highestScore * 0.35,
      4200
    );
    // Smooth transition
    this.arenaRadius += (targetRadius - this.arenaRadius) * 0.02;
    this.callbacks.onArenaSizeUpdate(this.arenaRadius);

    // Keep food density balanced as arena expands
    const desiredFoodCount = Math.floor(550 + (this.arenaRadius - this.BASE_ARENA_RADIUS) * 0.5);
    if (this.foods.length < desiredFoodCount) {
      const diff = Math.min(desiredFoodCount - this.foods.length, 5);
      const colors = ['#f43f5e', '#ec4899', '#a855f7', '#6366f1', '#38bdf8', '#34d399', '#fbbf24', '#f97316'];
      for (let i = 0; i < diff; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.sqrt(Math.random()) * (this.arenaRadius - 40);
        this.foods.push({
          id: this.nextFoodId++,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          val: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          radius: 4.5,
        });
      }
    }

    // 2. Update player worm steering & boosting
    const player = this.worms.get(this.playerId);
    if (player && player.isAlive) {
      const rect = this.canvas.getBoundingClientRect();
      const centerX = rect.width > 0 ? rect.width / 2 : this.canvas.width / 2;
      const centerY = rect.height > 0 ? rect.height / 2 : this.canvas.height / 2;
      const dx = this.screenMousePos.x - centerX;
      const dy = this.screenMousePos.y - centerY;

      // Follow mouse direction continuously relative to screen center (where player worm head is locked)
      if (Math.hypot(dx, dy) > 4) {
        player.targetAngle = Math.atan2(dy, dx);
      }

      player.isBoosting = this.isBoosting && player.score > 15;
      if (player.isBoosting) {
        sound.playBoost();
        // Consumes small score to boost and drops tiny pellet behind
        if (Math.random() < 0.25) {
          player.score = Math.max(15, player.score - 1);
          const tail = player.segments[player.segments.length - 1];
          this.foods.push({
            id: this.nextFoodId++,
            x: tail.x + (Math.random() - 0.5) * 6,
            y: tail.y + (Math.random() - 0.5) * 6,
            val: 1,
            color: player.skin.glowColor,
            radius: 3.5,
          });
        }
      }
    }

    // 3. Update AI Bots
    this.updateBots(dt);

    // 4. Move all worms
    this.worms.forEach((worm) => {
      if (!worm.isAlive) return;
      this.moveWorm(worm, dt);
    });

    // 5. Check Collisions:
    // a. Food collisions
    this.checkFoodCollisions();

    // b. Arena Boundary & Worm vs Worm body collisions
    this.checkWormCollisions();

    // 6. Camera follows player worm continuously & Dynamic Zoom
    // "layar akan terus mengikuti cacing pemain"
    if (player && player.isAlive) {
      const head = player.segments[0];
      // Layar/kamera selalu mengunci posisi cacing pemain di tengah layar secara real-time
      this.camera.x = head.x;
      this.camera.y = head.y;

      // Dynamic zoom: as worm gets larger, zoom out smoothly
      const targetZoom = Math.max(0.62, 1.05 - (player.thickness - 18) * 0.016);
      this.zoom += (targetZoom - this.zoom) * 0.05;
    }

    // 7. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.025;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 8. Leaderboard & Stats
    this.updateLeaderboardAndStats();

    // 9. Sync with WebSocket server periodically
    if (this.ws && this.ws.readyState === WebSocket.OPEN && player && player.isAlive) {
      const timeNow = performance.now();
      if (timeNow - this.lastNetworkSendTime > 40) {
        // ~25 updates/sec
        this.lastNetworkSendTime = timeNow;
        this.ws.send(
          JSON.stringify({
            type: 'move',
            segments: player.segments.slice(0, 20), // send head segments
            angle: player.angle,
            score: player.score,
            thickness: player.thickness,
            isBoosting: player.isBoosting,
            isAlive: player.isAlive,
          })
        );
      }
    }
  }

  private updateBots(dt: number) {
    this.worms.forEach((bot) => {
      if (!bot.isBot || !bot.isAlive) return;

      const head = bot.segments[0];

      // 1. Boundary avoidance: turn away if close to edge
      const distFromCenter = Math.hypot(head.x, head.y);
      if (distFromCenter > this.arenaRadius * 0.8) {
        bot.targetAngle = Math.atan2(-head.y, -head.x) + (Math.random() - 0.5) * 0.5;
      } else {
        // 2. Look for nearest food or avoid nearby other worm bodies
        let nearestFood: Food | null = null;
        let minFoodDist = 350;

        // Sample subset of foods for performance
        for (let i = 0; i < Math.min(this.foods.length, 120); i++) {
          const f = this.foods[i];
          const d = Math.hypot(f.x - head.x, f.y - head.y);
          if (d < minFoodDist) {
            minFoodDist = d;
            nearestFood = f;
          }
        }

        if (nearestFood && Math.random() < 0.6) {
          bot.targetAngle = Math.atan2(nearestFood.y - head.y, nearestFood.x - head.x);
        } else if (Math.random() < 0.03) {
          bot.targetAngle += (Math.random() - 0.5) * 1.5;
        }

        // Random brief boost
        if (Math.random() < 0.015 && bot.score > 50) {
          bot.isBoosting = true;
          setTimeout(() => {
            bot.isBoosting = false;
          }, 800);
        }
      }
    });
  }

  private moveWorm(worm: Worm, dt: number) {
    // Angle interpolation
    let diff = worm.targetAngle - worm.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    const isPlayer = worm.id === this.playerId;
    const turnSpeed = isPlayer
      ? (worm.isBoosting ? 10.5 : 8.5)
      : (worm.isBoosting ? 4.8 : 3.8);
    worm.angle += diff * Math.min(turnSpeed * dt, 1);

    // Speed
    const baseSpeed = worm.isBoosting ? 6.8 : 3.6;
    worm.speed = baseSpeed;

    // Head movement
    const head = worm.segments[0];
    const newHeadX = head.x + Math.cos(worm.angle) * worm.speed;
    const newHeadY = head.y + Math.sin(worm.angle) * worm.speed;

    // Desired segment length & thickness based on score
    worm.length = Math.floor(14 + worm.score / 7);
    worm.thickness = Math.min(18 + Math.sqrt(worm.score) * 0.42, 50);

    // Move segments
    const newSegments: Point[] = [{ x: newHeadX, y: newHeadY }];
    const segmentDist = worm.thickness * 0.48;

    for (let i = 1; i < worm.length; i++) {
      const prev = newSegments[i - 1];
      const cur = worm.segments[i] || prev;

      const segDx = cur.x - prev.x;
      const segDy = cur.y - prev.y;
      const segDist = Math.hypot(segDx, segDy);

      if (segDist > segmentDist) {
        const factor = segmentDist / segDist;
        newSegments.push({
          x: prev.x + segDx * factor,
          y: prev.y + segDy * factor,
        });
      } else {
        newSegments.push(cur);
      }
    }

    worm.segments = newSegments;
  }

  private checkFoodCollisions() {
    this.worms.forEach((worm) => {
      if (!worm.isAlive) return;

      const head = worm.segments[0];
      const headRadius = worm.thickness * 1.1;

      for (let i = this.foods.length - 1; i >= 0; i--) {
        const food = this.foods[i];
        const dist = Math.hypot(food.x - head.x, food.y - head.y);

        if (dist < headRadius + food.radius) {
          worm.score += food.val;
          worm.foodEaten += 1;

          if (worm.id === this.playerId) {
            sound.playEat(food.val);
          }

          // Small food eat sparkle
          if (food.isCorpseFood && Math.random() < 0.4) {
            this.particles.push({
              x: food.x,
              y: food.y,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              color: food.color,
              alpha: 0.8,
              radius: 3,
            });
          }

          this.foods.splice(i, 1);
        }
      }
    });
  }

  private checkWormCollisions() {
    this.worms.forEach((wormA) => {
      if (!wormA.isAlive) return;

      const headA = wormA.segments[0];
      const headRadiusA = wormA.thickness * 0.9;

      // 1. Boundary check:
      // "jika menabrak batasan area permainan cacing akan mati"
      const distFromCenter = Math.hypot(headA.x, headA.y);
      if (distFromCenter + headRadiusA >= this.arenaRadius) {
        this.killWorm(wormA, 'boundary');
        return;
      }

      // 2. Collision with other worms' bodies:
      // "cacing akan mati jika menabrak tubuh cacing lain"
      // "jika menabrak tubuh sendiri cacing tidak mati dan lewat lanjut"
      this.worms.forEach((wormB) => {
        if (!wormB.isAlive) return;

        // Jika menabrak tubuh sendiri: cacing TIDAK mati dan bisa lewat lanjut bebas
        if (wormA.id === wormB.id) return;

        const radiusB = wormB.thickness * 0.85;

        for (let s = 1; s < wormB.segments.length; s++) {
          const segB = wormB.segments[s];
          const dist = Math.hypot(headA.x - segB.x, headA.y - segB.y);

          if (dist < headRadiusA * 0.82 + radiusB) {
            // Worm A crashed into Worm B's body!
            wormB.kills += 1;
            wormB.score += Math.max(30, Math.floor(wormA.score * 0.2));
            this.killWorm(wormA, 'crash', wormB);
            return;
          }
        }
      });
    });
  }

  private killWorm(worm: Worm, reason: 'boundary' | 'crash', killer?: Worm) {
    worm.isAlive = false;
    worm.deathTime = Date.now();

    // "jika cacing mati akan berubah menjadi makanan cacing"
    this.spawnCorpseFood(worm);

    if (worm.id === this.playerId) {
      sound.playDie();

      // Trigger Game Over with highest rank stats
      const survivalSecs = Math.max(1, Math.floor((Date.now() - this.matchStartTime) / 1000));
      const finalRank = this.calculateRank(worm.id);

      const stats: GameOverStats = {
        score: worm.score,
        length: worm.length,
        kills: worm.kills,
        foodEaten: worm.foodEaten,
        peakRank: Math.min(this.peakRank, finalRank),
        finalRank,
        totalPlayers: this.worms.size,
        survivalSeconds: survivalSecs,
        deathReason: reason,
        killerName: killer ? killer.name : undefined,
        killerAvatar: killer ? killer.avatarUrl : undefined,
      };

      this.callbacks.onGameOver(stats);
    } else {
      if (killer && killer.id === this.playerId) {
        sound.playKill();
      }

      // Respawn bot after 3-5 seconds to keep arena alive
      if (worm.isBot) {
        setTimeout(() => {
          if (!this.isRunning) return;
          worm.isAlive = true;
          worm.score = 25 + Math.floor(Math.random() * 30);
          worm.length = 16;
          worm.thickness = 16;
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * (this.arenaRadius * 0.6);
          const startX = Math.cos(angle) * dist;
          const startY = Math.sin(angle) * dist;
          worm.segments = [];
          for (let i = 0; i < worm.length; i++) {
            worm.segments.push({ x: startX - i * 8, y: startY });
          }
        }, 3500);
      }
    }
  }

  private calculateRank(id: string): number {
    const list = Array.from(this.worms.values())
      .filter((w) => w.isAlive)
      .sort((a, b) => b.score - a.score);
    const idx = list.findIndex((w) => w.id === id);
    return idx >= 0 ? idx + 1 : list.length + 1;
  }

  private updateLeaderboardAndStats() {
    const sortedWorms = Array.from(this.worms.values())
      .filter((w) => w.isAlive)
      .sort((a, b) => b.score - a.score);

    const entries: LeaderboardEntry[] = sortedWorms.map((w, idx) => ({
      id: w.id,
      name: w.name,
      avatarUrl: w.avatarUrl,
      score: w.score,
      kills: w.kills,
      rank: idx + 1,
      isCurrentPlayer: w.id === this.playerId,
      isBot: w.isBot,
    }));

    const playerEntry = entries.find((e) => e.isCurrentPlayer);
    if (playerEntry) {
      if (playerEntry.rank < this.peakRank) {
        this.peakRank = playerEntry.rank;
      }
      this.callbacks.onScoreUpdate(
        playerEntry.score,
        this.worms.get(this.playerId)?.length || 0,
        playerEntry.kills,
        playerEntry.rank,
        this.worms.size
      );
    }

    this.callbacks.onLeaderboardUpdate(entries);
  }

  // Canvas Rendering
  private render() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Apply Camera transform with smooth zoom
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Draw subtle arena grid
    this.renderGrid(ctx);

    // 2. Draw Arena Boundary Border (Dynamic Neon Laser Barrier)
    this.renderArenaBoundary(ctx);

    // 3. Draw Foods (Ordinary & Glowing Corpse Food)
    this.renderFoods(ctx);

    // 4. Draw Particles
    this.renderParticles(ctx);

    // 5. Draw Worms (Tail to Head, with Skins and Player Face Photos)
    this.renderWorms(ctx);

    ctx.restore();

    // 6. Draw subtle mouse target indicator for smooth feedback
    this.renderMouseAim(ctx);

    // 7. Draw Radar / Minimap HUD in screen coordinate
    this.renderRadar(ctx);
  }

  private renderMouseAim(ctx: CanvasRenderingContext2D) {
    if (!this.hasInput) return;
    const player = this.worms.get(this.playerId);
    if (!player || !player.isAlive) return;

    const { x, y } = this.screenMousePos;
    const time = performance.now() * 0.005;
    const pulse = Math.sin(time) * 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 10 + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = player.skin.glowColor || '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = 0.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.restore();
  }

  private renderGrid(ctx: CanvasRenderingContext2D) {
    const gridSize = 80;
    const startX = Math.floor((this.camera.x - this.canvas.width / this.zoom) / gridSize) * gridSize;
    const endX = Math.ceil((this.camera.x + this.canvas.width / this.zoom) / gridSize) * gridSize;
    const startY = Math.floor((this.camera.y - this.canvas.height / this.zoom) / gridSize) * gridSize;
    const endY = Math.ceil((this.camera.y + this.canvas.height / this.zoom) / gridSize) * gridSize;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }

  private renderArenaBoundary(ctx: CanvasRenderingContext2D) {
    const r = this.arenaRadius;

    // Outer dark mask beyond boundary
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r + 800, 0, Math.PI * 2);
    ctx.arc(0, 0, r, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
    ctx.fill();

    // Pulsing glowing laser boundary wall
    const time = performance.now() * 0.003;
    const pulse = Math.sin(time) * 4;

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 8 + pulse;
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 24;
    ctx.stroke();

    // Inner warning dashes
    ctx.beginPath();
    ctx.arc(0, 0, r - 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 15]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private renderFoods(ctx: CanvasRenderingContext2D) {
    const time = performance.now() * 0.004;

    for (let i = 0; i < this.foods.length; i++) {
      const f = this.foods[i];

      // Cull foods offscreen
      const dx = f.x - this.camera.x;
      const dy = f.y - this.camera.y;
      const maxDist = (this.canvas.width / this.zoom) * 0.8;
      if (Math.abs(dx) > maxDist || Math.abs(dy) > maxDist) continue;

      const shimmer = Math.sin(time + f.id * 1.7) * 1.5;
      const radius = Math.max(3, f.radius + (f.isCorpseFood ? shimmer : 0));

      ctx.save();
      ctx.beginPath();
      ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = f.color;

      if (f.isCorpseFood) {
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 14;
      }
      ctx.fill();

      // Inner shiny core
      ctx.beginPath();
      ctx.arc(f.x - radius * 0.3, f.y - radius * 0.3, radius * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();

      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }
  }

  private renderWorms(ctx: CanvasRenderingContext2D) {
    // Sort so player worm renders on top, or larger worms render nicely
    const wormList = Array.from(this.worms.values()).filter((w) => w.isAlive);
    wormList.sort((a, b) => (a.id === this.playerId ? 1 : b.id === this.playerId ? -1 : 0));

    wormList.forEach((worm) => {
      this.drawSingleWorm(ctx, worm);
    });
  }

  private drawSingleWorm(ctx: CanvasRenderingContext2D, worm: Worm) {
    if (worm.segments.length === 0) return;

    const thickness = worm.thickness;
    const isPlayer = worm.id === this.playerId;
    const time = performance.now() * 0.003;

    // 1. Draw Body Segments from tail to head
    for (let i = worm.segments.length - 1; i >= 1; i--) {
      const seg = worm.segments[i];
      // Tapering tail
      const progress = i / worm.segments.length;
      const segRadius = thickness * (0.65 + 0.35 * (1 - progress * 0.4));

      ctx.save();
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, segRadius, 0, Math.PI * 2);

      // Apply skin pattern
      let segColor = worm.skin.primaryColor;
      if (worm.skin.pattern === 'rainbow') {
        const hue = (time * 80 + i * 14) % 360;
        segColor = `hsl(${hue}, 85%, 55%)`;
      } else if (worm.skin.pattern === 'stripes') {
        segColor = Math.floor(i / 2) % 2 === 0 ? worm.skin.primaryColor : worm.skin.secondaryColor;
      } else if (worm.skin.pattern === 'bumblebee') {
        segColor = Math.floor(i / 2) % 2 === 0 ? '#eab308' : '#18181b';
      } else if (worm.skin.pattern === 'batik') {
        segColor = Math.floor(i / 3) % 2 === 0 ? '#d97706' : '#78350f';
      } else if (worm.skin.pattern === 'toxic') {
        segColor = Math.floor(i / 2) % 2 === 0 ? '#84cc16' : '#166534';
      }

      ctx.fillStyle = segColor;

      // Glow on boost or neon
      if (worm.isBoosting || isPlayer) {
        ctx.shadowColor = worm.skin.glowColor;
        ctx.shadowBlur = worm.isBoosting ? 16 : 8;
      }
      ctx.fill();

      // Border outline on segments for 3D depth
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    // 2. Draw Worm Head with Player Face Photo:
    // "untuk login pemain membuat nama dan input foto wajah yang nanti foto itu menjadi kepala cacing"
    const head = worm.segments[0];
    const headRadius = thickness * 1.15;

    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(worm.angle);

    // Head base circle with glow
    ctx.beginPath();
    ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = worm.skin.primaryColor;
    ctx.shadowColor = worm.skin.glowColor;
    ctx.shadowBlur = isPlayer ? 18 : 10;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Clip circle to render player's face photo inside the head
    const avatarImg = isPlayer ? this.playerAvatarImg : this.getAvatarImage(worm.avatarUrl);
    if (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, headRadius * 0.88, 0, Math.PI * 2);
      ctx.clip();

      // "Wajah yang di upload bagian bawah wajah akan terus didepan cacing mengikuti gerakan cacing"
      // Rotasi -90 derajat (-Math.PI / 2) agar bagian bawah wajah (dagu/mulut) selalu
      // berada di depan cacing (+X) mengikuti arah gerak cacing, sedangkan kening/rambut
      // menghadap ke belakang menyambung ke badan cacing.
      ctx.rotate(-Math.PI / 2);

      // Draw photo centered and scaled
      ctx.drawImage(
        avatarImg,
        -headRadius * 0.95,
        -headRadius * 0.95,
        headRadius * 1.9,
        headRadius * 1.9
      );
      ctx.restore();
    } else {
      // Default cute worm face if photo is loading
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headRadius * 0.35, -headRadius * 0.35, headRadius * 0.32, 0, Math.PI * 2);
      ctx.arc(headRadius * 0.35, headRadius * 0.35, headRadius * 0.32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(headRadius * 0.45, -headRadius * 0.35, headRadius * 0.16, 0, Math.PI * 2);
      ctx.arc(headRadius * 0.45, headRadius * 0.35, headRadius * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Head Accessory (Crown, Cowboy Hat, Sunglasses, etc.)
    this.drawAccessory(ctx, worm.skin.accessory, headRadius);

    ctx.restore();

    // 3. Render Floating Name Tag & Score above head
    ctx.save();
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const tagY = head.y - headRadius - 14;

    // Background pill
    const nameText = `${worm.name} (${worm.score})`;
    const textWidth = ctx.measureText(nameText).width;
    ctx.fillStyle = isPlayer ? 'rgba(16, 185, 129, 0.9)' : 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(head.x - textWidth / 2 - 8, tagY - 14, textWidth + 16, 20, 10);
    ctx.fill();
    ctx.strokeStyle = isPlayer ? '#34d399' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(nameText, head.x, tagY);
    ctx.restore();
  }

  private drawAccessory(ctx: CanvasRenderingContext2D, acc: string, r: number) {
    if (acc === 'none' || !acc) return;

    ctx.save();
    ctx.font = `${Math.round(r * 1.1)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (acc === 'crown') {
      ctx.fillText('👑', -r * 0.1, -r * 0.85);
    } else if (acc === 'sunglasses') {
      ctx.fillText('🕶️', r * 0.2, 0);
    } else if (acc === 'cowboy') {
      ctx.fillText('🤠', -r * 0.1, -r * 0.8);
    } else if (acc === 'party') {
      ctx.fillText('🎉', -r * 0.2, -r * 0.85);
    } else if (acc === 'wizard') {
      ctx.fillText('🧙', -r * 0.1, -r * 0.85);
    } else if (acc === 'devil') {
      ctx.fillText('😈', 0, -r * 0.7);
    } else if (acc === 'halo') {
      ctx.fillText('😇', 0, -r * 0.85);
    } else if (acc === 'viking') {
      ctx.fillText('🪓', 0, -r * 0.75);
    }

    ctx.restore();
  }

  // Render Minimap Radar at Bottom-Left
  private renderRadar(ctx: CanvasRenderingContext2D) {
    const radarSize = 130;
    const padding = 18;
    const radarX = padding + radarSize / 2;
    const radarY = this.canvas.height - padding - radarSize / 2;
    const radarRadius = radarSize / 2;
    const scale = radarRadius / this.arenaRadius;

    ctx.save();
    // Radar background
    ctx.beginPath();
    ctx.arc(radarX, radarY, radarRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(radarX - radarRadius, radarY);
    ctx.lineTo(radarX + radarRadius, radarY);
    ctx.moveTo(radarX, radarY - radarRadius);
    ctx.lineTo(radarX, radarY + radarRadius);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw other worms dots
    this.worms.forEach((w) => {
      if (!w.isAlive) return;
      const head = w.segments[0];
      const wx = radarX + head.x * scale;
      const wy = radarY + head.y * scale;

      const isPlayer = w.id === this.playerId;
      ctx.beginPath();
      ctx.arc(wx, wy, isPlayer ? 4.5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isPlayer ? '#10b981' : '#f87171';
      ctx.shadowColor = isPlayer ? '#34d399' : '#f87171';
      ctx.shadowBlur = isPlayer ? 6 : 2;
      ctx.fill();
    });

    // Radar label
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('RADAR ARENA', radarX, radarY + radarRadius - 8);

    ctx.restore();
  }
}
