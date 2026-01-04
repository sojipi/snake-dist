import { _decorator, Component, Node, Vec3 } from 'cc';
import { GameManager } from '../GameManager';
import { SnakeController } from '../SnakeController';
import { TargetSelector } from './TargetSelector';
import { PathFinder } from './PathFinder';
import { MovementController } from './MovementController';
import { AutoDiscardAI } from './discard/AutoDiscardAI';
import { Direction, AIConfig, DecisionContext, AIState, CharacterType, IAICharacter } from './AITypes';
import { DiscardStrategy } from './discard/DiscardTypes';
import { MultiAIManager } from './MultiAIManager';
import { AICharacter } from './AICharacter';

const { ccclass, property } = _decorator;

@ccclass('SnakeAI')
export class SnakeAI extends Component {
    
    // 属性配置
    @property({ tooltip: "是否启用AI自动控制" })
    enableAI: boolean = false;
    
    @property({ tooltip: "🔥 是否使用多角色AI系统" })
    useMultiAI: boolean = false;
    
    @property({ tooltip: "角色名称（多角色AI模式下使用）" })
    characterName: string = "Snake";
    
    @property({ tooltip: "角色类型（多角色AI模式下使用）" })
    characterType: CharacterType = CharacterType.SNAKE;
    
    @property({ tooltip: "AI决策间隔时间（秒）" })
    decisionInterval: number = 0.3;
    
    @property({ tooltip: "搜索麻将牌的最大距离" })
    searchRadius: number = 500;
    
    @property({ tooltip: "AI移动速度倍数" })
    speedMultiplier: number = 1.0;
    
    @property({ tooltip: "避障检测距离" })
    obstacleDetectionRange: number = 80;
    
    // 核心组件
    private gameManager: GameManager = null!;
    private snakeController: SnakeController = null!;
    private targetSelector: TargetSelector = null!;
    private pathFinder: PathFinder = null!;
    private movementController: MovementController = null!;
    private autoDiscardAI: AutoDiscardAI = null!;
    
    // 🔥 多角色AI系统支持
    private multiAIManager: MultiAIManager | null = null;
    private aiCharacter: IAICharacter | null = null;
    private characterId: string = "";
    
    // AI状态
    private currentState: AIState = AIState.IDLE;
    private decisionTimer: number = 0;
    private currentTarget: Node | null = null;
    private lastDirection: Direction = Direction.RIGHT;
    
    // AI配置
    private config: AIConfig = {
        decisionInterval: 0.3,
        searchRadius: 500,
        speedMultiplier: 1.0,
        obstacleDetectionRange: 80,
        maxHistoryLength: 10,
        stuckThreshold: 6,
        explorationBias: 0.8
    };
    
    onLoad() {
        this.initializeComponents();
        
        if (this.useMultiAI) {
            this.initializeMultiAI();
        } else {
        this.initializeAIModules();
        }
    }
    
    /**
     * 初始化核心组件
     */
    private initializeComponents() {
        this.gameManager = GameManager.getInstance();
        this.snakeController = this.getComponent(SnakeController) || this.node.getComponent(SnakeController);
        
        if (!this.snakeController) {
            console.error("SnakeAI: 未找到SnakeController组件");
        }
    }
    
    /**
     * 初始化AI模块
     */
    private initializeAIModules() {
        // 添加AI子模块组件
        this.targetSelector = this.node.addComponent(TargetSelector);
        this.pathFinder = this.node.addComponent(PathFinder);
        this.movementController = this.node.addComponent(MovementController);
        this.autoDiscardAI = this.node.addComponent(AutoDiscardAI);

        // 设置TargetSelector的目标提供者，避免循环依赖
        if (this.targetSelector && this.gameManager) {
            this.targetSelector.setTargetProvider(() => this.gameManager);
        }

        console.log("SnakeAI: AI模块初始化完成");
    }
    
