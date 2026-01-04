import { _decorator, Component, Node, Vec3 } from 'cc';
import { MultiAIManager } from './MultiAIManager';
import { 
    CharacterConfig, 
    CharacterType, 
    AIConfig, 
    IAICharacter 
} from './AITypes';

const { ccclass, property } = _decorator;

@ccclass('MultiAIExample')
export class MultiAIExample extends Component {
    
    @property({ type: Node, tooltip: "AI管理器节点" })
    managerNode: Node = null!;
    
    @property({ type: [Node], tooltip: "角色控制器节点列表" })
    characterNodes: Node[] = [];
    
    @property({ tooltip: "是否在启动时自动创建角色" })
    autoCreateCharacters: boolean = true;
    
    @property({ tooltip: "创建的角色数量" })
    characterCount: number = 3;
    
    private multiAIManager: MultiAIManager = null!;
    private createdCharacters: IAICharacter[] = [];
    
    start() {
        this.setupMultiAIManager();
        
        if (this.autoCreateCharacters) {
            this.createExampleCharacters();
        }
    }
    
    /**
     * 设置多角色AI管理器
     */
    private setupMultiAIManager() {
        if (!this.managerNode) {
            console.error("MultiAIExample: managerNode 未设置");
            return;
        }
        
        // 添加MultiAIManager组件
        this.multiAIManager = this.managerNode.addComponent(MultiAIManager);
        
        // 配置管理器参数
        this.multiAIManager.enableMultiAI = true;
        this.multiAIManager.updateInterval = 0.1;
        this.multiAIManager.maxCharacters = 10;
        this.multiAIManager.avoidanceDistance = 60;
        
        console.log("MultiAIExample: 多角色AI管理器已设置");
    }
    
    /**
     * 创建示例角色
     */
    private createExampleCharacters() {
        if (!this.multiAIManager) {
            console.error("MultiAIExample: multiAIManager 未初始化");
            return;
        }
        
        const charactersToCreate = Math.min(this.characterCount, this.characterNodes.length);
        
        for (let i = 0; i < charactersToCreate; i++) {
            const characterNode = this.characterNodes[i];
            if (!characterNode) continue;
            
            const config = this.createCharacterConfig(i, characterNode);
            const character = this.multiAIManager.addCharacter(config);
            
            if (character) {
                this.createdCharacters.push(character);
                console.log(`MultiAIExample: 创建角色 ${config.name} 成功`);
            }
        }
        
        console.log(`MultiAIExample: 成功创建 ${this.createdCharacters.length} 个角色`);
    }
    
    /**
     * 创建角色配置
     */
    private createCharacterConfig(index: number, controllerNode: Node): CharacterConfig {
        const characterId = `character_${index}`;
        const characterName = `AI角色_${index + 1}`;
        
        // 根据索引决定角色类型
        const characterType = this.getCharacterType(index);
        
        // 创建AI配置
        const aiConfig: AIConfig = {
            decisionInterval: 0.3 + (index * 0.1), // 不同角色有不同的决策间隔
            searchRadius: 400 + (index * 100),      // 不同搜索半径
            speedMultiplier: 0.8 + (index * 0.2),  // 不同速度
            obstacleDetectionRange: 80,
            maxHistoryLength: 10,
            stuckThreshold: 6,
            explorationBias: 0.7 + (index * 0.1),  // 不同探索倾向
            characterId: characterId,
            avoidOtherCharacters: true,
            cooperationMode: index % 2 === 0 // 偶数角色开启协作模式
        };
        
        // 使用管理器创建默认配置
        const config = this.multiAIManager.createDefaultCharacterConfig(
            characterId,
            characterName,
            characterType,
            controllerNode,
            {
                aiConfig: aiConfig,
                enabled: true,
                priority: index + 1 // 优先级从1开始
            }
        );
        
        return config;
    }
    
    /**
     * 根据索引获取角色类型
     */
    private getCharacterType(index: number): CharacterType {
        const types = [CharacterType.SNAKE, CharacterType.ENEMY, CharacterType.NPC];
        return types[index % types.length];
    }
    
