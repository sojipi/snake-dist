import { _decorator, Component, Node, Prefab, instantiate, input, Input, EventKeyboard, KeyCode, UITransform, find, Button, Label } from 'cc';
import { HandCardManager } from './HandCardManager';
import { IGameManager } from './interfaces/IGameManager';
import { ITargetProvider } from './interfaces/ITargetProvider';
import { SnakeController } from './SnakeController';
import { BoundaryManager } from './BoundaryManager';
import { DirectionButtonController } from './DirectionButtonController';
import { CameraController } from './CameraController';
import { GameOverDialog } from './GameOverDialog';
import { UILayoutManager } from './UILayoutManager';
import { TileSpawner } from './TileSpawner';
import { TestModeManager } from './TestModeManager';
import { MahjongTile } from './MahjongTile';
import { LevelDataManager } from './LevelDataManager';
import { MAHJONG_LEVEL_DATA } from './data/LevelData';
import YakuFactory from './mahjong/yaku/YakuFactory';
import Chess from './game/Chess';
import { SnakeAI } from './ai/SnakeAI';
import { MultiAIManager } from './ai/MultiAIManager';
import { LevelInfoDialog } from './LevelInfoDialog';
import { AudioManager } from './AudioManager';
import { AudioSettingsUI } from './AudioSettingsUI';
import { TutorialManager } from './TutorialManager';
import { WechatShareManager } from './WechatShareManager';
import { RankListManager } from './RankListManager';


// 微信广告类型定义
interface CustomAd {
    show(): Promise<void>;
    hide(): Promise<void>;
    isShow(): boolean;
    destroy(): void;
    onClose(listener: Function): void;
    offClose(listener: Function): void;
    onHide(listener: Function): void;
    offHide(listener: Function): void;
    onLoad(listener: Function): void;
    offLoad(listener: Function): void;
    onResize(listener: Function): void;
    offResize(listener: Function): void;
    onError(listener: Function): void;
    offError(listener: Function): void;
    style: {
        left: number;
        top: number;
        width: number;
        fixed?: boolean;
    };
}

const { ccclass, property } = _decorator;

export enum GameState {
    PLAYING,
    PAUSED,
    GAME_OVER
}

@ccclass('GameManager')
export class GameManager extends Component implements IGameManager, ITargetProvider {
    @property(Prefab)
    mahjongTilePrefab: Prefab = null!;
    
    @property(Node)
    canvas: Node = null!;
    
    @property(HandCardManager)
    handCardManager: HandCardManager = null!;
    
    @property(SnakeController)
    snakeController: SnakeController | null = null;
    
    @property(BoundaryManager)
    boundaryManager: BoundaryManager = null!;
    
    @property(DirectionButtonController)
    directionController: DirectionButtonController = null!;
    
    @property(CameraController)
    cameraController: CameraController | null = null;
    
    @property({ tooltip: "开启测试模式，游戏开始时自动生成10张测试麻将牌到蛇身和手牌" })
    enableTestMode: boolean = false;
    
    @property(Prefab)
    gameOverDialogPrefab: Prefab = null!;
    
    @property(Prefab)
    levelInfoDialogPrefab: Prefab = null!;

    @property(Prefab)
    settingsPanelPrefab: Prefab = null!;

    @property(Button)
    levelInfoButton: Button = null!;

    @property(Button)
    settingsButton: Button = null!;

    @property({ tooltip: "开启AI自动控制贪食蛇" })
    enableSnakeAI: boolean = false;
    
    @property({ tooltip: "开启AI自动弃牌" })
    enableDiscardAI: boolean = false;
    
    // 管理器组件
    private uiLayoutManager: UILayoutManager = null!;
    private tileSpawner: TileSpawner = null!;
    private testModeManager: TestModeManager = null!;
    private levelDataManager: LevelDataManager = null!;
    private snakeAI: SnakeAI = null!;
    private multiAIManager: any = null; // 🔥 添加MultiAIManager引用
    
    // 游戏状态
    private static instance: GameManager = null!;
    private gameState: GameState = GameState.PLAYING;
    private gameOverDialog: GameOverDialog = null!;
    private levelInfoDialog: LevelInfoDialog = null!;
    private settingsPanel: AudioSettingsUI = null!;
    private tutorialManager: TutorialManager = null!;
    private handCards: string[] = [];
    private readonly maxHandCards: number = 14;
    
    // 🔥 新增：弃牌历史记录
    private discardHistory: string[] = [];
    
    // 🔥 新增：统一弃牌区管理
    private discardArea: { tileType: string, characterId: string }[] = [];
    
    // 当前关卡配置
    private currentLevelConfig: any = null;
    
    public static getInstance(): GameManager {
        return GameManager.instance;
    }
    
    onLoad() {
        GameManager.instance = this;
        this.initComponents();
        this.setupKeyboardInput();
    }
    
    start() {
        console.log("GameManager.start: 游戏开始");
        
        // 初始化微信原生模板广告
        this.initWechatCustomAd();
        
        // 初始化游戏
        this.initGame();
        this.findDirectionController();
        this.initCameraController();
        this.initAudio();
        
        // 设置HandCardManager的GameManager获取函数，避免循环依赖
        if (this.handCardManager) {
            this.handCardManager.setGameManagerGetter(() => GameManager.getInstance());
        }
    }
    
    update(deltaTime: number) {
        this.uiLayoutManager?.maintainDirectionButtonsPosition();
    }
    
    private initComponents() {
        this.snakeController = this.getComponent(SnakeController)!;
        this.handCardManager = this.getComponent(HandCardManager)!;
        
        // 初始化关卡数据管理器
        this.levelDataManager = LevelDataManager.getInstance();
        this.loadCurrentLevelConfig();
        
        this.setupCanvas();
        this.setupManagers();
        this.initCameraController();
        this.initGameOverDialog();
        this.initLevelInfoDialog();
        this.initLevelInfoButton();
        this.initSettingsPanel();
        this.initSettingsButton();
        this.initTutorialManager();
        this.initWechatShare(); // 初始化微信分享功能
        this.findDirectionController();
        this.initGame();
    }
    
