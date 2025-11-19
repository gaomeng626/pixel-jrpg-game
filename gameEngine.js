// 游戏引擎核心系统 - 升级版

// 技能系统
class SkillSystem {
    constructor(game) {
        this.game = game;
        this.skills = {};
        this.cooldowns = {};
    }
    
    learnSkill(skillId) {
        if (!SKILLS[skillId]) return false;
        
        const skill = SKILLS[skillId];
        if (this.game.player.level < skill.unlockLevel) {
            this.game.showNotification(`需要等级 ${skill.unlockLevel} 才能学习此技能！`, '#ff6b6b');
            return false;
        }
        
        if (this.game.player.skillPoints < 1) {
            this.game.showNotification('技能点不足！', '#ff6b6b');
            return false;
        }
        
        if (!this.skills[skillId]) {
            this.skills[skillId] = { level: 1, ...skill };
            this.game.player.skillPoints--;
            this.game.showNotification(`学会了 ${skill.name}！`, '#4ecca3');
            this.game.playSound('levelUp');
            return true;
        }
        
        return false;
    }
    
    upgradeSkill(skillId) {
        if (!this.skills[skillId]) return false;
        
        const skill = this.skills[skillId];
        if (skill.level >= skill.maxLevel) {
            this.game.showNotification('技能已达最大等级！', '#ffcc00');
            return false;
        }
        
        if (this.game.player.skillPoints < 1) {
            this.game.showNotification('技能点不足！', '#ff6b6b');
            return false;
        }
        
        skill.level++;
        this.game.player.skillPoints--;
        this.game.showNotification(`${skill.name} 升级到 Lv.${skill.level}！`, '#4ecca3');
        this.game.playSound('levelUp');
        return true;
    }
    
    useSkill(skillId) {
        if (!this.skills[skillId]) return false;
        
        const skill = this.skills[skillId];
        
        // 检查冷却
        if (this.cooldowns[skillId] && this.cooldowns[skillId] > 0) {
            this.game.showNotification(`技能冷却中... ${this.cooldowns[skillId]}回合`, '#ffcc00');
            return false;
        }
        
        // 检查魔法值
        if (this.game.player.mana < skill.manaCost) {
            this.game.showNotification('魔法值不足！', '#ff6b6b');
            return false;
        }
        
        // 消耗魔法值
        this.game.player.mana -= skill.manaCost;
        
        // 设置冷却
        this.cooldowns[skillId] = skill.cooldown;
        
        // 执行技能效果
        this.executeSkill(skill);
        
        return true;
    }
    
    executeSkill(skill) {
        const bonusDamage = skill.levelBonus * (skill.level - 1);
        
        switch(skill.id) {
            case 'fireball':
                const fireDamage = Math.floor(this.game.player.attack * (skill.damage + bonusDamage));
                this.game.currentEnemy.hp -= fireDamage;
                this.game.showBattleLog(`🔥 火球术！造成 ${fireDamage} 点魔法伤害！`);
                this.game.createParticle(this.game.currentEnemy.x, this.game.currentEnemy.y, '#ff6b6b', '🔥');
                break;
                
            case 'heal':
                const healAmount = Math.floor(this.game.player.maxHp * (skill.healPercent + bonusDamage));
                this.game.player.hp = Math.min(this.game.player.maxHp, this.game.player.hp + healAmount);
                this.game.showBattleLog(`💚 治疗术！恢复 ${healAmount} 点生命值！`);
                this.game.createParticle(this.game.player.x, this.game.player.y, '#4ecca3', '+' + healAmount);
                break;
                
            case 'icebolt':
                const iceDamage = Math.floor(this.game.player.attack * (skill.damage + bonusDamage));
                this.game.currentEnemy.hp -= iceDamage;
                this.game.currentEnemy.attackDebuff = skill.debuff.attack;
                this.game.currentEnemy.debuffDuration = skill.debuff.duration;
                this.game.showBattleLog(`❄️ 冰冻术！造成 ${iceDamage} 点伤害并降低敌人攻击力！`);
                this.game.createParticle(this.game.currentEnemy.x, this.game.currentEnemy.y, '#00ffff', '❄️');
                break;
                
            case 'thunder':
                const thunderDamage = Math.floor(this.game.player.attack * (skill.damage + bonusDamage));
                this.game.currentEnemy.hp -= thunderDamage;
                this.game.showBattleLog(`⚡ 雷击术！造成 ${thunderDamage} 点巨大伤害！`);
                this.game.createParticle(this.game.currentEnemy.x, this.game.currentEnemy.y, '#ffff00', '⚡');
                break;
        }
        
        this.game.playSound('skillCast');
    }
    
