import { _decorator, Component, Node, Vec3, Collider2D, Contact2DType, IPhysics2DContact, RigidBody2D, Vec2, UITransform, BoxCollider2D, ERigidBody2DType, CCFloat, Sprite, Color, SpriteFrame, Animation, instantiate, resources } from 'cc';
import { GameManager } from './GameManager';
import { MahjongTile } from './MahjongTile';
const { ccclass, property } = _decorator;

@ccclass('SnakeController')
export class SnakeController extends Component {
    @property(Node)
    snakeHead: Node = null!;
    
    @property(Node)
    snakeBodyPrefab: Node = null!;
    
    @property(CCFloat)
    moveSpeed: number = 0.3; // 移动间隔时间（秒）

    @property([SpriteFrame])
    snakeHeadFrames: SpriteFrame[] = [];

    @property(Animation)
    snakeHeadAnimation: Animation = null!;

    @property(CCFloat)
    gridSize: number = 40; // 网格大小
    
    @property(CCFloat)
    boostSpeedMultiplier: number = 3.0; // 最大加速倍数

    @property(CCFloat)
    maxBoostSpeedMultiplier: number = 5.0; // 最大加速倍数

    @property(CCFloat)
    boostAcceleration: number = 2.0; // 加速度（每秒增加的倍数）
    
    private snakeBody: Node[] = [];
    private moveDirection: Vec2 = new Vec2(1, 0); // 初始向右移动
    private nextDirection: Vec2 = new Vec2(1, 0); // 下一步的方向
    private isLocked: boolean = true; // 初始状态锁定，等待游戏管理器解锁
    private rigidBody: RigidBody2D = null!;
    
    // 网格移动相关
    private moveTimer: number = 0;
    private positions: Vec3[] = []; // 记录蛇的所有位置历史
    
    // 加速相关
    private isBoosting: boolean = false; // 是否正在加速
    private currentMoveSpeed: number = 0.3; // 当前移动速度
    private currentSpeedMultiplier: number = 1.0; // 当前速度倍数
    private boostTimer: number = 0; // 加速持续时间
    
    // 帧动画相关
    private currentFrame: number = 0;
    private frameTimer: number = 0;
    private frameInterval: number = 0.3; // 每帧间隔0.3秒
    
    // 🔥 保护盾相关
    private hasShield: boolean = false; // 是否有保护盾
    private shieldTimer: number = 0; // 保护盾计时器
    private shieldDuration: number = 3.0; // 保护盾持续时间（秒）
    private originalColors: Map<Node, Color> = new Map(); // 保存原始颜色
    
    onLoad() {
        this.initSnakeComponents();
        console.log("贪吃蛇控制器初始化完成");
    }
    
    start() {
        this.initSnake();
        // 开始播放蛇头动画
        this.playSnakeAnimation();
    }
    
    update(deltaTime: number) {
        if (this.isLocked) {
            return;
        }
        
        this.updateFrameAnimation(deltaTime);
        this.updateBoostSpeed(deltaTime);
        this.updateSnakeMovement(deltaTime);
        this.updateShield(deltaTime);
    }
    
    private initSnakeComponents() {
        // 🔥 安全检查：如果snakeHead为空，尝试查找或创建
        if (!this.snakeHead) {
            console.warn(`SnakeController: ${this.node.name} snakeHead未设置，尝试查找或创建`);
            this.snakeHead = this.node.getChildByName("SnakeHead");
            
            if (!this.snakeHead) {
                console.log(`SnakeController: ${this.node.name} 未找到SnakeHead子节点，创建新的`);
                this.snakeHead = new Node("SnakeHead");
                this.snakeHead.setParent(this.node);
                this.snakeHead.setPosition(0, 0, 0);
            }
        }
        
        // 再次检查snakeHead是否有效
        if (!this.snakeHead || !this.snakeHead.isValid) {
            console.error("SnakeController: snakeHead无效，无法初始化组件");
            return;
        }
        
        if (!this.snakeHead.getComponent(RigidBody2D)) {
            const rigidBody = this.snakeHead.addComponent(RigidBody2D);
            rigidBody.type = ERigidBody2DType.Kinematic;
            rigidBody.gravityScale = 0; // 不受重力影响
            rigidBody.enabledContactListener = true;
            rigidBody.linearVelocity = Vec2.ZERO; // 停止物理移动，使用网格移动
        }
        
        // 获取刚体组件引用
        this.rigidBody = this.snakeHead.getComponent(RigidBody2D)!;
        
        if (!this.snakeHead.getComponent(Collider2D)) {
            const collider = this.snakeHead.addComponent(BoxCollider2D);
            collider.sensor = true;
        }
        
        const collider = this.snakeHead.getComponent(Collider2D);
        
        if (!this.snakeHead.getComponent(UITransform)) {
            const transform = this.snakeHead.addComponent(UITransform);
            transform.setContentSize(this.gridSize, this.gridSize); // 使用网格大小
        }
        
        // 添加 Sprite 组件
        if (!this.snakeHead.getComponent(Sprite)) {
            const sprite = this.snakeHead.addComponent(Sprite);
            
            // 如果有动画帧，使用第一帧作为默认显示
            if (this.snakeHeadFrames.length > 0) {
                sprite.spriteFrame = this.snakeHeadFrames[0];
                console.log(`SnakeController: 使用编辑器配置的贴图 ${this.snakeHeadFrames[0].name}`);
            } else {
                // 🔥 对于AI角色，自动加载snake/snake-0贴图
                this.loadAISnakeSprite(sprite);
            }
        } else {
            // 🔥 如果已有Sprite组件（预制体），保持原有配置但应用AI颜色
            const sprite = this.snakeHead.getComponent(Sprite)!;
            console.log(`SnakeController: 使用预制体Sprite配置`);
        }
        
        // 🔥 检查是否有AI角色颜色设置（无论是新创建还是预制体）
        const sprite = this.snakeHead.getComponent(Sprite);
        const aiColor = (this as any)._aiCharacterColor;
        if (sprite && aiColor) {
            sprite.color = new Color(aiColor.r, aiColor.g, aiColor.b, aiColor.a);
            console.log(`SnakeController: 应用AI角色颜色 rgb(${aiColor.r}, ${aiColor.g}, ${aiColor.b})`);
        }
        
        // 设置碰撞监听
        if (collider) {
            // 设置碰撞监听
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        } else {
            console.error("无法设置碰撞监听，碰撞体不存在！");
        }
        
        console.log(`SnakeController: 组件初始化完成 - ${this.node.name}`);
    }
    
