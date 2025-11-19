const ITEMS = {
    potion: { id: 'potion', name: '生命药水', type: 'consumable', icon: '🧪', desc: '恢复50点生命值', effect: { hp: 50 }, price: 10, stackable: true },
    super_potion: { id: 'super_potion', name: '超级药水', type: 'consumable', icon: '🍷', desc: '恢复100点生命值', effect: { hp: 100 }, price: 30, stackable: true },
    sword_wood: { id: 'sword_wood', name: '木剑', type: 'weapon', icon: '🗡️', desc: '攻击力 +5', stats: { attack: 5 }, price: 50 },
    sword_iron: { id: 'sword_iron', name: '铁剑', type: 'weapon', icon: '⚔️', desc: '攻击力 +15', stats: { attack: 15 }, price: 150 },
    sword_dragon: { id: 'sword_dragon', name: '龙之剑', type: 'weapon', icon: '🐲', desc: '攻击力 +30', stats: { attack: 30 }, price: 500 },
    armor_leather: { id: 'armor_leather', name: '皮甲', type: 'armor', icon: '👕', desc: '防御力 +3', stats: { defense: 3 }, price: 40 },
    armor_iron: { id: 'armor_iron', name: '铁甲', type: 'armor', icon: '🛡️', desc: '防御力 +10', stats: { defense: 10 }, price: 120 },
    ring_vitality: { id: 'ring_vitality', name: '活力戒指', type: 'accessory', icon: '💍', desc: '最大生命 +20', stats: { maxHp: 20 }, price: 200 },
    key: { id: 'key', name: '钥匙', type: 'misc', icon: '🔑', desc: '可以打开上锁的门或宝箱', price: 20, stackable: true }
};

// 将新增物品合并到旧的物品表中，供所有系统复用
if (typeof NEW_ITEMS !== 'undefined') {
    Object.assign(ITEMS, NEW_ITEMS);
}

const ALL_ITEMS = ITEMS;

