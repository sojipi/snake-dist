import { _decorator, Component, Node, Vec3 } from 'cc';
import { GameManager } from '../GameManager';
import { SnakeController } from '../SnakeController';
import { TargetSelector } from './TargetSelector';
import { PathFinder } from './PathFinder';
import { MovementController } from './MovementController';
import { AutoDiscardAI } from './discard/AutoDiscardAI';
import Chess from '../game/Chess';
import YakuFactory from '../mahjong/yaku/YakuFactory';
import { ENUM_MAHJONG_YAKU } from '../Enum';
import { 
    Direction, 
    AIConfig, 
    DecisionContext, 
    AIState, 
    CharacterType, 
    CharacterConfig, 
    IAICharacter 
} from './AITypes';
import { DiscardStrategy } from './discard/DiscardTypes';

const { ccclass, property } = _decorator;

@ccclass('AICharacter')
export class AICharacter extends Component implements IAICharacter {
    
    // 角色配置
    private config: CharacterConfig;
    
    // 核心组件
    private gameManager: GameManager = null!;
    private snakeController: SnakeController = null!;
    private targetSelector: TargetSelector = null!;
    private pathFinder: PathFinder = null!;
    private movementController: MovementController = null!;
    private autoDiscardAI: AutoDiscardAI = null!;
    
    // AI状态
    private currentState: AIState = AIState.IDLE;
    private decisionTimer: number = 0;
    private currentTarget: Node | null = null;
    private lastDirection: Direction = Direction.RIGHT;
    private aiEnabled: boolean = false; // 🔥 重命名避免与Component.enabled冲突
    
    // 私有AI配置
    private aiConfig: AIConfig;
    
    // 🔥 AI角色手牌管理
    // 🔥 简化：移除独立手牌管理，直接使用蛇身作为手牌
    private readonly maxHandCards: number = 14;
    private isHandFull: boolean = false; // 🔥 新增：手牌已满标记
    private isCheckingWin: boolean = false; // 🔥 新增：正在检查胡牌标记，避免重复检查
    
    /**
     * 初始化AI角色
     */
    public static create(
        node: Node, 
        config: CharacterConfig
    ): AICharacter {
        // 🔥 先设置配置到节点的临时属性，避免时序问题
        (node as any)._aiCharacterConfig = config;
        const aiCharacter = node.addComponent(AICharacter);
        return aiCharacter;
    }
    
    /**
     * 使用配置初始化
     */
    private initializeWithConfig(config: CharacterConfig) {
        console.log(`AICharacter: 开始初始化配置`, config);
        
        this.config = { ...config };
        this.aiConfig = { ...config.aiConfig };
        this.aiConfig.characterId = config.id;
        this.aiEnabled = config.enabled; // 🔥 使用aiEnabled避免冲突
        
        console.log(`AICharacter: 初始化角色 ${config.name} (ID: ${config.id})`);
    }
    
    onLoad() {
        // 🔥 从节点的临时属性中读取配置
        const nodeConfig = (this.node as any)._aiCharacterConfig;
        if (nodeConfig) {
            this.initializeWithConfig(nodeConfig);
            delete (this.node as any)._aiCharacterConfig;
        } else {
            console.error('AICharacter: 没有找到_aiCharacterConfig，配置可能未正确传递');
        }
        
        this.initializeComponents();
        this.initializeAIModules();
    }
    
    /**
     * 初始化核心组件
     */
    private initializeComponents() {
        this.gameManager = GameManager.getInstance();
        this.snakeController = this.getComponent(SnakeController) || 
                               this.node.getComponent(SnakeController);
        
        if (!this.snakeController) {
            console.error(`AICharacter: 角色 ${this.config?.id || 'unknown'} 未找到SnakeController组件`);
        }
    }
    
    /**
     * 初始化AI模块
     */
    private initializeAIModules() {
        // 🔥 检查配置是否正确初始化
        if (!this.config) {
            console.error('AICharacter: 配置未初始化，无法初始化AI模块');
            return;
        }
        
        // 添加AI子模块组件
        this.targetSelector = this.node.addComponent(TargetSelector);
        this.pathFinder = this.node.addComponent(PathFinder);
        this.movementController = this.node.addComponent(MovementController);
        this.autoDiscardAI = this.node.addComponent(AutoDiscardAI);
        
        // 设置角色ID到各个组件
        this.setupModuleCharacterIds();

        // 设置TargetSelector的目标提供者，避免循环依赖
        if (this.targetSelector && this.gameManager) {
            this.targetSelector.setTargetProvider(() => this.gameManager);
            console.log(`AICharacter: 角色 ${this.config.id} TargetSelector目标提供者已设置`);
        } else {
            console.error(`AICharacter: 角色 ${this.config.id} 无法设置TargetSelector目标提供者 - targetSelector:${!!this.targetSelector}, gameManager:${!!this.gameManager}`);
        }

        console.log(`AICharacter: AI模块初始化完成 - ${this.config.id}`);
    }
    
