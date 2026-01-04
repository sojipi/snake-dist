import { _decorator, Component, Node, Vec3 } from 'cc';
import { AICharacter } from './AICharacter';
import { 
    CharacterConfig, 
    CharacterType, 
    AIConfig, 
    IAICharacter, 
    MultiAIManagerState,
    AIState
} from './AITypes';

const { ccclass, property } = _decorator;

@ccclass('MultiAIManager')
export class MultiAIManager extends Component {
    
    @property({ tooltip: "是否启用多角色AI系统" })
    public enableMultiAI: boolean = true;
    
    @property({ tooltip: "AI更新间隔时间（秒）" })
    public updateInterval: number = 0.1;
    
    @property({ tooltip: "最大角色数量" })
    public maxCharacters: number = 10;
    
    @property({ tooltip: "角色间避让距离" })
    public avoidanceDistance: number = 50;
    
    // 管理器状态
    private managerState: MultiAIManagerState;
    private updateTimer: number = 0;
    private static instance: MultiAIManager;
    
    // 角色优先级队列
    private updateQueue: string[] = [];
    private currentUpdateIndex: number = 0;
    
    onLoad() {
        // 设置单例
        if (MultiAIManager.instance) {
            console.warn("MultiAIManager: 多个实例存在，标记为冗余实例");
            // 🔥 不要销毁，而是标记为冗余实例，避免影响现有系统
            (this as any)._isRedundantInstance = true;
            return;
        }
        MultiAIManager.instance = this;
        
        // 初始化管理器状态
        this.initializeManagerState();
        
        console.log("MultiAIManager: 多角色AI管理器已初始化");
    }
    
    /**
     * 初始化管理器状态
     */
    private initializeManagerState() {
        this.managerState = {
            totalCharacters: 0,
            activeCharacters: 0,
            charactersById: new Map<string, IAICharacter>(),
            updateQueue: [],
            isRunning: false
        };
        console.log("MultiAIManager: 管理器状态已初始化");
    }
    
    start() {
        // 🔥 冗余实例不执行start逻辑
        if ((this as any)._isRedundantInstance) {
            console.log("MultiAIManager: 冗余实例跳过start逻辑");
            return;
        }
        
        if (this.enableMultiAI) {
            this.startMultiAI();
        }
    }
    
    onDestroy() {
        // 🔥 冗余实例销毁时不影响系统
        if ((this as any)._isRedundantInstance) {
            console.log("MultiAIManager: 冗余实例被销毁，不影响主系统");
            return;
        }
        
        this.stopMultiAI();
        if (MultiAIManager.instance === this) {
            MultiAIManager.instance = null!;
        }
    }
    
    /**
     * 获取单例实例
     */
    public static getInstance(): MultiAIManager {
        return MultiAIManager.instance;
    }
    
    /**
     * 启动多角色AI系统
     */
    public startMultiAI() {
        // 🔥 安全检查：确保managerState已初始化
        if (!this.managerState) {
            console.warn("MultiAIManager: managerState未初始化，重新初始化");
            this.initializeManagerState();
        }
        
        this.managerState.isRunning = true;
        this.updateTimer = 0;
        this.rebuildUpdateQueue();
        
        console.log("MultiAIManager: 多角色AI系统已启动");
    }
    
    /**
     * 停止多角色AI系统
     */
    public stopMultiAI() {
        // 🔥 安全检查：确保managerState已初始化
        if (!this.managerState) {
            console.warn("MultiAIManager: managerState未初始化，无法停止");
            return;
        }
        
        this.managerState.isRunning = false;
        
        // 停止所有AI角色
        this.managerState.charactersById.forEach(character => {
            character.stopAI();
        });
        
        console.log("MultiAIManager: 多角色AI系统已停止");
    }
    
    /**
     * 🔥 暂停所有AI角色
     */
    public pauseAllAI() {
        // 🔥 安全检查：确保managerState已初始化
        if (!this.managerState) {
            console.warn("MultiAIManager: managerState未初始化，无法暂停");
            return;
        }
        
        console.log("MultiAIManager: 暂停所有AI角色");
        
        // 暂停所有AI角色
        this.managerState.charactersById.forEach(character => {
            if (character instanceof AICharacter) {
                // 锁定AI角色的移动
                const snakeController = (character as any).snakeController;
                if (snakeController && !snakeController.isMovementLocked()) {
                    snakeController.lockMovement();
                }
            }
        });
    }
    