    private loadCurrentLevelConfig() {
        const currentLevelId = this.levelDataManager.getCurrentLevel();
        if (currentLevelId > 0 && currentLevelId <= MAHJONG_LEVEL_DATA.length) {
            this.currentLevelConfig = MAHJONG_LEVEL_DATA[currentLevelId - 1];
            console.log(`加载关卡配置: ${this.currentLevelConfig.name} - ${this.currentLevelConfig.description}`);
        } else {
            // 默认使用第一关配置
            this.currentLevelConfig = MAHJONG_LEVEL_DATA[0];
            console.log("使用默认关卡配置:", this.currentLevelConfig.name);
        }
    }
    
    // 获取当前关卡配置
    public getCurrentLevelConfig() {
        return this.currentLevelConfig;
    }

    // 获取当前关卡ID
    public getCurrentLevel(): number {
        return this.levelDataManager.getCurrentLevel();
    }

    // 获取当前关卡的目标役种
    public getCurrentTargetYaku() {
        return this.currentLevelConfig?.targetYaku || null;
    }
    
    // 检查是否完成当前关卡
    public checkLevelCompletion(): boolean {
        if (!this.currentLevelConfig) {
            return false;
        }
        
        // 检查手牌是否满额（14张）
        const isHandFull = this.handCards.length >= this.maxHandCards;
        
        if (isHandFull) {
            // 将手牌字符串转换为Chess对象数组
            const chessArray = this.convertHandCardsToChess();
            
            // 使用YakuFactory检查是否能胡出目标牌型
            const yakuFactory = YakuFactory.getInstance();
            const targetYaku = this.currentLevelConfig.targetYaku;
            const canWin = yakuFactory.checkYaku(targetYaku, chessArray);
            
            console.log(`检查玩家关卡完成条件:`);
            console.log(`- 目标役种: ${targetYaku}`);
            console.log(`- 手牌数量: ${this.handCards.length}`);
            console.log(`- 能否胡牌: ${canWin}`);
            
            if (canWin) {
                console.log("玩家胡牌！关卡完成，解锁下一关");
                this.onLevelCompleted();
                return true;
            } else {
                console.log("手牌已满但不满足胡牌条件，需要调整手牌");
                // 可以在这里提示玩家需要调整手牌
            }
        }
        
        return false;
    }
    
    // 将手牌字符串数组转换为Chess对象数组
    private convertHandCardsToChess(): Chess[] {
        return this.handCards.map(tileType => {
            const chess = new Chess();
            // 根据tileType设置Chess对象的属性
            this.setChessFromTileType(chess, tileType);
            return chess;
        });
    }
    
    // 根据麻将牌类型设置Chess对象属性
    private setChessFromTileType(chess: Chess, tileType: string) {
        // 将tileType直接转换为数字并设置到Chess的num属性
        const typeNum = parseInt(tileType);
        
        // 设置麻将牌编号
        chess.num = typeNum;
        chess.id = typeNum;
        
        console.log(`设置麻将牌: tileType=${tileType}, num=${chess.num}`);
    }
    
    // 关卡完成处理
    private onLevelCompleted() {
        console.log(`关卡完成: ${this.currentLevelConfig.name}`);

        // 播放胜利音效
        this.playWinSound();

        // 设置游戏状态为结束
        this.gameState = GameState.GAME_OVER;

        // 暂停所有AI
        if (this.multiAIManager) {
            this.multiAIManager.pauseAllAI();
        }

        // 锁定玩家移动
        this.snakeController?.lockMovement();

        // 计算分数（这里可以根据实际需求调整）
        const score = this.calculateScore();

        // 计算星数（根据分数评级）
        const stars = this.calculateStars(score);

        // 触发教程：玩家胜利
        if (this.tutorialManager) {
            this.tutorialManager.onPlayerWin();
        }

        // 完成关卡
        const currentLevelId = this.levelDataManager.getCurrentLevel();
        this.levelDataManager.completeLevel(currentLevelId, score, stars);

        // 显示完成提示或跳转到结算界面
        this.showLevelCompletedDialog(score);
    }
    
    // 🔥 新增：AI胡牌处理
    public onAIWin(aiCharacterId: string) {
        console.log(`AI角色 ${aiCharacterId} 胡牌，游戏失败`);

        // 播放失败音效
        this.playLoseSound();

        // 设置游戏状态为结束
        this.gameState = GameState.GAME_OVER;
        
        // 暂停所有AI
        if (this.multiAIManager) {
            this.multiAIManager.pauseAllAI();
        }
        
        // 锁定玩家移动
        this.snakeController?.lockMovement();
        
        // 显示失败对话框
        this.showGameFailedDialog(aiCharacterId);
    }
    
    // 🔥 新增：显示游戏失败对话框
    private showGameFailedDialog(aiCharacterId: string) {
        console.log(`游戏失败！AI角色 ${aiCharacterId} 先胡牌了`);
        // 显示失败弹窗，传入false表示失败状态
        if (this.gameOverDialog) {
            this.gameOverDialog.showDialog(false, 0, `AI角色 ${aiCharacterId} 先胡牌了！`);
        } else {
            console.error("游戏结束弹窗未初始化");
        }
    }
    
    // 计算分数
    private calculateScore(): number {
        // 简单的分数计算逻辑
        const baseScore = 1000;
        const handBonus = this.handCards.length * 50;
        return baseScore + handBonus;
    }
    
    // 计算星数
    private calculateStars(score: number): number {
        // 根据分数计算星数（1-3星）
        if (score >= 1600) {
            return 3; // 三星
        } else if (score >= 1300) {
            return 2; // 二星
        } else {
            return 1; // 一星
        }
    }
    
    // 显示关卡完成对话框
    private showLevelCompletedDialog(score: number) {
        console.log(`关卡完成！得分: ${score}`);
        // 显示胜利弹窗，传入true表示胜利状态
        if (this.gameOverDialog) {
            this.gameOverDialog.showDialog(true, score);
        } else {
            console.error("游戏结束弹窗未初始化");
        }
    }
    
    private setupCanvas() {
        if (!this.canvas) {
            this.canvas = this.node.parent || this.node.scene?.getChildByName('Canvas') || null;
        }
        
        if (!this.canvas) {
            console.error("无法找到 Canvas 节点");
            return;
        }
        
        // 确保Canvas有UITransform组件
        let canvasTransform = this.canvas.getComponent(UITransform);
        if (!canvasTransform) {
            canvasTransform = this.canvas.addComponent(UITransform);
            canvasTransform?.setContentSize(1280, 720);
        }
        
        // 初始化边框管理器
        this.boundaryManager = this.addComponent(BoundaryManager);
        this.boundaryManager.canvas = this.canvas;
    }
    