    /**
     * 设置各模块的角色ID
     */
    private setupModuleCharacterIds() {
        const characterId = this.config?.id;
        if (!characterId) return;
        
        // 为每个模块设置角色ID（如果它们有这个方法）
        if (this.targetSelector && typeof (this.targetSelector as any).setCharacterId === 'function') {
            (this.targetSelector as any).setCharacterId(characterId);
        }
        
        if (this.pathFinder && typeof (this.pathFinder as any).setCharacterId === 'function') {
            (this.pathFinder as any).setCharacterId(characterId);
        }
        
        if (this.movementController && typeof (this.movementController as any).setCharacterId === 'function') {
            (this.movementController as any).setCharacterId(characterId);
        }
        
        if (this.autoDiscardAI && typeof (this.autoDiscardAI as any).setCharacterId === 'function') {
            (this.autoDiscardAI as any).setCharacterId(characterId);
        }
    }
    
    start() {
        if (this.aiEnabled) {
            this.startAI();
        }
    }
    
    /**
     * 更新AI逻辑
     */
    update(deltaTime: number) {
        if (!this.aiEnabled || !this.gameManager || !this.snakeController) {
            return;
        }
        
        // 🔥 检查游戏状态
        const gameState = this.gameManager.getGameState();
        if (gameState !== 0) { // 0 = PLAYING
            // 如果游戏暂停或结束，锁定AI角色移动
            if (gameState === 1) { // 1 = PAUSED
                if (!this.snakeController.isMovementLocked()) {
                    this.snakeController.lockMovement();
                    console.log(`AICharacter: 角色 ${this.config.id} 游戏暂停，锁定移动`);
                }
            } else if (gameState === 2) { // 2 = GAME_OVER
                if (!this.snakeController.isMovementLocked()) {
                    this.snakeController.lockMovement();
                    console.log(`AICharacter: 角色 ${this.config.id} 游戏结束，锁定移动`);
                }
            }
            return;
        }
        
        // 游戏进行中，确保AI角色可以移动
        if (this.snakeController.isMovementLocked()) {
            this.snakeController.unlockMovement();
            console.log(`AICharacter: 角色 ${this.config.id} 游戏恢复，解锁移动`);
        }
        
        // AI决策计时器
        this.decisionTimer += deltaTime;
        if (this.decisionTimer >= this.aiConfig.decisionInterval) {
            this.decisionTimer = 0;
            this.executeAIDecision();
        }
    }
    
    /**
     * 执行AI决策
     */
    private executeAIDecision() {
        const snakeHead = this.getSnakeHead();
        if (!snakeHead) {
            console.error(`AICharacter: 角色 ${this.config.id} 无法获取蛇头位置`);
            return;
        }

        // 创建决策上下文
        const context = this.createDecisionContext(snakeHead.position);

        // 🔥 添加详细调试信息
        console.log(`AICharacter: 角色 ${this.config.id} 执行AI决策 - 当前状态: ${this.getStateString(this.currentState)}, 位置: (${snakeHead.position.x.toFixed(1)}, ${snakeHead.position.y.toFixed(1)})`);

        // 更新AI状态
        this.updateAIState(context);

        // 执行决策逻辑
        switch (this.currentState) {
            case AIState.SEEKING_TARGET:
                this.handleSeekingTarget(context);
                break;
            case AIState.MOVING_TO_TARGET:
                this.handleMovingToTarget(context);
                break;
            case AIState.EXPLORING:
                this.handleExploring(context);
                break;
            case AIState.STUCK:
                this.handleStuck(context);
                break;
            default:
                console.warn(`AICharacter: 角色 ${this.config.id} 未知AI状态`);
                this.currentState = AIState.SEEKING_TARGET;
                break;
        }
    }
    