    /**
     * 🔥 恢复所有AI角色
     */
    public resumeAllAI() {
        // 🔥 安全检查：确保managerState已初始化
        if (!this.managerState) {
            console.warn("MultiAIManager: managerState未初始化，无法恢复");
            return;
        }
        
        console.log("MultiAIManager: 恢复所有AI角色");
        
        // 恢复所有AI角色
        this.managerState.charactersById.forEach(character => {
            if (character instanceof AICharacter) {
                // 解锁AI角色的移动
                const snakeController = (character as any).snakeController;
                if (snakeController && snakeController.isMovementLocked()) {
                    snakeController.unlockMovement();
                }
            }
        });
    }
    
    /**
     * 主要更新循环
     */
    update(deltaTime: number) {
        // 🔥 冗余实例不执行update逻辑
        if ((this as any)._isRedundantInstance) {
            return;
        }
        
        // 🔥 安全检查：确保managerState已初始化
        if (!this.managerState || !this.managerState.isRunning || !this.enableMultiAI) {
            return;
        }
        
        this.updateTimer += deltaTime;
        
        if (this.updateTimer >= this.updateInterval) {
            this.updateTimer = 0;
            this.updateCharacters(deltaTime);
        }
    }
    
    /**
     * 更新角色
     */
    private updateCharacters(deltaTime: number) {
        if (this.updateQueue.length === 0) {
            return;
        }
        
        // 轮询更新策略，避免所有角色同时更新
        const charactersToUpdate = Math.min(3, this.updateQueue.length);
        
        for (let i = 0; i < charactersToUpdate; i++) {
            const characterId = this.updateQueue[this.currentUpdateIndex];
            const character = this.managerState.charactersById.get(characterId);
            
            if (character && character.isEnabled()) {
                // 更新角色的其他角色位置信息
                this.updateCharacterContext(character);
                
                // 更新角色AI
                character.update(deltaTime);
            }
            
            // 移动到下一个角色
            this.currentUpdateIndex = (this.currentUpdateIndex + 1) % this.updateQueue.length;
        }
    }
    
    /**
     * 更新角色上下文信息
     */
    private updateCharacterContext(character: IAICharacter) {
        const otherPositions = this.getOtherCharactersPositions(character.getId());
        
        // 如果角色有updateOtherCharactersPositions方法，调用它
        if (character instanceof AICharacter) {
            character.updateOtherCharactersPositions(otherPositions);
        }
    }
    
    /**
     * 获取其他角色的位置
     */
    private getOtherCharactersPositions(excludeId: string): Vec3[] {
        const positions: Vec3[] = [];
        
        this.managerState.charactersById.forEach((character, id) => {
            if (id !== excludeId && character.isEnabled()) {
                const characterNode = character.getConfig().controllerNode;
                if (characterNode && characterNode.isValid) {
                    positions.push(characterNode.position.clone());
                }
            }
        });
        
        return positions;
    }
    
    /**
     * 添加AI角色
     */
    public addCharacter(config: CharacterConfig): IAICharacter | null {
        // 🔥 安全检查：确保managerState已初始化
        if (!this.managerState) {
            console.warn("MultiAIManager: managerState未初始化，重新初始化");
            this.initializeManagerState();
        }
        
        // 检查是否已存在相同ID的角色
        if (this.managerState.charactersById.has(config.id)) {
            console.error(`MultiAIManager: 角色ID ${config.id} 已存在`);
            return null;
        }
        
        // 检查是否超过最大角色数量
        if (this.managerState.totalCharacters >= this.maxCharacters) {
            console.error(`MultiAIManager: 已达到最大角色数量 ${this.maxCharacters}`);
            return null;
        }
        
        // 创建AI角色
        const aiCharacter = AICharacter.create(config.controllerNode, config);
        
        // 添加到管理器
        this.managerState.charactersById.set(config.id, aiCharacter);
        this.managerState.totalCharacters++;
        
        if (config.enabled) {
            this.managerState.activeCharacters++;
        }
        
        // 重建更新队列
        this.rebuildUpdateQueue();
        
        console.log(`MultiAIManager: 成功添加角色 ${config.name} (ID: ${config.id})`);
        return aiCharacter;
    }
    