    private setupManagers() {
        // UI布局管理器
        this.uiLayoutManager = this.addComponent(UILayoutManager);
        this.uiLayoutManager.initialize(this.canvas);
        
        // 麻将牌生成器
        this.tileSpawner = this.addComponent(TileSpawner);
        this.tileSpawner.mahjongTilePrefab = this.mahjongTilePrefab;
        this.tileSpawner.initialize(this.canvas, this.boundaryManager);
        
        // 根据关卡配置设置麻将牌数量
        if (this.currentLevelConfig) {
            this.tileSpawner.setMaxTilesOnField(this.currentLevelConfig.pairs);
        }
        
        // 测试模式管理器
        this.testModeManager = this.addComponent(TestModeManager);
        this.testModeManager.mahjongTilePrefab = this.mahjongTilePrefab;
        this.testModeManager.initialize(this.canvas, this.snakeController, this.handCardManager, this.handCards);
        
        // 贪食蛇AI
        this.snakeAI = this.addComponent(SnakeAI);
        if (this.enableSnakeAI) {
            this.snakeAI.startAI();
            console.log("贪食蛇AI已启用");
        }
        
        // 自动弃牌AI
        if (this.enableDiscardAI) {
            this.snakeAI.toggleAutoDiscard();
            console.log("自动弃牌AI已启用");
        }
        
        // 🔥 延迟获取MultiAIManager引用，确保它已经初始化
        this.scheduleOnce(() => {
            this.multiAIManager = MultiAIManager.getInstance();
            console.log(`GameManager: MultiAIManager引用已获取: ${this.multiAIManager ? '成功' : '失败'}`);
        }, 0.1);
    }
    
    private initGame() {
        this.gameState = GameState.PLAYING;
        this.snakeController?.unlockMovement();
        
        // 🔥 初始化麻将牌池
        MahjongTile.initializeTilePool();
        
        // 延迟生成确保边界计算完成
        this.scheduleOnce(() => {
            this.spawnInitialTiles();
            
            if (this.enableTestMode) {
                const totalTiles = this.testModeManager.generateTestTiles();
                if (this.handCards.length >= this.maxHandCards) {
                    this.snakeController?.setSnakeHeadColor(true);
                }
            }
        }, 0.1);
    }
    
    private spawnInitialTiles() {
        const bounds = this.boundaryManager?.getStoredBackgroundBounds();
        if (!bounds || bounds.width === 0) {
            this.scheduleOnce(() => this.spawnInitialTiles(), 0.1);
            return;
        }
        
        this.tileSpawner.spawnInitialTiles();
    }
    
    public spawnMahjongTile() {
        // 🔥 智能牌池管理：检查是否应该生成新牌
        const poolStatus = MahjongTile.getPoolStatus();
        const activeTilesCount = this.tileSpawner.getActiveTilesCount();
        
        console.log(`GameManager.spawnMahjongTile: 牌池状态检查`);
        console.log(`- 剩余牌数: ${poolStatus.remaining}/${poolStatus.total}`);
        console.log(`- 场上牌数: ${activeTilesCount}/${this.tileSpawner.getMaxTilesOnField()}`);
        
        // 检查是否应该生成新牌
        if (!this.shouldSpawnNewTile(poolStatus, activeTilesCount)) {
            console.log(`GameManager.spawnMahjongTile: 条件不满足，跳过生成新牌`);
            return null;
        }
        
        // 🔥 增强调试信息
        console.log(`GameManager: 尝试生成麻将牌，当前场上牌数: ${activeTilesCount}, 最大数量: ${this.tileSpawner.getMaxTilesOnField()}`);
        
        const newTile = this.tileSpawner.spawnMahjongTile();
        if (newTile) {
            console.log(`GameManager: 成功生成麻将牌，位置: (${newTile.position.x.toFixed(1)}, ${newTile.position.y.toFixed(1)})`);
        } else {
            console.log("GameManager: 无法生成麻将牌，可能已达到最大数量");
        }
        
        return newTile;
    }
    
    public addHandCard(tileType: string): boolean {
        if (this.handCards.length >= this.maxHandCards) {
            return false;
        }

        const success = this.handCardManager.addHandCard(tileType);

        if (success) {
            this.handCards.push(tileType);

            // 触发教程：吃牌
            if (this.tutorialManager) {
                this.tutorialManager.onTileEaten();
            }

            if (this.handCards.length >= this.maxHandCards) {
                this.snakeController?.setSnakeHeadColor(true);

                // 触发教程：收集14张牌
                if (this.tutorialManager) {
                    this.tutorialManager.onHandCardsFull();
                }

                // 检查是否完成关卡
                this.checkLevelCompletion();
            }
        }

        return success;
    }
    
    public discardCard(index: number): boolean {
        if (this.handCards.length < this.maxHandCards || index < 0 || index >= this.handCards.length) {
            console.log(`GameManager.discardCard: 弃牌条件不满足 - 手牌数:${this.handCards.length}, 最大:${this.maxHandCards}, 索引:${index}`);
            return false;
        }
        
        console.log(`GameManager.discardCard: 开始处理弃牌，索引:${index}, 牌型:${this.handCards[index]}`);
        
        // 🔥 修复：先保存要弃掉的牌型，然后再移除数据
        const discardedCard = this.handCards[index];
        
        // 从手牌数据中移除
        this.handCards.splice(index, 1);
        
        // 🔥 修复：通知HandCardManager更新UI
        if (this.handCardManager) {
            console.log(`GameManager.discardCard: 通知HandCardManager移除UI节点`);
            this.handCardManager.removeHandCardAtIndex(index);
        }
        
        console.log(`GameManager.discardCard: 数据已移除，当前手牌数:${this.handCards.length}`);
        
        // 🔥 修复：处理弃牌后续逻辑，包括蛇身移除
        this.onCardDiscarded(discardedCard);
        
        console.log(`GameManager.discardCard: 弃牌完成`);
        return true;
    }
    