    /**
     * 为AI角色加载snake/snake-0贴图
     */
    private loadAISnakeSprite(sprite: Sprite) {
        // 🔥 使用resources.load加载snake/snake-0贴图
        resources.load('textures/snake/snake-0', SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.warn(`SnakeController: 无法加载snake/snake-0贴图:`, err);
                // 使用默认颜色作为后备方案
                sprite.color = new Color(0, 255, 0, 255);
                console.log(`SnakeController: 使用默认绿色显示`);
            } else {
                sprite.spriteFrame = spriteFrame;
                console.log(`SnakeController: 成功加载AI角色贴图 snake/snake-0`);
            }
        });
    }

    public playSnakeAnimation() {
        console.log(`SnakeController: 尝试播放蛇头动画`);

        // 优先使用Animation组件
        if (this.snakeHeadAnimation) {
            console.log(`SnakeController: 使用Animation组件播放动画`);
            this.snakeHeadAnimation.play();
            return;
        }

        // 备用方案：使用帧动画
        if (this.snakeHeadFrames.length >= 2) {
            console.log(`SnakeController: 使用帧动画，帧数: ${this.snakeHeadFrames.length}`);
            this.frameTimer = 0;
            this.currentFrame = 0;
        } else {
            console.warn(`SnakeController: 没有Animation组件且帧数不足，无法播放动画`);
        }
    }

    public stopSnakeAnimation() {
        // 停止动画，回到第一帧
        if (this.snakeHeadFrames.length > 0) {
            const sprite = this.snakeHead.getComponent(Sprite);
            if (sprite) {
                sprite.spriteFrame = this.snakeHeadFrames[0];
            }
        }
    }

    private updateFrameAnimation(deltaTime: number) {
        if (this.snakeHeadFrames.length < 2) return;
        
        this.frameTimer += deltaTime;
        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            this.currentFrame = (this.currentFrame + 1) % this.snakeHeadFrames.length;
            
            const sprite = this.snakeHead.getComponent(Sprite);
            if (sprite) {
                sprite.spriteFrame = this.snakeHeadFrames[this.currentFrame];
            }
        }
    }
    
    // 🔥 新增：更新保护盾状态
    private updateShield(deltaTime: number) {
        if (this.hasShield) {
            this.shieldTimer -= deltaTime;
            
            if (this.shieldTimer <= 0) {
                // 保护盾时间到，移除保护盾
                this.removeShield();
            }
        }
    }
    
    private initSnake() {
        // 初始化蛇头位置（对齐到网格）
        this.snakeHead.setPosition(0, 0, 0);
        
        // 初始化位置历史
        this.positions = [];
        
        // 设置初始移动方向（向右）
        this.moveDirection = new Vec2(1, 0);
        this.nextDirection = new Vec2(1, 0);
        
        // 设置初始旋转角度（向右，0度）
        this.rotateSnakeHead(this.moveDirection);
        
        // 重置移动计时器，立即开始移动
        this.moveTimer = 0;
        
        // 初始化移动速度和加速状态
        this.currentMoveSpeed = this.moveSpeed;
        this.isBoosting = false;
        this.boostTimer = 0;
        this.currentSpeedMultiplier = 1.0;
    }
    
    private updateBoostSpeed(deltaTime: number) {
        if (this.isBoosting) {
            // 增加加速时间
            this.boostTimer += deltaTime;

            // 计算当前速度倍数（渐进式增加）
            this.currentSpeedMultiplier = Math.min(
                this.boostSpeedMultiplier + (this.boostTimer * this.boostAcceleration),
                this.maxBoostSpeedMultiplier
            );

            // 更新当前移动速度
            this.currentMoveSpeed = this.moveSpeed / this.currentSpeedMultiplier;

            // 每0.2秒输出一次调试信息，避免日志过多
            if (Math.floor(this.boostTimer * 5) !== Math.floor((this.boostTimer - deltaTime) * 5)) {
                console.log(`渐进加速: 持续时间=${this.boostTimer.toFixed(1)}s, 倍数=${this.currentSpeedMultiplier.toFixed(2)}x, 速度=${this.currentMoveSpeed.toFixed(3)}s/步`);
            }
        }
    }

    private updateSnakeMovement(deltaTime: number) {
        this.moveTimer += deltaTime;

        if (this.moveTimer >= this.currentMoveSpeed) {
            this.moveTimer = 0;
            this.moveSnakeStep();
        }
    }
    
    private moveSnakeStep() {
        // 更新移动方向（防止直接反向）
        if (!this.isOppositeDirection(this.nextDirection, this.moveDirection)) {
            this.moveDirection = this.nextDirection.clone();
            
            // 根据移动方向旋转蛇头
            this.rotateSnakeHead(this.moveDirection);
        }
        
        // 计算新的蛇头位置
        const currentPos = this.snakeHead.position.clone();
        const newPos = new Vec3(
            currentPos.x + this.moveDirection.x * this.gridSize,
            currentPos.y + this.moveDirection.y * this.gridSize,
            0
        );
        
        // 记录当前位置到历史记录
        this.positions.unshift(currentPos.clone());
        
        // 移动蛇头
        this.snakeHead.setPosition(newPos);
        
        // 🔥 调试信息：AI角色移动
        if (this.node.name.includes('AICharacter')) {
            console.log(`SnakeController: ${this.node.name} 蛇头移动: (${currentPos.x.toFixed(1)}, ${currentPos.y.toFixed(1)}) -> (${newPos.x.toFixed(1)}, ${newPos.y.toFixed(1)})`);
            console.log(`SnakeController: ${this.node.name} 位置历史长度: ${this.positions.length}`);
        }
        
        // 手动检查碰撞（作为物理碰撞的备用方案）
        this.checkManualCollision();
        
        // 🔥 调试：输出玩家位置信息
        if (!this.node.name.includes('AICharacter')) {
            console.log(`🔥 玩家蛇头位置: (${newPos.x.toFixed(1)}, ${newPos.y.toFixed(1)})`);
        }
        
        // 更新蛇身位置
        this.updateSnakeBodyPositions();
        
        // 限制位置历史记录的长度
        const maxPositions = this.snakeBody.length + 10; // 多保留一些位置
        if (this.positions.length > maxPositions) {
            this.positions.splice(maxPositions);
        }
    }
    
    // 根据移动方向旋转蛇头
    private rotateSnakeHead(direction: Vec2) {
        let angle = 0;
        
        if (direction.x > 0) {
            // 向右移动，角度为0度
            angle = 90;
        } else if (direction.x < 0) {
            // 向左移动，角度为180度
            angle = 270;
        } else if (direction.y > 0) {
            // 向上移动，角度为90度
            angle = 180;
        } else if (direction.y < 0) {
            // 向下移动，角度为-90度（或270度）
            angle = 0;
        }
        
        // 设置蛇头的旋转角度
        this.snakeHead.setRotationFromEuler(0, 0, angle);
    }
    
    private updateSnakeBodyPositions() {
        // 让每节蛇身移动到前一个位置
        for (let i = 0; i < this.snakeBody.length; i++) {
            const bodyNode = this.snakeBody[i];
            
            // 🔥 修复：检查节点和位置是否有效
            if (!bodyNode || !bodyNode.isValid) {
                console.warn(`SnakeController.updateSnakeBodyPositions: 蛇身节点${i}无效，跳过更新`);
                continue;
            }
            
            if (i < this.positions.length && this.positions[i]) {
                const targetPosition = this.positions[i];
                if (targetPosition && typeof targetPosition.x === 'number' && typeof targetPosition.y === 'number') {
                    bodyNode.setPosition(targetPosition);
                } else {
                    console.warn(`SnakeController.updateSnakeBodyPositions: 位置${i}无效，跳过更新`);
                }
            } else {
                console.warn(`SnakeController.updateSnakeBodyPositions: 没有足够的位置历史，节点${i}跳过更新`);
            }
        }
    }
    
    // 检查两个方向是否相反
    private isOppositeDirection(dir1: Vec2, dir2: Vec2): boolean {
        return (dir1.x === -dir2.x && dir1.y === -dir2.y) && (dir1.x !== 0 || dir1.y !== 0);
    }
    
    public setMoveDirection(direction: Vec2) {
        if (this.isLocked) {
            return; 
        }
        
        // 防止蛇头直接反向（经典贪食蛇规则）
        if (this.isOppositeDirection(direction, this.moveDirection)) {
            return;
        }
        
        // 只接受四个基本方向
        if (Math.abs(direction.x) + Math.abs(direction.y) === 1) {
            this.nextDirection = direction.clone();
            
            // 立即旋转蛇头，提供视觉反馈
            this.rotateSnakeHead(direction);
        }
    }
    
    // 设置加速模式
    public setBoostMode(boosting: boolean) {
        if (this.isLocked) {
            return;
        }

        this.isBoosting = boosting;

        if (boosting) {
            // 开始渐进式加速
            this.boostTimer = 0;
            this.currentSpeedMultiplier = this.boostSpeedMultiplier;
            this.currentMoveSpeed = this.moveSpeed / this.currentSpeedMultiplier;
            console.log(`开始渐进式加速，初始倍数: ${this.currentSpeedMultiplier.toFixed(2)}x，速度: ${this.currentMoveSpeed.toFixed(3)}秒/步`);
        } else {
            // 结束加速，重置状态
            this.boostTimer = 0;
            this.currentSpeedMultiplier = 1.0;
            this.currentMoveSpeed = this.moveSpeed;
            console.log(`结束加速，恢复正常速度: ${this.currentMoveSpeed.toFixed(3)}秒/步`);
        }
    }
    
    // 获取当前是否正在加速
    public isBoostingActive(): boolean {
        return this.isBoosting;
    }

    // 获取当前加速倍数
    public getCurrentSpeedMultiplier(): number {
        return this.currentSpeedMultiplier;
    }

    // 获取加速持续时间
    public getBoostDuration(): number {
        return this.boostTimer;
    }
    
    public lockMovement() {
        this.isLocked = true;
        // 停止物理移动
        if (this.rigidBody) {
            this.rigidBody.linearVelocity = Vec2.ZERO;
        }
    }
    
    public unlockMovement() {
        this.isLocked = false;
        // 确保物理移动停止（因为我们使用网格移动）
        if (this.rigidBody) {
            this.rigidBody.linearVelocity = Vec2.ZERO;
        }
    }
    
    // 手动检查碰撞（作为物理碰撞的备用方案）
    private checkManualCollision() {
        const gameManager = GameManager.getInstance();
        if (!gameManager) return;
        
        // 检查背景边界
        this.checkBackgroundBoundary();
        
        // 🔥 新增：检查与其他蛇身的碰撞（蛇攻击功能）
        this.checkSnakeAttackCollision();
        
        // 获取活跃的麻将牌
        const activeTiles = gameManager.getActiveTiles();
        
        const headPos = this.snakeHead.position;
        
        // 🔥 调试信息：检查AI角色的碰撞检测
        if (this.node.name.includes('AICharacter')) {
            console.log(`SnakeController: ${this.node.name} 碰撞检测 - 蛇头位置: (${headPos.x.toFixed(1)}, ${headPos.y.toFixed(1)})`);
        }
        
        for (const tile of activeTiles) {
            if (tile && tile.isValid) {
                const tilePos = tile.position;
                const distance = Vec3.distance(headPos, tilePos);
                
                // 如果距离小于网格大小的一半，认为发生碰撞
                if (distance < this.gridSize * 0.8) {
                    // 🔥 调试信息：AI角色碰撞
                    if (this.node.name.includes('AICharacter')) {
                        console.log(`SnakeController: ${this.node.name} 检测到碰撞，距离: ${distance.toFixed(1)}`);
                    }
                    // 模拟碰撞处理
                    this.handleTileCollision(tile);
                    break;
                }
            }
        }
    }
    
    private checkBackgroundBoundary() {
        const gameManager = GameManager.getInstance();
        if (!gameManager) return;
        
        // 从BoundaryManager获取背景边界
        const boundaryManager = (gameManager as any).boundaryManager;
        if (!boundaryManager) {
            console.warn("BoundaryManager未找到，无法检查背景边界");
            return;
        }
        
        const bounds = boundaryManager.getGameAreaBounds();
        
        const headPos = this.snakeHead.position;
        
        // console.log(`检查背景边界 - 蛇头位置: (${headPos.x.toFixed(1)}, ${headPos.y.toFixed(1)})`);
        // console.log(`背景边界: X(${bounds.minX}, ${bounds.maxX}), Y(${bounds.minY}, ${bounds.maxY})`);
        
        // 检查是否超出边界
        if (headPos.x <= bounds.minX || headPos.x >= bounds.maxX || 
            headPos.y <= bounds.minY || headPos.y >= bounds.maxY) {
            
            // 🔥 检查是否是AI角色
            const isAICharacter = this.node.name.includes('AICharacter');
            
            if (isAICharacter) {
                // AI角色超出边界：记录日志但不触发游戏结束
                console.log(`AI角色 ${this.node.name} 超出背景边界，但不触发游戏结束`);
                console.log(`AI蛇头位置: (${headPos.x.toFixed(1)}, ${headPos.y.toFixed(1)})`);
                console.log(`边界范围: X(${bounds.minX}, ${bounds.maxX}), Y(${bounds.minY}, ${bounds.maxY})`);
                
                // 🔥 AI角色超出边界时，将其位置重置到边界内
                this.resetAIPositionToBounds(bounds);
            } else {
                // 玩家角色超出边界：触发游戏结束
                console.log("玩家蛇头超出背景边界，触发游戏结束");
            console.log(`蛇头位置: (${headPos.x.toFixed(1)}, ${headPos.y.toFixed(1)})`);
            console.log(`边界范围: X(${bounds.minX}, ${bounds.maxX}), Y(${bounds.minY}, ${bounds.maxY})`);
            
            // 触发游戏结束
            gameManager.gameOver();
            }
        }
    }
    
    /**
     * 🔥 新增：将AI角色位置重置到边界内
     */
    private resetAIPositionToBounds(bounds: any) {
        const headPos = this.snakeHead.position;
        let newX = headPos.x;
        let newY = headPos.y;
        
        // 确保位置在边界内
        if (newX <= bounds.minX) {
            newX = bounds.minX + 20; // 留出20像素的安全距离
        } else if (newX >= bounds.maxX) {
            newX = bounds.maxX - 20;
        }
        
        if (newY <= bounds.minY) {
            newY = bounds.minY + 20;
        } else if (newY >= bounds.maxY) {
            newY = bounds.maxY - 20;
        }
        
        // 设置新位置
        this.snakeHead.setPosition(newX, newY, headPos.z);
        console.log(`AI角色 ${this.node.name} 位置已重置到: (${newX.toFixed(1)}, ${newY.toFixed(1)})`);
        
        // 🔥 同时重置蛇身位置，避免蛇身和蛇头分离
        this.updateSnakeBodyPositions();
    }
    
    /**
     * 🔥 新增：检查与其他蛇身的碰撞（蛇攻击功能）
     */
    private checkSnakeAttackCollision() {
        const gameManager = GameManager.getInstance();
        if (!gameManager) {
            console.log(`🔥 ${this.node.name} 攻击检查失败: GameManager为空`);
            return;
        }
        
        // 检查是否可以吃牌（手牌未满）
        const canEat = this.canEatTileForAttack();
        if (!canEat) {
            console.log(`🔥 ${this.node.name} 攻击检查失败: canEat=${canEat}`);
            return; // 手牌已满，无法攻击
        }
        
        const headPos = this.snakeHead.position;
        
        // 🔥 获取MultiAIManager来遍历所有蛇
        const multiAIManager = (gameManager as any).multiAIManager;
        if (!multiAIManager) {
            // MultiAIManager可能还没有初始化，这是正常情况，不输出错误日志
            return;
        }
        
        console.log(`🔥 ${this.node.name} 开始攻击检查，头部位置: (${headPos.x.toFixed(1)}, ${headPos.y.toFixed(1)})`);
        
        // 获取所有可攻击的目标（包括AI角色和玩家）
        const allTargets = this.getAllAttackTargets(gameManager, multiAIManager);
        
        // 🔥 调试：显示攻击目标信息
        if (this.node.name.includes('AICharacter')) {
            console.log(`🔥 AI ${this.node.name} 找到 ${allTargets.length} 个攻击目标:`, allTargets.map(t => t.id));
        } else {
            console.log(`🔥 玩家找到 ${allTargets.length} 个攻击目标:`, allTargets.map(t => t.id));
        }
        
        for (const target of allTargets) {
            // 跳过自己
            if (target.id === this.getCharacterId()) {
                continue;
            }
            
            // 获取对方的SnakeController
            const otherSnakeController = target.snakeController;
            if (!otherSnakeController) {
                continue;
            }
            
            // 🔥 检查目标是否有保护盾
            if (otherSnakeController.hasShieldActive()) {
                console.log(`🔥 ${target.id} 有保护盾，无法攻击`);
                continue;
            }
            
            // 检查与对方蛇身的碰撞
            const otherSnakeBody = (otherSnakeController as any).snakeBody;
            for (let i = 0; i < otherSnakeBody.length; i++) {
                const bodyNode = otherSnakeBody[i];
                if (bodyNode && bodyNode.isValid) {
                    const bodyPos = bodyNode.position;
                    const distance = Vec3.distance(headPos, bodyPos);
                    
                    // 🔥 调试：显示距离信息
                    if (distance < this.gridSize * 2) {
                        const attackerType = this.node.name.includes('AICharacter') ? 'AI' : '玩家';
                        console.log(`🔥 ${attackerType} ${this.node.name} 距离${target.id}蛇身节点${i}: ${distance.toFixed(1)}px (阈值: ${(this.gridSize * 0.8).toFixed(1)}px)`);
                    }
                    
                    // 如果距离小于网格大小，认为发生攻击碰撞
                    if (distance < this.gridSize * 0.8) {
                        console.log(`🔥 蛇攻击！${this.node.name} 攻击 ${target.id} 的蛇身节点${i}`);
                        
                        // 执行攻击逻辑
                        this.executeSnakeAttack(target.character, bodyNode, otherSnakeController);
                        return; // 一次只能攻击一个节点
                    }
                }
            }
        }
    }
    
    /**
     * 🔥 新增：检查是否可以吃牌进行攻击
     */
    private canEatTileForAttack(): boolean {
        // 检查是否是AI角色
        const isAICharacter = this.node.name.includes('AICharacter');
        
        if (isAICharacter) {
            // AI角色：检查AI角色的手牌状态
            const aiCharacter = this.node.getComponent('AICharacter') as any;
            if (aiCharacter) {
                const canEat = aiCharacter.canEatTile();
                console.log(`🔥 AI角色 ${this.node.name} 攻击检查: canEat=${canEat}`);
                return canEat;
            }
        } else {
            // 玩家角色：检查GameManager的手牌状态
            const gameManager = GameManager.getInstance();
            if (gameManager) {
                const canEat = gameManager.canEatTile();
                const handCardCount = gameManager.getHandCardsCount();
                console.log(`🔥 玩家攻击检查: 手牌数量=${handCardCount}, canEat=${canEat}`);
                return canEat;
            }
        }
        
        return false;
    }
    
    /**
     * 🔥 新增：执行蛇攻击逻辑
     */
    private executeSnakeAttack(targetCharacter: any, targetBodyNode: Node, targetSnakeController: SnakeController) {
        // 获取被攻击的牌型
        const mahjongTile = targetBodyNode.getComponent(MahjongTile);
        if (!mahjongTile) {
            console.warn("蛇攻击：目标节点没有MahjongTile组件");
            return;
        }
        
        const tileType = mahjongTile.getTileType();
        console.log(`🔥 蛇攻击：抢夺牌型 ${tileType}`);
        
        // 检查攻击者是否可以添加这张牌
        const canAddToAttacker = this.addTileToAttacker(tileType);
        if (!canAddToAttacker) {
            console.log("🔥 蛇攻击：攻击者无法添加牌型，攻击失败");
            return;
        }
        
        // 从被攻击者移除这张牌
        const removedFromTarget = this.removeTileFromTarget(targetCharacter, targetSnakeController, tileType, targetBodyNode);
        if (!removedFromTarget) {
            console.warn("🔥 蛇攻击：从目标移除牌型失败，但继续执行攻击");
            // 🔥 修复：即使移除失败也继续攻击，可能是节点已经被其他逻辑处理了
        }
        
        // 🔥 修复：确保攻击者的手牌和蛇身都得到更新
        const isPlayerAttacker = !this.node.name.includes('AICharacter');
        if (isPlayerAttacker) {
            // 玩家攻击：手牌已在addTileToAttacker中添加，现在需要将节点添加到蛇身
            console.log(`🔥 玩家攻击：开始添加节点到蛇身，节点名称: ${targetBodyNode.name}`);
            
            // 🔥 确保节点有效且未被销毁
            if (targetBodyNode && targetBodyNode.isValid) {
                this.addSnakeBodyFromTile(targetBodyNode);
                console.log(`🔥 玩家攻击：牌已添加到手牌和蛇身`);
            } else {
                console.warn(`🔥 玩家攻击：目标节点无效，无法添加到蛇身`);
                // 🔥 创建新的牌节点来替代
                this.createNewTileForAttacker(tileType);
            }
            
            const gameManager = GameManager.getInstance();
            if (gameManager) {
                // 检查目标是否是AI角色
                const isTargetAI = targetCharacter.getId && typeof targetCharacter.getId === 'function' && targetCharacter.getId() !== 'player';
                if (isTargetAI) {
                    console.log(`🔥 播放玩家攻击AI成功音效`);
                    gameManager.playGameSFX('collect'); // 使用bonus音效表示玩家攻击AI成功
                }
            }
        } else {
            // AI攻击：将节点转移到攻击者的蛇身
            this.transferTileToAttacker(targetBodyNode);
            console.log(`🔥 AI攻击：牌节点已转移到攻击者蛇身`);
        }
        
        // 🔥 为被攻击者激活保护盾
        targetSnakeController.activateShield();
        
        // 🔥 修复：安全获取目标角色ID
        const targetId = targetCharacter.getId && typeof targetCharacter.getId === 'function' ? targetCharacter.getId() : 'player';
        console.log(`🔥 蛇攻击成功！${this.node.name} 从 ${targetId} 抢夺了 ${tileType}，目标获得保护盾`);

        // 🔥 触发教程：如果是玩家攻击AI成功，触发攻击AI教程完成
        const isPlayerAttacking = !this.node.name.includes('AICharacter');
        if (isPlayerAttacking && canAddToAttacker) {
            const gameManager = GameManager.getInstance();
            const tutorialManager = gameManager?.getTutorialManager();
            if (tutorialManager) {
                tutorialManager.onAIAttacked();
                console.log("🔥 教程触发：玩家成功攻击AI，完成攻击AI教程");
            }
        }
    }
    
    /**
     * 🔥 新增：将牌添加到攻击者
     */
    private addTileToAttacker(tileType: string): boolean {
        const isAICharacter = this.node.name.includes('AICharacter');
        
        if (isAICharacter) {
            // AI角色：添加到AI手牌
            const aiCharacter = this.node.getComponent('AICharacter') as any;
            if (aiCharacter) {
                const success = aiCharacter.addHandCard(tileType);
                console.log(`🔥 AI攻击添加牌型 ${tileType}: ${success ? '成功' : '失败'}`);
                if (!success) {
                    const handCount = aiCharacter.getHandCardsCount ? aiCharacter.getHandCardsCount() : 'unknown';
                    console.log(`🔥 AI攻击失败原因：当前手牌数量=${handCount}`);
                }
                return success;
            }
        } else {
            // 玩家角色：添加到GameManager手牌
            const gameManager = GameManager.getInstance();
            if (gameManager) {
                const success = gameManager.addHandCard(tileType);
                console.log(`🔥 玩家攻击添加牌型 ${tileType}: ${success ? '成功' : '失败'}`);
                return success;
            }
        }
        
        return false;
    }
    
    /**
     * 🔥 新增：从目标移除牌型
     */
    private removeTileFromTarget(targetCharacter: any, targetSnakeController: SnakeController, tileType: string, targetBodyNode: Node): boolean {
        let handCardRemoved = false;
        let snakeBodyRemoved = false;
        
        // 🔥 修复：攻击时直接从手牌数据中移除，不进入弃牌区，不销毁蛇身节点
        console.log(`🔥 蛇攻击：从目标直接移除手牌 ${tileType}（不进入弃牌区）`);
        
        // 🔥 修复：正确判断目标是AI还是玩家
        // 如果目标有getId方法且getId()不等于'player'，则认为是AI角色
        // 如果目标没有getId方法或者getId()等于'player'，则认为是玩家角色
        const isTargetAI = targetCharacter.getId && typeof targetCharacter.getId === 'function' && targetCharacter.getId() !== 'player';
        
        if (isTargetAI) {
            // 目标是AI角色：直接从AI手牌数据中移除
            console.log(`🔥 蛇攻击：目标是AI角色 ${targetCharacter.getId()}`);
            const aiCharacter = targetCharacter;
            if (aiCharacter && aiCharacter.getHandCards) {
                const handCards = aiCharacter.getHandCards();
                const cardIndex = handCards.indexOf(tileType);
                if (cardIndex !== -1) {
                    // 直接从数组中移除，不触发弃牌逻辑
                    handCards.splice(cardIndex, 1);
                    handCardRemoved = true;
                    console.log(`🔥 蛇攻击：从AI ${targetCharacter.getId()} 直接移除手牌 ${tileType} 成功`);
                } else {
                    console.warn(`🔥 蛇攻击：在AI ${targetCharacter.getId()} 手牌中找不到 ${tileType}`);
                    console.warn(`🔥 调试：AI手牌内容:`, handCards);
                }
            }
        } else {
            // 目标是玩家：直接从GameManager手牌数据中移除
            console.log(`🔥 蛇攻击：目标是玩家角色`);
            const gameManager = targetCharacter;
            if (gameManager && gameManager.handCards) {
                const handCards = (gameManager as any).handCards;
                const cardIndex = handCards.indexOf(tileType);
                if (cardIndex !== -1) {
                    // 直接从数组中移除，不触发弃牌逻辑
                    handCards.splice(cardIndex, 1);
                    handCardRemoved = true;
                    console.log(`🔥 蛇攻击：从玩家手牌数据中移除 ${tileType} 成功`);
                    
                    // 🔥 修复：通知HandCardManager更新UI显示
                    if (gameManager.handCardManager) {
                        const uiRemoved = gameManager.handCardManager.removeHandCardByType(tileType);
                        console.log(`🔥 蛇攻击：更新玩家手牌UI显示: ${uiRemoved ? '成功' : '失败'}`);
                    }
                    
                    // 🔥 修复：更新玩家蛇头颜色（手牌数量减少了）
                    const playerSnakeController = gameManager.snakeController;
                    if (playerSnakeController) {
                        const newHandCount = handCards.length;
                        const maxHandCards = gameManager.getMaxHandCards();
                        const isHandFull = newHandCount >= maxHandCards;
                        playerSnakeController.setSnakeHeadColor(isHandFull);
                        console.log(`🔥 蛇攻击：更新玩家蛇头颜色，手牌数量: ${newHandCount}/${maxHandCards}，满手: ${isHandFull}`);
                    }
                } else {
                    console.warn(`🔥 蛇攻击：在玩家手牌中找不到 ${tileType}`);
                    console.warn(`🔥 调试：玩家手牌内容:`, handCards);
                }
            }
        }
        
        // 🔥 只有在手牌移除成功后才移除蛇身节点
        if (handCardRemoved) {
            // 从目标的蛇身数组中移除节点（但不销毁节点，因为要转移给攻击者）
            const targetSnakeBody = (targetSnakeController as any).snakeBody;
            const nodeIndex = targetSnakeBody.indexOf(targetBodyNode);
            if (nodeIndex !== -1) {
                targetSnakeBody.splice(nodeIndex, 1);
                snakeBodyRemoved = true;
                console.log(`🔥 蛇攻击：从目标蛇身移除节点（不销毁），索引=${nodeIndex}，剩余蛇身长度=${targetSnakeBody.length}`);
                
                // 重新调整目标蛇身的位置
                (targetSnakeController as any).adjustSnakeBodyPositionsAfterRemoval(nodeIndex);
            } else {
                console.warn("🔥 蛇攻击：在目标蛇身中找不到要移除的节点");
                // 🔥 调试：输出目标蛇身的所有节点信息
                console.log(`🔥 调试：目标蛇身包含 ${targetSnakeBody.length} 个节点:`);
                for (let i = 0; i < targetSnakeBody.length; i++) {
                    const bodyNode = targetSnakeBody[i];
                    console.log(`  节点${i}: ${bodyNode ? bodyNode.name : 'null'} (相同引用: ${bodyNode === targetBodyNode})`);
                }
            }
        } else {
            console.warn("🔥 蛇攻击：手牌移除失败，跳过蛇身节点移除");
        }
        
        // 🔥 只要手牌移除成功就认为攻击有效
        return handCardRemoved;
    }
    
    /**
     * 🔥 新增：将牌节点转移到攻击者的蛇身
     */
    private transferTileToAttacker(tileNode: Node) {
        // 从原来的蛇身中移除（不销毁节点）
        // 这个逻辑在removeTileFromTarget中已经处理了
        
        // 重新设置节点的显示状态
        const mahjongTile = tileNode.getComponent(MahjongTile);
        if (mahjongTile) {
            (mahjongTile as any).showAsBackSide = false;
            (mahjongTile as any).updateDisplayMode();
        }
        
        // 移除原有的碰撞体，避免干扰
        const oldCollider = tileNode.getComponent(Collider2D);
        if (oldCollider) {
            oldCollider.destroy();
        }
        
        // 为蛇身添加新的碰撞体
        const bodyCollider = tileNode.addComponent(BoxCollider2D);
        bodyCollider.sensor = true;
        
        // 设置蛇身位置
        const tailIndex = this.snakeBody.length;
        if (tailIndex < this.positions.length) {
            tileNode.setPosition(this.positions[tailIndex]);
        } else {
            // 如果没有足够的历史位置，放在最后一个蛇身后面
            const lastBodyPos = this.snakeBody.length > 0 ? 
                this.snakeBody[this.snakeBody.length - 1].position : 
                this.snakeHead.position;
            const newPos = new Vec3(
                lastBodyPos.x - this.moveDirection.x * this.gridSize,
                lastBodyPos.y - this.moveDirection.y * this.gridSize,
                0
            );
            tileNode.setPosition(newPos);
        }
        
        // 添加到攻击者的蛇身
        this.snakeBody.push(tileNode);
        
        console.log(`🔥 牌节点已转移到攻击者蛇身，当前蛇身长度: ${this.snakeBody.length}`);
    }
    
    /**
     * 🔥 新增：获取当前角色ID
     */
    private getCharacterId(): string {
        // 对于AI角色，从AICharacter组件获取ID
        const aiCharacter = this.node.getComponent('AICharacter') as any;
        if (aiCharacter) {
            return aiCharacter.getId();
        }
        
        // 对于玩家角色，返回固定ID
        return 'player';
    }
    
    /**
     * 🔥 新增：获取所有可攻击的目标（包括AI角色和玩家）
     */
    private getAllAttackTargets(gameManager: any, multiAIManager: any): Array<{id: string, character: any, snakeController: SnakeController}> {
        const targets: Array<{id: string, character: any, snakeController: SnakeController}> = [];
        
        // 添加所有AI角色
        const allCharacters = multiAIManager.getAllCharacters();
        for (const character of allCharacters) {
            const snakeController = character.node.getComponent(SnakeController);
            if (snakeController) {
                targets.push({
                    id: character.getId(),
                    character: character,
                    snakeController: snakeController
                });
            }
        }
        
        // 添加玩家角色（如果当前不是玩家角色）
        const isCurrentAI = this.node.name.includes('AICharacter');
        if (isCurrentAI) {
            // 当前是AI角色，可以攻击玩家
            const playerSnakeController = gameManager.snakeController;
            if (playerSnakeController && playerSnakeController !== this) {
                targets.push({
                    id: 'player',
                    character: gameManager, // 玩家使用GameManager作为角色对象
                    snakeController: playerSnakeController
                });
            }
        }
        
        return targets;
    }
    
    /**
     * 🔥 新增：检查物理碰撞中的蛇身攻击
     */
    private checkSnakeBodyAttack(otherNode: Node): boolean {
        // 检查是否可以吃牌进行攻击
        const canEat = this.canEatTileForAttack();
        if (!canEat) {
            return false;
        }
        
        const gameManager = GameManager.getInstance();
        if (!gameManager) return false;
        
        // 获取MultiAIManager来查找其他蛇
        const multiAIManager = (gameManager as any).multiAIManager;
        if (!multiAIManager) {
            return false;
        }
        
        // 获取所有可攻击的目标（包括AI角色和玩家）
        const allTargets = this.getAllAttackTargets(gameManager, multiAIManager);
        
        for (const target of allTargets) {
            // 跳过自己
            if (target.id === this.getCharacterId()) {
                continue;
            }
            
            // 获取对方的SnakeController
            const otherSnakeController = target.snakeController;
            if (!otherSnakeController) {
                continue;
            }
            
            // 🔥 检查目标是否有保护盾
            if (otherSnakeController.hasShieldActive()) {
                console.log(`🔥 ${target.id} 有保护盾，无法攻击`);
                continue;
            }
            
            // 检查碰撞的节点是否是对方的蛇身
            const otherSnakeBody = (otherSnakeController as any).snakeBody;
            const bodyIndex = otherSnakeBody.indexOf(otherNode);
            
            if (bodyIndex !== -1) {
                console.log(`🔥 物理碰撞蛇攻击！${this.node.name} 攻击 ${target.id} 的蛇身节点${bodyIndex}`);
                
                // 执行攻击逻辑
                this.executeSnakeAttack(target.character, otherNode, otherSnakeController);
                return true; // 攻击成功
            }
        }
        
        return false; // 不是蛇身攻击
    }
    
    // 处理麻将牌碰撞的逻辑
    private handleTileCollision(tileNode: Node) {
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            // 🔥 检查是否是AI角色
            const isAICharacter = this.node.name.includes('AICharacter');
            
            if (isAICharacter) {
                // AI角色：直接添加到蛇身（蛇身就是手牌）
                const mahjongTile = tileNode.getComponent('MahjongTile') as any;
                if (mahjongTile) {
                    const tileType = mahjongTile.getTileType();
                    console.log(`SnakeController: ${this.node.name} AI角色吃到牌 ${tileType}`);
                    
                    // 🔥 获取AI角色组件并检查是否可以吃牌
                    const aiCharacter = this.node.getComponent('AICharacter') as any;
                    if (!aiCharacter) {
                        console.warn(`SnakeController: ${this.node.name} 未找到AICharacter组件`);
                        return;
                    }
                    
                    if (!aiCharacter.canEatTile()) {
                        console.log(`SnakeController: ${this.node.name} AI角色手牌已满，无法添加牌型 ${tileType}`);
                        return;
                    }
                    
                    // 🔥 简化：先通知AI角色检查是否可以添加手牌
                    const canAdd = aiCharacter.addHandCard(tileType);
                    if (!canAdd) {
                        console.log(`SnakeController: ${this.node.name} AI角色拒绝添加手牌 ${tileType}，跳过吃牌逻辑`);
                        return;
                    }
                    
                    console.log(`SnakeController: ${this.node.name} AI角色成功添加手牌 ${tileType}`);
                    
                    // 将麻将牌添加到蛇身
                    this.addSnakeBodyFromTile(tileNode);
                    
                    // 从游戏管理器中移除这个麻将牌
                    gameManager.removeTile(tileNode);
                    
                    // 生成新的麻将牌
                    gameManager.respawnMahjongTile();
                }
            } else {
                // 玩家角色：正常添加到手牌
            if (gameManager.canEatTile()) {
                const mahjongTile = tileNode.getComponent('MahjongTile') as any;
                if (mahjongTile) {
                    const tileType = mahjongTile.getTileType();
                    
                    // 添加到手牌
                    if (gameManager.addHandCard(tileType)) {
                        // 播放收集音效
                        gameManager.playCollectSound();

                        // 将麻将牌添加到蛇身
                        this.addSnakeBodyFromTile(tileNode);

                        // 从游戏管理器中移除这个麻将牌
                        gameManager.removeTile(tileNode);

                        // 生成新的麻将牌
                        gameManager.respawnMahjongTile();
                        }
                    }
                }
            }
        }
    }
    
    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if (!this.isLocked) {
            const otherNode = otherCollider.node;
            
            // 🔥 首先检查蛇攻击（优先级最高）
            console.log(`🔥 物理碰撞检测: ${this.node.name} 碰到 ${otherNode.name}`);
            const attackResult = this.checkSnakeBodyAttack(otherNode);
            if (attackResult) {
                console.log(`🔥 蛇攻击成功，跳过其他碰撞处理`);
                return; // 攻击成功，跳过其他碰撞处理
            }
            
            // 检查是否碰到边界
            if (otherNode.name.includes('Boundary')) {
                // 🔥 检查是否是AI角色
                const isAICharacter = this.node.name.includes('AICharacter');
                
                if (isAICharacter) {
                    // AI角色碰到边界：记录日志但不触发游戏结束
                    console.log(`AI角色 ${this.node.name} 碰到边界 ${otherNode.name}，但不触发游戏结束`);
                    
                    // 🔥 获取边界信息并重置AI位置
                    const gameManager = GameManager.getInstance();
                    if (gameManager) {
                        const boundaryManager = (gameManager as any).boundaryManager;
                        if (boundaryManager) {
                            const bounds = boundaryManager.getGameAreaBounds();
                            this.resetAIPositionToBounds(bounds);
                        }
                    }
                } else {
                    // 玩家角色碰到边界：触发游戏结束
                const gameManager = GameManager.getInstance();
                if (gameManager) {
                    gameManager.gameOver();
                    }
                }
                return;
            }
            
            // 检查是否碰到麻将牌
            if (otherNode.name === 'MahjongTile') {
                const gameManager = GameManager.getInstance();
                if (gameManager) {
                    // 🔥 检查是否是AI角色
                    const isAICharacter = this.node.name.includes('AICharacter');
                    
                    if (isAICharacter) {
                        // AI角色：直接添加到蛇身（蛇身就是手牌）
                        const mahjongTile = otherNode.getComponent('MahjongTile') as any;
                        if (mahjongTile) {
                            const tileType = mahjongTile.getTileType();
                            console.log(`SnakeController: ${this.node.name} AI角色物理碰撞吃到牌 ${tileType}`);
                            
                            // 🔥 获取AI角色组件并检查是否可以吃牌
                            const aiCharacter = this.node.getComponent('AICharacter') as any;
                            if (!aiCharacter) {
                                console.warn(`SnakeController: ${this.node.name} 未找到AICharacter组件`);
                                return;
                            }
                            
                            if (!aiCharacter.canEatTile()) {
                                console.log(`SnakeController: ${this.node.name} AI角色手牌已满，无法添加牌型 ${tileType}`);
                                return;
                            }
                            
                            // 🔥 简化：先通知AI角色检查是否可以添加手牌
                            const canAdd = aiCharacter.addHandCard(tileType);
                            if (!canAdd) {
                                console.log(`SnakeController: ${this.node.name} AI角色物理碰撞拒绝添加手牌 ${tileType}，跳过吃牌逻辑`);
                                return;
                            }
                            
                            console.log(`SnakeController: ${this.node.name} AI角色物理碰撞成功添加手牌 ${tileType}`);
                            
                            // 将麻将牌添加到蛇身
                            this.addSnakeBodyFromTile(otherNode);
                            
                            // 从游戏管理器中移除这个麻将牌
                            gameManager.removeTile(otherNode);
                            
                            // 生成新的麻将牌
                            gameManager.respawnMahjongTile();
                        }
                    } else {
                        // 玩家角色：正常添加到手牌
                    if (gameManager.canEatTile()) {
                        const mahjongTile = otherNode.getComponent('MahjongTile') as any;
                        if (mahjongTile) {
                            const tileType = mahjongTile.getTileType();
                            
                            // 添加到手牌
                            if (gameManager.addHandCard(tileType)) {
                                // 播放收集音效
                                gameManager.playCollectSound();

                                // 将麻将牌添加到蛇身
                                this.addSnakeBodyFromTile(otherNode);

                                // 从游戏管理器中移除这个麻将牌
                                gameManager.removeTile(otherNode);

                                // 生成新的麻将牌
                                gameManager.respawnMahjongTile();
                                }
                            }
                        }
                    }
                }
            }
            
            // 检查是否碰到自己的身体
            if (this.snakeBody.indexOf(otherNode) !== -1) {
                const gameManager = GameManager.getInstance();
                if (gameManager) {
                    gameManager.gameOver();
                }
            }
        }
    }
    
    private addSnakeBodyFromTile(tileNode: Node) {
        console.log("[FLIP_DEBUG] ★★★ 开始将麻将牌添加到蛇身 ★★★");
        console.log(`[FLIP_DEBUG] 节点名称: ${tileNode.name}`);
        console.log(`[FLIP_DEBUG] 节点父级: ${tileNode.parent ? tileNode.parent.name : 'null'}`);
        console.log(`[FLIP_DEBUG] 当前蛇身长度: ${this.snakeBody.length}`);
        
        // 🔥 确保节点被正确添加到场景中，并设置到正确的层级
        const gameManager = GameManager.getInstance();
        if (gameManager && gameManager.canvas) {
            // 将节点重新设置到Canvas下
            tileNode.setParent(gameManager.canvas);
            console.log("[FLIP_DEBUG] 将节点添加到Canvas");
            
            // 🔥 确保节点在正确的层级（与其他蛇身节点相同）
            if (this.snakeBody.length > 0) {
                const existingBodyNode = this.snakeBody[0];
                if (existingBodyNode && existingBodyNode.parent) {
                    tileNode.setParent(existingBodyNode.parent);
                    console.log(`[FLIP_DEBUG] 将节点设置到与其他蛇身相同的父级: ${existingBodyNode.parent.name}`);
                }
            }
        } else {
            console.warn("[FLIP_DEBUG] 无法设置节点父级，GameManager或Canvas不存在");
        }
        
        // 获取原麻将牌的类型信息
        const originalMahjongTile = tileNode.getComponent(MahjongTile);
        if (!originalMahjongTile) {
            console.error("[FLIP_DEBUG] 未找到MahjongTile组件！");
            return;
        }
        
        const tileType = (originalMahjongTile as any).getTileTypeEnum();
        const tileTypeString = (originalMahjongTile as any).getTileType();
        console.log(`[FLIP_DEBUG] 获取到牌型: ${tileType}(${(originalMahjongTile as any).getTileTypeName()})`);
        console.log(`[FLIP_DEBUG] 牌型字符串: "${tileTypeString}" (长度:${tileTypeString.length})`);
        
        // 🔥 简化：AI角色的蛇身就是手牌，不需要额外验证
        
        // 移除原麻将牌的碰撞体和刚体，避免干扰
        const collider = tileNode.getComponent(Collider2D);
        if (collider) {
            collider.destroy();
            console.log("[FLIP_DEBUG] 移除了麻将牌的碰撞体");
        }
        
        const rigidBody = tileNode.getComponent(RigidBody2D);
        if (rigidBody) {
            rigidBody.destroy();
            console.log("[FLIP_DEBUG] 移除了麻将牌的刚体");
        }
        
        // 直接修改原麻将牌为正面显示（简单方法）
        console.log("[FLIP_DEBUG] 开始设置原麻将牌为正面显示");
        (originalMahjongTile as any).showAsBackSide = false;
        console.log(`[FLIP_DEBUG] showAsBackSide 已设置为: ${(originalMahjongTile as any).showAsBackSide}`);
        
        // 🔥 修复：确保tileType已经设置，避免在updateDisplayMode中重新生成
        if ((originalMahjongTile as any).tileType === undefined) {
            console.warn("[FLIP_DEBUG] tileType未初始化，使用当前牌型设置");
            (originalMahjongTile as any).tileType = tileType;
        }
        
        // 强制更新显示模式
        (originalMahjongTile as any).updateDisplayMode();
        console.log("[FLIP_DEBUG] 已调用updateDisplayMode()");
        
        // 为蛇身添加新的碰撞体（用于蛇头碰撞检测）
        const bodyCollider = tileNode.addComponent(BoxCollider2D);
        bodyCollider.sensor = true; // 设置为传感器，不影响物理
        console.log("[FLIP_DEBUG] 为蛇身添加了新的碰撞体");
        
        // 确保有UITransform组件
        if (!tileNode.getComponent(UITransform)) {
            const transform = tileNode.addComponent(UITransform);
            transform.setContentSize(this.gridSize, this.gridSize);
            console.log("[FLIP_DEBUG] 添加了UITransform组件");
        }
        
        // 设置蛇身位置
        const tailIndex = this.snakeBody.length;
        if (tailIndex < this.positions.length) {
            tileNode.setPosition(this.positions[tailIndex]);
            console.log(`[FLIP_DEBUG] 设置蛇身位置到历史位置 ${tailIndex}: (${this.positions[tailIndex].x}, ${this.positions[tailIndex].y})`);
        } else {
            // 如果没有足够的历史位置，放在最后一个蛇身后面
            const lastBodyPos = this.snakeBody.length > 0 ? 
                this.snakeBody[this.snakeBody.length - 1].position : 
                this.snakeHead.position;
            const newPos = new Vec3(
                lastBodyPos.x - this.moveDirection.x * this.gridSize,
                lastBodyPos.y - this.moveDirection.y * this.gridSize,
                0
            );
            tileNode.setPosition(newPos);
            console.log(`[FLIP_DEBUG] 设置蛇身位置到计算位置: (${newPos.x}, ${newPos.y})`);
        }
        
        // 添加到蛇身数组
        this.snakeBody.push(tileNode);
        
        // 🔥 如果当前有保护盾，为新节点应用金色效果
        if (this.hasShield) {
            const bodySprite = tileNode.getComponent(Sprite);
            if (bodySprite) {
                this.originalColors.set(tileNode, bodySprite.color.clone());
                bodySprite.color = new Color(255, 215, 0, 255); // 金色
            }
        }
        
        console.log(`[FLIP_DEBUG] 麻将牌已添加到蛇身，当前蛇身长度: ${this.snakeBody.length}`);
        
        // 🔥 调试：检查节点的可见性和状态
        console.log(`[FLIP_DEBUG] 节点最终状态检查:`);
        console.log(`  - 节点有效: ${tileNode.isValid}`);
        console.log(`  - 节点活跃: ${tileNode.active}`);
        console.log(`  - 节点位置: (${tileNode.position.x.toFixed(1)}, ${tileNode.position.y.toFixed(1)})`);
        console.log(`  - 节点父级: ${tileNode.parent ? tileNode.parent.name : 'null'}`);
        console.log(`  - 节点层级: ${tileNode.layer}`);
        
        // 🔥 检查节点的Sprite组件
        const sprite = tileNode.getComponent(Sprite);
        if (sprite) {
            console.log(`  - Sprite组件存在: true`);
            console.log(`  - Sprite可见: ${sprite.enabled}`);
            console.log(`  - Sprite颜色: rgba(${sprite.color.r}, ${sprite.color.g}, ${sprite.color.b}, ${sprite.color.a})`);
        } else {
            console.log(`  - Sprite组件存在: false`);
        }
        
        console.log("[FLIP_DEBUG] ★★★ 麻将牌添加到蛇身完成 ★★★");
    }
    
    public getSnakeLength(): number {
        return this.snakeBody.length + 1; // +1 包括蛇头
    }
    
    public removeSnakeBodyByTileType(tileType: string): boolean {
        if (this.snakeBody.length === 0) {
            console.log("SnakeController.removeSnakeBodyByTileType: 蛇身为空，无法移除");
            return false;
        }
        
        console.log(`SnakeController.removeSnakeBodyByTileType: 寻找牌型为 "${tileType}" 的蛇身节点`);
        console.log(`SnakeController.removeSnakeBodyByTileType: 当前蛇身长度: ${this.snakeBody.length}`);
        
        // 🔥 增强调试：先显示所有蛇身节点的牌型
        console.log(`SnakeController.removeSnakeBodyByTileType: 当前蛇身所有节点:`);
        for (let j = 0; j < this.snakeBody.length; j++) {
            const bodyNode = this.snakeBody[j];
            if (bodyNode && bodyNode.isValid) {
                const mahjongTile = bodyNode.getComponent(MahjongTile);
                if (mahjongTile) {
                    const bodyTileType = mahjongTile.getTileType();
                    console.log(`  蛇身节点${j}: 牌型="${bodyTileType}" (类型: ${typeof bodyTileType})`);
                } else {
                    console.log(`  蛇身节点${j}: 无MahjongTile组件`);
                }
            } else {
                console.log(`  蛇身节点${j}: 节点无效`);
            }
        }
        
        // 🔥 修复：直接查找第一个匹配的节点（因为GameManager已经保证了牌型的一致性）
        for (let i = 0; i < this.snakeBody.length; i++) {
            const bodyNode = this.snakeBody[i];
            if (bodyNode && bodyNode.isValid) {
                const mahjongTile = bodyNode.getComponent(MahjongTile);
                if (mahjongTile) {
                    const bodyTileType = mahjongTile.getTileType();
                    console.log(`SnakeController.removeSnakeBodyByTileType: 检查蛇身节点 ${i}: 牌型="${bodyTileType}"`);
                    console.log(`SnakeController.removeSnakeBodyByTileType: 比较 "${bodyTileType}" === "${tileType}" ? ${bodyTileType === tileType}`);
                    
                    if (bodyTileType === tileType) {
                        // 找到匹配的节点，移除它
                        console.log(`SnakeController.removeSnakeBodyByTileType: ✅ 找到匹配的蛇身节点，索引=${i}, 牌型=${bodyTileType}`);
                        
                        // 从数组中移除
                        const removedNode = this.snakeBody.splice(i, 1)[0];
                        
                        // 销毁节点
                        removedNode.destroy();
                        
                        // 重新分配所有蛇身节点的位置
                        this.adjustSnakeBodyPositionsAfterRemoval(i);
                        
                        console.log(`SnakeController.removeSnakeBodyByTileType: ✅ 成功移除蛇身节点，剩余蛇身长度: ${this.snakeBody.length}`);
                        return true;
                    }
                } else {
                    console.log(`SnakeController.removeSnakeBodyByTileType: 蛇身节点 ${i} 没有MahjongTile组件`);
                }
            } else {
                console.log(`SnakeController.removeSnakeBodyByTileType: 蛇身节点 ${i} 无效或已销毁`);
            }
        }
        
        console.warn(`SnakeController.removeSnakeBodyByTileType: ❌ 未找到牌型为 "${tileType}" 的蛇身节点`);
        console.warn(`SnakeController.removeSnakeBodyByTileType: 所有蛇身牌型:`, 
            this.snakeBody.map((node, i) => {
                if (node && node.isValid) {
                    const tile = node.getComponent(MahjongTile);
                    return tile ? `${i}:${tile.getTileType()}` : `${i}:无组件`;
                }
                return `${i}:无效节点`;
            }).join(', ')
        );
        return false;
    }
    
    /**
     * 🔥 修复：调整移除节点后的蛇身位置
     */
    private adjustSnakeBodyPositionsAfterRemoval(removedIndex: number) {
        console.log(`SnakeController.adjustSnakeBodyPositionsAfterRemoval: 调整索引${removedIndex}之后的蛇身位置`);
        
        // 🔥 使用现有的位置历史系统，重新分配所有蛇身节点的位置
        for (let i = 0; i < this.snakeBody.length; i++) {
            const bodyNode = this.snakeBody[i];
            
            // 🔥 修复：检查节点和位置是否有效
            if (!bodyNode || !bodyNode.isValid) {
                console.warn(`SnakeController.adjustSnakeBodyPositionsAfterRemoval: 蛇身节点${i}无效，跳过调整`);
                continue;
            }
            
            // 使用positions数组中的历史位置
            if (i < this.positions.length && this.positions[i]) {
                const targetPosition = this.positions[i];
                if (targetPosition && typeof targetPosition.x === 'number' && typeof targetPosition.y === 'number') {
                    bodyNode.setPosition(targetPosition);
                    console.log(`SnakeController.adjustSnakeBodyPositionsAfterRemoval: 调整节点${i}位置到历史位置 (${targetPosition.x.toFixed(1)}, ${targetPosition.y.toFixed(1)})`);
                } else {
                    console.warn(`SnakeController.adjustSnakeBodyPositionsAfterRemoval: 历史位置${i}无效，跳过调整`);
                }
            } else {
                console.warn(`SnakeController.adjustSnakeBodyPositionsAfterRemoval: 节点${i}没有对应的历史位置`);
            }
        }
        
        console.log(`SnakeController.adjustSnakeBodyPositionsAfterRemoval: 位置调整完成`);
    }
    
    public removeLastSnakeBody(): boolean {
        if (this.snakeBody.length === 0) {
            console.log("SnakeController: 蛇身为空，无法移除");
            return false;
        }
        
        // 移除最后一个蛇身节点
        const lastBodyNode = this.snakeBody.pop();
        if (lastBodyNode && lastBodyNode.isValid) {
            console.log(`SnakeController: 移除蛇身节点，剩余蛇身长度: ${this.snakeBody.length}`);
            lastBodyNode.destroy();
            return true;
        }
        
        console.error("SnakeController: 移除蛇身节点失败");
        return false;
    }
    
    public isMovementLocked(): boolean {
        return this.isLocked;
    }
    
    // 重置蛇的状态到初始状态
    public resetSnake() {
        console.log("Log.e: 重置蛇的状态");
        
        // 清空所有蛇身节点
        this.clearAllSnakeBody();
        
        // 重置蛇头位置到原点
        this.snakeHead.setPosition(0, 0, 0);
        console.log("Log.e: 蛇头位置已重置到原点 (0, 0, 0)");
        
        // 重置移动方向
        this.moveDirection = new Vec2(1, 0);
        this.nextDirection = new Vec2(1, 0);
        
        // 设置初始旋转角度（向右）
        this.rotateSnakeHead(this.moveDirection);
        
        // 清空位置历史
        this.positions = [];
        
        // 重置移动计时器
        this.moveTimer = 0;
        
        // 重置加速状态
        this.isBoosting = false;
        this.boostTimer = 0;
        this.currentSpeedMultiplier = 1.0;
        this.currentMoveSpeed = this.moveSpeed;
        
        // 重置蛇头颜色为正常状态
        this.setSnakeHeadColor(false);
        
        console.log("Log.e: 蛇状态重置完成");
    }
    
    // 清空所有蛇身节点
    public clearAllSnakeBody() {
        console.log(`Log.e: 开始清空蛇身，当前蛇身长度: ${this.snakeBody.length}`);
        
        // 销毁所有蛇身节点
        for (const bodyNode of this.snakeBody) {
            if (bodyNode && bodyNode.isValid) {
                bodyNode.destroy();
            }
        }
        
        // 清空蛇身数组
        this.snakeBody = [];
        
        // 清空位置历史
        this.positions = [];
        
        console.log("Log.e: 蛇身清空完成");
    }
    
    // 设置蛇头颜色（满14张牌时变红）
    public setSnakeHeadColor(isHandFull: boolean) {
        // 智能查找Sprite组件
        let sprite = this.findSpriteComponent();

        if (sprite) {
            if (isHandFull) {
                // 手牌满时变红色
                sprite.color = new Color(255, 100, 100, 255);
                console.log("蛇头变为红色 - 手牌已满");
            } else {
                // 正常状态恢复原始颜色
                this.restoreOriginalColor(sprite);
                console.log("蛇头恢复原始颜色 - 手牌未满");
            }
        } else {
            console.warn("SnakeController: 找不到Sprite组件，无法设置蛇头颜色");
        }
    }

    /**
     * 智能查找Sprite组件
     */
    private findSpriteComponent(): Sprite | null {
        if (!this.snakeHead) {
            return null;
        }

        // 首先尝试在根节点查找Sprite组件
        let sprite = this.snakeHead.getComponent(Sprite);

        // 如果根节点没有，尝试在Sprite子节点查找
        if (!sprite) {
            const spriteChild = this.snakeHead.getChildByName('Sprite');
            if (spriteChild) {
                sprite = spriteChild.getComponent(Sprite);
            }
        }

        return sprite;
    }

    /**
     * 恢复原始颜色
     */
    private restoreOriginalColor(sprite: Sprite) {
        // 检查是否是AI角色
        const isAICharacter = this.node.name.includes('AICharacter');

        if (isAICharacter) {
            // AI角色：恢复到设置的AI颜色
            const aiColor = (this as any)._aiCharacterColor;
            if (aiColor) {
                sprite.color = new Color(aiColor.r, aiColor.g, aiColor.b, aiColor.a);
                console.log(`AI角色恢复到原始颜色: rgb(${aiColor.r}, ${aiColor.g}, ${aiColor.b})`);
            } else {
                // 如果没有保存的AI颜色，使用白色
                sprite.color = new Color(255, 255, 255, 255);
                console.log("AI角色没有保存的颜色，恢复到白色");
            }
        } else {
            // 玩家角色：恢复到白色
            sprite.color = new Color(255, 255, 255, 255);
            console.log("玩家角色恢复到白色");
        }
    }
    
    // 🔥 新增：激活保护盾
    public activateShield() {
        if (this.hasShield) {
            // 如果已经有保护盾，重置时间
            this.shieldTimer = this.shieldDuration;
            return;
        }
        
        this.hasShield = true;
        this.shieldTimer = this.shieldDuration;
        
        // 保存原始颜色并应用金色效果
        this.applyShieldEffect();
        
        console.log(`🔥 ${this.node.name} 激活保护盾，持续 ${this.shieldDuration} 秒`);
    }
    
    // 🔥 新增：移除保护盾
    private removeShield() {
        if (!this.hasShield) return;
        
        this.hasShield = false;
        this.shieldTimer = 0;
        
        // 恢复原始颜色
        this.restoreOriginalColors();
        
        console.log(`🔥 ${this.node.name} 保护盾已移除`);
    }
    
    // 🔥 新增：应用保护盾金色效果
    private applyShieldEffect() {
        const goldColor = new Color(255, 215, 0, 255); // 金色

        // 为蛇头应用金色效果（智能查找Sprite组件）
        const headSprite = this.findSpriteComponent();
        if (headSprite) {
            // 使用蛇头节点作为key，但保存的是实际Sprite组件的颜色
            this.originalColors.set(this.snakeHead, headSprite.color.clone());
            headSprite.color = goldColor;
            console.log(`🔥 ${this.node.name} 蛇头应用保护盾金色效果`);
        } else {
            console.warn(`🔥 ${this.node.name} 找不到蛇头Sprite组件，无法应用保护盾效果`);
        }

        // 为所有蛇身应用金色效果
        for (const bodyNode of this.snakeBody) {
            if (bodyNode && bodyNode.isValid) {
                const bodySprite = bodyNode.getComponent(Sprite);
                if (bodySprite) {
                    this.originalColors.set(bodyNode, bodySprite.color.clone());
                    bodySprite.color = goldColor;
                }
            }
        }
    }
    
    // 🔥 新增：恢复原始颜色
    private restoreOriginalColors() {
        // 恢复蛇头颜色（智能查找Sprite组件）
        const headSprite = this.findSpriteComponent();
        if (headSprite && this.originalColors.has(this.snakeHead)) {
            headSprite.color = this.originalColors.get(this.snakeHead)!;
            this.originalColors.delete(this.snakeHead);
            console.log(`🔥 ${this.node.name} 蛇头恢复原始颜色`);
        } else if (!headSprite) {
            console.warn(`🔥 ${this.node.name} 找不到蛇头Sprite组件，无法恢复颜色`);
        }

        // 恢复所有蛇身颜色
        for (const bodyNode of this.snakeBody) {
            if (bodyNode && bodyNode.isValid) {
                const bodySprite = bodyNode.getComponent(Sprite);
                if (bodySprite && this.originalColors.has(bodyNode)) {
                    bodySprite.color = this.originalColors.get(bodyNode)!;
                    this.originalColors.delete(bodyNode);
                }
            }
        }

        // 清空剩余的颜色记录
        this.originalColors.clear();
    }
    
    // 🔥 新增：检查是否有保护盾
    public hasShieldActive(): boolean {
        return this.hasShield;
    }
    
    // 🔥 新增：为攻击者创建新的牌节点
    private createNewTileForAttacker(tileType: string) {
        console.log(`🔥 创建新牌节点给攻击者，牌型: ${tileType}`);
        
        const gameManager = GameManager.getInstance();
        if (!gameManager) {
            console.error("🔥 无法获取GameManager，创建新牌节点失败");
            return;
        }
        
        // 🔥 简化：直接创建一个简单的节点来代表这张牌
        const newTileNode = new Node(`AttackedTile_${tileType}`);
        
        // 添加MahjongTile组件
        const mahjongTile = newTileNode.addComponent(MahjongTile);
        if (mahjongTile) {
            // 设置牌型
            (mahjongTile as any).setTileType(tileType);
            
            // 添加到蛇身
            this.addSnakeBodyFromTile(newTileNode);
            
            console.log(`🔥 成功创建并添加新牌节点到攻击者蛇身`);
        } else {
            console.error("🔥 无法添加MahjongTile组件到新节点");
        }
    }
}