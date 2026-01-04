import { _decorator, Component, Node, Prefab, instantiate, UITransform, Collider2D, RigidBody2D, BoxCollider2D, Vec3, math, ERigidBody2DType } from 'cc';
import { MahjongTile, MahjongType } from './MahjongTile';
import { SnakeController } from './SnakeController';
import { HandCardManager } from './HandCardManager';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('TestModeManager')
export class TestModeManager extends Component {
    @property(Prefab)
    mahjongTilePrefab: Prefab = null!;
    
    @property({ tooltip: "测试模式生成的牌数量" })
    testTileCount: number = 10;
    
    private canvas: Node = null!;
    private snakeController: SnakeController = null!;
    private handCardManager: HandCardManager = null!;
    private handCards: string[] = [];
    private gameManager: GameManager = null!;
    
    public initialize(canvas: Node, snakeController: SnakeController, handCardManager: HandCardManager, handCards: string[]) {
        this.canvas = canvas;
        this.snakeController = snakeController;
        this.handCardManager = handCardManager;
        this.handCards = handCards;
        this.gameManager = GameManager.getInstance();
    }
    
    public generateTestTiles(): number {
        console.log("测试模式：开始生成测试牌到手牌和蛇身");
        
        // 生成指定数量的测试牌
        const generatedCount = this.generateTestTilesToHandAndSnake();
        
        console.log(`测试模式：成功生成 ${generatedCount} 张测试牌`);
        return generatedCount;
    }
    
    private generateTestTilesToHandAndSnake(): number {
        if (!this.snakeController || !this.handCardManager) {
            console.error("测试模式：SnakeController 或 HandCardManager 未初始化");
            return 0;
        }
        
        // 🔥 获取当前关卡的示例牌型
        const currentLevelExampleTiles = this.getCurrentLevelExampleTiles();
        if (!currentLevelExampleTiles || currentLevelExampleTiles.length === 0) {
            console.warn("测试模式：无法获取当前关卡示例牌型，使用默认牌型");
            return this.generateDefaultTestTiles();
        }
        
        console.log(`测试模式：使用当前关卡示例牌型，共${currentLevelExampleTiles.length}张牌`);
        console.log(`测试模式：示例牌型: ${currentLevelExampleTiles.join(', ')}`);
        
        // 确保不超过设定的数量
        const tilesToGenerate = Math.min(this.testTileCount, currentLevelExampleTiles.length);
        let successCount = 0;
        
        for (let i = 0; i < tilesToGenerate; i++) {
            const tileTypeEnum = currentLevelExampleTiles[i];
            const tileTypeString = tileTypeEnum.toString();
            
            // 添加到手牌
            const addedToHand = this.gameManager.addHandCard(tileTypeString);
            if (addedToHand) {
                // 同时添加到蛇身
                const addedToSnake = this.addTileToSnakeBodyByEnum(tileTypeEnum);
                if (addedToSnake) {
                    successCount++;
                    console.log(`测试模式：成功添加牌型 ${tileTypeEnum}(${this.getTileTypeName(tileTypeEnum)}) 到手牌和蛇身 (第${i+1}张)`);
                } else {
                    console.warn(`测试模式：牌型 ${tileTypeEnum} 添加到蛇身失败`);
                }
            } else {
                console.warn(`测试模式：牌型 ${tileTypeEnum} 添加到手牌失败`);
                break; // 如果手牌满了就停止
            }
        }
        
        console.log(`测试模式：总共生成了 ${successCount} 张测试牌`);
        return successCount;
    }
    

    
    // 🔥 获取当前关卡的示例牌型
    private getCurrentLevelExampleTiles(): number[] {
        try {
            const levelConfig = this.gameManager.getCurrentLevelConfig();
            if (!levelConfig || !levelConfig.targetYaku) {
                console.warn("测试模式：无法获取当前关卡配置");
                return [];
            }
            
            const targetYaku = levelConfig.targetYaku;
            console.log(`测试模式：当前关卡目标役种: ${targetYaku}`);
            
            // 复制LevelInfoDialog中的getExampleTiles逻辑
            const exampleTiles = this.getExampleTiles(targetYaku);
            console.log(`测试模式：获取到示例牌型: ${exampleTiles.join(', ')}`);
            
            return exampleTiles;
        } catch (error) {
            console.error("测试模式：获取当前关卡示例牌型时出错", error);
            return [];
        }
    }
    