    /**
     * 🔥 新增：通过牌型弃牌（供AI使用）
     */
    public discardCardByType(tileType: string): boolean {
        if (this.handCards.length < this.maxHandCards) {
            console.log(`GameManager.discardCardByType: 弃牌条件不满足 - 手牌数:${this.handCards.length}, 最大:${this.maxHandCards}`);
            return false;
        }
        
        console.log(`GameManager.discardCardByType: 寻找要弃掉的牌型 "${tileType}"`);
        console.log(`GameManager.discardCardByType: 当前手牌:`, this.handCards);
        
        // 🔥 在手牌数据中查找第一个匹配的牌型
        const dataIndex = this.handCards.findIndex(cardType => cardType === tileType);
        
        if (dataIndex === -1) {
            console.warn(`GameManager.discardCardByType: ❌ 未找到要弃掉的牌型 "${tileType}"`);
            console.warn(`GameManager.discardCardByType: 当前手牌中的牌型:`, this.handCards.map((card, i) => `${i}:${card}`).join(', '));
            return false;
        }
        
        console.log(`GameManager.discardCardByType: ✅ 找到牌型 "${tileType}" 在数据索引 ${dataIndex}`);
        
        // 🔥 修复：直接从数据中移除，然后通知HandCardManager按牌型移除
        const discardedCard = this.handCards.splice(dataIndex, 1)[0];
        console.log(`GameManager.discardCardByType: 从手牌数据中移除了 "${discardedCard}"`);
        
        // 通知HandCardManager按牌型移除UI节点
        if (this.handCardManager) {
            console.log(`GameManager.discardCardByType: 通知HandCardManager按牌型移除UI节点`);
            const uiRemoved = this.handCardManager.removeHandCardByType(tileType);
            if (!uiRemoved) {
                console.error(`GameManager.discardCardByType: HandCardManager无法移除牌型 "${tileType}"`);
                // 回滚数据变更
                this.handCards.splice(dataIndex, 0, discardedCard);
                return false;
            }
        }
        
        console.log(`GameManager.discardCardByType: 数据已移除，当前手牌数:${this.handCards.length}`);
        
        // 处理弃牌后续逻辑
        this.onCardDiscarded(discardedCard);
        
        console.log(`GameManager.discardCardByType: 弃牌完成`);
        return true;
    }
    
    private onCardDiscarded(discardedTileType: string) {
        console.log(`GameManager.onCardDiscarded: 开始处理弃牌后续逻辑，弃掉的牌型: "${discardedTileType}"`);
        console.log(`GameManager.onCardDiscarded: 牌型类型: ${typeof discardedTileType}, 长度: ${discardedTileType.length}`);
        console.log(`GameManager.onCardDiscarded: 当前手牌数量: ${this.handCards.length}/${this.maxHandCards}`);
        
        // 🔥 新增：记录弃牌历史
        this.discardHistory.push(discardedTileType);
        console.log(`GameManager.onCardDiscarded: 弃牌已记录到历史，当前历史数量: ${this.discardHistory.length}`);
        
        // 🔥 新增：添加到统一弃牌区（玩家角色）
        this.addToDiscardArea(discardedTileType, 'player');

        // 触发教程：弃牌
        if (this.tutorialManager) {
            this.tutorialManager.onCardDiscarded();
        }
        
        // 🔥 增强调试：先检查蛇身有哪些牌型
        if (this.snakeController) {
            console.log("GameManager.onCardDiscarded: 当前蛇身状态检查:");
            const snakeBody = (this.snakeController as any).snakeBody || [];
            console.log(`蛇身节点数量: ${snakeBody.length}`);
            
            for (let i = 0; i < snakeBody.length; i++) {
                const bodyNode = snakeBody[i];
                if (bodyNode && bodyNode.isValid) {
                    const mahjongTile = bodyNode.getComponent(MahjongTile);
                    if (mahjongTile) {
                        const bodyTileType = mahjongTile.getTileType();
                        console.log(`  蛇身节点${i}: 牌型="${bodyTileType}" (类型: ${typeof bodyTileType}, 长度: ${bodyTileType.length})`);
                        console.log(`  比较结果: "${bodyTileType}" === "${discardedTileType}" ? ${bodyTileType === discardedTileType}`);
                    } else {
                        console.log(`  蛇身节点${i}: 没有MahjongTile组件`);
                    }
                } else {
                    console.log(`  蛇身节点${i}: 节点无效或已销毁`);
                }
            }
        }
        
        // 尝试移除蛇身节点
        const removed = this.snakeController?.removeSnakeBodyByTileType(discardedTileType);
        console.log(`GameManager.onCardDiscarded: 蛇身移除结果: ${removed}`);
        
        if (removed) {
            console.log("GameManager.onCardDiscarded: 蛇身移除成功");
        } else {
            console.warn(`GameManager.onCardDiscarded: 蛇身移除失败，未找到匹配的牌型 "${discardedTileType}"`);
        }
        
        // 🔥 修复：无论蛇身移除是否成功，只要弃牌成功就重置蛇头颜色
        // 因为手牌数量已经减少，蛇头应该能继续吃牌
        if (this.handCards.length < this.maxHandCards) {
            this.snakeController?.setSnakeHeadColor(false);
            console.log("GameManager.onCardDiscarded: 手牌未满，蛇头颜色已重置为可吃状态");
        } else {
            console.log("GameManager.onCardDiscarded: 手牌仍然满额，蛇头保持不可吃状态");
        }
    }
    
    public canEatTile(): boolean {
        return this.handCardManager.getCardCount() < this.maxHandCards && this.gameState === GameState.PLAYING;
    }
    
    public getHandCardsCount(): number {
        return this.handCardManager.getCardCount();
    }
    
    public getMaxHandCards(): number {
        return this.maxHandCards;
    }
    
    public getGameState(): GameState {
        return this.gameState;
    }
    
    public setGameState(state: GameState) {
        this.gameState = state;
    }
    