    /**
     * 移除AI角色
     */
    public removeCharacter(characterId: string): boolean {
        const character = this.managerState.charactersById.get(characterId);
        
        if (!character) {
            console.error(`MultiAIManager: 角色 ${characterId} 不存在`);
            return false;
        }
        
        // 停止并销毁角色
        character.stopAI();
        character.destroy();
        
        // 从管理器中移除
        this.managerState.charactersById.delete(characterId);
        this.managerState.totalCharacters--;
        
        if (character.isEnabled()) {
            this.managerState.activeCharacters--;
        }
        
        // 重建更新队列
        this.rebuildUpdateQueue();
        
        console.log(`MultiAIManager: 成功移除角色 ${characterId}`);
        return true;
    }
    
    /**
     * 获取AI角色
     */
    public getCharacter(characterId: string): IAICharacter | null {
        return this.managerState.charactersById.get(characterId) || null;
    }
    
    /**
     * 获取所有角色
     */
    public getAllCharacters(): IAICharacter[] {
        return Array.from(this.managerState.charactersById.values());
    }
    
    /**
     * 启用/禁用角色
     */
    public setCharacterEnabled(characterId: string, enabled: boolean): boolean {
        const character = this.managerState.charactersById.get(characterId);
        
        if (!character) {
            console.error(`MultiAIManager: 角色 ${characterId} 不存在`);
            return false;
        }
        
        const wasEnabled = character.isEnabled();
        character.setEnabled(enabled);
        
        // 更新活跃角色计数
        if (enabled && !wasEnabled) {
            this.managerState.activeCharacters++;
        } else if (!enabled && wasEnabled) {
            this.managerState.activeCharacters--;
        }
        
        // 重建更新队列
        this.rebuildUpdateQueue();
        
        console.log(`MultiAIManager: 角色 ${characterId} ${enabled ? '启用' : '禁用'}`);
        return true;
    }
    
    /**
     * 启用/禁用多角色AI系统
     */
    public setMultiAIEnabled(enabled: boolean) {
        this.enableMultiAI = enabled;
        
        if (enabled) {
            this.startMultiAI();
        } else {
            this.stopMultiAI();
        }
    }
    
    /**
     * 重建更新队列
     */
    private rebuildUpdateQueue() {
        this.updateQueue = [];
        
        // 按优先级排序角色
        const characters = Array.from(this.managerState.charactersById.values())
            .filter(char => char.isEnabled())
            .sort((a, b) => a.getConfig().priority - b.getConfig().priority);
        
        // 构建更新队列
        this.updateQueue = characters.map(char => char.getId());
        this.managerState.updateQueue = [...this.updateQueue];
        
        // 重置更新索引
        this.currentUpdateIndex = 0;
        
        console.log(`MultiAIManager: 重建更新队列，包含 ${this.updateQueue.length} 个角色`);
    }
    
    /**
     * 创建默认角色配置
     */
    public createDefaultCharacterConfig(
        id: string,
        name: string,
        type: CharacterType,
        controllerNode: Node,
        options: Partial<CharacterConfig> = {}
    ): CharacterConfig {
        const defaultAIConfig: AIConfig = {
            decisionInterval: 0.1, // 更快的决策间隔
            searchRadius: 1500, // 更大的搜索半径
            speedMultiplier: 1.0,
            obstacleDetectionRange: 80,
            maxHistoryLength: 10,
            stuckThreshold: 6,
            explorationBias: 0.8,
            characterId: id,
            avoidOtherCharacters: true,
            cooperationMode: false
        };
        
        return {
            id: id,
            type: type,
            name: name,
            controllerNode: controllerNode,
            aiConfig: options.aiConfig || defaultAIConfig,
            enabled: options.enabled !== undefined ? options.enabled : true,
            priority: options.priority !== undefined ? options.priority : 1,
            ...options
        };
    }
    
