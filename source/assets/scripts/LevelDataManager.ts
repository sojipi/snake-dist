import { _decorator, Component, sys, Node } from 'cc';
import { MAHJONG_LEVEL_DATA } from './data/LevelData';
const { ccclass, property } = _decorator;

// 关卡进度数据
interface LevelProgress {
    isUnlocked: boolean;
    isCompleted: boolean;
    bestScore: number;
    stars: number; // 获得的星数
    playCount: number; // 游玩次数
}

@ccclass('LevelDataManager')
export class LevelDataManager {
    private static instance: LevelDataManager = null!;
    private static readonly SAVE_KEY = "level_progress_data";
    private static readonly CURRENT_LEVEL_KEY = "current_level_id";
    
    // 默认关卡进度（第一关默认解锁）
    private levelProgress: Map<number, LevelProgress> = new Map();
    private currentLevelId: number = 1;
    
    public static getInstance(): LevelDataManager {
        if (!LevelDataManager.instance) {
            LevelDataManager.instance = new LevelDataManager();
            LevelDataManager.instance.ensureDefaultProgress();
        }
        return LevelDataManager.instance;
    }
    
    constructor() {
        this.loadProgressData();
        this.handleTutorialLevelMigration();
    }
    
    // 🔥 新增：处理教学关卡迁移逻辑
    // 如果玩家已经完成了原来的第一关（现在的第二关），则默认完成教学关
    private handleTutorialLevelMigration() {
        // 检查是否已经进行过迁移
        const hasMigrated = sys.localStorage.getItem("tutorial_migration_done2") === "true";
        if (hasMigrated) {
            return;
        }
        
        console.log("LevelDataManager: 检查教学关卡迁移");
        
        // 创建新的关卡进度映射
        const newLevelProgress = new Map<number, LevelProgress>();
        
        // 遍历现有的关卡进度，将关卡ID向后移动一位
        let hasCompletedLevels = false;
        for (const [levelId, progress] of this.levelProgress) {
            // 将所有关卡向后移动一位（关卡ID+1）
            const newLevelId = levelId + 1;
            newLevelProgress.set(newLevelId, progress);
            
            if (progress.isCompleted) {
                hasCompletedLevels = true;
            }
        }
        
        // 如果有完成的关卡，需要执行迁移
        if (hasCompletedLevels) {
            console.log("LevelDataManager: 检测到已完成的关卡，执行关卡迁移");
            
            // 清空原来的进度
            this.levelProgress.clear();
            
            // 将迁移后的进度设置到主进度映射中
            for (const [newLevelId, progress] of newLevelProgress) {
                this.levelProgress.set(newLevelId, progress);
            }
            
            // 设置教学关（第一关）为已完成（如果原来的第一关已完成）
            const originalFirstLevelProgress = this.levelProgress.get(2); // 原来的第一关现在是第二关
            if (originalFirstLevelProgress && originalFirstLevelProgress.isCompleted) {
                console.log("LevelDataManager: 检测到玩家已完成原第一关，自动完成教学关");
                
                // 设置教学关（第一关）为已完成
                this.levelProgress.set(1, {
                    isUnlocked: true,
                    isCompleted: true,
                    bestScore: 1000, // 默认分数
                    stars: 1, // 默认1星
                    playCount: 1
                });
                console.log("LevelDataManager: 教学关已自动完成");
            }
            
            // 确保所有关卡都存在（防止遗漏）
            this.ensureAllLevelsExist();
            
            this.saveProgressData();
        } else {
            // 没有完成任何关卡，只需确保所有关卡都存在
            this.ensureAllLevelsExist();
        }
        
        // 标记已进行过迁移
        sys.localStorage.setItem("tutorial_migration_done2", "true");
        console.log("LevelDataManager: 教学关卡迁移完成");
    }
    
    // 🔥 新增：确保默认进度存在
    private ensureDefaultProgress() {
        console.log(`LevelDataManager.ensureDefaultProgress: 当前进度数量=${this.levelProgress.size}`);
        
        if (this.levelProgress.size === 0) {
            console.log("LevelDataManager.ensureDefaultProgress: 没有进度数据，初始化默认进度");
            this.initDefaultProgress();
        } else {
            console.log("LevelDataManager.ensureDefaultProgress: 已有进度数据，检查完整性");
            // 检查是否需要补充缺失的关卡
            this.ensureAllLevelsExist();
        }
        
        // 🔥 调试：输出当前进度状态
        this.debugProgressData();
    }
    
