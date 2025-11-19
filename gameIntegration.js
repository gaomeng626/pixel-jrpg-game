// 游戏系统集成补丁 - 将新系统整合到原游戏中

// 在游戏初始化后调用此函数
function initializeEnhancedSystems() {
    // 初始化精灵渲染器
    if (typeof SpriteRenderer !== 'undefined') {
        spriteRenderer = new SpriteRenderer();
        spriteRenderer.loadAssets().then(() => {
            console.log('Sprite assets loaded');
        }).catch(err => {
            console.warn('Failed to load sprites, using fallback', err);
        });
    }
    
    // 初始化动画控制器
    if (typeof AnimationController !== 'undefined') {
        animationController = new AnimationController();
    }
    
    // 初始化技能系统
    if (typeof SkillSystem !== 'undefined') {
        skillSystem = new SkillSystem(game);
    }
    
    // 初始化任务系统
    if (typeof QuestSystem !== 'undefined') {
        questSystem = new QuestSystem(game);
        // 自动接受第一个主线任务
        questSystem.acceptQuest('main_1');
    }
    
    // 初始化成就系统
    if (typeof AchievementSystem !== 'undefined') {
        achievementSystem = new AchievementSystem(game);
    }
    
    // 初始化难度系统
    if (typeof DifficultySystem !== 'undefined') {
        difficultySystem = new DifficultySystem(game);
    }
    
    // 初始化强化系统
    if (typeof EnhancementSystem !== 'undefined') {
        enhancementSystem = new EnhancementSystem(game);
    }
    
    // 初始化玩家魔法值
    if (!game.player.mana) {
        game.player.mana = 100;
        game.player.maxMana = 100;
    }
    
    // 初始化技能点
    if (!game.player.skillPoints) {
        game.player.skillPoints = 0;
    }
    
    console.log('Enhanced systems initialized');
}

// 增强游戏初始化 - 延迟执行
setTimeout(() => {
    if (typeof game !== 'undefined' && game.init) {
        const originalInit = game.init;
        game.init = async function() {
            await originalInit.call(this);
            initializeEnhancedSystems();
        };
    }
}, 100);

// 增强更新UI
const originalUpdateUI = game.updateUI;
game.updateUI = function() {
    originalUpdateUI.call(this);
    
    // 更新魔法值显示
    if (document.getElementById('playerMana')) {
        document.getElementById('playerMana').textContent = this.player.mana;
        document.getElementById('playerMaxMana').textContent = this.player.maxMana;
        const manaPercent = (this.player.mana / this.player.maxMana) * 100;
        document.getElementById('manaFill').style.width = manaPercent + '%';
    }
    
    // 更新技能点显示
    if (document.getElementById('playerSkillPoints')) {
        document.getElementById('playerSkillPoints').textContent = this.player.skillPoints;
    }
};

// 增强升级系统
const originalLevelUp = game.levelUp;
game.levelUp = function() {
    originalLevelUp.call(this);
    
    // 增加技能点
    this.player.skillPoints++;
    
    // 恢复魔法值
    this.player.mana = this.player.maxMana;
    
    // 应用被动技能加成
    if (skillSystem) {
        const bonuses = skillSystem.applyPassiveSkills();
        if (bonuses.maxHp) this.player.maxHp += bonuses.maxHp;
        if (bonuses.attack) this.player.attack += bonuses.attack;
        if (bonuses.defense) this.player.defense += bonuses.defense;
        if (bonuses.critRate) this.player.critRate += bonuses.critRate;
    }
    
    // 检查成就
    if (achievementSystem) {
        achievementSystem.checkAchievements();
    }
    
    this.showNotification(`升级到 LV.${this.player.level}！获得1技能点！`, '#ffcc00');
};

// 增强战斗胜利
const originalWinBattle = game.winBattle;
game.winBattle = function() {
    const enemy = this.currentEnemy;
    
    // 处理掉落物品
    if (difficultySystem && enemy.dropTable) {
        const drops = difficultySystem.processItemDrop(enemy);
        for (let itemId of drops) {
            this.addItem(itemId, 1);
            const item = ALL_ITEMS[itemId];
            if (item) {
                this.showNotification(`获得: ${item.icon} ${item.name}`, '#4ecca3');
            }
        }
    }
    
    // 更新任务进度
    if (questSystem) {
        questSystem.updateQuestProgress('kill', enemy.id);
        questSystem.updateQuestProgress('kill', 'any');
    }
    
    // 记录BOSS击杀
    if (enemy.isBoss) {
        if (!this.bossesKilled) this.bossesKilled = [];
        this.bossesKilled.push(enemy.id);
    }
    
    // 检查成就
    if (achievementSystem) {
        achievementSystem.checkAchievements();
    }
    
    originalWinBattle.call(this);
};