    updateCooldowns() {
        for (let skillId in this.cooldowns) {
            if (this.cooldowns[skillId] > 0) {
                this.cooldowns[skillId]--;
            }
        }
    }
    
    applyPassiveSkills() {
        let bonuses = {
            maxHp: 0,
            attack: 0,
            defense: 0,
            expBonus: 0,
            critRate: 0
        };
        
        for (let skillId in this.skills) {
            const skill = this.skills[skillId];
            if (skill.type === 'passive' && skill.bonus) {
                for (let stat in skill.bonus) {
                    const baseBonus = skill.bonus[stat];
                    const levelBonus = skill.levelBonus * (skill.level - 1);
                    bonuses[stat] = (bonuses[stat] || 0) + baseBonus + levelBonus;
                }
            }
        }
        
        return bonuses;
    }
}

// 任务系统
class QuestSystem {
    constructor(game) {
        this.game = game;
        this.activeQuests = [];
        this.completedQuests = [];
        this.dailyReset = Date.now();
    }
    
    acceptQuest(questId) {
        if (!QUESTS[questId]) return false;
        
        const quest = QUESTS[questId];
        
        // 检查等级要求
        if (this.game.player.level < quest.unlockLevel) {
            this.game.showNotification(`需要等级 ${quest.unlockLevel}！`, '#ff6b6b');
            return false;
        }
        
        // 检查是否已接受
        if (this.activeQuests.find(q => q.id === questId)) {
            this.game.showNotification('已接受此任务！', '#ffcc00');
            return false;
        }
        
        // 检查是否已完成（非可重复任务）
        if (!quest.repeatable && this.completedQuests.includes(questId)) {
            this.game.showNotification('此任务已完成！', '#ffcc00');
            return false;
        }
        
        // 接受任务
        const newQuest = JSON.parse(JSON.stringify(quest));
        this.activeQuests.push(newQuest);
        this.game.showNotification(`接受任务: ${quest.name}`, '#4ecca3');
        this.game.playSound('interact');
        
        return true;
    }
    
    updateQuestProgress(type, target, count = 1) {
        for (let quest of this.activeQuests) {
            for (let objective of quest.objectives) {
                if (objective.type === type && 
                    (objective.target === target || objective.target === 'any')) {
                    objective.current = Math.min(objective.current + count, objective.count);
                    
                    // 检查任务是否完成
                    if (this.isQuestComplete(quest)) {
                        this.completeQuest(quest);
                    }
                }
            }
        }
    }
    
    isQuestComplete(quest) {
        return quest.objectives.every(obj => obj.current >= obj.count);
    }
    
    completeQuest(quest) {
        // 移除活动任务
        const index = this.activeQuests.findIndex(q => q.id === quest.id);
        if (index !== -1) {
            this.activeQuests.splice(index, 1);
        }
        
        // 添加到已完成
        if (!quest.repeatable) {
            this.completedQuests.push(quest.id);
        }
        
        // 发放奖励
        let rewardText = `完成任务: ${quest.name}\\n获得奖励:\\n`;
        
        if (quest.rewards.exp) {
            this.game.player.exp += quest.rewards.exp;
            rewardText += `📚 ${quest.rewards.exp} 经验值\\n`;
        }
        
        if (quest.rewards.gold) {
            this.game.player.gold += quest.rewards.gold;
            rewardText += `💰 ${quest.rewards.gold} 金币\\n`;
        }
        
        if (quest.rewards.items) {
            for (let itemId of quest.rewards.items) {
                this.game.addItem(itemId, 1);
                const item = ITEMS[itemId] || NEW_ITEMS[itemId];
                if (item) {
                    rewardText += `${item.icon} ${item.name}\\n`;
                }
            }
        }
        
        this.game.showDialog('任务完成', rewardText);
        this.game.playSound('victory');
        
        // 检查升级
        if (this.game.player.exp >= this.game.player.maxExp) {
            this.game.levelUp();
        }
        
        // 解锁下一个任务
        if (quest.nextQuest) {
            this.acceptQuest(quest.nextQuest);
        }
    }
    