    // 🔥 新增：确保所有关卡都有进度记录
    private ensureAllLevelsExist() {
        let hasChanges = false;
        
        for (let i = 1; i <= MAHJONG_LEVEL_DATA.length; i++) {
            if (!this.levelProgress.has(i)) {
                console.log(`LevelDataManager.ensureAllLevelsExist: 添加缺失的关卡${i}`);
                this.levelProgress.set(i, {
                    isUnlocked: i === 1, // 只有第一关（教学关）默认解锁
                    isCompleted: false,
                    bestScore: 0,
                    stars: 0,
                    playCount: 0
                });
                hasChanges = true;
            }
        }
        
        if (hasChanges) {
            this.saveProgressData();
        }
    }
    
    // 🔥 新增：调试输出进度数据
    private debugProgressData() {
        console.log("=== LevelDataManager 进度状态 ===");
        console.log(`总关卡数: ${MAHJONG_LEVEL_DATA.length}`);
        console.log(`进度记录数: ${this.levelProgress.size}`);
        
        for (let i = 1; i <= Math.min(5, MAHJONG_LEVEL_DATA.length); i++) {
            const progress = this.levelProgress.get(i);
            if (progress) {
                console.log(`关卡${i}: 解锁=${progress.isUnlocked}, 完成=${progress.isCompleted}, 分数=${progress.bestScore}, 星数=${progress.stars}`);
            } else {
                console.log(`关卡${i}: 无记录`);
            }
        }
        console.log("==============================");
    }

    // 初始化默认进度（第一关解锁）
    private initDefaultProgress() {
        console.log("LevelDataManager.initDefaultProgress: 开始初始化默认进度");
        
        // 第一关（教学关）默认解锁
        this.levelProgress.set(1, {
            isUnlocked: true,
            isCompleted: false,
            bestScore: 0,
            stars: 0,
            playCount: 0
        });
        
        // 其他关卡默认锁定，根据MAHJONG_LEVEL_DATA的长度来设置
        for (let i = 2; i <= MAHJONG_LEVEL_DATA.length; i++) {
            this.levelProgress.set(i, {
                isUnlocked: false,
                isCompleted: false,
                bestScore: 0,
                stars: 0,
                playCount: 0
            });
        }
        
        this.saveProgressData();
        console.log(`LevelDataManager.initDefaultProgress: 初始化完成，共${this.levelProgress.size}个关卡`);
    }
    
    // 获取关卡进度
    public getLevelProgress(levelId: number): LevelProgress | null {
        return this.levelProgress.get(levelId) || null;
    }
    
    // 检查关卡是否解锁
    public isLevelUnlocked(levelId: number): boolean {
        const progress = this.getLevelProgress(levelId);
        return progress ? progress.isUnlocked : false;
    }
    
    // 检查关卡是否完成
    public isLevelCompleted(levelId: number): boolean {
        const progress = this.getLevelProgress(levelId);
        return progress ? progress.isCompleted : false;
    }
    
    // 获取关卡最佳分数
    public getLevelBestScore(levelId: number): number {
        const progress = this.getLevelProgress(levelId);
        return progress ? progress.bestScore : 0;
    }
    
    // 解锁关卡
    public unlockLevel(levelId: number): boolean {
        const progress = this.levelProgress.get(levelId);
        if (progress) {
            progress.isUnlocked = true;
            this.saveProgressData();
            console.log(`关卡 ${levelId} 已解锁`);
            return true;
        }
        return false;
    }
    
    // 完成关卡
    public completeLevel(levelId: number, score: number, stars: number = 0): boolean {
        console.log(`LevelDataManager.completeLevel: 尝试完成关卡${levelId}, 分数=${score}, 星数=${stars}`);
        
        const progress = this.levelProgress.get(levelId);
        if (!progress) {
            console.error(`LevelDataManager.completeLevel: 关卡${levelId}不存在`);
            return false;
        }
        
        if (!progress.isUnlocked) {
            console.error(`LevelDataManager.completeLevel: 关卡${levelId}未解锁，无法完成`);
            return false;
        }
        
        console.log(`LevelDataManager.completeLevel: 关卡${levelId}当前状态 - 已完成=${progress.isCompleted}, 最佳分数=${progress.bestScore}, 星数=${progress.stars}`);
        
        progress.isCompleted = true;
        progress.playCount++;
        
        // 更新最佳分数
        if (score > progress.bestScore) {
            progress.bestScore = score;
            console.log(`LevelDataManager.completeLevel: 更新最佳分数 ${progress.bestScore} -> ${score}`);
        }
        
        // 更新星数
        if (stars > progress.stars) {
            progress.stars = stars;
            console.log(`LevelDataManager.completeLevel: 更新星数 ${progress.stars} -> ${stars}`);
        }
        
        // 🔥 在解锁下一关之前先保存当前进度
        this.saveProgressData();
        console.log(`LevelDataManager.completeLevel: 当前关卡进度已保存`);
        
        // 自动解锁下一关
        this.unlockNextLevel(levelId);
        
        // 🔥 解锁下一关后再次保存
        this.saveProgressData();
        console.log(`LevelDataManager.completeLevel: 关卡 ${levelId} 完成，分数: ${score}, 星数: ${stars}`);
        
        // 🔥 输出解锁后的状态
        this.debugProgressData();
        
        return true;
    }
    