// 增强战斗攻击 - 添加暴击系统
const originalBattleAttack = game.battleAttack;
game.battleAttack = function() {
    const weaponAtk = (this.player.equipment.weapon ? ALL_ITEMS[this.player.equipment.weapon].stats.attack : 0);
    const totalAtk = this.player.attack + weaponAtk;
    
    // 检查暴击
    const isCrit = difficultySystem ? difficultySystem.checkCritical(this.player.critRate) : (Math.random() < 0.1);
    
    let damage;
    if (difficultySystem) {
        damage = difficultySystem.calculateDamage(
            { attack: totalAtk },
            this.currentEnemy,
            isCrit
        );
    } else {
        damage = Math.max(1, totalAtk - this.currentEnemy.defense + Math.floor(Math.random() * 5));
        if (isCrit) damage *= 2;
    }
    
    this.currentEnemy.hp -= damage;
    this.playSound('attack');
    
    if (isCrit) {
        this.showBattleLog(`💥 暴击！对 ${this.currentEnemy.name} 造成了 ${damage} 点伤害！`);
        this.createParticle(this.currentEnemy.x, this.currentEnemy.y, '#ff00ff', '💥');
    } else {
        this.showBattleLog(`你对 ${this.currentEnemy.name} 造成了 ${damage} 点伤害！`);
    }
    
    if (this.currentEnemy.hp <= 0) {
        this.winBattle();
    } else {
        // 更新技能冷却
        if (skillSystem) {
            skillSystem.updateCooldowns();
        }
        setTimeout(() => this.enemyTurn(), 1000);
    }
    this.updateBattleUI();
};

// 添加技能菜单
game.openSkillMenu = function() {
    if (!skillSystem) {
        this.showBattleLog('技能系统未初始化！');
        return;
    }
    
    const skills = skillSystem.skills;
    const activeSkills = Object.values(skills).filter(s => s.type === 'active');
    
    if (activeSkills.length === 0) {
        this.showBattleLog('还没有学习任何技能！按K键打开技能树');
        return;
    }
    
    // 简化版：使用第一个可用技能
    const skill = activeSkills[0];
    if (skillSystem.useSkill(skill.id)) {
        if (this.currentEnemy.hp <= 0) {
            this.winBattle();
        } else {
            setTimeout(() => this.enemyTurn(), 1000);
        }
        this.updateBattleUI();
    }
};

// 添加敌人生成增强
const originalSpawnSingleEnemy = game.spawnSingleEnemy;
game.spawnSingleEnemy = function() {
    if (difficultySystem && typeof MAP_ZONES !== 'undefined') {
        const enemy = difficultySystem.spawnEnemy(this.currentZone);
        if (enemy) {
            this.enemies.push(enemy);
            return;
        }
    }
    
    // 降级到原始方法
    originalSpawnSingleEnemy.call(this);
};

// 增强绘制系统
const originalRender = game.render;
game.render = function() {
    if (!this.ctx) return;
    
    // 如果精灵渲染器可用，使用增强渲染
    if (spriteRenderer && spriteRenderer.loaded) {
        this.renderWithSprites();
    } else {
        // 降级到原始渲染
        originalRender.call(this);
    }
    
    // 渲染动画效果
    if (animationController) {
        animationController.update();
        animationController.render(this.ctx, spriteRenderer, this.camera.x, this.camera.y);
    }
};