    /**
     * 创建决策上下文
     */
    private createDecisionContext(snakePosition: Vec3): DecisionContext {
        return {
            snakePosition: snakePosition,
            currentTarget: this.currentTarget,
            availableTargets: this.gameManager.getActiveTiles() || [],
            gameBounds: this.gameManager.getGameAreaBounds(),
            handCardCount: this.gameManager.getHandCardsCount(),
            maxHandCards: this.gameManager.getMaxHandCards(),
            lastDirection: this.lastDirection,
            pathHistory: this.movementController ? this.movementController.getPathHistory() : [],
            // 角色相关上下文
            characterId: this.config.id,
            otherCharacters: this.getOtherCharactersPositions(),
            cooperationMode: this.aiConfig.cooperationMode,
            avoidOtherCharacters: this.aiConfig.avoidOtherCharacters
        };
    }
    
    /**
     * 获取其他角色位置
     */
    private getOtherCharactersPositions(): Vec3[] {
        // 这里需要从MultiAIManager获取其他角色的位置
        // 暂时返回空数组，后面在MultiAIManager中实现
        return [];
    }
    
    /**
     * 更新AI状态
     */
    private updateAIState(context: DecisionContext) {
        // 🔥 检查手牌是否已满
        if (this.getHandCardsCount() >= this.maxHandCards) {
            console.log(`AICharacter: 角色 ${this.config.id} 手牌已满，停止寻找目标，专注于弃牌`);
            this.currentTarget = null;
            this.currentState = AIState.IDLE;
            return;
        }
        
        // 检查是否卡死
        const isStuck = this.movementController.isStuckInLoop();
        
        if (isStuck) {
            if (this.currentState !== AIState.STUCK) {
                console.log(`AICharacter: 角色 ${this.config.id} 检测到卡死状态`);
                this.currentState = AIState.STUCK;
            }
            return;
        }
        
        // 正常状态转换逻辑
        if (this.currentState === AIState.STUCK) {
            this.currentState = AIState.SEEKING_TARGET;
            console.log(`AICharacter: 角色 ${this.config.id} 从卡死状态恢复`);
        }
        
        // 检查是否需要刷新目标
        if (this.currentTarget && this.movementController.shouldRefreshTarget(context)) {
            this.currentTarget = null;
            this.currentState = AIState.SEEKING_TARGET;
            console.log(`AICharacter: 角色 ${this.config.id} 目标已刷新`);
        }
        
        // 根据当前目标状态更新AI状态
        if (!this.currentTarget && this.currentState === AIState.MOVING_TO_TARGET) {
            this.currentState = AIState.SEEKING_TARGET;
        }
    }
    
    /**
     * 处理寻找目标状态
     */
    private handleSeekingTarget(context: DecisionContext) {
        console.log(`AICharacter: 角色 ${this.config.id} 开始寻找目标...`);

        this.currentTarget = this.targetSelector.findBestTarget(context);

        if (this.currentTarget) {
            this.currentState = AIState.MOVING_TO_TARGET;
            const distance = Vec3.distance(context.snakePosition, this.currentTarget.position);
            console.log(`AICharacter: 角色 ${this.config.id} 找到目标，距离:${distance.toFixed(1)}`);
        } else {
            this.currentState = AIState.EXPLORING;
            console.log(`AICharacter: 角色 ${this.config.id} 未找到目标，切换到探索状态`);
        }

        // 更新上下文并继续执行
        context.currentTarget = this.currentTarget;
        this.executeMovement(context);
    }
    
    /**
     * 处理移动到目标状态
     */
    private handleMovingToTarget(context: DecisionContext) {
        this.executeMovement(context);
    }
    
    /**
     * 处理探索状态
     */
    private handleExploring(context: DecisionContext) {
        this.executeMovement(context);
    }
    
    /**
     * 处理卡死状态
     */
    private handleStuck(context: DecisionContext) {
        console.log(`AICharacter: 角色 ${this.config.id} 处理卡死状态`);
        
        // 清空历史和重置状态
        if (this.movementController) {
            this.movementController.clearMovementHistory();
        }
        
        this.currentTarget = null;
        this.currentState = AIState.SEEKING_TARGET;
        
        // 强制执行探索移动
        context.currentTarget = null;
        context.pathHistory = [];
        this.executeMovement(context);
    }
    
    /**
     * 执行移动
     */
    private executeMovement(context: DecisionContext) {
        const pathPlan = this.pathFinder.planPathToTarget(context);
        
        // 执行移动
        if (this.movementController) {
            const success = this.movementController.executeMovement(pathPlan.direction, context);
            if (success) {
                this.lastDirection = pathPlan.direction;
            }
        }
    }
    
