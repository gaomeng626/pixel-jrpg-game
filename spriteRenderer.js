// 精灵图渲染系统

class SpriteRenderer {
    constructor() {
        this.images = {};
        this.loaded = false;
        this.loadingPromises = [];
    }
    
    async loadAssets() {
        const assets = [
            { key: 'player', src: 'assets/sprites/player_sprite.png' },
            { key: 'enemies', src: 'assets/sprites/enemies_sprite.png' },
            { key: 'effects', src: 'assets/effects/attack_effects.png' },
            { key: 'tiles', src: 'assets/tiles/terrain_tileset.png' },
            { key: 'particles', src: 'assets/effects/particles.png' }
        ];
        
        for (let asset of assets) {
            const promise = new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.images[asset.key] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed to load ${asset.src}, using fallback`);
                    resolve(); // 继续加载其他资源
                };
                img.src = asset.src;
            });
            this.loadingPromises.push(promise);
        }
        
        await Promise.all(this.loadingPromises);
        this.loaded = true;
        console.log('All sprite assets loaded');
    }
    
    // 绘制玩家精灵
    drawPlayer(ctx, x, y, direction = 'down', frame = 0, size = 32) {
        if (!this.images.player) {
            // 降级到emoji
            ctx.font = `${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🗡️', x + size / 2, y + size / 2);
            return;
        }
        
        // 精灵图布局: 4行(下上左右) x 4列(动画帧)
        const directionMap = { down: 0, up: 1, left: 2, right: 3 };
        const row = directionMap[direction] || 0;
        const col = frame % 4;
        
        const spriteSize = 32; // 原始精灵大小
        const sx = col * spriteSize;
        const sy = row * spriteSize;
        
        ctx.drawImage(
            this.images.player,
            sx, sy, spriteSize, spriteSize,
            x, y, size, size
        );
    }
    
    // 绘制敌人精灵
    drawEnemy(ctx, enemyId, x, y, size = 32) {
        if (!this.images.enemies) {
            // 降级到emoji
            const enemyType = ENEMY_TYPES[enemyId];
            if (enemyType) {
                ctx.font = `${size}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(enemyType.sprite, x + size / 2, y + size / 2);
            }
            return;
        }
        
        // 敌人精灵图布局: 4x2 网格
        const enemyMap = {
            slime: { col: 0, row: 0 },
            bat: { col: 1, row: 0 },
            wolf: { col: 2, row: 0 },
            goblin: { col: 3, row: 0 },
            skeleton: { col: 0, row: 1 },
            spider: { col: 1, row: 1 },
            golem: { col: 2, row: 1 },
            dragon: { col: 3, row: 1 }
        };
        
        const pos = enemyMap[enemyId] || { col: 0, row: 0 };
        const spriteSize = 32;
        const sx = pos.col * spriteSize;
        const sy = pos.row * spriteSize;
        
        ctx.drawImage(
            this.images.enemies,
            sx, sy, spriteSize, spriteSize,
            x, y, size, size
        );
    }
    
    // 绘制攻击特效
    drawEffect(ctx, effectType, x, y, frame = 0, size = 32) {
        if (!this.images.effects) {
            // 降级到简单图形
            ctx.fillStyle = this.getEffectColor(effectType);
            ctx.globalAlpha = 0.7;
            ctx.fillRect(x, y, size, size);
            ctx.globalAlpha = 1.0;
            return;
        }
        
        // 特效精灵图布局
        const effectMap = {
            slash: { startCol: 0, frames: 3 },
            fireball: { startCol: 3, frames: 4 },
            ice: { startCol: 7, frames: 3 },
            thunder: { startCol: 10, frames: 4 },
            heal: { startCol: 14, frames: 3 }
        };
        
        const effect = effectMap[effectType];
        if (!effect) return;
        
        const spriteSize = 32;
        const col = effect.startCol + (frame % effect.frames);
        const sx = col * spriteSize;
        const sy = 0;
        
        ctx.drawImage(
            this.images.effects,
            sx, sy, spriteSize, spriteSize,
            x, y, size, size
        );
    }
    
    // 绘制地形
    drawTile(ctx, tileType, x, y, size = 32) {
        if (!this.images.tiles) {
            // 降级到颜色块
            ctx.fillStyle = this.getTileColor(tileType);
            ctx.fillRect(x, y, size, size);
            return;
        }
        
        // 地形图集布局
        const tileMap = {
            grass: { col: 0, row: 0 },
            wall: { col: 1, row: 0 },
            tree: { col: 2, row: 0 },
            water: { col: 3, row: 0 },
            dirt: { col: 0, row: 1 },
            stone: { col: 1, row: 1 },
            cave: { col: 2, row: 1 },
            lava: { col: 3, row: 1 }
        };
        
        const pos = tileMap[tileType] || { col: 0, row: 0 };
        const spriteSize = 32;
        const sx = pos.col * spriteSize;
        const sy = pos.row * spriteSize;
        
        ctx.drawImage(
            this.images.tiles,
            sx, sy, spriteSize, spriteSize,
            x, y, size, size
        );
    }
    
    // 绘制粒子效果
    drawParticle(ctx, particleType, x, y, size = 16, alpha = 1.0) {
        if (!this.images.particles) {
            // 降级到简单圆形
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.getParticleColor(particleType);
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            return;
        }
        
        const particleMap = {
            gold: { col: 0, row: 0 },
            exp: { col: 1, row: 0 },
            levelup: { col: 2, row: 0 },
            damage: { col: 3, row: 0 },
            critical: { col: 4, row: 0 },
            heal: { col: 0, row: 1 }
        };
        
        const pos = particleMap[particleType] || { col: 0, row: 0 };
        const spriteSize = 16;
        const sx = pos.col * spriteSize;
        const sy = pos.row * spriteSize;
        
        ctx.globalAlpha = alpha;
        ctx.drawImage(
            this.images.particles,
            sx, sy, spriteSize, spriteSize,
            x - size / 2, y - size / 2, size, size
        );
        ctx.globalAlpha = 1.0;
    }
    
    // 辅助方法 - 获取特效颜色
    getEffectColor(effectType) {
        const colors = {
            slash: '#ffffff',
            fireball: '#ff6b6b',
            ice: '#00ffff',
            thunder: '#ffff00',
            heal: '#4ecca3'
        };
        return colors[effectType] || '#ffffff';
    }
    
    // 辅助方法 - 获取地形颜色
    getTileColor(tileType) {
        const colors = {
            grass: '#90EE90',
            wall: '#808080',
            tree: '#228B22',
            water: '#4169E1',
            dirt: '#8B4513',
            stone: '#696969',
            cave: '#2F4F4F',
            lava: '#FF4500'
        };
        return colors[tileType] || '#90EE90';
    }
    
    // 辅助方法 - 获取粒子颜色
    getParticleColor(particleType) {
        const colors = {
            gold: '#FFD700',
            exp: '#00FFFF',
            levelup: '#FFFF00',
            damage: '#FF0000',
            critical: '#FF00FF',
            heal: '#00FF00'
        };
        return colors[particleType] || '#FFFFFF';
    }
}

// 动画控制器
class AnimationController {
    constructor() {
        this.animations = {};
        this.activeEffects = [];
    }
    
    addAnimation(id, type, x, y, duration = 500) {
        this.animations[id] = {
            type: type,
            x: x,
            y: y,
            startTime: Date.now(),
            duration: duration,
            frame: 0
        };
    }
    
    addEffect(type, x, y, duration = 1000) {
        this.activeEffects.push({
            type: type,
            x: x,
            y: y,
            startTime: Date.now(),
            duration: duration,
            frame: 0
        });
    }
    
    update() {
        const now = Date.now();
        
        // 更新动画
        for (let id in this.animations) {
            const anim = this.animations[id];
            const elapsed = now - anim.startTime;
            
            if (elapsed > anim.duration) {
                delete this.animations[id];
            } else {
                anim.frame = Math.floor((elapsed / anim.duration) * 4);
            }
        }
        
        // 更新特效
        this.activeEffects = this.activeEffects.filter(effect => {
            const elapsed = now - effect.startTime;
            if (elapsed > effect.duration) {
                return false;
            }
            effect.frame = Math.floor((elapsed / effect.duration) * 4);
            return true;
        });
    }
    
    render(ctx, spriteRenderer, offsetX = 0, offsetY = 0) {
        // 渲染特效
        for (let effect of this.activeEffects) {
            const alpha = 1.0 - (Date.now() - effect.startTime) / effect.duration;
            ctx.globalAlpha = alpha;
            spriteRenderer.drawEffect(
                ctx, 
                effect.type, 
                effect.x - offsetX, 
                effect.y - offsetY, 
                effect.frame
            );
            ctx.globalAlpha = 1.0;
        }
    }
    
    clear() {
        this.animations = {};
        this.activeEffects = [];
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpriteRenderer, AnimationController };
}