    /**
     * 🔥 智能牌池管理：重新生成麻将牌
     * 当剩余牌数不足以维持游戏时，停止生成新牌
     * 当场上所有牌都被吃完时，游戏结束
     */
    public respawnMahjongTile() {
        // 检查牌池状态
        const poolStatus = MahjongTile.getPoolStatus();
        const activeTilesCount = this.tileSpawner.getActiveTilesCount();
        
        console.log(`GameManager.respawnMahjongTile: 牌池状态检查`);
        console.log(`- 剩余牌数: ${poolStatus.remaining}/${poolStatus.total}`);
        console.log(`- 场上牌数: ${activeTilesCount}/${this.tileSpawner.getMaxTilesOnField()}`);
        
        // 🔥 判断是否应该生成新牌
        if (this.shouldSpawnNewTile(poolStatus, activeTilesCount)) {
            const newTile = this.spawnMahjongTile();
            if (newTile) {
                console.log(`GameManager.respawnMahjongTile: 成功生成新牌`);
            } else {
                console.log(`GameManager.respawnMahjongTile: 无法生成新牌，可能已达到场上最大数量`);
            }
        } else {
            console.log(`GameManager.respawnMahjongTile: 跳过生成新牌`);
        }
        
        // 🔥 检查游戏结束条件
        this.checkGameEndCondition(poolStatus, activeTilesCount);
    }
    
    /**
     * 🔥 判断是否应该生成新牌
     */
    private shouldSpawnNewTile(poolStatus: any, activeTilesCount: number): boolean {
        // 如果牌池已空，不再生成新牌
        if (poolStatus.remaining <= 0) {
            console.log(`GameManager.shouldSpawnNewTile: 牌池已空，停止生成新牌`);
            return false;
        }
        
        // 如果场上牌数已达到最大数量，不再生成新牌
        if (activeTilesCount >= this.tileSpawner.getMaxTilesOnField()) {
            console.log(`GameManager.shouldSpawnNewTile: 场上牌数已满，停止生成新牌`);
            return false;
        }
        
        // 🔥 智能判断：当剩余牌数 <= 场上牌数时，停止生成新牌
        // 这样可以确保游戏结束时场上还有牌可吃
        if (poolStatus.remaining <= activeTilesCount) {
            console.log(`GameManager.shouldSpawnNewTile: 剩余牌数(${poolStatus.remaining}) <= 场上牌数(${activeTilesCount})，停止生成新牌`);
            return false;
        }
        
        console.log(`GameManager.shouldSpawnNewTile: 条件满足，可以生成新牌`);
        return true;
    }
    
    /**
     * 🔥 检查游戏结束条件
     */
    private checkGameEndCondition(poolStatus: any, activeTilesCount: number): void {
        // 当牌池已空且场上没有牌时，游戏结束
        if (poolStatus.remaining <= 0 && activeTilesCount <= 0) {
            console.log(`GameManager.checkGameEndCondition: 牌池已空且场上无牌，游戏结束！`);
            this.gameOver("牌池已空，游戏结束！");
            return;
        }

        // 当牌池即将耗尽且场上牌数很少时，给出警告
        if (poolStatus.remaining <= 5 && activeTilesCount <= 3) {
            console.warn(`GameManager.checkGameEndCondition: 牌池即将耗尽！剩余牌数: ${poolStatus.remaining}, 场上牌数: ${activeTilesCount}`);
        }
    }
    
    public getGameAreaBounds() {
        return this.boundaryManager?.getGameAreaBounds() || { minX: -400, maxX: 400, minY: -300, maxY: 300 };
    }
    
    public pauseGame() {
        if (this.gameState === GameState.PLAYING) {
            this.gameState = GameState.PAUSED;
            if (this.snakeController) {
                this.snakeController.lockMovement();
            }

            // 🔥 显示广告
            this.showWechatCustomAd();

            // 🔥 通知MultiAIManager暂停所有AI角色
            if (this.multiAIManager) {
                this.multiAIManager.pauseAllAI();
            }
        }
    }
    
    public resumeGame() {
        if (this.gameState === GameState.PAUSED) {
            this.gameState = GameState.PLAYING;
            if (this.snakeController) {
                this.snakeController.unlockMovement();
            }

            // 🔥 隐藏广告
            this.hideWechatCustomAd();

            // 🔥 通知MultiAIManager恢复所有AI角色
            if (this.multiAIManager) {
                this.multiAIManager.resumeAllAI();
            }
        }
    }
    
    public gameOver(failureReason?: string) {
        if (this.gameState === GameState.GAME_OVER) {
            return;
        }

        // 播放失败音效
        this.playLoseSound();

        this.gameState = GameState.GAME_OVER;
        if (this.snakeController) {
            this.snakeController.lockMovement();
            this.snakeController.stopSnakeAnimation();
        }
        this.showGameOverScreen(failureReason);
    }
    
    private showGameOverScreen(failureReason?: string) {
        if (this.gameOverDialog) {
            this.gameOverDialog.showDialog(false, 0, failureReason);
        } else {
            console.error("游戏结束弹窗未初始化");
        }
    }
    
    public restartGame() {
        this.gameState = GameState.PLAYING;
        
        // 清理所有麻将牌
        this.tileSpawner.clearAllTiles();
        
        // 🔥 重新初始化麻将牌池
        MahjongTile.initializeTilePool();
        
        // 重置蛇和手牌
        if (this.snakeController) {
            this.snakeController.resetSnake();
            this.snakeController.unlockMovement();
            this.snakeController.playSnakeAnimation();
        }
        
        this.handCards = [];
        this.handCardManager.clearAllCards();
        
        // 🔥 新增：清空弃牌历史和弃牌区
        this.clearDiscardHistory();
        this.clearDiscardArea();
        
        // 重新生成麻将牌
        this.spawnInitialTiles();
    }
    
    public removeTile(tile: Node) {
        this.tileSpawner.removeTile(tile);
    }
    
    public getActiveTiles(): Node[] {
        return this.tileSpawner.getActiveTiles();
    }
    
    /**
     * 🔥 新增：确保场上有足够的麻将牌
     */
    public ensureMinimumTiles(minTiles: number = 5): number {
        if (!this.tileSpawner) {
            console.log("GameManager: TileSpawner未初始化，无法确保最小麻将牌数量");
            return 0;
        }
        
        return this.tileSpawner.ensureMinimumTiles(minTiles);
    }
    