    /**
     * 批量添加角色
     */
    public addCharacters(configs: CharacterConfig[]): IAICharacter[] {
        const addedCharacters: IAICharacter[] = [];
        
        for (const config of configs) {
            const character = this.addCharacter(config);
            if (character) {
                addedCharacters.push(character);
            }
        }
        
        console.log(`MultiAIManager: 批量添加 ${addedCharacters.length} 个角色`);
        return addedCharacters;
    }
    
    /**
     * 清空所有角色
     */
    public clearAllCharacters() {
        const characterIds = Array.from(this.managerState.charactersById.keys());
        
        for (const id of characterIds) {
            this.removeCharacter(id);
        }
        
        console.log("MultiAIManager: 已清空所有角色");
    }
    
    /**
     * 获取管理器状态
     */
    public getManagerState(): MultiAIManagerState {
        return {
            totalCharacters: this.managerState.totalCharacters,
            activeCharacters: this.managerState.activeCharacters,
            charactersById: new Map(this.managerState.charactersById),
            updateQueue: [...this.managerState.updateQueue],
            isRunning: this.managerState.isRunning
        };
    }
    
    /**
     * 获取管理器统计信息
     */
    public getManagerStats(): {
        totalCharacters: number,
        activeCharacters: number,
        isRunning: boolean,
        updateInterval: number,
        characterStats: any[]
    } {
        const characterStats: any[] = [];
        
        this.managerState.charactersById.forEach((character, id) => {
            if (character instanceof AICharacter) {
                characterStats.push({
                    id: id,
                    name: character.getName(),
                    type: character.getType(),
                    enabled: character.isEnabled(),
                    state: character.getCurrentState(),
                    hasTarget: !!character.getCurrentTarget(),
                    aiStats: character.getAIStats()
                });
            }
        });
        
        return {
            totalCharacters: this.managerState.totalCharacters,
            activeCharacters: this.managerState.activeCharacters,
            isRunning: this.managerState.isRunning,
            updateInterval: this.updateInterval,
            characterStats: characterStats
        };
    }
    
    /**
     * 设置角色间避让距离
     */
    public setAvoidanceDistance(distance: number) {
        this.avoidanceDistance = Math.max(20, distance);
        console.log(`MultiAIManager: 角色间避让距离设置为 ${this.avoidanceDistance} 像素`);
    }
    
    /**
     * 设置更新间隔
     */
    public setUpdateInterval(interval: number) {
        this.updateInterval = Math.max(0.05, interval);
        console.log(`MultiAIManager: 更新间隔设置为 ${this.updateInterval} 秒`);
    }
    
    /**
     * 设置最大角色数量
     */
    public setMaxCharacters(maxCount: number) {
        this.maxCharacters = Math.max(1, maxCount);
        console.log(`MultiAIManager: 最大角色数量设置为 ${this.maxCharacters}`);
    }
    
    /**
     * 检查角色是否可以移动到指定位置（避让检查）
     */
    public isPositionAvailable(characterId: string, position: Vec3): boolean {
        const otherPositions = this.getOtherCharactersPositions(characterId);
        
        for (const otherPos of otherPositions) {
            const distance = Vec3.distance(position, otherPos);
            if (distance < this.avoidanceDistance) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 获取角色的最佳移动方向（考虑避让）
     */
    public getBestMovementDirection(characterId: string, preferredDirection: Vec3): Vec3 {
        const character = this.managerState.charactersById.get(characterId);
        if (!character) {
            return preferredDirection;
        }
        
        const currentPos = character.getConfig().controllerNode.position;
        const testPos = currentPos.clone().add(preferredDirection);
        
        // 检查首选方向是否可用
        if (this.isPositionAvailable(characterId, testPos)) {
            return preferredDirection;
        }
        
        // 寻找替代方向
        const alternatives = [
            preferredDirection.clone().multiplyScalar(0.5), // 减缓移动
            new Vec3(preferredDirection.y, -preferredDirection.x, 0), // 垂直方向
            new Vec3(-preferredDirection.y, preferredDirection.x, 0), // 另一个垂直方向
            preferredDirection.clone().multiplyScalar(-0.5) // 轻微后退
        ];
        
        for (const alternative of alternatives) {
            const altTestPos = currentPos.clone().add(alternative);
            if (this.isPositionAvailable(characterId, altTestPos)) {
                return alternative;
            }
        }
        
        // 所有方向都不可用，返回原方向
        return preferredDirection;
    }
} 