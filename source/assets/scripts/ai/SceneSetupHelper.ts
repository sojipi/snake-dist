import { _decorator, Component, Node, Vec3, Prefab, instantiate, Animation, Sprite, Color } from 'cc';
import { MultiAIManager } from './MultiAIManager';
import { MultiAIExample } from './MultiAIExample';
import { AICharacter } from './AICharacter';
import { CharacterType, CharacterConfig } from './AITypes';
import { GameManager } from '../GameManager';
import { SnakeController } from '../SnakeController';

const { ccclass, property } = _decorator;

@ccclass('SceneSetupHelper')
export class SceneSetupHelper extends Component {
    
    @property({ tooltip: "是否自动设置多角色AI系统" })
    public autoSetup: boolean = true;
    
    @property({ tooltip: "要创建的AI角色数量" })
    public aiCharacterCount: number = 3;
    
    @property({ tooltip: "角色之间的间距" })
    public characterSpacing: number = 200;
    
    @property({ type: Prefab, tooltip: "蛇头预制体节点（可选）" })
    public snakeHeadPrefab: Prefab | null = null;
    
    @property({ tooltip: "是否为现有SnakeAI启用多角色模式" })
    public upgradeExistingSnakeAI: boolean = true;
    
    private multiAIManager: MultiAIManager | null = null;
    private gameManager: GameManager | null = null;
    private gameArea: Node | null = null;
    
    start() {
        if (this.autoSetup) {
            this.setupMultiAISystem();
        }
    }
    
    /**
     * 设置多角色AI系统
     */
    public setupMultiAISystem() {
        console.log("=== 开始设置多角色AI系统 ===");
        
        // 1. 找到必要的节点
        this.findRequiredNodes();
        
        // 2. 创建多角色AI管理器
        this.createMultiAIManager();
        
        // 3. 升级现有的SnakeAI
        if (this.upgradeExistingSnakeAI) {
            this.upgradeExistingSnakeAI_();
        }
        
        // 4. 创建额外的AI角色
        this.createAdditionalAICharacters();
        
        // 5. 配置所有角色
        this.configureAllCharacters();
        
        console.log("=== 多角色AI系统设置完成 ===");
    }
    
    /**
     * 查找必要的节点
     */
    private findRequiredNodes() {
        console.log("正在查找场景节点...");
        
        // 查找GameManager
        this.gameManager = this.node.scene.getComponentInChildren(GameManager);
        if (!this.gameManager) {
            console.error("未找到GameManager组件！");
            return;
        }
        console.log("✓ 找到GameManager");
        
        // 查找GameArea
        this.gameArea = this.node.scene.getChildByName('Canvas')?.getChildByName('GameArea');
        if (!this.gameArea) {
            console.error("未找到GameArea节点！");
            return;
        }
        console.log("✓ 找到GameArea");
    }
    
    /**
     * 创建多角色AI管理器
     */
    private createMultiAIManager() {
        console.log("正在创建多角色AI管理器...");
        
        // 🔥 首先检查是否已经存在MultiAIManager实例
        const existingManager = MultiAIManager.getInstance();
        if (existingManager) {
            console.log("✓ 发现现有MultiAIManager实例，直接使用");
            this.multiAIManager = existingManager;
            
            // 配置管理器参数
            this.multiAIManager.enableMultiAI = true;
            this.multiAIManager.updateInterval = 0.1;
            this.multiAIManager.maxCharacters = 10;
            this.multiAIManager.avoidanceDistance = 60;
            
            console.log("✓ 现有MultiAIManager配置已更新");
            return;
        }
        
        // 如果不存在，创建新的管理器
        const managerNode = new Node("MultiAIManager");
        managerNode.setParent(this.gameArea!);
        managerNode.setPosition(0, 0, 0);
        
        // 添加MultiAIManager组件
        this.multiAIManager = managerNode.addComponent(MultiAIManager);
        
        // 配置管理器参数
        this.multiAIManager.enableMultiAI = true;
        this.multiAIManager.updateInterval = 0.1;
        this.multiAIManager.maxCharacters = 10;
        this.multiAIManager.avoidanceDistance = 60;
        
        console.log("✓ 新MultiAIManager创建完成");
        
        // 添加示例组件（可选）
        const exampleComponent = managerNode.addComponent(MultiAIExample);
        exampleComponent.managerNode = managerNode;
        exampleComponent.autoCreateCharacters = false; // 我们手动创建
        
        console.log("✓ 示例组件已添加");
    }
    