    /**
     * 设置角色AI参数的示例
     */
    public configureCharacterAI(characterId: string) {
        const character = this.multiAIManager.getCharacter(characterId);
        if (!character) {
            console.error(`MultiAIExample: 角色 ${characterId} 不存在`);
            return;
        }
        
        // 这里演示如何配置角色AI参数
        if (character instanceof require('./AICharacter').AICharacter) {
            character.setDecisionInterval(0.5);
            character.setSearchRadius(600);
            character.setSpeedMultiplier(1.2);
            character.setCooperationMode(true);
            character.setAvoidOtherCharacters(true);
            
            console.log(`MultiAIExample: 角色 ${characterId} AI参数已配置`);
        }
    }
    
    /**
     * 启用/禁用角色
     */
    public toggleCharacter(characterId: string) {
        const character = this.multiAIManager.getCharacter(characterId);
        if (!character) {
            console.error(`MultiAIExample: 角色 ${characterId} 不存在`);
            return;
        }
        
        const currentState = character.isEnabled();
        this.multiAIManager.setCharacterEnabled(characterId, !currentState);
        
        console.log(`MultiAIExample: 角色 ${characterId} ${!currentState ? '已启用' : '已禁用'}`);
    }
    
    /**
     * 动态添加角色
     */
    public addDynamicCharacter(controllerNode: Node, characterType: CharacterType = CharacterType.SNAKE) {
        if (!this.multiAIManager) {
            console.error("MultiAIExample: multiAIManager 未初始化");
            return null;
        }
        
        const timestamp = Date.now();
        const characterId = `dynamic_${timestamp}`;
        const characterName = `动态角色_${timestamp}`;
        
        const config = this.multiAIManager.createDefaultCharacterConfig(
            characterId,
            characterName,
            characterType,
            controllerNode,
            {
                enabled: true,
                priority: 5 // 动态角色优先级为5
            }
        );
        
        const character = this.multiAIManager.addCharacter(config);
        
        if (character) {
            this.createdCharacters.push(character);
            console.log(`MultiAIExample: 成功添加动态角色 ${characterName}`);
        }
        
        return character;
    }
    
    /**
     * 移除角色
     */
    public removeCharacter(characterId: string) {
        const success = this.multiAIManager.removeCharacter(characterId);
        
        if (success) {
            // 从本地列表中移除
            this.createdCharacters = this.createdCharacters.filter(char => 
                char.getId() !== characterId
            );
            
            console.log(`MultiAIExample: 成功移除角色 ${characterId}`);
        }
        
        return success;
    }
    
    /**
     * 获取管理器统计信息
     */
    public getManagerStats() {
        if (!this.multiAIManager) {
            console.error("MultiAIExample: multiAIManager 未初始化");
            return null;
        }
        
        const stats = this.multiAIManager.getManagerStats();
        
        console.log("=== 多角色AI管理器统计信息 ===");
        console.log(`总角色数量: ${stats.totalCharacters}`);
        console.log(`活跃角色数量: ${stats.activeCharacters}`);
        console.log(`系统运行状态: ${stats.isRunning ? '运行中' : '已停止'}`);
        console.log(`更新间隔: ${stats.updateInterval} 秒`);
        
        console.log("\n=== 角色详细信息 ===");
        stats.characterStats.forEach((char, index) => {
            console.log(`角色 ${index + 1}:`);
            console.log(`  ID: ${char.id}`);
            console.log(`  名称: ${char.name}`);
            console.log(`  类型: ${char.type}`);
            console.log(`  状态: ${char.enabled ? '启用' : '禁用'}`);
            console.log(`  AI状态: ${char.aiStats.state}`);
            console.log(`  有目标: ${char.hasTarget ? '是' : '否'}`);
            console.log(`  ---`);
        });
        
        return stats;
    }
    
    /**
     * 批量配置角色
     */
    public batchConfigureCharacters() {
        if (!this.multiAIManager) {
            return;
        }
        
        const allCharacters = this.multiAIManager.getAllCharacters();
        
        allCharacters.forEach((character, index) => {
            const config = character.getConfig();
            
            // 为不同角色设置不同的AI参数
            if (character instanceof require('./AICharacter').AICharacter) {
                switch (config.type) {
                    case CharacterType.SNAKE:
                        character.setDecisionInterval(0.3);
                        character.setSearchRadius(500);
                        character.setSpeedMultiplier(1.0);
                        character.setCooperationMode(false);
                        break;
                        
                    case CharacterType.ENEMY:
                        character.setDecisionInterval(0.4);
                        character.setSearchRadius(400);
                        character.setSpeedMultiplier(0.8);
                        character.setCooperationMode(true);
                        break;
                        
                    case CharacterType.NPC:
                        character.setDecisionInterval(0.5);
                        character.setSearchRadius(300);
                        character.setSpeedMultiplier(0.6);
                        character.setCooperationMode(false);
                        break;
                }
            }
        });
        
        console.log(`MultiAIExample: 批量配置完成，共配置 ${allCharacters.length} 个角色`);
    }
    
