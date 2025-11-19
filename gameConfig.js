// 游戏配置文件 - 数据驱动设计

// 技能配置
const SKILLS = {
    // 主动技能
    fireball: {
        id: 'fireball',
        name: '火球术',
        type: 'active',
        icon: '🔥',
        desc: '发射火球造成150%攻击力的魔法伤害',
        manaCost: 15,
        cooldown: 3,
        damage: 1.5,
        effect: 'fire',
        unlockLevel: 3,
        maxLevel: 5,
        levelBonus: 0.2 // 每级增加20%伤害
    },
    heal: {
        id: 'heal',
        name: '治疗术',
        type: 'active',
        icon: '💚',
        desc: '恢复30%最大生命值',
        manaCost: 20,
        cooldown: 5,
        healPercent: 0.3,
        effect: 'heal',
        unlockLevel: 2,
        maxLevel: 5,
        levelBonus: 0.1 // 每级增加10%治疗量
    },
    icebolt: {
        id: 'icebolt',
        name: '冰冻术',
        type: 'active',
        icon: '❄️',
        desc: '造成120%攻击力伤害并降低敌人攻击力',
        manaCost: 18,
        cooldown: 4,
        damage: 1.2,
        debuff: { attack: -0.2, duration: 2 },
        effect: 'ice',
        unlockLevel: 5,
        maxLevel: 5,
        levelBonus: 0.15
    },
    thunder: {
        id: 'thunder',
        name: '雷击术',
        type: 'active',
        icon: '⚡',
        desc: '召唤雷电造成200%攻击力的巨大伤害',
        manaCost: 25,
        cooldown: 6,
        damage: 2.0,
        effect: 'thunder',
        unlockLevel: 8,
        maxLevel: 5,
        levelBonus: 0.25
    },
    
    // 被动技能
    vitality: {
        id: 'vitality',
        name: '生命强化',
        type: 'passive',
        icon: '❤️',
        desc: '永久增加最大生命值',
        bonus: { maxHp: 20 },
        unlockLevel: 1,
        maxLevel: 10,
        levelBonus: 10 // 每级增加10点生命
    },
    strength: {
        id: 'strength',
        name: '力量强化',
        type: 'passive',
        icon: '💪',
        desc: '永久增加攻击力',
        bonus: { attack: 3 },
        unlockLevel: 1,
        maxLevel: 10,
        levelBonus: 2 // 每级增加2点攻击
    },
    defense: {
        id: 'defense',
        name: '防御强化',
        type: 'passive',
        icon: '🛡️',
        desc: '永久增加防御力',
        bonus: { defense: 2 },
        unlockLevel: 1,
        maxLevel: 10,
        levelBonus: 1 // 每级增加1点防御
    },
    wisdom: {
        id: 'wisdom',
        name: '智慧祝福',
        type: 'passive',
        icon: '📚',
        desc: '增加经验获取量',
        bonus: { expBonus: 0.1 },
        unlockLevel: 4,
        maxLevel: 5,
        levelBonus: 0.05 // 每级增加5%经验
    },
    critical: {
        id: 'critical',
        name: '致命一击',
        type: 'passive',
        icon: '💥',
        desc: '增加暴击率',
        bonus: { critRate: 0.05 },
        unlockLevel: 6,
        maxLevel: 5,
        levelBonus: 0.03 // 每级增加3%暴击率
    }
};