    // 解锁下一关
    private unlockNextLevel(currentLevelId: number) {
        const nextLevelId = currentLevelId + 1;
        console.log(`LevelDataManager.unlockNextLevel: 尝试解锁关卡${nextLevelId}`);
        
        const nextProgress = this.levelProgress.get(nextLevelId);
        
        if (!nextProgress) {
            console.log(`LevelDataManager.unlockNextLevel: 关卡${nextLevelId}不存在，无法解锁`);
            return;
        }
        
        if (nextProgress.isUnlocked) {
            console.log(`LevelDataManager.unlockNextLevel: 关卡${nextLevelId}已经解锁`);
            return;
        }
        
        nextProgress.isUnlocked = true;
        console.log(`LevelDataManager.unlockNextLevel: ✅ 关卡${nextLevelId}已自动解锁`);
    }
    
    // 设置当前关卡ID
    public setCurrentLevel(levelId: number) {
        this.currentLevelId = levelId;
        sys.localStorage.setItem(LevelDataManager.CURRENT_LEVEL_KEY, levelId.toString());
    }
    
    // 获取当前关卡ID
    public getCurrentLevel(): number {
        return this.currentLevelId;
    }
    
    // 获取总进度统计
    public getProgressStats(): {
        totalLevels: number;
        unlockedLevels: number;
        completedLevels: number;
        totalStars: number;
        totalScore: number;
    } {
        let unlockedLevels = 0;
        let completedLevels = 0;
        let totalStars = 0;
        let totalScore = 0;
        
        for (const [levelId, progress] of this.levelProgress) {
            if (progress.isUnlocked) {
                unlockedLevels++;
            }
            if (progress.isCompleted) {
                completedLevels++;
            }
            totalStars += progress.stars;
            totalScore += progress.bestScore;
        }
        
        return {
            totalLevels: this.levelProgress.size,
            unlockedLevels,
            completedLevels,
            totalStars,
            totalScore
        };
    }
    
    // 重置所有进度
    public resetAllProgress() {
        this.levelProgress.clear();
        this.currentLevelId = 1;
        this.initDefaultProgress();
        console.log("所有关卡进度已重置");
        
        // 重置教学关卡迁移标记
        sys.localStorage.removeItem("tutorial_migration_done");
    }
    
    // 保存进度到本地存储
    private saveProgressData() {
        try {
            const progressData: { [key: number]: LevelProgress } = {};
            for (const [levelId, progress] of this.levelProgress) {
                progressData[levelId] = progress;
            }
            
            const jsonData = JSON.stringify(progressData);
            sys.localStorage.setItem(LevelDataManager.SAVE_KEY, jsonData);
            console.log("关卡进度已保存");
        } catch (error) {
            console.error("保存关卡进度失败:", error);
        }
    }
    
    // 从本地存储加载进度
    private loadProgressData() {
        try {
            const jsonData = sys.localStorage.getItem(LevelDataManager.SAVE_KEY);
            const currentLevelData = sys.localStorage.getItem(LevelDataManager.CURRENT_LEVEL_KEY);
            
            if (jsonData) {
                const progressData = JSON.parse(jsonData);
                this.levelProgress.clear();
                
                for (const levelId in progressData) {
                    this.levelProgress.set(parseInt(levelId), progressData[levelId]);
                }
                
                console.log("关卡进度已加载");
            }
            
            if (currentLevelData) {
                this.currentLevelId = parseInt(currentLevelData);
            }
        } catch (error) {
            console.error("加载关卡进度失败:", error);
            // 加载失败时初始化默认数据
            this.levelProgress.clear();
        }
    }
    
    // 开发者测试功能：解锁所有关卡
    public unlockAllLevels() {
        for (const [levelId, progress] of this.levelProgress) {
            progress.isUnlocked = true;
        }
        this.saveProgressData();
        console.log("所有关卡已解锁（开发者模式）");
    }
    
    // 开发者测试功能：完成所有关卡
    public completeAllLevels() {
        for (const [levelId, progress] of this.levelProgress) {
            progress.isUnlocked = true;
            progress.isCompleted = true;
            progress.bestScore = Math.floor(Math.random() * 3000) + 1000; // 随机分数
            progress.stars = Math.floor(Math.random() * 3) + 1; // 1-3星
        }
        this.saveProgressData();
        console.log("所有关卡已完成（开发者模式）");
    }
    
    // 🔥 新增：检查是否为教学关卡
    public isTutorialLevel(levelId: number): boolean {
        const levelData = MAHJONG_LEVEL_DATA[levelId - 1];
        return levelData ? (levelData.isTutorial || false) : false;
    }
} 