// 使用精灵的渲染方法
game.renderWithSprites = function() {
    const ctx = this.ctx;
    const tileSize = this.tileSize;
    
    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 计算可见区域
    const startX = Math.floor(this.camera.x / tileSize);
    const startY = Math.floor(this.camera.y / tileSize);
    const endX = startX + Math.ceil(this.canvas.width / tileSize) + 1;
    const endY = startY + Math.ceil(this.canvas.height / tileSize) + 1;
    
    // 绘制地图
    for (let y = startY; y < endY && y < this.map.length; y++) {
        for (let x = startX; x < endX && x < this.map[0].length; x++) {
            if (y < 0 || x < 0) continue;
            
            const screenX = x * tileSize - this.camera.x;
            const screenY = y * tileSize - this.camera.y;
            
            const tile = this.map[y][x];
            const tileTypes = ['grass', 'wall', 'tree', 'water', 'dirt'];
            spriteRenderer.drawTile(ctx, tileTypes[tile] || 'grass', screenX, screenY, tileSize);
        }
    }
    
    // 绘制NPC
    for (let npc of this.npcs) {
        const screenX = npc.x * tileSize - this.camera.x;
        const screenY = npc.y * tileSize - this.camera.y;
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(npc.sprite, screenX + tileSize / 2, screenY + tileSize / 2 + 10);
    }
    
    // 绘制敌人
    for (let enemy of this.enemies) {
        const screenX = enemy.x * tileSize - this.camera.x;
        const screenY = enemy.y * tileSize - this.camera.y;
        spriteRenderer.drawEnemy(ctx, enemy.id, screenX, screenY, tileSize);
        
        // 绘制敌人等级
        if (enemy.level > 1) {
            ctx.fillStyle = '#ffcc00';
            ctx.font = '12px Arial';
            ctx.fillText(`Lv.${enemy.level}`, screenX + tileSize / 2, screenY - 5);
        }
    }
    
    // 绘制宝箱
    for (let chest of this.chests) {
        const screenX = chest.x * tileSize - this.camera.x;
        const screenY = chest.y * tileSize - this.camera.y;
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(chest.sprite, screenX + tileSize / 2, screenY + tileSize / 2 + 10);
    }
    
    // 绘制玩家
    const playerScreenX = this.player.x * tileSize - this.camera.x;
    const playerScreenY = this.player.y * tileSize - this.camera.y;
    const frame = Math.floor(this.animationFrame / 10) % 4;
    spriteRenderer.drawPlayer(ctx, playerScreenX, playerScreenY, 'down', frame, tileSize);
    
    // 绘制粒子
    for (let particle of this.particles) {
        const screenX = particle.x - this.camera.x;
        const screenY = particle.y - this.camera.y;
        spriteRenderer.drawParticle(ctx, 'damage', screenX, screenY, 16, particle.life);
        
        if (particle.text) {
            ctx.fillStyle = particle.color;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(particle.text, screenX, screenY);
        }
    }
};

// 添加键盘控制扩展
const originalSetupControls = game.setupControls;
game.setupControls = function() {
    originalSetupControls.call(this);
    
    // 添加新的快捷键
    document.addEventListener('keydown', (e) => {
        if (this.inDialog || this.inBattle || this.inInventory || this.inShop) return;
        
        // K键 - 技能树
        if (e.code === 'KeyK') {
            this.showNotification('技能系统开发中...', '#ffcc00');
            // TODO: 打开技能树界面
        }
        
        // Q键 - 任务列表
        if (e.code === 'KeyQ') {
            this.showQuestList();
        }
    });
};

// 显示任务列表
game.showQuestList = function() {
    if (!questSystem) {
        this.showNotification('任务系统未初始化！', '#ff6b6b');
        return;
    }
    
    let questText = '=== 活动任务 ===\\n\\n';
    
    if (questSystem.activeQuests.length === 0) {
        questText += '暂无活动任务\\n';
    } else {
        for (let quest of questSystem.activeQuests) {
            questText += `📜 ${quest.name}\\n`;
            questText += `${quest.desc}\\n`;
            for (let obj of quest.objectives) {
                questText += `  - ${obj.type}: ${obj.current}/${obj.count}\\n`;
            }
            questText += '\\n';
        }
    }
    
    questText += `\\n已完成: ${questSystem.completedQuests.length} 个任务`;
    
    this.showDialog('任务', questText);
};

// 增强游戏循环
game.animationFrame = 0;
const originalGameLoop = game.gameLoop;
game.gameLoop = function(timestamp) {
    originalGameLoop.call(this, timestamp);
    
    // 更新动画帧
    this.animationFrame++;
    
    // 每日任务重置检查
    if (questSystem && this.animationFrame % 3600 === 0) {
        questSystem.checkDailyReset();
    }
};

console.log('Game integration patch loaded');