    /**
     * 🔥 初始化多角色AI系统
     */
    private initializeMultiAI() {
        // 获取或创建多角色AI管理器
        this.multiAIManager = MultiAIManager.getInstance();
        
        if (!this.multiAIManager) {
            console.error("SnakeAI: 多角色AI管理器未找到，请先在场景中添加MultiAIManager组件");
            // 回退到传统AI模式
            this.useMultiAI = false;
            this.initializeAIModules();
            return;
        }
        
        // 生成角色ID
        this.characterId = `snake_${this.node.uuid}`;
        
        // 创建角色配置
        const config = this.multiAIManager.createDefaultCharacterConfig(
            this.characterId,
            this.characterName,
            this.characterType,
            this.node,
            {
                enabled: this.enableAI,
                priority: 1,
                aiConfig: {
                    decisionInterval: this.decisionInterval,
                    searchRadius: this.searchRadius,
                    speedMultiplier: this.speedMultiplier,
                    obstacleDetectionRange: this.obstacleDetectionRange,
                    maxHistoryLength: 10,
                    stuckThreshold: 6,
                    explorationBias: 0.8,
                    characterId: this.characterId,
                    avoidOtherCharacters: true,
                    cooperationMode: false
                }
            }
        );
        
        // 添加角色到管理器
        this.aiCharacter = this.multiAIManager.addCharacter(config);
        
        if (this.aiCharacter) {
            console.log(`SnakeAI: 成功添加到多角色AI系统，角色ID: ${this.characterId}`);
        } else {
            console.error("SnakeAI: 无法添加角色到多角色AI系统");
            // 回退到传统AI模式
            this.useMultiAI = false;
            this.initializeAIModules();
        }
    }
    
    start() {
        if (this.enableAI) {
            this.startAI();
        }
    }
    
    update(deltaTime: number) {
        // 🔥 在多角色AI模式下，更新逻辑由MultiAIManager处理
        if (this.useMultiAI && this.aiCharacter) {
            // 多角色AI系统会自动处理更新
            return;
        }
        
        // 传统单角色AI模式
        if (!this.enableAI || !this.gameManager || !this.snakeController) {
            return;
        }
        
        // 检查游戏状态
        if (this.gameManager.getGameState() !== 0) { // 0 = PLAYING
            return;
        }
        
        // AI决策计时器
        this.decisionTimer += deltaTime;
        if (this.decisionTimer >= this.config.decisionInterval) {
            this.decisionTimer = 0;
            this.executeAIDecision();
        }
    }
    
    /**
     * 启动AI
     */
    public startAI() {
        this.enableAI = true;
        
        // 🔥 多角色AI模式
        if (this.useMultiAI && this.aiCharacter) {
            this.aiCharacter.startAI();
            console.log(`SnakeAI: 多角色AI已启动 (角色ID: ${this.characterId})`);
            return;
        }
        
        // 传统单角色AI模式
        this.currentState = AIState.SEEKING_TARGET;
        this.decisionTimer = 0;
        this.currentTarget = null;
        
        // 重置子模块
        if (this.movementController) {
            this.movementController.clearMovementHistory();
        }
        
        console.log("SnakeAI: 贪食蛇AI已启动");
    }
    
    /**
     * 停止AI
     */
    public stopAI() {
        this.enableAI = false;
        
        // 🔥 多角色AI模式
        if (this.useMultiAI && this.aiCharacter) {
            this.aiCharacter.stopAI();
            console.log(`SnakeAI: 多角色AI已停止 (角色ID: ${this.characterId})`);
            return;
        }
        
        // 传统单角色AI模式
        this.currentState = AIState.IDLE;
        this.currentTarget = null;
        
        console.log("SnakeAI: 贪食蛇AI已停止");
    }
    