// 任务配置
const QUESTS = {
    main_1: {
        id: 'main_1',
        name: '清理森林',
        type: 'main',
        desc: '村长请求你清理森林中的怪物',
        objectives: [
            { type: 'kill', target: 'any', count: 10, current: 0 }
        ],
        rewards: {
            exp: 200,
            gold: 100,
            items: ['super_potion', 'sword_iron']
        },
        unlockLevel: 1,
        nextQuest: 'main_2'
    },
    main_2: {
        id: 'main_2',
        name: '探索洞穴',
        type: 'main',
        desc: '深入洞穴寻找失落的宝藏',
        objectives: [
            { type: 'explore', target: 'cave', count: 1, current: 0 },
            { type: 'collect', target: 'ancient_key', count: 1, current: 0 }
        ],
        rewards: {
            exp: 500,
            gold: 300,
            items: ['armor_iron', 'ring_vitality']
        },
        unlockLevel: 5,
        nextQuest: 'main_3'
    },
    main_3: {
        id: 'main_3',
        name: '击败龙王',
        type: 'main',
        desc: '最终挑战：击败强大的龙王',
        objectives: [
            { type: 'kill', target: 'dragon_king', count: 1, current: 0 }
        ],
        rewards: {
            exp: 1000,
            gold: 1000,
            items: ['sword_dragon', 'dragon_armor']
        },
        unlockLevel: 10
    },
    
    side_1: {
        id: 'side_1',
        name: '采集草药',
        type: 'side',
        desc: '商人需要一些草药制作药水',
        objectives: [
            { type: 'collect', target: 'herb', count: 5, current: 0 }
        ],
        rewards: {
            exp: 50,
            gold: 50,
            items: ['super_potion', 'super_potion']
        },
        unlockLevel: 2,
        repeatable: true
    },
    side_2: {
        id: 'side_2',
        name: '护送商队',
        type: 'side',
        desc: '保护商队安全到达目的地',
        objectives: [
            { type: 'escort', target: 'merchant', count: 1, current: 0 }
        ],
        rewards: {
            exp: 150,
            gold: 200,
            items: ['key', 'key', 'key']
        },
        unlockLevel: 4
    },
    
    daily_1: {
        id: 'daily_1',
        name: '每日狩猎',
        type: 'daily',
        desc: '击败5只怪物',
        objectives: [
            { type: 'kill', target: 'any', count: 5, current: 0 }
        ],
        rewards: {
            exp: 100,
            gold: 50
        },
        unlockLevel: 1,
        repeatable: true,
        resetDaily: true
    }
};

// 敌人配置 - 动态难度
const ENEMY_TYPES = {
    slime: {
        id: 'slime',
        name: '史莱姆',
        sprite: '👾',
        baseHp: 30,
        baseAttack: 6,
        baseDefense: 2,
        baseExp: 20,
        baseGold: 10,
        level: 1,
        skills: [],
        dropTable: [
            { item: 'potion', chance: 0.3 },
            { item: 'herb', chance: 0.5 }
        ],
        spawnZones: ['village', 'forest']
    },
    bat: {
        id: 'bat',
        name: '蝙蝠',
        sprite: '🦇',
        baseHp: 25,
        baseAttack: 8,
        baseDefense: 1,
        baseExp: 18,
        baseGold: 8,
        level: 1,
        skills: ['quick_attack'],
        dropTable: [
            { item: 'potion', chance: 0.2 }
        ],
        spawnZones: ['forest', 'cave']
    },
    wolf: {
        id: 'wolf',
        name: '野狼',
        sprite: '🐺',
        baseHp: 50,
        baseAttack: 12,
        baseDefense: 4,
        baseExp: 35,
        baseGold: 20,
        level: 3,
        skills: ['bite'],
        dropTable: [
            { item: 'super_potion', chance: 0.2 },
            { item: 'wolf_fang', chance: 0.4 }
        ],
        spawnZones: ['forest']
    },
    goblin: {
        id: 'goblin',
        name: '哥布林',
        sprite: '👺',
        baseHp: 60,
        baseAttack: 10,
        baseDefense: 6,
        baseExp: 40,
        baseGold: 25,
        level: 4,
        skills: ['steal'],
        dropTable: [
            { item: 'key', chance: 0.15 },
            { item: 'gold_bag', chance: 0.3 }
        ],
        spawnZones: ['forest', 'cave']
    },
    skeleton: {
        id: 'skeleton',
        name: '骷髅战士',
        sprite: '💀',
        baseHp: 80,
        baseAttack: 15,
        baseDefense: 8,
        baseExp: 60,
        baseGold: 40,
        level: 6,
        skills: ['bone_throw'],
        dropTable: [
            { item: 'sword_iron', chance: 0.1 },
            { item: 'bone', chance: 0.5 }
        ],
        spawnZones: ['cave']
    },
    spider: {
        id: 'spider',
        name: '巨型蜘蛛',
        sprite: '🕷️',
        baseHp: 70,
        baseAttack: 13,
        baseDefense: 5,
        baseExp: 55,
        baseGold: 35,
        level: 5,
        skills: ['poison'],
        dropTable: [
            { item: 'spider_silk', chance: 0.6 },
            { item: 'super_potion', chance: 0.2 }
        ],
        spawnZones: ['cave']
    },
    golem: {
        id: 'golem',
        name: '石头人',
        sprite: '🗿',
        baseHp: 120,
        baseAttack: 18,
        baseDefense: 15,
        baseExp: 80,
        baseGold: 60,
        level: 8,
        skills: ['stone_skin'],
        dropTable: [
            { item: 'stone_core', chance: 0.3 },
            { item: 'armor_iron', chance: 0.1 }
        ],
        spawnZones: ['cave']
    },
    dragon: {
        id: 'dragon',
        name: '幼龙',
        sprite: '🐉',
        baseHp: 150,
        baseAttack: 22,
        baseDefense: 12,
        baseExp: 120,
        baseGold: 100,
        level: 10,
        skills: ['fire_breath'],
        dropTable: [
            { item: 'dragon_scale', chance: 0.5 },
            { item: 'sword_dragon', chance: 0.05 }
        ],
        spawnZones: ['dragon_lair']
    },
    dragon_king: {
        id: 'dragon_king',
        name: '龙王',
        sprite: '🐲',
        baseHp: 300,
        baseAttack: 30,
        baseDefense: 20,
        baseExp: 500,
        baseGold: 500,
        level: 15,
        isBoss: true,
        skills: ['fire_breath', 'tail_sweep', 'dragon_roar'],
        dropTable: [
            { item: 'dragon_heart', chance: 1.0 },
            { item: 'sword_dragon', chance: 0.5 },
            { item: 'dragon_armor', chance: 0.5 }
        ],
        spawnZones: ['dragon_lair']
    }
};