    /**
     * 获取蛇头节点
     */
    private getSnakeHead(): Node | null {
        if (this.snakeController) {
            return (this.snakeController as any).snakeHead;
        }
        return null;
    }
    
    // === IAICharacter接口实现 ===
    
    public getId(): string {
        return this.config.id;
    }
    
    public getType(): CharacterType {
        return this.config.type;
    }
    
    public getName(): string {
        return this.config.name;
    }
    
    public isEnabled(): boolean {
        return this.aiEnabled;
    }
    
    public setEnabled(enabled: boolean): void {
        this.aiEnabled = enabled;
        if (enabled) {
            this.startAI();
        } else {
            this.stopAI();
        }
    }
    
    public getConfig(): CharacterConfig {
        return { ...this.config };
    }
    
    public getCurrentState(): AIState {
        return this.currentState;
    }
    
    public getCurrentTarget(): Node | null {
        return this.currentTarget;
    }
    
    public startAI(): void {
        this.aiEnabled = true;
        this.currentState = AIState.SEEKING_TARGET;
        this.decisionTimer = 0;
        this.currentTarget = null;
        
        // 🔥 解锁AI角色的移动
        if (this.snakeController) {
            this.snakeController.unlockMovement();
            console.log(`AICharacter: 角色 ${this.config.id} 移动已解锁`);
        }
        
        // 重置子模块
        if (this.movementController) {
            this.movementController.clearMovementHistory();
        }
        
        // 🔥 启动AutoDiscardAI
        if (this.autoDiscardAI) {
            this.autoDiscardAI.startAutoDiscard();
            console.log(`AICharacter: 角色 ${this.config.id} AutoDiscardAI已启动`);
        }
        
        console.log(`AICharacter: 角色 ${this.config.id} AI已启动`);
    }
    
    public stopAI(): void {
        this.aiEnabled = false;
        this.currentState = AIState.IDLE;
        this.currentTarget = null;
        
        // 🔥 锁定AI角色的移动
        if (this.snakeController) {
            this.snakeController.lockMovement();
            console.log(`AICharacter: 角色 ${this.config.id} 移动已锁定`);
        }
        
        // 🔥 停止AutoDiscardAI
        if (this.autoDiscardAI) {
            this.autoDiscardAI.stopAutoDiscard();
            console.log(`AICharacter: 角色 ${this.config.id} AutoDiscardAI已停止`);
        }
        
        console.log(`AICharacter: 角色 ${this.config.id} AI已停止`);
    }
    
    onDestroy() {
        this.stopAI();

        // 清理AI模块
        if (this.targetSelector) {
            this.targetSelector.destroy();
        }
        if (this.pathFinder) {
            this.pathFinder.destroy();
        }
        if (this.movementController) {
            this.movementController.destroy();
        }
        if (this.autoDiscardAI) {
            this.autoDiscardAI.destroy();
        }

        console.log(`AICharacter: 角色 ${this.config?.id || 'unknown'} 已销毁`);
    }
    
    // === 配置方法 ===
    
    /**
     * 设置AI参数
     */
    public setDecisionInterval(interval: number) {
        this.aiConfig.decisionInterval = Math.max(0.1, interval);
        console.log(`AICharacter: 角色 ${this.config.id} 决策间隔设置为: ${this.aiConfig.decisionInterval}秒`);
    }
    
    public setSearchRadius(radius: number) {
        this.aiConfig.searchRadius = Math.max(100, radius);
        console.log(`AICharacter: 角色 ${this.config.id} 搜索半径设置为: ${this.aiConfig.searchRadius}像素`);
    }
    
    public setSpeedMultiplier(multiplier: number) {
        this.aiConfig.speedMultiplier = Math.max(0.5, Math.min(3.0, multiplier));
        console.log(`AICharacter: 角色 ${this.config.id} 速度倍数设置为: ${this.aiConfig.speedMultiplier}`);
    }
    
    /**
     * 设置协作模式
     */
    public setCooperationMode(enabled: boolean) {
        this.aiConfig.cooperationMode = enabled;
        console.log(`AICharacter: 角色 ${this.config.id} 协作模式: ${enabled ? '开启' : '关闭'}`);
    }
    