    checkDailyReset() {
        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;
        
        if (now - this.dailyReset > dayInMs) {
            // 重置每日任务
            this.activeQuests = this.activeQuests.filter(q => !QUESTS[q.id]?.resetDaily);
            this.dailyReset = now;
            this.game.showNotification('每日任务已重置！', '#4ecca3');
        }
    }
}

// 成就系统
class AchievementSystem {
    constructor(game) {
        this.game = game;
        this.unlockedAchievements = [];
    }
    
    checkAchievements() {
        for (let achId in ACHIEVEMENTS) {
            if (this.unlockedAchievements.includes(achId)) continue;
            
            const ach = ACHIEVEMENTS[achId];
            let unlocked = false;
            
            switch(ach.condition.type) {
                case 'kill':
                    unlocked = this.game.enemiesDefeated >= ach.condition.count;
                    break;
                case 'level':
                    unlocked = this.game.player.level >= ach.condition.count;
                    break;
                case 'gold':
                    unlocked = this.game.player.gold >= ach.condition.count;
                    break;
                case 'kill_boss':
                    unlocked = this.game.bossesKilled?.includes(ach.condition.target);
                    break;
            }
            
            if (unlocked) {
                this.unlockAchievement(achId, ach);
            }
        }
    }
    
    unlockAchievement(achId, ach) {
        this.unlockedAchievements.push(achId);
        
        let rewardText = `🏆 成就解锁: ${ach.name}\\n${ach.desc}\\n\\n奖励:\\n`;
        
        if (ach.reward.gold) {
            this.game.player.gold += ach.reward.gold;
            rewardText += `💰 ${ach.reward.gold} 金币\\n`;
        }
        
        if (ach.reward.exp) {
            this.game.player.exp += ach.reward.exp;
            rewardText += `📚 ${ach.reward.exp} 经验值\\n`;
        }
        
        if (ach.reward.skillPoints) {
            this.game.player.skillPoints += ach.reward.skillPoints;
            rewardText += `⭐ ${ach.reward.skillPoints} 技能点\\n`;
        }
        
        if (ach.reward.items) {
            for (let itemId of ach.reward.items) {
                this.game.addItem(itemId, 1);
            }
        }
        
        this.game.showDialog('成就解锁', rewardText);
        this.game.playSound('victory');
    }
}

// 动态难度系统
class DifficultySystem {
    constructor(game) {
        this.game = game;
    }
    
    spawnEnemy(zone = 'village') {
        const zoneConfig = MAP_ZONES[zone];
        if (!zoneConfig) return null;
        
        // 根据区域选择敌人类型
        const enemyTypeId = zoneConfig.enemyTypes[
            Math.floor(Math.random() * zoneConfig.enemyTypes.length)
        ];
        
        const enemyType = ENEMY_TYPES[enemyTypeId];
        if (!enemyType) return null;
        
        // 动态计算敌人等级和属性
        const enemyLevel = BALANCE_FORMULAS.enemyLevel(
            this.game.player.level, 
            enemyType.level
        );
        
        const enemy = {
            id: enemyType.id,
            name: enemyType.name,
            sprite: enemyType.sprite,
            level: enemyLevel,
            hp: BALANCE_FORMULAS.enemyHp(enemyType.baseHp, enemyLevel),
            maxHp: BALANCE_FORMULAS.enemyHp(enemyType.baseHp, enemyLevel),
            attack: BALANCE_FORMULAS.enemyAttack(enemyType.baseAttack, enemyLevel),
            defense: BALANCE_FORMULAS.enemyDefense(enemyType.baseDefense, enemyLevel),
            exp: BALANCE_FORMULAS.enemyExp(enemyType.baseExp, enemyLevel),
            gold: Math.floor(enemyType.baseGold * (1 + 0.2 * (enemyLevel - 1))),
            skills: enemyType.skills || [],
            dropTable: enemyType.dropTable || [],
            isBoss: enemyType.isBoss || false,
            x: 0,
            y: 0
        };
        
        // 随机位置
        do {
            enemy.x = Math.floor(Math.random() * 48) + 1;
            enemy.y = Math.floor(Math.random() * 48) + 1;
        } while (!this.game.canMove(enemy.x, enemy.y) || 
                 this.isNearPlayer(enemy.x, enemy.y, 5));
        
        return enemy;
    }
    