    private setupKeyboardInput() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }
    
    private onKeyDown(event: EventKeyboard) {
        if (event.keyCode === KeyCode.KEY_R && this.gameState === GameState.GAME_OVER) {
            this.restartGame();
        }
        
        // AI控制快捷键
        if (event.keyCode === KeyCode.KEY_L) {
            this.toggleSnakeAI();
        }
        
        // 测试模式快捷键
        if (event.keyCode === KeyCode.KEY_T) {
            this.toggleTestMode();
        }
        
        // 弃牌AI快捷键
        if (event.keyCode === KeyCode.KEY_P) {
            this.toggleDiscardAI();
        }
        
        // 手动弃牌快捷键
        if (event.keyCode === KeyCode.KEY_F) {
            this.triggerManualDiscard();
        }
        
        // 🔥 新增：关卡信息弹窗快捷键
        if (event.keyCode === KeyCode.KEY_I) {
            this.showLevelInfoDialog();
        }

        // 🔥 新增：设置面板快捷键
        if (event.keyCode === KeyCode.ESCAPE) {
            this.toggleSettingsPanel();
        }
    }
    
    // 切换AI控制
    private toggleSnakeAI() {
        if (!this.snakeAI) {
            console.log("SnakeAI组件未初始化");
            return;
        }
        
        if (this.snakeAI.isAIEnabled()) {
            this.snakeAI.stopAI();
            console.log("贪食蛇AI已关闭 - 可以手动控制");
        } else {
            this.snakeAI.startAI();
            console.log("贪食蛇AI已开启 - 自动寻找麻将牌");
        }
    }
    
    // 切换测试模式
    private toggleTestMode() {
        this.enableTestMode = !this.enableTestMode;
        console.log(`测试模式: ${this.enableTestMode ? '开启' : '关闭'}`);
        
        if (this.enableTestMode) {
            this.testModeManager.generateTestTiles();
        }
    }
    
    // 切换弃牌AI
    private toggleDiscardAI() {
        if (!this.snakeAI) {
            console.log("SnakeAI组件未初始化");
            return;
        }
        
        const isEnabled = this.snakeAI.toggleAutoDiscard();
        
        // 同步更新编辑器配置
        this.enableDiscardAI = isEnabled;
        
        console.log(`弃牌AI: ${isEnabled ? '开启' : '关闭'} - ${isEnabled ? '将自动分析并弃牌' : '停止自动弃牌'}`);
    }
    
    // 手动触发弃牌决策
    private triggerManualDiscard() {
        if (!this.snakeAI) {
            console.log("SnakeAI组件未初始化");
            return;
        }
        
        const decision = this.snakeAI.triggerManualDiscard();
        if (decision) {
            console.log("手动弃牌决策已触发，查看控制台输出");
        } else {
            console.log("无法触发弃牌决策，可能正在思考中或没有手牌");
        }
    }
    
    // 获取SnakeAI组件（供外部调用）
    public getSnakeAI(): SnakeAI | null {
        return this.snakeAI;
    }

    // 获取TutorialManager组件（供外部调用）
    public getTutorialManager(): TutorialManager | null {
        return this.tutorialManager;
    }

    // 实现ITargetProvider接口
    public getAllTileNodes(): Node[] {
        return this.getActiveTiles() || [];
    }

    public getPlayerSnakeHead(): Node | null {
        return this.snakeController?.snakeHead || null;
    }

    public getAllAICharacters(): Node[] {
        return this.multiAIManager?.getAllAICharacters() || [];
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        
        // 场景销毁时销毁广告
        if (this.wechatCustomAd) {
            this.wechatCustomAd.destroy();
            this.wechatCustomAd = null;
        }
    }
    
    private findDirectionController() {
        if (!this.directionController) {
            const directionNode = this.findNodeByName(this.canvas, 'DirectionButtons');
            if (directionNode) {
                this.directionController = directionNode.getComponent(DirectionButtonController);
                if (this.directionController) {
                    this.directionController.snakeController = this.snakeController;
                }
            }
        }
    }
    
    private findNodeByName(parent: Node, name: string): Node | null {
        if (parent.name === name) {
            return parent;
        }
        
        for (const child of parent.children) {
            const found = this.findNodeByName(child, name);
            if (found) {
                return found;
            }
        }
        
        return null;
    }
    
    private initCameraController() {
        if (!this.cameraController) {
            const cameraNode = this.node.scene.getChildByName('Main Camera');
            if (cameraNode) {
                this.cameraController = cameraNode.getComponent(CameraController) || cameraNode.addComponent(CameraController);
            }
        }
        
        if (this.cameraController && this.snakeController) {
            const snakeHead = (this.snakeController as any).snakeHead;
            if (snakeHead) {
                this.cameraController.setTarget(snakeHead);
            }

            // 设置相机边界
            const backgroundBounds = this.boundaryManager?.getStoredBackgroundBounds();
            if (backgroundBounds && backgroundBounds.width > 0) {
                const margin = 200;
                const halfWidth = backgroundBounds.width / 2 - margin;
                const halfHeight = backgroundBounds.height / 2 - margin;
                this.cameraController.setFollowBounds(-halfWidth, halfWidth, -halfHeight, halfHeight);
            }
        }
    }
    
    private initGameOverDialog() {
        if (!this.gameOverDialogPrefab || !this.canvas) {
            return;
        }
        
        const gameOverDialogNode = instantiate(this.gameOverDialogPrefab);
        gameOverDialogNode.setParent(this.canvas);
        gameOverDialogNode.layer = 524288;
        
        this.gameOverDialog = gameOverDialogNode.getComponent(GameOverDialog);
    }
    
    // 🔥 新增：获取弃牌历史
    public getDiscardHistory(): string[] {
        return [...this.discardHistory]; // 返回副本，避免外部修改
    }
    
    // 🔥 新增：清空弃牌历史
    public clearDiscardHistory(): void {
        this.discardHistory = [];
        console.log("弃牌历史已清空");
    }
    
    // 🔥 新增：显示关卡信息弹窗
    public showLevelInfoDialog(): void {
        if (this.levelInfoDialog) {
            this.levelInfoDialog.showDialog();
        } else {
            console.error("关卡信息弹窗未初始化");
        }
    }
    
    private initLevelInfoDialog() {
        if (!this.levelInfoDialogPrefab || !this.canvas) {
            return;
        }
        
        const levelInfoDialogNode = instantiate(this.levelInfoDialogPrefab);
        levelInfoDialogNode.setParent(this.canvas);
        levelInfoDialogNode.layer = 524288;
        
        this.levelInfoDialog = levelInfoDialogNode.getComponent(LevelInfoDialog);
    }
    
    private initLevelInfoButton() {
        if (!this.levelInfoButton) {
            console.error("关卡信息按钮未设置");
            return;
        }
        
        // 绑定按钮点击事件
        this.levelInfoButton.node.on(Button.EventType.CLICK, this.onLevelInfoButtonClicked, this);
        console.log("关卡信息按钮初始化成功");
    }
    
    private onLevelInfoButtonClicked() {
        this.showLevelInfoDialog();
    }

    // 🔥 新增：设置面板相关方法
    private initSettingsPanel() {
        console.log("GameScene: 开始初始化设置面板");
        console.log("GameScene: settingsPanelPrefab =", this.settingsPanelPrefab);
        console.log("GameScene: canvas =", this.canvas);

        if (!this.settingsPanelPrefab) {
            console.error("GameScene: 设置面板预制体未设置，请在编辑器中配置 settingsPanelPrefab");
            return;
        }

        if (!this.canvas) {
            console.error("GameScene: Canvas未设置");
            return;
        }

        console.log("GameScene: 开始实例化预制体");

        try {
            // 实例化设置面板预制体
            const settingsPanelNode = instantiate(this.settingsPanelPrefab);
            settingsPanelNode.setParent(this.canvas);
            settingsPanelNode.layer = 524288; // UI层

            console.log("GameScene: 预制体实例化完成，查找AudioSettingsUI组件");
            console.log("GameScene: 根节点组件列表:", settingsPanelNode.components.map(comp => comp.constructor.name));

            // 从根节点获取AudioSettingsUI组件（这是实际的设置面板脚本）
            this.settingsPanel = settingsPanelNode.getComponent(AudioSettingsUI);

            if (this.settingsPanel) {
                console.log("GameScene: 在根节点找到AudioSettingsUI组件");
                // 默认隐藏设置面板
                this.settingsPanel.hidePanel();
            } else {
                console.log("GameScene: 根节点未找到AudioSettingsUI组件");
                console.log("GameScene: 根节点名称:", settingsPanelNode.name);
                console.log("GameScene: 根节点所有组件:", settingsPanelNode.components.map(comp => comp.constructor.name));
            }

            if (this.settingsPanel) {
                console.log("GameScene: 设置面板预制体实例化成功");
                // 默认隐藏设置面板
                this.settingsPanel.hidePanel();
            } else {
                console.error("GameScene: 设置面板预制体中未找到SettingsPanel组件");
                console.log("GameScene: 预制体节点名称:", settingsPanelNode.name);
                console.log("GameScene: 预制体子节点:", settingsPanelNode.children.map(child => child.name));
                // 递归打印所有子节点的组件信息
                this.debugNodeComponents(settingsPanelNode, 0);
            }
        } catch (error) {
            console.error("GameScene: 实例化设置面板预制体时出错:", error);
        }
    }

    private initSettingsButton() {
        if (this.settingsButton) {
            this.settingsButton.node.on(Button.EventType.CLICK, this.onSettingsButtonClicked, this);
        }
    }

    private initTutorialManager() {
        // 查找TutorialManager组件
        this.tutorialManager = find('Canvas')?.getComponentInChildren(TutorialManager) || null!;

        if (this.tutorialManager) {
            console.log("GameScene: TutorialManager初始化成功");
            // 将GameManager实例传递给TutorialManager
            this.tutorialManager.setGameManager(this);
        } else {
            console.log("GameScene: 未找到TutorialManager组件");
        }
    }

    private onLevelInfoButtonClick() {
        this.showLevelInfoDialog();
    }

    /**
     * 初始化微信分享功能
     */
    private initWechatShare(): void {
        // 添加微信分享组件
        if (!this.getComponent(WechatShareManager)) {
            this.addComponent(WechatShareManager);
        }
    }
    
    /**
     * 调用分享功能
     * @param title 分享标题
     * @param imageUrl 分享图片
     * @param query 查询参数
     */
    public shareGame(title?: string, imageUrl?: string, query?: string): void {
        const shareManager = WechatShareManager.getInstance();
        if (shareManager) {
            shareManager.shareAppMessage(title, imageUrl, query);
        } else {
            console.log("微信分享管理器未初始化");
        }
    }

    private onSettingsButtonClicked() {
        console.log("GameScene: 设置按钮被点击");

        // 如果设置面板未初始化，尝试重新初始化
        if (!this.settingsPanel) {
            console.log("GameScene: 设置面板未初始化，尝试重新初始化");
            this.initSettingsPanel();
        }

        this.toggleSettingsPanel();
    }

    /**
     * 显示设置面板
     */
    public showSettingsPanel() {
        if (this.settingsPanel) {
            this.settingsPanel.showPanel();
        } else {
            console.error("设置面板未初始化");
        }
    }

    /**
     * 隐藏设置面板
     */
    public hideSettingsPanel() {
        console.log("GameScene: hideSettingsPanel被调用");

        if (this.settingsPanel) {
            console.log("GameScene: 设置面板存在，直接隐藏节点");
            // 直接隐藏节点，不调用AudioSettingsUI的hidePanel方法，避免循环调用
            this.settingsPanel.node.active = false;
            console.log("GameScene: 设置面板已隐藏");
        } else {
            console.error("GameScene: 设置面板未初始化");
        }
    }

    /**
     * 切换设置面板显示状态
     */
    public toggleSettingsPanel() {
        if (this.settingsPanel) {
            const isCurrentlyVisible = this.settingsPanel.node.active;
            console.log(`GameScene: 设置面板当前状态: ${isCurrentlyVisible ? '显示' : '隐藏'}`);

            if (isCurrentlyVisible) {
                console.log("GameScene: 面板已显示，执行隐藏操作");
                this.hideSettingsPanel();
            } else {
                console.log("GameScene: 面板已隐藏，执行显示操作");
                this.showSettingsPanel();
            }
        } else {
            console.error("GameScene: 设置面板未初始化");
        }
    }

    /**
     * 递归查找AudioSettingsUI组件
     */
    private findSettingsPanelInChildren(node: Node): AudioSettingsUI | null {
        // 检查当前节点
        const component = node.getComponent(AudioSettingsUI);
        if (component) {
            console.log(`GameScene: 在节点 ${node.name} 中找到AudioSettingsUI组件`);
            return component;
        }

        // 递归检查子节点
        for (const child of node.children) {
            const result = this.findSettingsPanelInChildren(child);
            if (result) {
                return result;
            }
        }

        return null;
    }

    /**
     * 调试节点组件信息
     */
    private debugNodeComponents(node: Node, depth: number = 0) {
        const indent = "  ".repeat(depth);
        const components = node.components.map(comp => comp.constructor.name);
        console.log(`${indent}节点: ${node.name}, 组件: [${components.join(', ')}]`);

        for (const child of node.children) {
            this.debugNodeComponents(child, depth + 1);
        }
    }
    
    // 🔥 弃牌区管理方法
    
    /**
     * 添加牌到统一弃牌区
     */
    public addToDiscardArea(tileType: string, characterId: string): void {
        this.discardArea.push({ tileType, characterId });
        this.discardHistory.push(tileType);
        
        console.log(`GameManager: 角色 ${characterId} 弃牌 ${tileType} 添加到弃牌区，当前弃牌区数量: ${this.discardArea.length}`);
        
        // 🔥 这里可以添加UI更新逻辑，显示弃牌区的牌
        this.updateDiscardAreaUI();
    }
    
    /**
     * 获取弃牌区所有牌
     */
    public getDiscardArea(): { tileType: string, characterId: string }[] {
        return [...this.discardArea];
    }
    
    /**
     * 获取指定角色的弃牌数量
     */
    public getCharacterDiscards(characterId: string): number {
        return this.discardArea.filter(item => item.characterId === characterId).length;
    }
    
    /**
     * 清空弃牌区
     */
    public clearDiscardArea(): void {
        this.discardArea = [];
        console.log("GameManager: 清空弃牌区");
    }
    
    /**
     * 更新弃牌区UI显示
     */
    private updateDiscardAreaUI(): void {
        // 🔥 这里可以添加UI更新逻辑
        // 例如：在屏幕上显示弃牌区的牌，或者更新弃牌统计
        console.log(`GameManager: 弃牌区更新 - 总数量: ${this.discardArea.length}`);
        
        // 按角色统计弃牌
        const characterStats: { [key: string]: number } = {};
        this.discardArea.forEach(item => {
            characterStats[item.characterId] = (characterStats[item.characterId] || 0) + 1;
        });
        
        console.log("GameManager: 各角色弃牌统计:", characterStats);
    }

    // ========== 音频系统集成 ==========

    /**
     * 初始化音频系统
     */
    private initAudio() {
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            // 游戏场景可以播放特定的BGM
            audioManager.playBGM('bgm');
            console.log("GameManager: 音频系统初始化完成");
        } else {
            console.warn("GameManager: AudioManager未找到，请确保场景中有AudioManager组件");
        }
    }

    /**
     * 播放收集音效（吃牌时）
     */
    public playCollectSound() {
        this.playGameSFX('collect');
    }

    /**
     * 播放胜利音效
     */
    public playWinSound() {
        this.playGameSFX('win');
    }

    /**
     * 播放失败音效
     */
    public playLoseSound() {
        this.playGameSFX('lose');
    }

    /**
     * 播放点击音效
     */
    public playClickSound() {
        this.playGameSFX('click');
    }

    /**
     * 播放游戏音效（公共方法）
     */
    public playGameSFX(soundName: string) {
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX(soundName);
        }
    }

    private wechatCustomAd: CustomAd | null = null; // 微信原生模板广告实例

    /**
     * 初始化微信原生模板广告
     */
    private initWechatCustomAd() {
        // 检查是否在微信环境中
        if (typeof window['wx'] !== 'undefined') {
            console.log("GameScene: 微信环境，初始化原生模板广告");
            
            try {
                // 获取系统信息以计算屏幕尺寸
                const systemInfo = window['wx'].getSystemInfoSync();
                const adWidth = Math.min(300, systemInfo.windowWidth * 0.8); // 最大宽度300，或者屏幕宽度的80%
                const adLeft = (systemInfo.windowWidth - adWidth) / 2;
                const adTop = systemInfo.windowHeight - 100; // 距离底部80像素
                
                // 创建原生模板广告实例
                this.wechatCustomAd = window['wx'].createCustomAd({
                    adUnitId: 'adunit-7ab1a2d8b6c4c107',
                    style: {
                        left: adLeft,
                        top: adTop,
                        width: adWidth
                    }
                }) as CustomAd;
                
                // 监听原生模板广告加载事件
                if (this.wechatCustomAd) {
                    this.wechatCustomAd.onLoad(() => {
                        console.log("GameScene: 原生模板广告加载成功");
                    });
                    
                    // 监听原生模板广告错误事件
                    this.wechatCustomAd.onError((err) => {
                        console.error("GameScene: 原生模板广告错误", err);
                    });
                    
                    // 监听原生模板广告关闭事件
                    this.wechatCustomAd.onClose(() => {
                        console.log("GameScene: 原生模板广告关闭");
                    });
                    
                    // 监听原生模板广告隐藏事件
                    this.wechatCustomAd.onHide(() => {
                        console.log("GameScene: 原生模板广告隐藏");
                    });
                    
                    // 监听原生模板广告尺寸变化事件
                    this.wechatCustomAd.onResize((res) => {
                        console.log("GameScene: 原生模板广告尺寸变化", res);
                        // 根据新尺寸调整广告位置，保持底部居中
                        if (this.wechatCustomAd && res && res.width) {
                            const systemInfo = window['wx'].getSystemInfoSync();
                            const newLeft = (systemInfo.windowWidth - res.width) / 2;
                            this.wechatCustomAd.style.left = newLeft;
                        }
                    });
                }
                
            } catch (err) {
                console.error("GameScene: 创建原生模板广告失败", err);
                this.wechatCustomAd = null;
            }
        } else {
            console.log("GameScene: 非微信环境，跳过原生模板广告初始化");
        }
    }
    
    /**
     * 显示微信原生模板广告
     */
    private showWechatCustomAd() {
        if (this.wechatCustomAd) {
            this.wechatCustomAd.show()
                .then(() => {
                    console.log("GameScene: 原生模板广告显示成功");
                })
                .catch((err) => {
                    console.error("GameScene: 原生模板广告显示失败", err);
                });
        }
    }
    
    /**
     * 隐藏微信原生模板广告
     */
    private hideWechatCustomAd() {
        if (this.wechatCustomAd) {
            this.wechatCustomAd.hide()
                .then(() => {
                    console.log("GameScene: 原生模板广告隐藏成功");
                })
                .catch((err) => {
                    console.error("GameScene: 原生模板广告隐藏失败", err);
                });
        }
    }
}