    // 🔥 根据目标役种返回示例牌型（复制自LevelInfoDialog）
    private getExampleTiles(targetYaku: string): number[] {
        // 根据目标役种返回示例牌型
        switch (targetYaku.toLowerCase()) {
            case 'tanyao':
                // 断幺九示例：不包含字牌和幺九牌的和牌
                return [2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7, 5, 5];
            case 'yakuhai':
                // 役牌示例：包含风牌或三元牌的刻子
                return [31, 31, 31, 19, 19, 19, 2, 3, 4, 5, 6, 7, 8, 8];
            case 'pinfu':
                // 平和示例：四组顺子和一对雀头
                return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 5, 5];
            case 'toitoi':
                // 对对和示例：四组刻子和一对雀头
                return [1, 1, 1, 4, 4, 4, 7, 7, 7, 10, 10, 10, 5, 5];
            case 'honitsu':
                // 混一色示例：所有牌都是同一花色或字牌
                return [1, 2, 3, 4, 5, 6, 7, 8, 9, 31, 31, 31, 5, 5];
            case 'chinitsu':
                // 清一色示例：所有牌都是同一花色
                return [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 5, 5];
            case 'chitoitsu':
                // 七对子示例：由7个对子组成
                return [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7];
            case 'ipeko':
                // 一杯口示例：包含一组相同的顺子
                return [1, 2, 3, 1, 2, 3, 4, 5, 6, 7, 8, 9, 5, 5];
            case 'sanshoku':
                // 三色同顺示例：万饼条都有同样的顺子
                return [1, 2, 3, 10, 11, 12, 22, 23, 24, 4, 5, 6, 7, 7];
            case 'ittsu':
                // 一气通贯示例：同一花色的1-9
                return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 5, 5];
            default:
                // 默认示例
                return [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5];
        }
    }
    
    // 🔥 生成默认测试牌型（当无法获取关卡示例时使用）
    private generateDefaultTestTiles(): number {
        const defaultTiles = [1, 1, 1, 2, 3, 4, 5, 5]; // 一饼刻子 + 二三四饼顺子 + 五饼对子
        let successCount = 0;
        
        const tilesToGenerate = Math.min(this.testTileCount, defaultTiles.length);
        
        for (let i = 0; i < tilesToGenerate; i++) {
            const tileTypeEnum = defaultTiles[i];
            const tileTypeString = tileTypeEnum.toString();
            
            const addedToHand = this.gameManager.addHandCard(tileTypeString);
            if (addedToHand) {
                const addedToSnake = this.addTileToSnakeBodyByEnum(tileTypeEnum);
                if (addedToSnake) {
                    successCount++;
                    console.log(`测试模式：成功添加默认牌型 ${tileTypeEnum}(${this.getTileTypeName(tileTypeEnum)}) 到手牌和蛇身 (第${i+1}张)`);
                }
            }
        }
        
        return successCount;
    }
    
    // 🔥 使用枚举值添加到蛇身
    private addTileToSnakeBodyByEnum(tileTypeEnum: number): boolean {
        if (!this.mahjongTilePrefab || !this.canvas) {
            console.error("测试模式：缺少麻将牌Prefab或Canvas");
            return false;
        }
        
        try {
            const tileNode = instantiate(this.mahjongTilePrefab);
            tileNode.setParent(this.canvas);
            
            const mahjongTile = tileNode.getComponent(MahjongTile);
            if (!mahjongTile) {
                console.error("测试模式：无法获取MahjongTile组件");
                tileNode.destroy();
                return false;
            }
            
            // 直接使用枚举值设置牌型
            mahjongTile.setTileType(tileTypeEnum as MahjongType);
            
            let uiTransform = tileNode.getComponent(UITransform);
            if (!uiTransform) {
                uiTransform = tileNode.addComponent(UITransform);
            }
            uiTransform.setContentSize(60, 80);
            
            return this.addTileToSnakeBodyDirect(tileNode);
            
        } catch (error) {
            console.error("测试模式：创建麻将牌时发生错误", error);
            return false;
        }
    }
    
    // 🔥 获取牌型名称
    private getTileTypeName(tileTypeEnum: number): string {
        switch (tileTypeEnum) {
            // 饼子
            case 1: return "一饼";
            case 2: return "二饼";
            case 3: return "三饼";
            case 4: return "四饼";
            case 5: return "五饼";
            case 6: return "六饼";
            case 7: return "七饼";
            case 8: return "八饼";
            case 9: return "九饼";
            
            // 条子
            case 10: return "一条";
            case 11: return "二条";
            case 12: return "三条";
            case 13: return "四条";
            case 14: return "五条";
            case 15: return "六条";
            case 16: return "七条";
            case 17: return "八条";
            case 18: return "九条";
            
            // 中发白
            case 19: return "红中";
            case 20: return "发财";
            case 21: return "白板";
            
            // 万字
            case 22: return "一万";
            case 23: return "二万";
            case 24: return "三万";
            case 25: return "四万";
            case 26: return "五万";
            case 27: return "六万";
            case 28: return "七万";
            case 29: return "八万";
            case 30: return "九万";
            
            // 东西南北
            case 31: return "东";
            case 32: return "南";
            case 33: return "西";
            case 34: return "北";
            
            default: return "未知";
        }
    }
    
    // 🔥 新增：直接添加到蛇身的方法，不依赖于移动历史
    private addTileToSnakeBodyDirect(tileNode: Node): boolean {
        try {
            console.log("测试模式：直接添加麻将牌到蛇身");
            
            // 获取蛇头位置和当前蛇身数组
            const snakeHeadPos = this.snakeController.snakeHead.position;
            const snakeBody = (this.snakeController as any).snakeBody;
            const gridSize = (this.snakeController as any).gridSize || 40;
            
            // 计算新蛇身节点的位置
            let newPos: Vec3;
            if (snakeBody.length === 0) {
                // 如果这是第一个蛇身节点，放在蛇头左侧
                newPos = new Vec3(snakeHeadPos.x - gridSize, snakeHeadPos.y, 0);
            } else {
                // 如果已有蛇身节点，放在最后一个蛇身节点的左侧
                const lastBodyPos = snakeBody[snakeBody.length - 1].position;
                newPos = new Vec3(lastBodyPos.x - gridSize, lastBodyPos.y, 0);
            }
            
            // 设置节点位置
            tileNode.setPosition(newPos);
            console.log(`测试模式：设置蛇身位置到: (${newPos.x}, ${newPos.y})`);
            
            // 获取MahjongTile组件并设置为正面显示
            const mahjongTile = tileNode.getComponent(MahjongTile);
            if (mahjongTile) {
                // 设置为正面显示
                (mahjongTile as any).showAsBackSide = false;
                (mahjongTile as any).updateDisplayMode();
                console.log("测试模式：设置麻将牌为正面显示");
            }
            
            // 添加碰撞体（用于蛇头碰撞检测）
            const bodyCollider = tileNode.addComponent(BoxCollider2D);
            bodyCollider.sensor = true;
            bodyCollider.size.set(gridSize, gridSize);
            
            // 添加到蛇身数组
            if (snakeBody && Array.isArray(snakeBody)) {
                snakeBody.push(tileNode);
                console.log(`测试模式：成功添加到蛇身，当前蛇身长度: ${snakeBody.length}`);
                
                // 🔥 重要：初始化positions数组，确保蛇身能跟随移动
                const positions = (this.snakeController as any).positions;
                if (positions && Array.isArray(positions)) {
                    // 预填充一些位置历史，确保蛇身能正确跟随
                    for (let i = positions.length; i < snakeBody.length; i++) {
                        const historyPos = new Vec3(
                            snakeHeadPos.x - (i + 1) * gridSize,
                            snakeHeadPos.y,
                            0
                        );
                        positions.push(historyPos);
                    }
                    console.log(`测试模式：初始化了${positions.length}个历史位置`);
                }
                
                return true;
            } else {
                console.error("测试模式：无法访问蛇身数组");
                return false;
            }
            
        } catch (error) {
            console.error("测试模式：添加到蛇身时发生错误", error);
            return false;
        }
    }

    
    // 手动控制接口 - 清除测试牌
    public clearTestTiles() {
        console.log("测试模式：清除所有测试牌");
        
        // 清除手牌
        this.handCards.length = 0;
        this.handCardManager.clearAllCards();
        
        // 重置蛇身
        this.snakeController.resetSnake();
        
        console.log("测试模式：测试牌已清除");
    }
    
    // 重新生成测试牌
    public regenerateTestTiles(): number {
        this.clearTestTiles();
        return this.generateTestTiles();
    }
    
    // 设置测试牌数量
    public setTestTileCount(count: number) {
        this.testTileCount = Math.max(1, Math.min(count, 14)); // 限制在1-14之间
        console.log(`测试模式：设置测试牌数量为 ${this.testTileCount}`);
    }
    
    // 获取当前测试牌数量设置
    public getTestTileCount(): number {
        return this.testTileCount;
    }

} 