    isNearPlayer(x, y, distance) {
        const dx = x - this.game.player.x;
        const dy = y - this.game.player.y;
        return Math.sqrt(dx * dx + dy * dy) < distance;
    }
    
    calculateDamage(attacker, defender, isCrit = false) {
        return BALANCE_FORMULAS.calculateDamage(attacker, defender, isCrit);
    }
    
    checkCritical(critRate = 0.1) {
        return BALANCE_FORMULAS.checkCritical(critRate);
    }
    
    checkDodge(dodgeRate = 0.05) {
        return BALANCE_FORMULAS.checkDodge(dodgeRate);
    }
    
    processItemDrop(enemy) {
        const drops = [];
        
        for (let drop of enemy.dropTable) {
            if (Math.random() < drop.chance) {
                drops.push(drop.item);
            }
        }
        
        return drops;
    }
}

// 装备强化系统
class EnhancementSystem {
    constructor(game) {
        this.game = game;
    }
    
    enhanceEquipment(itemId, enhanceLevel = 0) {
        const item = this.game.player.inventory.find(i => i.id === itemId);
        if (!item) return false;
        
        const currentLevel = item.enhanceLevel || 0;
        const cost = this.getEnhanceCost(currentLevel);
        const materials = this.getRequiredMaterials(currentLevel);
        
        // 检查金币
        if (this.game.player.gold < cost) {
            this.game.showNotification('金币不足！', '#ff6b6b');
            return false;
        }
        
        // 检查材料
        for (let mat of materials) {
            const matItem = this.game.player.inventory.find(i => i.id === mat.id);
            if (!matItem || matItem.count < mat.count) {
                this.game.showNotification(`材料不足: ${mat.id}`, '#ff6b6b');
                return false;
            }
        }
        
        // 计算成功率
        const successRate = this.getSuccessRate(currentLevel);
        const success = Math.random() < successRate;
        
        // 消耗资源
        this.game.player.gold -= cost;
        for (let mat of materials) {
            this.game.removeItem(mat.id, mat.count);
        }
        
        if (success) {
            item.enhanceLevel = currentLevel + 1;
            this.game.showNotification(
                `强化成功！${item.name} +${item.enhanceLevel}`, 
                '#4ecca3'
            );
            this.game.playSound('victory');
            return true;
        } else {
            this.game.showNotification('强化失败！', '#ff6b6b');
            this.game.playSound('error');
            return false;
        }
    }
    
    getEnhanceCost(level) {
        return Math.floor(100 * Math.pow(1.5, level));
    }
    
    getRequiredMaterials(level) {
        if (level < 3) {
            return [{ id: 'herb', count: level + 1 }];
        } else if (level < 6) {
            return [{ id: 'wolf_fang', count: level - 2 }];
        } else {
            return [{ id: 'dragon_scale', count: level - 5 }];
        }
    }
    
    getSuccessRate(level) {
        if (level < 3) return 0.9;
        if (level < 6) return 0.7;
        if (level < 9) return 0.5;
        return 0.3;
    }
    
    getEnhanceBonus(item) {
        const level = item.enhanceLevel || 0;
        if (level === 0) return {};
        
        const bonus = {};
        if (item.stats) {
            for (let stat in item.stats) {
                bonus[stat] = Math.floor(item.stats[stat] * 0.1 * level);
            }
        }
        return bonus;
    }
}

// 导出系统
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SkillSystem,
        QuestSystem,
        AchievementSystem,
        DifficultySystem,
        EnhancementSystem
    };
}