const game = {
    canvas: null,
    ctx: null,
    tileSize: 32,
    player: {
        x: 5,
        y: 5,
        hp: 100,
        maxHp: 100,
        level: 1,
        exp: 0,
        maxExp: 100,
        attack: 15,
        defense: 5,
        sprite: '🗡️',
        gold: 50,
        potions: 3, // 保持兼容，但在初始化时会转换为物品
        keys: 0,
        inventory: [],
        equipment: {
            weapon: null,
            armor: null,
            accessory: null
        }
    },
    camera: {
        x: 0,
        y: 0
    },
    map: [],
    npcs: [],
    enemies: [],
    chests: [],
    particles: [],
    inDialog: false,
    inBattle: false,
    inInventory: false,
    inventoryIndex: 0,
    inShop: false,
    shopIndex: 0,
    shopType: 'buy', // 'buy' or 'sell'
    selectedItem: null,
    currentEnemy: null,
    currentEnemyIndex: null,
    isDefending: false,
    isPaused: false,
    enemiesDefeated: 0,
    maxEnemies: 12,
    soundEnabled: true,
    gameStartTime: Date.now(),
    lastFrameTime: 0,
    fps: 60,
    audioContext: null,
    maxParticles: 80,
    
    async init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 初始化音频上下文（修复Bug #2）
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('AudioContext not supported');
        }
        
        this.generateMap();
        this.spawnNPCs();
        this.spawnEnemies();
        this.spawnChests();
        this.setupControls();
        
        // 等待存档加载完成（修复Bug #1）
        await this.loadGame();
        
        // Migrate old data to inventory
        if (this.player.potions > 0) {
            this.addItem('potion', this.player.potions);
            this.player.potions = 0;
        }
        if (this.player.keys > 0) {
            this.addItem('key', this.player.keys);
            this.player.keys = 0;
        }
        
        this.updateUI();
        this.gameLoop();
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    },

    // 使用ZzFX音效系统（如果可用）
    playSound(soundName) {
        if (!this.soundEnabled) return;
        
        try {
            if (typeof zzfx !== 'undefined' && typeof SoundEffects !== 'undefined' && SoundEffects[soundName]) {
                zzfx(...SoundEffects[soundName]);
            } else if (this.audioContext) {
                // 降级方案：使用复用的AudioContext（修复Bug #2）
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                const freqMap = {
                    move: 200, interact: 600, attack: 400, hit: 250,
                    victory: 1200, levelUp: 1500, usePotion: 800, openChest: 1000,
                    skillCast: 800, error: 200, defend: 300
                };
                
                oscillator.frequency.value = freqMap[soundName] || 400;
                oscillator.type = 'square';
                
                const currentTime = this.audioContext.currentTime;
                gainNode.gain.setValueAtTime(0.3, currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
                
                oscillator.start(currentTime);
                oscillator.stop(currentTime + 0.1);
            }
        } catch (e) {
            console.log('Audio playback failed:', e.message);
        }
    },

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.showNotification(
            this.soundEnabled ? '音效已开启' : '音效已关闭',
            this.soundEnabled ? '#4ecca3' : '#ff6b6b'
        );
        if (this.isPaused) {
            document.getElementById('pauseSoundStatus').textContent = 
                this.soundEnabled ? '开启' : '关闭';
        }
    },

    createParticle(x, y, color, text = '') {
        // 限制最大粒子数量（修复Bug #6）
        if (this.particles.length >= this.maxParticles) {
            this.particles.shift(); // 移除最老的粒子
        }
        
        this.particles.push({
            x: x * this.tileSize + this.tileSize / 2,
            y: y * this.tileSize + this.tileSize / 2,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 3 - 1,
            life: 1,
            color: color,
            text: text
        });
    },

    async saveGame() {
        const saveData = {
            player: this.player,
            enemies: this.enemies,
            chests: this.chests,
            enemiesDefeated: this.enemiesDefeated,
            gameTime: Date.now() - this.gameStartTime,
            soundEnabled: this.soundEnabled,
            saveDate: new Date().toISOString()
        };
        
        try {
            if (typeof localforage !== 'undefined') {
                // 使用IndexedDB (localforage)
                await localforage.setItem('jrpgSave', saveData);
                console.log('Game saved to IndexedDB');
            } else {
                // 降级到localStorage
                localStorage.setItem('jrpgSave', JSON.stringify(saveData));
                console.log('Game saved to localStorage');
            }
            this.showNotification('游戏已保存！', '#4ecca3');
        } catch (e) {
            console.error('Failed to save game:', e);
            this.showNotification('保存失败！', '#ff6b6b');
        }
    },

    async loadGame() {
        try {
            let saveData = null;
            
            if (typeof localforage !== 'undefined') {
                // 尝试从IndexedDB加载
                saveData = await localforage.getItem('jrpgSave');
                if (saveData) console.log('Loaded from IndexedDB');
            }
            
            if (!saveData) {
                // 降级到localStorage
                const localData = localStorage.getItem('jrpgSave');
                if (localData) {
                    saveData = JSON.parse(localData);
                    console.log('Loaded from localStorage');
                }
            }
            
            if (saveData) {
                Object.assign(this.player, saveData.player);
                this.enemies = saveData.enemies || this.enemies;
                this.chests = saveData.chests || this.chests;
                this.enemiesDefeated = saveData.enemiesDefeated || 0;
                this.soundEnabled = saveData.soundEnabled !== undefined ? saveData.soundEnabled : true;
                
                if (saveData.gameTime) {
                    this.gameStartTime = Date.now() - saveData.gameTime;
                }
                
                this.showNotification('读取存档成功！', '#4ecca3');
            }
        } catch (e) {
            console.error('Failed to load save data:', e);
        }
    },

    resetGame() {
        if (confirm('确定要重新开始游戏吗？所有进度将丢失！')) {
            if (typeof localforage !== 'undefined') {
                localforage.removeItem('jrpgSave');
            }
            localStorage.removeItem('jrpgSave');
            location.reload();
        }
    },

    generateMap() {
        const width = 50;
        const height = 50;
        
        for (let y = 0; y < height; y++) {
            this.map[y] = [];
            for (let x = 0; x < width; x++) {
                if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                    this.map[y][x] = 1; // Wall
                } else if (Math.random() < 0.05) {
                    this.map[y][x] = 3; // Water (New)
                } else if (Math.random() < 0.1) {
                    this.map[y][x] = 2; // Tree
                } else if (x >= 10 && x <= 12 && y >= 10 && y <= 12) {
                    this.map[y][x] = 4; // House
                } else {
                    this.map[y][x] = 0; // Grass
                }
            }
        }
    },

    spawnNPCs() {
        this.npcs = [
            { x: 8, y: 8, sprite: '👨', name: '村长', dialog: '欢迎来到我们的村庄！听说北方森林里出现了怪物...' },
            { x: 15, y: 8, sprite: '👩', name: '商人', dialog: '我这里有最好的装备！药水5金币一瓶哦！' },
            { x: 11, y: 15, sprite: '🧙', name: '魔法师', dialog: '年轻人，想学习强大的魔法吗？先去打败10只怪物吧！' }
        ];
    },

    spawnEnemies() {
        for (let i = 0; i < this.maxEnemies; i++) {
            this.spawnSingleEnemy();
        }
    },

    spawnSingleEnemy() {
        const enemyTypes = [
            {sprite: '👾', name: '史莱姆', hpRange: [20, 40], atkRange: [5, 8], defRange: [1, 3], expRange: [15, 25], gold: [5, 15]},
            {sprite: '🐉', name: '小龙', hpRange: [40, 60], atkRange: [8, 12], defRange: [3, 5], expRange: [30, 50], gold: [15, 30]},
            {sprite: '🦇', name: '蝙蝠', hpRange: [15, 30], atkRange: [6, 9], defRange: [1, 2], expRange: [10, 20], gold: [3, 10]},
            {sprite: '🐺', name: '野狼', hpRange: [35, 50], atkRange: [10, 14], defRange: [2, 4], expRange: [25, 40], gold: [10, 20]}
        ];

        let x, y;
        let attempts = 0;
        const maxAttempts = 100; 
        
        do {
            x = Math.floor(Math.random() * (this.map[0].length - 2)) + 1;
            y = Math.floor(Math.random() * (this.map.length - 2)) + 1;
            attempts++;
            
            if (attempts >= maxAttempts) return;
        } while (
            this.map[y][x] !== 0 || 
            (Math.abs(x - this.player.x) < 8 && Math.abs(y - this.player.y) < 8) // Keep distance from player
        );
        
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const hp = Math.floor(Math.random() * (type.hpRange[1] - type.hpRange[0])) + type.hpRange[0];
        
        this.enemies.push({
            x: x,
            y: y,
            sprite: type.sprite,
            name: type.name,
            hp: hp,
            maxHp: hp,
            attack: Math.floor(Math.random() * (type.atkRange[1] - type.atkRange[0])) + type.atkRange[0],
            defense: Math.floor(Math.random() * (type.defRange[1] - type.defRange[0])) + type.defRange[0],
            exp: Math.floor(Math.random() * (type.expRange[1] - type.expRange[0])) + type.expRange[0],
            gold: Math.floor(Math.random() * (type.gold[1] - type.gold[0])) + type.gold[0]
        });
    },

    checkRespawn() {
        if (this.enemies.length < this.maxEnemies && Math.random() < 0.01) { // 1% chance per frame if under pop cap
            this.spawnSingleEnemy();
        }
    },

    spawnChests() {
        for (let i = 0; i < 3; i++) {
            let x, y;
            let attempts = 0;
            const maxAttempts = 100; // 防止死循环（修复Bug #5）
            
            do {
                x = Math.floor(Math.random() * 28) + 1;
                y = Math.floor(Math.random() * 28) + 1;
                attempts++;
                
                if (attempts >= maxAttempts) {
                    console.warn(`无法为宝箱 ${i + 1} 找到合适位置`);
                    break;
                }
            } while (this.map[y][x] !== 0);
            
            if (attempts >= maxAttempts) continue; // 跳过这个宝箱
            
            this.chests.push({
                x: x,
                y: y,
                sprite: '📦',
                opened: false,
                contents: {
                    gold: Math.floor(Math.random() * 30) + 20,
                    potion: Math.random() > 0.5 ? 1 : 0,
                    key: Math.random() > 0.7 ? 1 : 0
                }
            });
        }
    },

    setupControls() {
        document.addEventListener('keydown', (e) => {
            // Global keys
            if (e.code === 'KeyM') {
                this.toggleSound();
                return;
            }

            // State-specific handling
            if (this.inBattle) {
                this.handleBattleInput(e);
                return;
            }

            if (this.inInventory) {
                this.handleInventoryInput(e);
                return;
            }

            if (this.inShop) {
                this.handleShopInput(e);
                return;
            }

            if (this.inDialog) {
                if (e.code === 'Space') this.closeDialog();
                return;
            }

            if (this.isPaused) {
                if (e.code === 'Escape') this.togglePause();
                return;
            }

            // Normal Gameplay
            if (e.code === 'Escape') {
                this.togglePause();
                return;
            }

            if (e.code === 'KeyS' && e.ctrlKey) {
                e.preventDefault();
                this.saveGame();
                return;
            }

            if (e.code === 'KeyH') {
                this.usePotion();
                return;
            }

            if (e.code === 'KeyI') {
                this.openInventory();
                return;
            }

            if (e.code === 'KeyP') {
                this.checkShopInteraction();
                return;
            }

            let newX = this.player.x;
            let newY = this.player.y;

            switch(e.code) {
                case 'ArrowUp': newY--; break;
                case 'ArrowDown': newY++; break;
                case 'ArrowLeft': newX--; break;
                case 'ArrowRight': newX++; break;
                case 'Space':
                    this.interact();
                    return;
            }

            if (this.canMove(newX, newY)) {
                this.player.x = newX;
                this.player.y = newY;
                this.playSound('move');
                this.checkEnemyEncounter();
                this.checkChestInteraction();
            }
            
            // Prevent scrolling
            if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
    },

    handleBattleInput(e) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') this.battleAttack();
        if (e.code === 'Digit2' || e.code === 'Numpad2') this.battleDefend();
        if (e.code === 'Digit3' || e.code === 'Numpad3') this.battleSkill();
        if (e.code === 'Digit4' || e.code === 'Numpad4') this.battleRun();
    },

    handleInventoryInput(e) {
        if (e.code === 'Escape' || e.code === 'KeyI') {
            this.closeInventory();
            return;
        }

        const inventorySize = this.player.inventory.length;
        if (inventorySize === 0) return;

        if (e.code === 'ArrowRight') this.inventoryIndex = (this.inventoryIndex + 1) % inventorySize;
        if (e.code === 'ArrowLeft') this.inventoryIndex = (this.inventoryIndex - 1 + inventorySize) % inventorySize;
        if (e.code === 'ArrowDown') this.inventoryIndex = (this.inventoryIndex + 5) % inventorySize; // Assuming 5 cols
        if (e.code === 'ArrowUp') this.inventoryIndex = (this.inventoryIndex - 5 + inventorySize) % inventorySize;

        if (e.code === 'Space' || e.code === 'Enter') {
            const item = this.player.inventory[this.inventoryIndex];
            if (item) this.selectItem(item);
            this.useSelectedItem(); // Auto use on double select or separate key?
            // Current design: selectItem updates details, useSelectedItem executes action
            // Let's make Space trigger the action directly for smoother play
        }
        
        // Update selection immediately
        if (['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.code)) {
             this.selectItem(this.player.inventory[this.inventoryIndex]);
        }
    },

    handleShopInput(e) {
        if (e.code === 'Escape' || e.code === 'KeyP') {
            this.closeShop();
            return;
        }
        
        // Tab switching
        if (e.code === 'Tab') {
            e.preventDefault();
            this.switchShopTab(this.shopType === 'buy' ? 'sell' : 'buy');
            return;
        }

        const items = this.shopType === 'buy' ? Object.keys(ITEMS) : this.player.inventory;
        const listSize = items.length;
        if (listSize === 0) return;

        if (e.code === 'ArrowDown') this.shopIndex = (this.shopIndex + 1) % listSize;
        if (e.code === 'ArrowUp') this.shopIndex = (this.shopIndex - 1 + listSize) % listSize;

        if (['ArrowDown','ArrowUp'].includes(e.code)) {
            const item = this.shopType === 'buy' 
                ? {id: items[this.shopIndex], ...ITEMS[items[this.shopIndex]]}
                : items[this.shopIndex];
            this.selectShopItem(item);
        }

        if (e.code === 'Space' || e.code === 'Enter') {
            this.buyOrSellSelectedItem();
        }
    },

    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (this.isPaused) {
            document.getElementById('pauseEnemies').textContent = this.enemiesDefeated;
            document.getElementById('pauseLevel').textContent = this.player.level;
            document.getElementById('pauseGold').textContent = this.player.gold;
            
            // 显示游戏时间
            const gameTime = Date.now() - this.gameStartTime;
            const minutes = Math.floor(gameTime / 60000);
            const seconds = Math.floor((gameTime % 60000) / 1000);
            if (document.getElementById('pauseTime')) {
                document.getElementById('pauseTime').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            if (document.getElementById('pauseSoundStatus')) {
                document.getElementById('pauseSoundStatus').textContent = 
                    this.soundEnabled ? '开启' : '关闭';
            }
            
            pauseOverlay.classList.add('show');
        } else {
            pauseOverlay.classList.remove('show');
        }
    },

    usePotion() {
        const potionItem = this.player.inventory.find(i => i.id === 'potion');
        if (potionItem && this.player.hp < this.player.maxHp) {
            this.removeItem('potion', 1);
            const healAmount = Math.min(50, this.player.maxHp - this.player.hp);
            this.player.hp += healAmount;
            this.playSound('usePotion');
            this.createParticle(this.player.x, this.player.y, '#4ecca3', '+' + healAmount);
            this.showNotification(`使用药水恢复 ${healAmount} HP！`, '#4ecca3');
            this.updateUI();
        } else if (!potionItem) {
            this.showNotification('没有药水了！', '#ff6b6b');
        } else {
            this.showNotification('HP已满！', '#ffcc00');
        }
    },

    showNotification(message, color = '#00ffff') {
        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.textContent = message;
        notif.style.background = color;
        document.body.appendChild(notif);
        
        setTimeout(() => notif.classList.add('show'), 10);
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 2000);
    },

    canMove(x, y) {
        if (x < 0 || x >= this.map[0].length || y < 0 || y >= this.map.length) {
            return false;
        }
        
        const tile = this.map[y][x];
        if (tile === 1 || tile === 2 || tile === 3 || tile === 4) { // Added 3 (Water)
            return false;
        }

        for (let npc of this.npcs) {
            if (npc.x === x && npc.y === y) {
                return false;
            }
        }

        return true;
    },

    interact() {
        const directions = [
            {x: 0, y: -1},
            {x: 0, y: 1},
            {x: -1, y: 0},
            {x: 1, y: 0}
        ];

        for (let dir of directions) {
            const checkX = this.player.x + dir.x;
            const checkY = this.player.y + dir.y;

            for (let npc of this.npcs) {
                if (npc.x === checkX && npc.y === checkY) {
                    this.playSound('interact');
                    let dialog = npc.dialog;
                    if (npc.name === '魔法师' && this.enemiesDefeated >= 10) {
                        dialog = '做得好！你已经击败了' + this.enemiesDefeated + '个敌人。这里有个奖励给你！';
                        this.addItem('potion', 3);
                        this.player.gold += 100;
                    }
                    this.showDialog(npc.name, dialog);
                    return;
                }
            }

            for (let chest of this.chests) {
                if (chest.x === checkX && chest.y === checkY && !chest.opened) {
                    this.openChest(chest);
                    return;
                }
            }
        }
    },

    checkEnemyEncounter() {
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (enemy.x === this.player.x && enemy.y === this.player.y) {
                this.startBattle(enemy, i);
                return;
            }
        }
    },

    checkChestInteraction() {
        for (let chest of this.chests) {
            if (chest.x === this.player.x && chest.y === this.player.y && !chest.opened) {
                this.openChest(chest);
                return;
            }
        }
    },

    openChest(chest) {
        chest.opened = true;
        chest.sprite = '📭';
        this.playSound('openChest');
        
        let message = '打开宝箱！获得：\n';
        if (chest.contents.gold > 0) {
            this.player.gold += chest.contents.gold;
            message += `💰 ${chest.contents.gold} 金币\n`;
        }
        if (chest.contents.potion > 0) {
            this.addItem('potion', chest.contents.potion);
            message += `🧪 ${chest.contents.potion} 个药水\n`;
        }
        if (chest.contents.key > 0) {
            this.addItem('key', chest.contents.key);
            message += `🔑 ${chest.contents.key} 把钥匙`;
        }
        
        this.createParticle(chest.x, chest.y, '#ffcc00', '✨');
        this.showDialog('宝箱', message);
        this.updateUI();
    },

    showDialog(name, text) {
        this.inDialog = true;
        document.getElementById('dialogName').textContent = name;
        document.getElementById('dialogText').textContent = text;
        document.getElementById('dialogBox').classList.add('show');
    },

    closeDialog() {
        this.inDialog = false;
        document.getElementById('dialogBox').classList.remove('show');
    },

    startBattle(enemy, enemyIndex) {
        this.inBattle = true;
        this.currentEnemy = enemy;
        this.currentEnemyIndex = enemyIndex;
        this.isDefending = false;
        
        this.playSound('interact');
        document.getElementById('enemySprite').textContent = enemy.sprite;
        document.getElementById('enemyName').textContent = enemy.name;
        this.updateBattleUI();
        document.getElementById('battleScreen').classList.add('show');
        this.showBattleLog(`遭遇了 ${enemy.name}！`);
    },

    battleAttack() {
        const weaponAtk = (this.player.equipment.weapon ? ITEMS[this.player.equipment.weapon].stats.attack : 0);
        const totalAtk = this.player.attack + weaponAtk;
        const damage = Math.max(1, totalAtk - this.currentEnemy.defense + Math.floor(Math.random() * 5));
        
        this.currentEnemy.hp -= damage;
        this.playSound('attack');
        this.showBattleLog(`你对 ${this.currentEnemy.name} 造成了 ${damage} 点伤害！`);
        
        if (this.currentEnemy.hp <= 0) {
            this.winBattle();
        } else {
            setTimeout(() => this.enemyTurn(), 1000);
        }
        this.updateBattleUI();
    },

    battleDefend() {
        this.isDefending = true;
        this.showBattleLog('你进入了防御姿态！');
        setTimeout(() => this.enemyTurn(), 1000);
    },

    battleSkill() {
        if (this.player.level < 2) {
            this.playSound('error');
            this.showBattleLog('技能等级不足！需要LV2才能使用！');
            return;
        }
        const damage = Math.floor(this.player.attack * 1.5);
        this.currentEnemy.hp -= damage;
        this.playSound('skillCast');
        this.showBattleLog(`使用技能对 ${this.currentEnemy.name} 造成了 ${damage} 点伤害！`);
        
        if (this.currentEnemy.hp <= 0) {
            this.winBattle();
        } else {
            setTimeout(() => this.enemyTurn(), 1000);
        }
        this.updateBattleUI();
    },

    battleRun() {
        if (Math.random() < 0.5) {
            this.playSound(600, 150);
            this.showBattleLog('成功逃跑了！');
            setTimeout(() => this.endBattle(false), 1000);
        } else {
            this.playSound(300, 100);
            this.showBattleLog('逃跑失败！');
            setTimeout(() => this.enemyTurn(), 1000);
        }
    },

    enemyTurn() {
        const armorDef = (this.player.equipment.armor ? ITEMS[this.player.equipment.armor].stats.defense : 0);
        const totalDef = this.player.defense + armorDef;
        const baseDamage = Math.max(1, this.currentEnemy.attack - totalDef);
        
        const damage = this.isDefending ? Math.floor(baseDamage / 2) : baseDamage + Math.floor(Math.random() * 3);
        this.player.hp -= damage;
        this.isDefending = false;
        
        this.playSound('hit');
        this.showBattleLog(`${this.currentEnemy.name} 对你造成了 ${damage} 点伤害！`);
        this.updateBattleUI();
        
        if (this.player.hp <= 0) {
            this.gameOver();
        }
    },

    winBattle() {
        const expGain = this.currentEnemy.exp;
        const goldGain = this.currentEnemy.gold || 10;
        this.player.exp += expGain;
        this.player.gold += goldGain;
        this.enemiesDefeated++;
        
        this.playSound('victory');
        this.showBattleLog(`战斗胜利！获得 ${expGain} 经验值和 ${goldGain} 金币！`);
        
        this.enemies.splice(this.currentEnemyIndex, 1);
        
        if (this.player.exp >= this.player.maxExp) {
            this.levelUp();
        }
        
        setTimeout(() => this.endBattle(true), 2000);
    },

    levelUp() {
        this.player.level++;
        this.player.exp -= this.player.maxExp;
        this.player.maxExp = Math.floor(this.player.maxExp * 1.5);
        this.player.maxHp += 20;
        this.player.hp = this.player.maxHp;
        this.player.attack += 3;
        this.player.defense += 2;
        this.playSound('levelUp');
        this.showBattleLog(`等级提升！现在是 LV ${this.player.level}！`);
    },

    endBattle(won) {
        this.inBattle = false;
        this.currentEnemy = null;
        const battleScreen = document.getElementById('battleScreen');
        if (battleScreen) battleScreen.classList.remove('show');
        this.updateUI();
        
        if (won) {
            // 尝试更多方向和距离（修复Bug #8）
            const directions = [
                {x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1},
                {x:1,y:1},{x:-1,y:1},{x:1,y:-1},{x:-1,y:-1}, // 对角线
                {x:2,y:0},{x:-2,y:0},{x:0,y:2},{x:0,y:-2}  // 更远的位置
            ];
            
            let moved = false;
            for (let dir of directions) {
                const newX = this.player.x + dir.x;
                const newY = this.player.y + dir.y;
                if (this.canMove(newX, newY)) {
                    this.player.x = newX;
                    this.player.y = newY;
                    moved = true;
                    break;
                }
            }
            
            if (!moved) {
                console.warn('战斗后无法移动玩家，保持原位置');
            }
        }
    },

    gameOver() {
        this.showBattleLog('你被击败了...');
        setTimeout(() => {
            alert('游戏结束！页面将重新加载。');
            location.reload();
        }, 2000);
    },

    showBattleLog(message) {
        document.getElementById('battleLog').textContent = message;
    },

    updateBattleUI() {
        const playerHpPercent = (this.player.hp / this.player.maxHp) * 100;
        const enemyHpPercent = (this.currentEnemy.hp / this.currentEnemy.maxHp) * 100;
        
        document.getElementById('battlePlayerHp').style.width = playerHpPercent + '%';
        document.getElementById('battleEnemyHp').style.width = Math.max(0, enemyHpPercent) + '%';
        
        document.getElementById('battlePlayerHpText').textContent = 
            `${Math.max(0, this.player.hp)}/${this.player.maxHp}`;
        document.getElementById('battleEnemyHpText').textContent = 
            `${Math.max(0, this.currentEnemy.hp)}/${this.currentEnemy.maxHp}`;
    },

    // Inventory System
    addItem(itemId, count = 1) {
        if (!ITEMS[itemId]) return;
        const itemDef = ITEMS[itemId];
        
        // Check if stackable and exists
        const existingItem = this.player.inventory.find(i => i.id === itemId);
        if (itemDef.stackable && existingItem) {
            existingItem.count += count;
        } else {
            // Add new item
            if (itemDef.stackable) {
                 this.player.inventory.push({ id: itemId, count: count });
            } else {
                 for(let i=0; i<count; i++) this.player.inventory.push({ id: itemId, count: 1, uniqueId: Date.now() + Math.random() });
            }
        }
        this.showNotification(`获得 ${itemDef.name} x${count}`, '#4ecca3');
    },

    removeItem(itemId, count = 1) {
        const index = this.player.inventory.findIndex(i => i.id === itemId);
        if (index === -1) return false;
        
        const item = this.player.inventory[index];
        if (ITEMS[itemId].stackable) {
            if (item.count >= count) {
                item.count -= count;
                if (item.count <= 0) this.player.inventory.splice(index, 1);
                return true;
            }
        } else {
            this.player.inventory.splice(index, 1);
            return true;
        }
        return false;
    },

    openInventory() {
        this.inInventory = true;
        document.getElementById('inventoryModal').classList.add('show');
        this.renderInventory();
        this.playSound('interact');
    },

    closeInventory() {
        this.inInventory = false;
        document.getElementById('inventoryModal').classList.remove('show');
        this.selectedItem = null;
    },

    renderInventory() {
        const grid = document.getElementById('inventoryGrid');
        grid.innerHTML = '';
        
        // Render items
        this.player.inventory.forEach((item, index) => {
            const def = ITEMS[item.id];
            const slot = document.createElement('div');
            slot.className = 'item-slot';
            if (this.selectedItem === item) slot.className += ' selected';
            slot.textContent = def.icon;
            slot.onclick = () => this.selectItem(item);
            
            if (item.count > 1) {
                const count = document.createElement('div');
                count.className = 'item-count';
                count.textContent = item.count;
                slot.appendChild(count);
            }
            grid.appendChild(slot);
        });

        // Update Gold
        document.getElementById('inventoryGold').textContent = this.player.gold;

        // Update Equipment Slots
        const updateEquipSlot = (type, id) => {
             const el = document.getElementById(id);
             const equipped = this.player.equipment[type];
             el.textContent = equipped ? ITEMS[equipped].icon : '';
             el.style.borderStyle = equipped ? 'solid' : 'dashed';
             el.style.borderColor = equipped ? '#4ecca3' : '#666';
        };
        updateEquipSlot('weapon', 'equipWeapon');
        updateEquipSlot('armor', 'equipArmor');
        updateEquipSlot('accessory', 'equipAccessory');
    },

    selectItem(item) {
        this.selectedItem = item;
        const def = ITEMS[item.id];
        
        document.getElementById('itemDetailIcon').textContent = def.icon;
        document.getElementById('itemDetailName').textContent = def.name;
        document.getElementById('itemDetailDesc').textContent = def.desc;
        
        let statsText = '';
        if (def.stats) {
            for(let key in def.stats) statsText += `${key}: +${def.stats[key]} `;
        }
        document.getElementById('itemDetailStats').textContent = statsText;
        
        const btn = document.getElementById('itemActionBtn');
        btn.style.display = 'block';
        if (def.type === 'consumable') btn.textContent = '使用';
        else if (['weapon', 'armor', 'accessory'].includes(def.type)) btn.textContent = '装备';
        else btn.style.display = 'none';
        
        this.renderInventory(); // Refresh for selection highlight
    },

    useSelectedItem() {
        if (!this.selectedItem) return;
        const item = this.selectedItem;
        const def = ITEMS[item.id];
        
        if (def.type === 'consumable') {
            if (def.effect.hp) {
                if (this.player.hp >= this.player.maxHp) {
                    this.showNotification('生命值已满', '#ffcc00');
                    return;
                }
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + def.effect.hp);
                this.showNotification(`恢复了 ${def.effect.hp} HP`, '#4ecca3');
                this.createParticle(this.player.x, this.player.y, '#4ecca3', `+${def.effect.hp}`);
            }
            this.removeItem(item.id, 1);
            this.playSound('usePotion');
        } else if (['weapon', 'armor', 'accessory'].includes(def.type)) {
            this.equipItem(item.id);
        }
        
        this.selectedItem = null;
        this.renderInventory();
        this.updateUI();
    },

    equipItem(itemId) {
        const def = ITEMS[itemId];
        const type = def.type;
        
        // Unequip current if exists
        if (this.player.equipment[type]) {
            this.addItem(this.player.equipment[type]);
        }
        
        // Equip new
        this.player.equipment[type] = itemId;
        this.removeItem(itemId, 1); // Remove from inventory (it's now in equipment slot)
        
        this.playSound('openChest'); // Reusing sound
        this.showNotification(`装备了 ${def.name}`, '#4ecca3');
        this.renderInventory();
        this.updateUI();
    },

    unequipItem(type) {
        if (this.player.equipment[type]) {
            this.addItem(this.player.equipment[type]);
            this.player.equipment[type] = null;
            this.playSound('interact');
            this.renderInventory();
            this.updateUI();
        }
    },

    // Shop System
    checkShopInteraction() {
        // Check if near merchant
        const merchant = this.npcs.find(n => n.name === '商人');
        if (merchant && Math.abs(this.player.x - merchant.x) <= 1 && Math.abs(this.player.y - merchant.y) <= 1) {
            this.openShop();
        } else {
            this.showNotification('附近没有商店', '#ff6b6b');
        }
    },

    openShop() {
        this.inShop = true;
        this.shopType = 'buy';
        document.getElementById('shopModal').classList.add('show');
        this.renderShop();
        this.playSound('interact');
    },

    closeShop() {
        this.inShop = false;
        document.getElementById('shopModal').classList.remove('show');
        this.selectedItem = null;
    },

    switchShopTab(type) {
        this.shopType = type;
        this.selectedItem = null;
        // Update tabs visual
        const tabs = document.querySelectorAll('.shop-tab');
        tabs.forEach(t => t.classList.remove('active'));
        tabs[type === 'buy' ? 0 : 1].classList.add('active');
        this.renderShop();
    },

    renderShop() {
        const list = document.getElementById('shopList');
        list.innerHTML = '';
        
        const itemsToDisplay = this.shopType === 'buy' 
            ? Object.keys(ITEMS).map(k => ({id: k, ...ITEMS[k]})) 
            : this.player.inventory.map(i => ({id: i.id, count: i.count, ...ITEMS[i.id]}));
            
        itemsToDisplay.forEach(item => {
            const div = document.createElement('div');
            div.className = 'shop-item';
            if (this.selectedItem && this.selectedItem.id === item.id) div.className += ' selected';
            div.onclick = () => this.selectShopItem(item);
            
            div.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-info">
                    <div class="shop-item-name">${item.name} ${item.count ? 'x'+item.count : ''}</div>
                    <div class="shop-item-cost">${this.shopType === 'buy' ? item.price : Math.floor(item.price/2)} 💰</div>
                </div>
            `;
            list.appendChild(div);
        });

        document.getElementById('shopGold').textContent = this.player.gold;
        
        // Clear details if no selection
        if (!this.selectedItem) {
             document.getElementById('shopDetailName').textContent = '选择物品';
             document.getElementById('shopActionBtn').style.display = 'none';
        }
    },

    selectShopItem(item) {
        this.selectedItem = item;
        const def = ITEMS[item.id];
        
        document.getElementById('shopDetailIcon').textContent = def.icon;
        document.getElementById('shopDetailName').textContent = def.name;
        document.getElementById('shopDetailDesc').textContent = def.desc;
        
        let statsText = '';
        if (def.stats) {
            for(let key in def.stats) statsText += `${key}: +${def.stats[key]} `;
        }
        document.getElementById('shopDetailStats').textContent = statsText;
        
        const price = this.shopType === 'buy' ? def.price : Math.floor(def.price/2);
        document.getElementById('shopDetailPrice').textContent = `${price} 金币`;
        
        const btn = document.getElementById('shopActionBtn');
        btn.style.display = 'block';
        btn.textContent = this.shopType === 'buy' ? '购买' : '出售';
        
        this.renderShop();
    },

    buyOrSellSelectedItem() {
        if (!this.selectedItem) return;
        const def = ITEMS[this.selectedItem.id];
        const price = this.shopType === 'buy' ? def.price : Math.floor(def.price/2);
        
        if (this.shopType === 'buy') {
            if (this.player.gold >= price) {
                this.player.gold -= price;
                this.addItem(this.selectedItem.id);
                this.playSound('victory'); // Cash sound?
                this.showNotification('购买成功!', '#4ecca3');
            } else {
                this.showNotification('金币不足!', '#ff6b6b');
                this.playSound('error');
            }
        } else {
            this.removeItem(this.selectedItem.id, 1);
            this.player.gold += price;
            this.playSound('victory');
            this.showNotification('出售成功!', '#4ecca3');
            
            // If ran out of items, clear selection
            if (!this.player.inventory.find(i => i.id === this.selectedItem.id)) {
                this.selectedItem = null;
            }
        }
        this.updateUI();
        this.renderShop();
    },

    updateUI() {
        // 安全地更新UI元素（修复Bug #7）
        const safeSet = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        
        safeSet('playerLevel', this.player.level);
        safeSet('playerExp', this.player.exp);
        safeSet('playerMaxExp', this.player.maxExp);
        safeSet('playerHp', this.player.hp);
        safeSet('playerMaxHp', this.player.maxHp);
        safeSet('playerGold', this.player.gold);
        
        const potionItem = this.player.inventory.find(i => i.id === 'potion');
        safeSet('playerPotions', potionItem ? potionItem.count : 0);
        
        safeSet('enemiesKilled', this.enemiesDefeated);
        safeSet('fps', Math.round(this.fps));
        
        const hpFill = document.getElementById('hpFill');
        if (hpFill) {
            const hpPercent = (this.player.hp / this.player.maxHp) * 100;
            hpFill.style.width = hpPercent + '%';
        }
    },

    drawTile(tile, x, y) {
        const colors = {
            0: '#2ecc71',
            1: '#8b4513',
            2: '#27ae60',
            3: '#3498db', // Water Color
            4: '#c0392b'
        };

        const symbols = {
            0: '🟩',
            1: '🟫',
            2: '🌳',
            3: '🌊', // Water Symbol
            4: '🏠'
        };

        this.ctx.fillStyle = colors[tile];
        this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(symbols[tile], x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2);
    },

    // ... (updateParticles and drawParticles skipped for brevity as they don't change) ...

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life -= 0.02;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },

    drawParticles() {
        for (let p of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            
            const screenX = p.x - this.camera.x * this.tileSize;
            const screenY = p.y - this.camera.y * this.tileSize;
            
            if (p.text) {
                this.ctx.fillText(p.text, screenX, screenY);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        }
    },

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const tilesX = Math.floor(this.canvas.width / this.tileSize);
        const tilesY = Math.floor(this.canvas.height / this.tileSize);
        
        this.camera.x = Math.max(0, Math.min(this.player.x - Math.floor(tilesX / 2), this.map[0].length - tilesX));
        this.camera.y = Math.max(0, Math.min(this.player.y - Math.floor(tilesY / 2), this.map.length - tilesY));

        for (let y = 0; y < tilesY && (y + this.camera.y) < this.map.length; y++) {
            for (let x = 0; x < tilesX && (x + this.camera.x) < this.map[0].length; x++) {
                this.drawTile(this.map[y + this.camera.y][x + this.camera.x], x, y);
            }
        }

        for (let chest of this.chests) {
            const screenX = (chest.x - this.camera.x) * this.tileSize;
            const screenY = (chest.y - this.camera.y) * this.tileSize;
            
            if (screenX >= 0 && screenX < this.canvas.width && screenY >= 0 && screenY < this.canvas.height) {
                this.ctx.font = '28px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(chest.sprite, screenX + this.tileSize/2, screenY + this.tileSize/2);
            }
        }

        for (let enemy of this.enemies) {
            const screenX = (enemy.x - this.camera.x) * this.tileSize;
            const screenY = (enemy.y - this.camera.y) * this.tileSize;
            
            if (screenX >= 0 && screenX < this.canvas.width && screenY >= 0 && screenY < this.canvas.height) {
                this.ctx.font = '28px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(enemy.sprite, screenX + this.tileSize/2, screenY + this.tileSize/2);
            }
        }

        for (let npc of this.npcs) {
            const screenX = (npc.x - this.camera.x) * this.tileSize;
            const screenY = (npc.y - this.camera.y) * this.tileSize;
            
            if (screenX >= 0 && screenX < this.canvas.width && screenY >= 0 && screenY < this.canvas.height) {
                this.ctx.font = '28px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(npc.sprite, screenX + this.tileSize/2, screenY + this.tileSize/2);
            }
        }

        const playerScreenX = (this.player.x - this.camera.x) * this.tileSize;
        const playerScreenY = (this.player.y - this.camera.y) * this.tileSize;
        
        this.ctx.font = '28px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.player.sprite, playerScreenX + this.tileSize/2, playerScreenY + this.tileSize/2);

        this.drawParticles();

        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= tilesX; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.tileSize, 0);
            this.ctx.lineTo(x * this.tileSize, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= tilesY; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.tileSize);
            this.ctx.lineTo(this.canvas.width, y * this.tileSize);
            this.ctx.stroke();
        }
    },
    
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        
        if (deltaTime > 0) {
            this.fps = Math.min(1000 / deltaTime, 144);
        }
        this.lastFrameTime = currentTime;
        
        if (!this.isPaused) {
            this.updateParticles();
            this.render();
            this.checkRespawn(); // Added Respawn Check
            
            if (Math.floor(currentTime / 1000) !== Math.floor((currentTime - deltaTime) / 1000)) {
                this.updateUI();
            }
        }
        requestAnimationFrame(() => this.gameLoop());
    }
};

window.addEventListener('load', async () => {
    try {
        await game.init(); // 等待游戏初始化完成（修复Bug #1）
    } catch (error) {
        console.error('游戏初始化失败:', error);
        alert('游戏初始化失败，请刷新页面重试。');
    }
});