// 新物品
const NEW_ITEMS = {
    herb: { id: 'herb', name: '草药', type: 'material', icon: '🌿', desc: '制作药水的材料', price: 5, stackable: true },
    wolf_fang: { id: 'wolf_fang', name: '狼牙', type: 'material', icon: '🦷', desc: '强化装备的材料', price: 15, stackable: true },
    bone: { id: 'bone', name: '骨头', type: 'material', icon: '🦴', desc: '制作武器的材料', price: 20, stackable: true },
    spider_silk: { id: 'spider_silk', name: '蜘蛛丝', type: 'material', icon: '🕸️', desc: '制作护甲的材料', price: 25, stackable: true },
    stone_core: { id: 'stone_core', name: '石核', type: 'material', icon: '💎', desc: '稀有强化材料', price: 50, stackable: true },
    dragon_scale: { id: 'dragon_scale', name: '龙鳞', type: 'material', icon: '🔷', desc: '顶级强化材料', price: 100, stackable: true },
    dragon_heart: { id: 'dragon_heart', name: '龙之心', type: 'material', icon: '💗', desc: '传说级材料', price: 500, stackable: true },
    gold_bag: { id: 'gold_bag', name: '钱袋', type: 'consumable', icon: '💰', desc: '获得50金币', effect: { gold: 50 }, price: 40, stackable: true },
    ancient_key: { id: 'ancient_key', name: '古代钥匙', type: 'misc', icon: '🗝️', desc: '打开古代宝箱的钥匙', price: 100, stackable: true },
    dragon_armor: { id: 'dragon_armor', name: '龙鳞甲', type: 'armor', icon: '🐲', desc: '防御力 +25', stats: { defense: 25 }, price: 800 },
    mana_potion: { id: 'mana_potion', name: '魔法药水', type: 'consumable', icon: '🔮', desc: '恢复50点魔法值', effect: { mana: 50 }, price: 15, stackable: true }
};