    /**
     * 升级现有的SnakeAI
     */
    private upgradeExistingSnakeAI_() {
        console.log("正在升级现有的SnakeAI...");
        
        if (!this.gameManager) {
            console.error("GameManager未找到，无法升级SnakeAI");
            return;
        }
        
        // 查找SnakeAI组件
        const snakeAI = this.gameManager.getComponent('SnakeAI');
        if (!snakeAI) {
            console.error("未找到SnakeAI组件");
            return;
        }
        
        // 设置多角色模式
        (snakeAI as any).useMultiAI = true;
        (snakeAI as any).characterName = "主角蛇";
        (snakeAI as any).characterType = CharacterType.SNAKE;
        
        console.log("✓ 现有SnakeAI已升级为多角色模式");
    }
    
    /**
     * 创建额外的AI角色
     */
    private createAdditionalAICharacters() {
        console.log(`正在创建 ${this.aiCharacterCount} 个额外AI角色...`);
        
        if (!this.multiAIManager || !this.gameArea) {
            console.error("必要组件未找到，无法创建AI角色");
            return;
        }
        
        const centerPos = Vec3.ZERO;
        const createdCharacters: Node[] = [];
        
        for (let i = 0; i < this.aiCharacterCount; i++) {
            const character = this.createSingleAICharacter(i, centerPos, createdCharacters.length);
            if (character) {
                createdCharacters.push(character);
            }
        }
        
        console.log(`✓ 成功创建 ${createdCharacters.length} 个AI角色`);
    }
    