    /**
     * 设置避让其他角色
     */
    public setAvoidOtherCharacters(enabled: boolean) {
        this.aiConfig.avoidOtherCharacters = enabled;
        console.log(`AICharacter: 角色 ${this.config.id} 避让其他角色: ${enabled ? '开启' : '关闭'}`);
    }
    
    /**
     * 弃牌AI相关设置
     */
    public setDiscardStrategy(strategy: DiscardStrategy) {
        if (this.autoDiscardAI) {
            this.autoDiscardAI.setDiscardStrategy(strategy);
        }
    }
    
    public setDiscardInterval(interval: number) {
        if (this.autoDiscardAI) {
            this.autoDiscardAI.setDecisionInterval(interval);
        }
    }
    
    public setSafetyLevel(level: number) {
        if (this.autoDiscardAI) {
            this.autoDiscardAI.setSafetyLevel(level);
        }
    }
    
    public toggleAutoDiscard(): boolean {
        if (this.autoDiscardAI) {
            return this.autoDiscardAI.toggleAI();
        }
        return false;
    }
    
    public triggerManualDiscard() {
        if (this.autoDiscardAI) {
            return this.autoDiscardAI.triggerManualDiscard();
        }
        return null;
    }
    
    /**
     * 获取AI统计信息
     */
    public getAIStats(): {
        characterId: string,
        state: string,
        target: boolean,
        movementStats: any,
        targetStats: any,
        discardStats: any
    } {
        const context = this.createDecisionContext(
            this.getSnakeHead()?.position || new Vec3()
        );
        
        return {
            characterId: this.config.id,
            state: this.getStateString(this.currentState),
            target: !!this.currentTarget,
            movementStats: this.movementController ? this.movementController.getMovementStats() : null,
            targetStats: this.targetSelector ? this.targetSelector.getTargetStats(context) : null,
            discardStats: this.autoDiscardAI ? this.autoDiscardAI.getAIStatus() : null
        };
    }
    
    /**
     * 状态转字符串
     */
    private getStateString(state: AIState): string {
        switch (state) {
            case AIState.IDLE: return "空闲";
            case AIState.SEEKING_TARGET: return "寻找目标";
            case AIState.MOVING_TO_TARGET: return "移动到目标";
            case AIState.EXPLORING: return "探索";
            case AIState.STUCK: return "卡死";
            default: return "未知";
        }
    }
    
    /**
     * 更新其他角色位置（由MultiAIManager调用）
     */
    public updateOtherCharactersPositions(positions: Vec3[]) {
        // 这个方法将被MultiAIManager调用来更新其他角色的位置
        // 可以在这里实现避让逻辑
    }
    
    // 🔥 AI角色手牌管理方法
    
    /**
     * 添加手牌（简化：直接检查蛇身长度）
     */
    public addHandCard(tileType: string): boolean {
        // 🔥 修复：如果已标记为手牌已满，直接拒绝添加
        if (this.isHandFull) {
            console.log(`AICharacter: 角色 ${this.config.id} 手牌已满标记，拒绝添加牌型 ${tileType}`);
            return false;
        }
        
        const currentHandCount = this.getHandCardsCount();
        const newHandCount = currentHandCount + 1;
        
        console.log(`AICharacter: 角色 ${this.config.id} 添加手牌 ${tileType}，当前手牌数: ${currentHandCount} -> ${newHandCount}`);
        
        if (currentHandCount >= this.maxHandCards) {
            console.log(`AICharacter: 角色 ${this.config.id} 手牌已满，无法添加牌型 ${tileType}`);
            return false;
        }
        
        // 🔥 检查是否胡牌（蛇身长度达到14时）
        if (newHandCount === this.maxHandCards) {
            console.log(`🔥 AICharacter.addHandCard: 手牌已满，检查胡牌和弃牌`);
            console.log(`🔥 AICharacter.addHandCard: autoDiscardAI存在: ${!!this.autoDiscardAI}`);
            
            // 🔥 修复：立即标记为手牌已满，防止继续添加
            this.isHandFull = true;
            
            // 🔥 修复：延迟一帧检查胡牌，确保蛇身已经更新
            this.scheduleOnce(() => {
                // 🔥 防止重复检查
                if (this.isCheckingWin) {
                    console.log(`AICharacter: 角色 ${this.config.id} 正在检查胡牌中，跳过重复检查`);
                    return;
                }
                
                this.isCheckingWin = true;
                const actualHandCount = this.getHandCardsCount();
                console.log(`AICharacter: 角色 ${this.config.id} 延迟检查胡牌，实际手牌数: ${actualHandCount}`);
                
                if (actualHandCount === this.maxHandCards) {
                    const hasWon = this.checkAIWin();
                    if (hasWon) {
                        console.log(`AICharacter: 角色 ${this.config.id} 胡牌！游戏结束，闯关失败`);
                        // 🔥 通知GameManager AI胡牌，游戏失败
                        if (this.gameManager) {
                            (this.gameManager as any).onAIWin(this.config.id);
                        }
                        this.isCheckingWin = false;
                        return;
                    }
                    
                    // 🔥 如果没有胡牌，立即触发弃牌决策
                    console.log(`AICharacter: 角色 ${this.config.id} 手牌已满但未胡牌，立即触发弃牌决策`);
                    if (this.autoDiscardAI) {
                        this.triggerDiscardDecision().catch(error => {
                            console.error(`AICharacter: 角色 ${this.config.id} 弃牌决策出错:`, error);
                            this.isCheckingWin = false;
                        });
                    } else {
                        console.error(`AICharacter: 角色 ${this.config.id} autoDiscardAI未初始化，无法触发弃牌决策`);
                        this.isCheckingWin = false;
                    }
                } else {
                    console.log(`AICharacter: 角色 ${this.config.id} 实际手牌数未达到最大值，重置手牌已满标记`);
                    this.isHandFull = false;
                    this.isCheckingWin = false;
                }
            }, 0);
        }
        
        return true;
    }
    