// 地图区域配置
const MAP_ZONES = {
    village: {
        id: 'village',
        name: '新手村',
        minLevel: 1,
        maxLevel: 3,
        enemyTypes: ['slime', 'bat'],
        spawnRate: 0.02,
        bgColor: '#90EE90'
    },
    forest: {
        id: 'forest',
        name: '迷雾森林',
        minLevel: 3,
        maxLevel: 7,
        enemyTypes: ['bat', 'wolf', 'goblin'],
        spawnRate: 0.04,
        bgColor: '#228B22'
    },
    cave: {
        id: 'cave',
        name: '黑暗洞穴',
        minLevel: 6,
        maxLevel: 10,
        enemyTypes: ['goblin', 'skeleton', 'spider', 'golem'],
        spawnRate: 0.05,
        bgColor: '#2F4F4F'
    },
    dragon_lair: {
        id: 'dragon_lair',
        name: '龙之巢穴',
        minLevel: 10,
        maxLevel: 20,
        enemyTypes: ['dragon', 'dragon_king'],
        spawnRate: 0.03,
        bgColor: '#8B0000'
    }
};

// 成就配置
const ACHIEVEMENTS = {
    first_blood: {
        id: 'first_blood',
        name: '初次胜利',
        desc: '击败第一只怪物',
        icon: '⚔️',
        condition: { type: 'kill', count: 1 },
        reward: { gold: 50 }
    },
    monster_hunter: {
        id: 'monster_hunter',
        name: '怪物猎人',
        desc: '击败50只怪物',
        icon: '🏹',
        condition: { type: 'kill', count: 50 },
        reward: { gold: 500, exp: 200 }
    },
    level_10: {
        id: 'level_10',
        name: '强者之路',
        desc: '达到10级',
        icon: '⭐',
        condition: { type: 'level', count: 10 },
        reward: { skillPoints: 2 }
    },
    rich: {
        id: 'rich',
        name: '富甲一方',
        desc: '拥有1000金币',
        icon: '💰',
        condition: { type: 'gold', count: 1000 },
        reward: { items: ['ring_vitality'] }
    },
    dragon_slayer: {
        id: 'dragon_slayer',
        name: '屠龙勇士',
        desc: '击败龙王',
        icon: '🐲',
        condition: { type: 'kill_boss', target: 'dragon_king' },
        reward: { gold: 1000, exp: 500, title: '屠龙者' }
    }
};

// 难度平衡公式
const BALANCE_FORMULAS = {
    // 敌人属性随玩家等级动态调整
    enemyLevel: (playerLevel, baseLevel) => {
        return Math.max(1, Math.floor(playerLevel * 0.8 + baseLevel * 0.5 + Math.random() * 3 - 1));
    },
    enemyHp: (baseHp, enemyLevel) => {
        return Math.floor(baseHp * (1 + 0.25 * (enemyLevel - 1)));
    },
    enemyAttack: (baseAttack, enemyLevel) => {
        return Math.floor(baseAttack * (1 + 0.18 * (enemyLevel - 1)));
    },
    enemyDefense: (baseDefense, enemyLevel) => {
        return Math.floor(baseDefense * (1 + 0.12 * (enemyLevel - 1)));
    },
    enemyExp: (baseExp, enemyLevel) => {
        return Math.floor(baseExp * (1 + 0.3 * (enemyLevel - 1)));
    },
    
    // 玩家升级所需经验
    requiredExp: (level) => {
        return Math.floor(100 * Math.pow(level, 1.5));
    },
    
    // 伤害计算
    calculateDamage: (attacker, defender, isCrit = false) => {
        const baseDamage = Math.max(1, attacker.attack - defender.defense * 0.5);
        const variance = 0.9 + Math.random() * 0.2; // 90%-110%
        let damage = Math.floor(baseDamage * variance);
        
        if (isCrit) {
            damage *= 2;
        }
        
        return damage;
    },
    
    // 暴击判定
    checkCritical: (critRate = 0.1) => {
        return Math.random() < critRate;
    },
    
    // 闪避判定
    checkDodge: (dodgeRate = 0.05) => {
        return Math.random() < dodgeRate;
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SKILLS,
        QUESTS,
        ENEMY_TYPES,
        NEW_ITEMS,
        MAP_ZONES,
        ACHIEVEMENTS,
        BALANCE_FORMULAS
    };
}