    /**
     * 启用/禁用整个多角色AI系统
     */
    public toggleMultiAISystem() {
        if (!this.multiAIManager) {
            return;
        }
        
        const currentState = this.multiAIManager.enableMultiAI;
        this.multiAIManager.setMultiAIEnabled(!currentState);
        
        console.log(`MultiAIExample: 多角色AI系统 ${!currentState ? '已启用' : '已禁用'}`);
    }
    
    /**
     * 清理所有角色
     */
    public clearAllCharacters() {
        if (!this.multiAIManager) {
            return;
        }
        
        this.multiAIManager.clearAllCharacters();
        this.createdCharacters = [];
        
        console.log("MultiAIExample: 已清理所有角色");
    }
    
    /**
     * 展示角色避让功能
     */
    public demonstrateAvoidance() {
        if (!this.multiAIManager) {
            return;
        }
        
        const allCharacters = this.multiAIManager.getAllCharacters();
        
        // 设置所有角色都开启避让
        allCharacters.forEach(character => {
            if (character instanceof require('./AICharacter').AICharacter) {
                character.setAvoidOtherCharacters(true);
            }
        });
        
        // 减少避让距离以观察效果
        this.multiAIManager.setAvoidanceDistance(80);
        
        console.log("MultiAIExample: 避让功能演示已启用");
    }
    
    /**
     * 展示协作功能
     */
    public demonstrateCooperation() {
        if (!this.multiAIManager) {
            return;
        }
        
        const allCharacters = this.multiAIManager.getAllCharacters();
        
        // 设置一半角色开启协作模式
        allCharacters.forEach((character, index) => {
            if (character instanceof require('./AICharacter').AICharacter) {
                character.setCooperationMode(index % 2 === 0);
            }
        });
        
        console.log("MultiAIExample: 协作功能演示已启用");
    }
    
    /**
     * 获取创建的角色列表
     */
    public getCreatedCharacters(): IAICharacter[] {
        return [...this.createdCharacters];
    }
    
    /**
     * 获取多角色AI管理器
     */
    public getMultiAIManager(): MultiAIManager {
        return this.multiAIManager;
    }
}

// 导出示例使用方法
export const MultiAIUsageExample = {
    /**
     * 基本使用示例
     */
    basicUsage: `
    // 1. 创建多角色AI管理器
    const managerNode = new Node("MultiAIManager");
    const multiAIManager = managerNode.addComponent(MultiAIManager);
    
    // 2. 配置管理器参数
    multiAIManager.enableMultiAI = true;
    multiAIManager.updateInterval = 0.1;
    multiAIManager.maxCharacters = 5;
    multiAIManager.avoidanceDistance = 60;
    
    // 3. 创建角色配置
    const config = multiAIManager.createDefaultCharacterConfig(
        "character_1",
        "AI角色1",
        CharacterType.SNAKE,
        characterNode,
        {
            enabled: true,
            priority: 1
        }
    );
    
    // 4. 添加角色
    const character = multiAIManager.addCharacter(config);
    
    // 5. 配置角色AI参数
    character.setDecisionInterval(0.3);
    character.setSearchRadius(500);
    character.setCooperationMode(true);
    `,
    
    /**
     * 高级使用示例
     */
    advancedUsage: `
    // 批量添加多个角色
    const configs = [
        multiAIManager.createDefaultCharacterConfig("snake_1", "蛇1", CharacterType.SNAKE, node1),
        multiAIManager.createDefaultCharacterConfig("enemy_1", "敌人1", CharacterType.ENEMY, node2),
        multiAIManager.createDefaultCharacterConfig("npc_1", "NPC1", CharacterType.NPC, node3)
    ];
    
    const characters = multiAIManager.addCharacters(configs);
    
    // 动态配置角色
    characters.forEach((character, index) => {
        character.setDecisionInterval(0.3 + index * 0.1);
        character.setAvoidOtherCharacters(true);
        character.setCooperationMode(index % 2 === 0);
    });
    
    // 获取统计信息
    const stats = multiAIManager.getManagerStats();
    console.log("活跃角色数量:", stats.activeCharacters);
    `
}; 