    /**
     * 弃牌（简化：直接从蛇身移除）
     */
    public discardCard(tileType: string): boolean {
        console.log(`🔥 AICharacter.discardCard: 开始弃牌，牌型="${tileType}"`);
        console.log(`🔥 AICharacter.discardCard: 当前蛇身长度: ${this.snakeController ? this.snakeController.getSnakeLength() : 0}`);
        
        // 🔥 直接从蛇身中移除对应的牌
        if (this.snakeController) {
            console.log(`🔥 AICharacter.discardCard: 准备从蛇身移除牌型 "${tileType}"`);
            
            const removed = this.snakeController.removeSnakeBodyByTileType(tileType);
            if (removed) {
                console.log(`AICharacter: 角色 ${this.config.id} 成功从蛇身移除牌型 ${tileType}`);
                
                // 🔥 重置手牌已满标记和检查标记
                this.isHandFull = false;
                this.isCheckingWin = false;
                console.log(`AICharacter: 角色 ${this.config.id} 重置手牌已满标记和检查标记`);
                
                // 🔥 通知GameManager添加到统一弃牌区
                if (this.gameManager) {
                    (this.gameManager as any).addToDiscardArea(tileType, this.config.id);
                }
                
                return true;
            } else {
                console.warn(`AICharacter: 角色 ${this.config.id} 从蛇身移除牌型 ${tileType} 失败`);
                return false;
            }
        }
        
        console.error(`AICharacter: 角色 ${this.config.id} SnakeController未初始化`);
        return false;
    }
    
    /**
     * 获取手牌数量（简化：直接返回蛇身长度）
     */
    public getHandCardsCount(): number {
        if (this.snakeController) {
            return this.snakeController.getSnakeLength() - 1; // 减去蛇头
        }
        return 0;
    }
    
    /**
     * 获取最大手牌数
     */
    public getMaxHandCards(): number {
        return this.maxHandCards;
    }
    
    /**
     * 检查是否可以吃牌（简化：检查蛇身长度）
     */
    public canEatTile(): boolean {
        // 🔥 修复：如果已标记为手牌已满，直接返回false
        if (this.isHandFull) {
            console.log(`AICharacter: 角色 ${this.config.id} 手牌已满标记，拒绝吃牌`);
            return false;
        }
        
        const handCount = this.getHandCardsCount();
        const canEat = handCount < this.maxHandCards;
        console.log(`AICharacter: 角色 ${this.config.id} 检查是否可以吃牌: ${handCount}/${this.maxHandCards} -> ${canEat}`);
        return canEat;
    }
    