    /**
     * 创建单个AI角色
     */
    private createSingleAICharacter(index: number, centerPos: Vec3, existingCount: number): Node | null {
        // 计算角色位置（围绕中心点分布）
        const angle = (index / this.aiCharacterCount) * Math.PI * 2;
        const radius = this.characterSpacing;
        const x = centerPos.x + Math.cos(angle) * radius;
        const y = centerPos.y + Math.sin(angle) * radius;
        
        // 🔥 直接创建蛇头节点在Canvas层
        let snakeHead: Node;
        if (this.snakeHeadPrefab) {
            snakeHead = instantiate(this.snakeHeadPrefab);
            snakeHead.name = `AICharacter_${index + 1}`;
            snakeHead.setParent(this.gameArea!);
            snakeHead.setPosition(x, y, 0);
            console.log(`✓ 使用预制体创建AI角色: ${snakeHead.name}`);
        } else {
            // 如果没有预制体，创建一个简单的节点
            snakeHead = new Node(`AICharacter_${index + 1}`);
            snakeHead.setParent(this.gameArea!);
            snakeHead.setPosition(x, y, 0);
            console.log(`✓ 创建AI角色节点: ${snakeHead.name}`);
        }
        
        // 添加SnakeController组件到蛇头节点
        const snakeController = snakeHead.addComponent(SnakeController);

        // 🔥 设置snakeHead属性为自身
        snakeController.snakeHead = snakeHead;
        console.log(`✓ 设置SnakeController.snakeHead: ${snakeHead.name}`);

        // 🔥 如果使用预制体，设置Animation组件引用
        if (this.snakeHeadPrefab) {
            const spriteChild = snakeHead.getChildByName('Sprite');
            if (spriteChild) {
                const animation = spriteChild.getComponent(Animation);
                if (animation) {
                    snakeController.snakeHeadAnimation = animation;
                    console.log(`✓ 设置Animation组件引用: ${spriteChild.name}`);
                } else {
                    console.log(`✓ 预制体Sprite子节点没有Animation组件`);
                }
            } else {
                console.log(`✓ 预制体没有找到Sprite子节点`);
            }
        }

        console.log(`✓ 创建角色控制器: ${snakeHead.name}`);

        // 🔥 为AI角色设置不同颜色
        this.setAICharacterColor(snakeController, index);
        
        console.log(`✓ 配置SnakeController: ${snakeHead.name} -> ${this.snakeHeadPrefab ? '使用预制体' : '自动创建'}`);
        
        // 配置SnakeController参数
        snakeController.moveSpeed = 0.3 + (index * 0.1); // 不同速度
        snakeController.gridSize = 40;
        
        // 创建角色配置
        const characterTypes = [CharacterType.SNAKE, CharacterType.ENEMY, CharacterType.NPC];
        const characterType = characterTypes[index % characterTypes.length];
        const characterName = this.getCharacterName(characterType, index);
        
        const config = this.multiAIManager!.createDefaultCharacterConfig(
            `ai_character_${index + 1}`,
            characterName,
            characterType,
            snakeHead,
            {
                enabled: true,
                priority: index + 2, // 主角蛇优先级为1，其他从2开始
                aiConfig: {
                    decisionInterval: 0.3 + (index * 0.1),
                    searchRadius: 400 + (index * 50),
                    speedMultiplier: 0.8 + (index * 0.1),
                    obstacleDetectionRange: 80,
                    maxHistoryLength: 10,
                    stuckThreshold: 6,
                    explorationBias: 0.7 + (index * 0.05),
                    characterId: `ai_character_${index + 1}`,
                    avoidOtherCharacters: true,
                    cooperationMode: index % 2 === 0 // 偶数开启协作
                }
            }
        );
        
        // 添加角色到管理器
        const aiCharacter = this.multiAIManager!.addCharacter(config);
        
        if (aiCharacter) {
            console.log(`✓ 创建AI角色: ${characterName} (位置: ${x.toFixed(1)}, ${y.toFixed(1)})`);
            return snakeHead;
        } else {
            console.error(`✗ 创建AI角色失败: ${characterName}`);
            snakeHead.destroy();
            return null;
        }
    }
    

    
    /**
     * 为AI角色设置不同的颜色
     */
    private setAICharacterColor(snakeController: SnakeController, index: number) {
        // 定义不同的颜色方案
        const colors = [
            { r: 255, g: 100, b: 100, a: 255 },  // 红色
            { r: 100, g: 255, b: 100, a: 255 },  // 绿色
            { r: 100, g: 100, b: 255, a: 255 },  // 蓝色
            { r: 255, g: 255, b: 100, a: 255 },  // 黄色
            { r: 255, g: 100, b: 255, a: 255 },  // 紫色
            { r: 100, g: 255, b: 255, a: 255 },  // 青色
            { r: 255, g: 150, b: 100, a: 255 },  // 橙色
            { r: 150, g: 255, b: 150, a: 255 },  // 浅绿色
        ];

        const colorData = colors[index % colors.length];
        const color = new Color(colorData.r, colorData.g, colorData.b, colorData.a);

        // 获取蛇头节点
        const snakeHead = snakeController.snakeHead;
        if (!snakeHead) {
            console.warn(`✗ AI角色 ${index + 1} 蛇头节点不存在，无法设置颜色`);
            return;
        }

        // 查找Sprite组件并设置颜色
        let spriteComponent: Sprite | null = null;

        // 首先尝试在根节点查找Sprite组件
        spriteComponent = snakeHead.getComponent(Sprite);

        // 如果根节点没有，尝试在Sprite子节点查找
        if (!spriteComponent) {
            const spriteChild = snakeHead.getChildByName('Sprite');
            if (spriteChild) {
                spriteComponent = spriteChild.getComponent(Sprite);
            }
        }

        // 应用颜色
        if (spriteComponent) {
            spriteComponent.color = color;
            console.log(`✓ AI角色 ${index + 1} 设置颜色为: rgb(${colorData.r}, ${colorData.g}, ${colorData.b})`);
        } else {
            console.warn(`✗ AI角色 ${index + 1} 没有找到Sprite组件，无法设置颜色`);
        }

        // 保存颜色信息到SnakeController（用于其他地方可能需要的颜色信息）
        (snakeController as any)._aiCharacterColor = colorData;
    }
    
    /**
     * 获取角色名称
     */
    private getCharacterName(type: CharacterType, index: number): string {
        switch (type) {
            case CharacterType.SNAKE:
                return `AI蛇_${index + 1}`;
            case CharacterType.ENEMY:
                return `敌人_${index + 1}`;
            case CharacterType.NPC:
                return `NPC_${index + 1}`;
            default:
                return `角色_${index + 1}`;
        }
    }
    