    /**
     * 执行AI决策
     */
    private executeAIDecision() {
        const snakeHead = this.getSnakeHead();
        if (!snakeHead) {
            console.error("SnakeAI: 无法获取蛇头位置");
            return;
        }
        
        // 不再因为手牌满了就自动关闭AI，让玩家自己决定
        // if (this.isHandCardsFull()) {
        //     this.stopAI();
        //     return;
        // }
        
        // 创建决策上下文
        const context = this.createDecisionContext(snakeHead.position);
        
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
                console.warn("SnakeAI: 未知AI状态");
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
            pathHistory: this.movementController ? this.movementController.getPathHistory() : []
        };
    }
    
    /**
     * 更新AI状态
     */
    private updateAIState(context: DecisionContext) {
        // 检查是否卡死
        const isStuck = this.movementController.isStuckInLoop();
        
        // 🔥 新增：检查是否在边界附近反复移动
        const isNearBoundary = this.isNearBoundary(context.snakePosition, context.gameBounds);
        const movementStats = this.movementController.getMovementStats();
        const hasRepeatedMoves = movementStats.isStuck; // 使用现有的卡死检测
        
        if (isStuck || (isNearBoundary && hasRepeatedMoves)) {
            if (this.currentState !== AIState.STUCK) {
                console.log("SnakeAI: 检测到卡死状态（可能在边界附近）");
                this.currentState = AIState.STUCK;
            }
            return;
        }
        
        // 正常状态转换逻辑
        if (this.currentState === AIState.STUCK) {
            this.currentState = AIState.SEEKING_TARGET;
            console.log("SnakeAI: 从卡死状态恢复");
        }
        
        // 🔥 修复：只有在有目标时才检查是否需要刷新
        if (this.currentTarget && this.movementController.shouldRefreshTarget(context)) {
            this.currentTarget = null;
            this.currentState = AIState.SEEKING_TARGET;
            console.log("SnakeAI: 目标已刷新，切换到寻找目标状态");
        }
        
        // 🔥 修复：根据当前目标状态更新AI状态
        if (!this.currentTarget && this.currentState === AIState.MOVING_TO_TARGET) {
            this.currentState = AIState.SEEKING_TARGET;
            console.log("SnakeAI: 没有目标，切换到寻找目标状态");
        }
    }
    
    /**
     * 🔥 新增：检查是否接近边界
     */
    private isNearBoundary(pos: Vec3, bounds: any, threshold: number = 60): boolean {
        return pos.x <= bounds.minX + threshold || 
               pos.x >= bounds.maxX - threshold || 
               pos.y <= bounds.minY + threshold || 
               pos.y >= bounds.maxY - threshold;
    }
    
    /**
     * 处理寻找目标状态
     */
    private handleSeekingTarget(context: DecisionContext) {
        console.log("SnakeAI: 执行寻找目标逻辑");
        
        // 🔥 新增：添加详细的调试信息
        const targetStats = this.targetSelector.getTargetStats(context);
        console.log(`SnakeAI: 目标统计 - 总数:${targetStats.totalTargets}, 范围内:${targetStats.inRange}, 可评估:${targetStats.evaluated}`);
        
        this.currentTarget = this.targetSelector.findBestTarget(context);
        
        if (this.currentTarget) {
            this.currentState = AIState.MOVING_TO_TARGET;
            const distance = Vec3.distance(context.snakePosition, this.currentTarget.position);
            console.log(`SnakeAI: 找到目标，距离:${distance.toFixed(1)}，切换到移动状态`);
        } else {
            this.currentState = AIState.EXPLORING;
            console.log("SnakeAI: 未找到目标，切换到探索状态");
        }
        
        // 更新上下文并继续执行
        context.currentTarget = this.currentTarget;
        this.executeMovement(context);
    }
    
    /**
     * 处理移动到目标状态
     */
    private handleMovingToTarget(context: DecisionContext) {
        console.log(`SnakeAI: 执行移动到目标逻辑，目标距离: ${context.currentTarget ? Vec3.distance(context.snakePosition, context.currentTarget.position).toFixed(1) : 'N/A'}`);
        
        this.executeMovement(context);
    }
    
    /**
     * 处理探索状态
     */
    private handleExploring(context: DecisionContext) {
        console.log("SnakeAI: 执行探索逻辑");
        
        this.executeMovement(context);
    }
    
    /**
     * 处理卡死状态
     */
    private handleStuck(context: DecisionContext) {
        console.log("SnakeAI: 处理卡死状态，执行恢复逻辑");
        
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
        
        // console.log(`SnakeAI: 路径规划结果 - 方向: ${this.directionToString(pathPlan.direction)}, 安全: ${pathPlan.isSafe}, 原因: ${pathPlan.reason}`);
        
        // 执行移动
        if (this.movementController) {
            const success = this.movementController.executeMovement(pathPlan.direction, context);
            if (success) {
                this.lastDirection = pathPlan.direction;
            }
        }
    }
    
    /**
     * 检查手牌是否已满
     */
    private isHandCardsFull(): boolean {
        const currentHandCount = this.gameManager.getHandCardsCount();
        const maxHandCount = this.gameManager.getMaxHandCards();
        
        if (currentHandCount >= maxHandCount) {
            console.log(`SnakeAI: 已吃满${maxHandCount}张牌，但继续探索（可通过弃牌AI管理手牌）`);
            return true;
        }
        
        console.log(`SnakeAI: 当前手牌: ${currentHandCount}/${maxHandCount}`);
        return false;
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
    
    /**
     * 方向转字符串
     */
    private directionToString(direction: Direction): string {
        switch (direction) {
            case Direction.UP: return "上";
            case Direction.DOWN: return "下";
            case Direction.LEFT: return "左";
            case Direction.RIGHT: return "右";
            default: return "未知";
        }
    }
    
    // === 公共接口方法 ===
    
    /**
     * 设置AI参数
     */
    public setDecisionInterval(interval: number) {
        // 🔥 多角色AI模式
        if (this.useMultiAI && this.aiCharacter instanceof AICharacter) {
            this.aiCharacter.setDecisionInterval(interval);
            console.log(`SnakeAI: 多角色AI决策间隔设置为: ${interval}秒 (角色ID: ${this.characterId})`);
            return;
        }
        
        // 传统单角色AI模式
        this.config.decisionInterval = Math.max(0.1, interval);
        this.decisionInterval = this.config.decisionInterval;
        console.log(`SnakeAI: AI决策间隔设置为: ${this.config.decisionInterval}秒`);
    }
    
    public setSearchRadius(radius: number) {
        // 🔥 多角色AI模式
        if (this.useMultiAI && this.aiCharacter instanceof AICharacter) {
            this.aiCharacter.setSearchRadius(radius);
            console.log(`SnakeAI: 多角色AI搜索半径设置为: ${radius}像素 (角色ID: ${this.characterId})`);
            return;
        }
        
        // 传统单角色AI模式
        this.config.searchRadius = Math.max(100, radius);
        this.searchRadius = this.config.searchRadius;
        console.log(`SnakeAI: AI搜索半径设置为: ${this.config.searchRadius}像素`);
    }
    
    public setSpeedMultiplier(multiplier: number) {
        // 🔥 多角色AI模式
        if (this.useMultiAI && this.aiCharacter instanceof AICharacter) {
            this.aiCharacter.setSpeedMultiplier(multiplier);
            console.log(`SnakeAI: 多角色AI速度倍数设置为: ${multiplier} (角色ID: ${this.characterId})`);
            return;
        }
        
        // 传统单角色AI模式
        this.config.speedMultiplier = Math.max(0.5, Math.min(3.0, multiplier));
        this.speedMultiplier = this.config.speedMultiplier;
        console.log(`SnakeAI: AI速度倍数设置为: ${this.config.speedMultiplier}`);
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
     * 获取AI状态信息
     */
    public isAIEnabled(): boolean {
        // 🔥 多角色AI模式
        if (this.useMultiAI && this.aiCharacter) {
            return this.aiCharacter.isEnabled();
        }
        
        // 传统单角色AI模式
        return this.enableAI;
    }
    
    public getCurrentTarget(): Node | null {
        // 🔥 多角色AI模式
        if (this.useMultiAI && this.aiCharacter) {
            return this.aiCharacter.getCurrentTarget();
        }
        
        // 传统单角色AI模式
        return this.currentTarget;
    }
    
    public getCurrentState(): AIState {
        // 🔥 多角色AI模式
        if (this.useMultiAI && this.aiCharacter) {
            return this.aiCharacter.getCurrentState();
        }
        
        // 传统单角色AI模式
        return this.currentState;
    }
    
    public getAIConfig(): AIConfig {
        // 🔥 多角色AI模式
        if (this.useMultiAI && this.aiCharacter) {
            return this.aiCharacter.getConfig().aiConfig;
        }
        
        // 传统单角色AI模式
        return { ...this.config };
    }
    
    /**
     * 获取AI统计信息
     */
    public getAIStats(): {
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
    
    // === 🔥 多角色AI系统扩展方法 ===
    
    /**
     * 获取角色ID（多角色AI模式）
     */
    public getCharacterId(): string {
        return this.characterId;
    }
    
    /**
     * 获取多角色AI管理器
     */
    public getMultiAIManager(): MultiAIManager | null {
        return this.multiAIManager;
    }
    
    /**
     * 获取AI角色实例
     */
    public getAICharacter(): IAICharacter | null {
        return this.aiCharacter;
    }
    
    /**
     * 切换AI模式
     */
    public switchAIMode(useMultiAI: boolean) {
        if (this.useMultiAI === useMultiAI) {
            return; // 模式已经是目标模式
        }
        
        const wasEnabled = this.enableAI;
        
        // 停止当前AI
        if (wasEnabled) {
            this.stopAI();
        }
        
        // 切换模式
        this.useMultiAI = useMultiAI;
        
        // 清理旧的AI系统
        if (useMultiAI) {
            // 从传统AI切换到多角色AI
            this.cleanupTraditionalAI();
            this.initializeMultiAI();
        } else {
            // 从多角色AI切换到传统AI
            this.cleanupMultiAI();
            this.initializeAIModules();
        }
        
        // 如果之前是启用状态，重新启动AI
        if (wasEnabled) {
            this.startAI();
        }
        
        console.log(`SnakeAI: 已切换到${useMultiAI ? '多角色AI' : '传统AI'}模式`);
    }
    
    /**
     * 清理传统AI系统
     */
    private cleanupTraditionalAI() {
        if (this.targetSelector) {
            this.targetSelector.destroy();
            this.targetSelector = null!;
        }
        
        if (this.pathFinder) {
            this.pathFinder.destroy();
            this.pathFinder = null!;
        }
        
        if (this.movementController) {
            this.movementController.destroy();
            this.movementController = null!;
        }
        
        if (this.autoDiscardAI) {
            this.autoDiscardAI.destroy();
            this.autoDiscardAI = null!;
        }
        
        console.log("SnakeAI: 传统AI系统已清理");
    }
    
    /**
     * 清理多角色AI系统
     */
    private cleanupMultiAI() {
        if (this.multiAIManager && this.characterId) {
            this.multiAIManager.removeCharacter(this.characterId);
        }
        
        this.multiAIManager = null;
        this.aiCharacter = null;
        this.characterId = "";
        
        console.log("SnakeAI: 多角色AI系统已清理");
    }
    
    /**
     * 设置角色协作模式（多角色AI模式专用）
     */
    public setCooperationMode(enabled: boolean) {
        if (this.useMultiAI && this.aiCharacter instanceof AICharacter) {
            this.aiCharacter.setCooperationMode(enabled);
            console.log(`SnakeAI: 角色协作模式设置为: ${enabled ? '开启' : '关闭'} (角色ID: ${this.characterId})`);
        } else {
            console.warn("SnakeAI: 协作模式仅在多角色AI模式下可用");
        }
    }
    
    /**
     * 设置角色避让模式（多角色AI模式专用）
     */
    public setAvoidOtherCharacters(enabled: boolean) {
        if (this.useMultiAI && this.aiCharacter instanceof AICharacter) {
            this.aiCharacter.setAvoidOtherCharacters(enabled);
            console.log(`SnakeAI: 角色避让模式设置为: ${enabled ? '开启' : '关闭'} (角色ID: ${this.characterId})`);
        } else {
            console.warn("SnakeAI: 避让模式仅在多角色AI模式下可用");
        }
    }
    
    /**
     * 组件销毁时清理
     */
    onDestroy() {
        if (this.useMultiAI) {
            this.cleanupMultiAI();
        } else {
            this.cleanupTraditionalAI();
        }
        
        console.log("SnakeAI: 组件已销毁");
    }
} 