    /**
     * 获取手牌列表（简化：从蛇身获取）
     */
    public getHandCards(): string[] {
        if (!this.snakeController) {
            return [];
        }
        
        const handCards: string[] = [];
        const snakeBodyLength = this.snakeController.getSnakeLength() - 1; // 减去蛇头
        
        for (let i = 0; i < snakeBodyLength; i++) {
            const bodyNode = (this.snakeController as any).snakeBody[i];
            if (bodyNode && bodyNode.isValid) {
                const mahjongTile = bodyNode.getComponent('MahjongTile');
                if (mahjongTile) {
                    const tileType = mahjongTile.getTileType();
                    handCards.push(tileType);
                }
            }
        }
        
        return handCards;
    }
    
    /**
     * 触发弃牌决策
     */
    private async triggerDiscardDecision() {
        if (this.autoDiscardAI) {
            console.log(`AICharacter: 角色 ${this.config.id} 手牌已满，触发弃牌决策`);
            const decision = await this.autoDiscardAI.triggerManualDiscard();
            if (decision && decision.recommendedTile) {
                console.log(`AICharacter: 角色 ${this.config.id} 弃牌决策: ${decision.recommendedTile.type}`);
                // 🔥 使用AutoDiscardAI的专用方法执行弃牌
                const success = this.autoDiscardAI.executeDiscardForAI(decision.recommendedTile.type);
                if (success) {
                    console.log(`AICharacter: 角色 ${this.config.id} 弃牌执行成功`);
                } else {
                    console.warn(`AICharacter: 角色 ${this.config.id} 弃牌执行失败`);
                }
            } else {
                console.warn(`AICharacter: 角色 ${this.config.id} 没有获得有效的弃牌决策`);
            }
        }
    }
    
    /**
     * 🔥 新增：检查AI角色是否胡牌（简化：只要能胡就行，不考虑特定役种）
     */
    public checkAIWin(): boolean {
        const handCardCount = this.getHandCardsCount();
        console.log(`AICharacter.checkAIWin: 当前手牌数量: ${handCardCount}, 需要数量: ${this.maxHandCards}`);
        
        if (handCardCount !== this.maxHandCards) {
            console.log(`AICharacter.checkAIWin: 手牌数量不匹配，跳过胡牌检查`);
            return false;
        }
        
        // 将手牌转换为Chess对象数组
        const chessArray = this.convertHandCardsToChess();
        
        // 🔥 修改：AI蛇只要能胡就行，检查所有可能的役种
        const yakuFactory = YakuFactory.getInstance();
        
        // 获取所有可用的役种类型
        const allYakuTypes = this.getAllYakuTypes();
        console.log(`AICharacter: 角色 ${this.config.id} 检查所有役种，共 ${allYakuTypes.length} 种`);
        
        // 检查是否能胡出任意一种役种
        for (const yakuType of allYakuTypes) {
            try {
                const canWin = yakuFactory.checkYaku(yakuType, chessArray);
                if (canWin) {
                    console.log(`AICharacter: 角色 ${this.config.id} 胡牌检查成功:`);
                    console.log(`- 胡出役种: ${yakuType}`);
                    console.log(`- 手牌数量: ${handCardCount}`);
                    return true;
                }
            } catch (error) {
                console.warn(`AICharacter: 检查役种 ${yakuType} 时出错:`, error);
                continue;
            }
        }
        
        console.log(`AICharacter: 角色 ${this.config.id} 无法胡出任何役种`);
        return false;
    }
    
    /**
     * 🔥 新增：将AI手牌转换为Chess对象数组
     */
    private convertHandCardsToChess(): any[] {
        try {
            const handCards = this.getHandCards();
            
            console.log(`AICharacter.convertHandCardsToChess: 转换手牌数量: ${handCards.length}`);
            
            return handCards.map(tileType => {
                const chess = new Chess();
                // 根据tileType设置Chess对象的属性
                this.setChessFromTileType(chess, tileType);
                return chess;
            });
        } catch (error) {
            console.error(`AICharacter.convertHandCardsToChess: 转换失败:`, error);
            return [];
        }
    }
    
    /**
     * 🔥 新增：根据麻将牌类型设置Chess对象属性
     */
    private setChessFromTileType(chess: any, tileType: string) {
        // 将tileType直接转换为数字并设置到Chess的num属性
        const typeNum = parseInt(tileType);
        
        // 设置麻将牌编号
        chess.num = typeNum;
        chess.id = typeNum;
        
        console.log(`AICharacter: 设置麻将牌: tileType=${tileType}, num=${chess.num}`);
    }
    