    /**
     * 配置所有角色
     */
    private configureAllCharacters() {
        console.log("正在配置所有AI角色...");
        
        if (!this.multiAIManager) {
            console.error("MultiAIManager未找到，无法配置角色");
            return;
        }
        
        const allCharacters = this.multiAIManager.getAllCharacters();
        
        allCharacters.forEach((character) => {
            const config = character.getConfig();
            
            if (character instanceof AICharacter) {
                // 根据角色类型设置不同的AI参数
                switch (config.type) {
                    case CharacterType.SNAKE:
                        character.setDecisionInterval(0.3);
                        character.setSearchRadius(500);
                        character.setSpeedMultiplier(1.0);
                        character.setCooperationMode(false);
                        character.setAvoidOtherCharacters(true);
                        break;
                        
                    case CharacterType.ENEMY:
                        character.setDecisionInterval(0.4);
                        character.setSearchRadius(400);
                        character.setSpeedMultiplier(0.8);
                        character.setCooperationMode(true);
                        character.setAvoidOtherCharacters(true);
                        break;
                        
                    case CharacterType.NPC:
                        character.setDecisionInterval(0.5);
                        character.setSearchRadius(300);
                        character.setSpeedMultiplier(0.6);
                        character.setCooperationMode(false);
                        character.setAvoidOtherCharacters(true);
                        break;
                }
                
                console.log(`✓ 配置角色: ${config.name} (类型: ${config.type})`);
            }
        });
        
        console.log(`✓ 所有 ${allCharacters.length} 个角色配置完成`);
    }
    
    /**
     * 获取管理器统计信息
     */
    public getStats() {
        if (!this.multiAIManager) {
            console.log("多角色AI管理器未初始化");
            return null;
        }
        
        const stats = this.multiAIManager.getManagerStats();
        
        console.log("=== 多角色AI系统统计 ===");
        console.log(`总角色数量: ${stats.totalCharacters}`);
        console.log(`活跃角色数量: ${stats.activeCharacters}`);
        console.log(`系统状态: ${stats.isRunning ? '运行中' : '已停止'}`);
        console.log(`更新间隔: ${stats.updateInterval} 秒`);
        
        console.log("\n=== 角色详情 ===");
        stats.characterStats.forEach((char, index) => {
            console.log(`${index + 1}. ${char.name} (${char.type})`);
            console.log(`   状态: ${char.enabled ? '启用' : '禁用'}`);
            console.log(`   AI状态: ${char.aiStats.state}`);
            console.log(`   有目标: ${char.hasTarget ? '是' : '否'}`);
        });
        
        return stats;
    }
    
    /**
     * 手动启动/停止多角色AI系统
     */
    public toggleMultiAISystem() {
        if (!this.multiAIManager) {
            console.log("多角色AI管理器未初始化，正在设置...");
            this.setupMultiAISystem();
            return;
        }
        
        const currentState = this.multiAIManager.enableMultiAI;
        this.multiAIManager.setMultiAIEnabled(!currentState);
        
        console.log(`多角色AI系统 ${!currentState ? '已启用' : '已禁用'}`);
    }
    
    /**
     * 演示避让功能
     */
    public demonstrateAvoidance() {
        if (!this.multiAIManager) {
            console.log("多角色AI管理器未初始化");
            return;
        }
        
        const allCharacters = this.multiAIManager.getAllCharacters();
        
        allCharacters.forEach(character => {
            if (character instanceof AICharacter) {
                character.setAvoidOtherCharacters(true);
            }
        });
        
        // 设置较小的避让距离以观察效果
        this.multiAIManager.setAvoidanceDistance(80);
        
        console.log("✓ 避让功能演示已启用");
        console.log("所有角色现在会避开彼此，避让距离: 80像素");
    }
    
    /**
     * 演示协作功能
     */
    public demonstrateCooperation() {
        if (!this.multiAIManager) {
            console.log("多角色AI管理器未初始化");
            return;
        }
        
        const allCharacters = this.multiAIManager.getAllCharacters();
        
        allCharacters.forEach((character, index) => {
            if (character instanceof AICharacter) {
                // 一半角色启用协作模式
                character.setCooperationMode(index % 2 === 0);
                console.log(`角色 ${character.getName()}: 协作模式 ${index % 2 === 0 ? '开启' : '关闭'}`);
            }
        });
        
        console.log("✓ 协作功能演示已启用");
    }
    
    /**
     * 重置系统
     */
    public resetSystem() {
        if (this.multiAIManager) {
            this.multiAIManager.clearAllCharacters();
            console.log("✓ 多角色AI系统已重置");
        }
    }
} 