    /**
     * 🔥 新增：获取所有可用的役种类型
     */
    private getAllYakuTypes(): string[] {
        return [
            ENUM_MAHJONG_YAKU.TANYAO,           // 断幺九
            ENUM_MAHJONG_YAKU.PINFU,            // 平和
            ENUM_MAHJONG_YAKU.IPEKO,            // 一杯口
            ENUM_MAHJONG_YAKU.YAKUHAI,          // 役牌
            ENUM_MAHJONG_YAKU.TOITOI,           // 对对和
            ENUM_MAHJONG_YAKU.CHITOITSU,        // 七对子
            ENUM_MAHJONG_YAKU.SANSHOKU,         // 三色同顺
            ENUM_MAHJONG_YAKU.ITTSU,            // 一气通贯
            ENUM_MAHJONG_YAKU.CHANTA,           // 混全带幺九
            ENUM_MAHJONG_YAKU.HONITSU,          // 混一色
            ENUM_MAHJONG_YAKU.CHINITSU,         // 清一色
            ENUM_MAHJONG_YAKU.RYANPEKO,         // 两杯口
            ENUM_MAHJONG_YAKU.TSUISO,           // 字一色
            ENUM_MAHJONG_YAKU.CHINROTO,         // 清老头
            ENUM_MAHJONG_YAKU.SANSHOKU_KOKU,    // 三色同刻
            ENUM_MAHJONG_YAKU.YISE_SANTOUSU,    // 一色三同顺
            ENUM_MAHJONG_YAKU.YISE_SISANTOUSU,  // 一色四同顺
            ENUM_MAHJONG_YAKU.HONGKONG,         // 红孔雀
            ENUM_MAHJONG_YAKU.HONGYI_DIAN,      // 红一点
            ENUM_MAHJONG_YAKU.HEIYI_SE,         // 黑一色
            ENUM_MAHJONG_YAKU.DACHELUN,         // 大车轮
            ENUM_MAHJONG_YAKU.SHISANBUDA,       // 十三不搭
            ENUM_MAHJONG_YAKU.DASHULIN,         // 大树林
            ENUM_MAHJONG_YAKU.DADALIN,          // 大竹林
            ENUM_MAHJONG_YAKU.BAIWANSHI,        // 百万石
            ENUM_MAHJONG_YAKU.DONGBEI_XINGANXIAN, // 东北新干线
            ENUM_MAHJONG_YAKU.JINMENQIAO,       // 金门桥
            ENUM_MAHJONG_YAKU.WUMENQI,          // 五门齐
            ENUM_MAHJONG_YAKU.SANSEITSU,        // 三色通贯
            ENUM_MAHJONG_YAKU.SANANKO,          // 三暗刻
            ENUM_MAHJONG_YAKU.SANKANTSU,        // 三杠子
            ENUM_MAHJONG_YAKU.SANLIANKE,        // 三连刻
            ENUM_MAHJONG_YAKU.SISANLIANKE,      // 四连刻
            ENUM_MAHJONG_YAKU.JUNCHAN,          // 纯全带幺九
            ENUM_MAHJONG_YAKU.HONROTO,          // 混老头
            ENUM_MAHJONG_YAKU.SHOSANGEN,        // 小三元
            ENUM_MAHJONG_YAKU.DAISANGEN,        // 大三元
            ENUM_MAHJONG_YAKU.KOKUSHI,          // 国士无双
            ENUM_MAHJONG_YAKU.KOKUSHI_SHISANMIAN, // 国士无双十三面
            ENUM_MAHJONG_YAKU.SUANKO,           // 四暗刻
            ENUM_MAHJONG_YAKU.SUANKO_DANQI,     // 四暗刻单骑
            ENUM_MAHJONG_YAKU.SUKANTSU,         // 四杠子
            ENUM_MAHJONG_YAKU.TENHO,            // 天和
            ENUM_MAHJONG_YAKU.CHIHO,            // 地和
            ENUM_MAHJONG_YAKU.DAISUSHI,         // 大四喜
            ENUM_MAHJONG_YAKU.SHOSUSHI,         // 小四喜
            ENUM_MAHJONG_YAKU.RYUISO,           // 绿一色
            ENUM_MAHJONG_YAKU.DASIXING,         // 大七星
            ENUM_MAHJONG_YAKU.WUFA_LVYISE,      // 无发绿一色
            ENUM_MAHJONG_YAKU.CHURENPOTO,       // 九莲宝灯
            ENUM_MAHJONG_YAKU.CHURENPOTO_ZHENZHENG // 纯正九莲宝灯
        ];
    }
} 