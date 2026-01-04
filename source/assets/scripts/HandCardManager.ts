import { _decorator, Component, Node, Prefab, instantiate, Vec3, Layout, Button, Color, Sprite, EventTouch, UITransform } from 'cc';
import { MahjongTile, MahjongType } from './MahjongTile';
import { IGameManager, GetGameManagerInstance } from './interfaces/IGameManager';
const { ccclass, property } = _decorator;

@ccclass('HandCardManager')
export class HandCardManager extends Component {
    @property(Node)
    handCardContainer: Node = null!;

    // 用于获取GameManager实例的函数，避免循环依赖
    private getGameManager: GetGameManagerInstance | null = null;
    
    @property(Prefab)
    handCardPrefab: Prefab = null!;
    
    @property(Layout)
    cardLayout: Layout = null!;
    
    private handCardNodes: Node[] = [];
    private selectedCardIndex: number = -1;
    private maxHandCards: number = 14;
    private dragThreshold: number = 30; // 降低拖拽阈值，使拖拽更容易触发
    private cardOriginalPositions: Vec3[] = []; // 记录牌的原始位置
    private selectedCardOffset: number = 20; // 选中牌上移距离
    
    onLoad() {
        this.initHandCardArea();
        console.log("手牌管理器初始化完成");
    }
    
    start() {
        this.updateHandCardDisplay();
    }

    /**
     * 设置GameManager实例获取函数，避免循环依赖
     */
    public setGameManagerGetter(getter: GetGameManagerInstance) {
        this.getGameManager = getter;
    }
    
    private initHandCardArea() {
        // 初始化手牌区域
        this.handCardNodes = [];
        this.selectedCardIndex = -1;
        this.cardOriginalPositions = [];
        
        // 设置布局 - 减小间距
        if (this.cardLayout) {
            this.cardLayout.type = Layout.Type.HORIZONTAL;
            this.cardLayout.spacingX = 2;  // 从10减少到2，让手牌更紧密
        }
    }
    
    public addHandCard(cardType: string): boolean {
        if (this.handCardNodes.length >= this.maxHandCards) {
            console.log("手牌已满，无法添加");
            return false;
        }
        
        // 创建手牌节点
        const cardNode = this.createHandCardNode(cardType);
        if (cardNode) {
            this.handCardNodes.push(cardNode);
            this.handCardContainer.addChild(cardNode);
            
            // 自动排序手牌
            this.sortHandCards();
            
            // 更新显示
            this.updateHandCardDisplay();
            console.log(`添加手牌: ${cardType}, 当前数量: ${this.handCardNodes.length}`);
            return true;
        }
        
        return false;
    }
    
    private createHandCardNode(cardType: string): Node | null {
        if (!this.handCardPrefab) {
            console.error("手牌预制体未设置");
            return null;
        }
        
        console.log(`Log.e: 创建手牌节点，类型: ${cardType}`);
        
        const cardNode = instantiate(this.handCardPrefab);
        const mahjongTile = cardNode.getComponent(MahjongTile);
        
        if (mahjongTile) {
            // 🔥 关键修复：先禁用自动初始化，防止onLoad覆盖我们的设置
            console.log(`Log.e: 禁用自动初始化，防止onLoad干扰`);
            // 如果有autoInitRandomTile属性，确保设置为false
            (mahjongTile as any).autoInitRandomTile = false;
            
            // 设置为正面显示（手牌应该显示具体图案）
            mahjongTile.setFrontSide();
            
            // 根据字符串设置麻将牌类型
            const tileType = this.stringToMahjongType(cardType);
            if (tileType) {
                console.log(`Log.e: 即将设置手牌类型: ${cardType} -> ${tileType}`);
                // 🔥 使用强制设置方法，确保不被其他逻辑干扰
                mahjongTile.forceSetTileType(tileType);
                console.log(`Log.e: 成功设置手牌类型: ${cardType} -> ${tileType}`);
                
                // 再次验证设置结果
                const verifyType = mahjongTile.getTileTypeEnum();
                const verifyName = mahjongTile.getTileTypeName();
                console.log(`Log.e: 验证设置结果: 期望=${tileType}, 实际=${verifyType}(${verifyName})`);
                
                if (verifyType !== tileType) {
                    console.error(`Log.e: 设置失败！期望=${tileType}, 实际=${verifyType}`);
                }
            } else {
                console.error(`Log.e: 无法转换麻将牌类型: ${cardType}`);
            }
        }
        
        // 设置到CONTROL层
        cardNode.layer = 524288; // CONTROL层
        console.log(`Log.e: 手牌节点已设置到CONTROL层: ${cardNode.layer}`);
        
        // 禁用Button组件，防止它拦截触摸事件
        const button = cardNode.getComponent(Button);
        if (button) {
            button.enabled = false;
            console.log("Log.e: 禁用Button组件，使用自定义触摸事件");
        }
        
        // 添加触摸事件（拖拽和双击）
        this.setupCardTouchEvents(cardNode);
        
        return cardNode;
    }
    
    private setupCardTouchEvents(cardNode: Node) {
        let touchStartPos: Vec3 = new Vec3();
        let hasDiscarded: boolean = false; // 标记是否已经弃牌，避免重复弃牌
        
        cardNode.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
            const gameManager = this.getGameManager?.();
            console.log(`触摸开始 - 当前手牌数量: ${gameManager.getHandCardsCount()}, 最大数量: ${gameManager.getMaxHandCards()}`);
            
            if (gameManager.getHandCardsCount() < gameManager.getMaxHandCards()) {
                console.log("手牌未满14张，不能操作");
                return; // 手牌未满14张时不能操作
            }
            
            // 直接使用触摸位置，不进行坐标转换
            const touchLocation = event.getLocation();
            touchStartPos = new Vec3(touchLocation.x, touchLocation.y, 0);
            console.log(`触摸开始位置: (${touchStartPos.x}, ${touchStartPos.y})`);
            hasDiscarded = false; // 重置弃牌标记
            
            const cardIndex = this.handCardNodes.indexOf(cardNode);
            console.log(`点击的牌索引: ${cardIndex}, 当前选中索引: ${this.selectedCardIndex}`);
            
            // 如果点击的是已选中的牌，直接弃牌
            if (this.selectedCardIndex === cardIndex) {
                console.log("点击已选中的牌，执行弃牌");
                this.discardCard(cardIndex);
                return;
            }
            
            // 否则选中这张牌
            console.log(`选中新的牌，索引: ${cardIndex}`);
            this.setSelectedCard(cardIndex);
        }, this);
        
        cardNode.on(Node.EventType.TOUCH_MOVE, (event: EventTouch) => {
            const gameManager = this.getGameManager?.();
            if (gameManager && gameManager.getHandCardsCount() < gameManager.getMaxHandCards()) {
                return;
            }
            
            // 如果已经弃牌了，不再处理
            if (hasDiscarded) {
                return;
            }
            
            // 直接使用触摸位置
            const touchLocation = event.getLocation();
            const currentPos = new Vec3(touchLocation.x, touchLocation.y, 0);
            
            const distance = Vec3.distance(touchStartPos, currentPos);
            console.log(`拖拽移动 - 距离: ${distance.toFixed(2)}, 阈值: ${this.dragThreshold}`);
            
            // 超过阈值立即弃牌
            if (distance > this.dragThreshold) {
                const cardIndex = this.handCardNodes.indexOf(cardNode);
                console.log(`拖拽超过阈值，立即弃牌 - 牌索引: ${cardIndex}, 拖拽距离: ${distance.toFixed(2)}`);
                hasDiscarded = true; // 标记已弃牌
                this.discardCard(cardIndex);
            }
        }, this);
        
        // 保留TOUCH_END事件处理，但只用于重置状态
        cardNode.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            console.log("触摸结束，重置状态");
            hasDiscarded = false;
        }, this);
    }
    
    private stringToMahjongType(typeStr: string): MahjongType | null {
        console.log(`stringToMahjongType 输入: "${typeStr}"`);
        
        // 将字符串转换为麻将牌类型枚举
        const typeNumber = parseInt(typeStr);
        console.log(`解析后的数字: ${typeNumber}`);
        
        // 检查是否是有效的数字
        if (isNaN(typeNumber)) {
            console.error(`无效的麻将牌类型字符串: ${typeStr}`);
            return null;
        }
        
        // 检查数字是否在有效范围内 (1-34)
        if (typeNumber >= 1 && typeNumber <= 34) {
            const result = typeNumber as MahjongType;
            console.log(`成功转换: "${typeStr}" -> ${result}`);
            return result;
        }
        
        console.error(`麻将牌类型数字超出范围: ${typeNumber}`);
        return null;
    }
    
    private setSelectedCard(index: number) {
        console.log(`设置选中手牌: ${index}`);
        
        // 清除之前的选中状态
        if (this.selectedCardIndex >= 0 && this.selectedCardIndex < this.handCardNodes.length) {
            this.setCardHighlight(this.handCardNodes[this.selectedCardIndex], false);
            this.resetCardPosition(this.selectedCardIndex);
        }
        
        // 设置新的选中状态
        this.selectedCardIndex = index;
        if (this.selectedCardIndex >= 0 && this.selectedCardIndex < this.handCardNodes.length) {
            this.setCardHighlight(this.handCardNodes[this.selectedCardIndex], true);
            this.moveCardUp(this.selectedCardIndex);
            console.log(`手牌 ${index} 已高亮显示并上移`);
        }
    }
    
    private setCardHighlight(cardNode: Node, highlight: boolean) {
        const sprite = cardNode.getComponent(Sprite);
        if (sprite) {
            if (highlight) {
                sprite.color = new Color(255, 255, 0, 255); // 黄色高亮
            } else {
                sprite.color = new Color(255, 255, 255, 255); // 白色正常
            }
        }
    }
    
    private moveCardUp(cardIndex: number) {
        if (cardIndex < 0 || cardIndex >= this.handCardNodes.length) return;
        
        const cardNode = this.handCardNodes[cardIndex];
        const currentPos = cardNode.position.clone();
        
        // 记录原始位置
        if (!this.cardOriginalPositions[cardIndex]) {
            this.cardOriginalPositions[cardIndex] = currentPos.clone();
        }
        
        // 上移
        cardNode.setPosition(currentPos.x, currentPos.y + this.selectedCardOffset, currentPos.z);
    }
    
    private resetCardPosition(cardIndex: number) {
        if (cardIndex < 0 || cardIndex >= this.handCardNodes.length) return;
        if (!this.cardOriginalPositions[cardIndex]) return;
        
        const cardNode = this.handCardNodes[cardIndex];
        cardNode.setPosition(this.cardOriginalPositions[cardIndex]);
    }
    
    private discardCard(cardIndex: number) {
        console.log(`=== 开始执行弃牌操作 ===`);
        console.log(`弃牌索引: ${cardIndex}`);
        console.log(`当前手牌节点数量: ${this.handCardNodes.length}`);
        
        if (cardIndex < 0 || cardIndex >= this.handCardNodes.length) {
            console.error(`弃牌索引无效: ${cardIndex}, 有效范围: 0-${this.handCardNodes.length - 1}`);
            return;
        }
        
        const gameManager = this.getGameManager?.();
        console.log(`GameManager实例存在: ${gameManager ? '是' : '否'}`);
        
        // 获取要弃掉的牌的信息
        const cardNode = this.handCardNodes[cardIndex];
        const mahjongTile = cardNode.getComponent(MahjongTile);
        const tileType = mahjongTile ? mahjongTile.getTileType() : '未知';
        console.log(`要弃掉的牌类型: ${tileType}`);
        
        // 🔥 修复：改为使用discardCardByType，与AI弃牌保持一致
        console.log(`HandCardManager.discardCard: 使用discardCardByType进行弃牌`);
        const discardResult = gameManager?.discardCardByType(tileType);
        console.log(`GameManager.discardCardByType返回结果: ${discardResult}`);
        
        if (discardResult) {
            // 重置选中状态
            this.selectedCardIndex = -1;
            console.log(`重置选中状态`);
            console.log("=== 弃牌成功 ===");
        } else {
            console.error("=== GameManager拒绝了弃牌操作 ===");
        }
    }
    
    private updateHandCardDisplay() {
        // 移除半透明效果，手牌始终正常显示
        for (const cardNode of this.handCardNodes) {
            const sprite = cardNode.getComponent(Sprite);
            if (sprite) {
                // 确保所有手牌都是正常显示（不透明）
                const color = sprite.color.clone();
                color.a = 255;
                sprite.color = color;
            }
        }
        
        // 更新布局
        if (this.cardLayout) {
            this.cardLayout.updateLayout();
        }
        
        // 重新记录原始位置
        this.scheduleOnce(() => {
            this.recordOriginalPositions();
        }, 0.1);
    }
    
    private recordOriginalPositions() {
        this.cardOriginalPositions = [];
        for (let i = 0; i < this.handCardNodes.length; i++) {
            this.cardOriginalPositions[i] = this.handCardNodes[i].position.clone();
        }
    }
    
    public getHandCardsCount(): number {
        return this.handCardNodes.length;
    }
    
    public clearHandCards() {
        // 清空所有手牌
        for (const cardNode of this.handCardNodes) {
            cardNode.destroy();
        }
        this.handCardNodes = [];
        this.selectedCardIndex = -1;
        this.updateHandCardDisplay();
    }
    
    public canOperateCards(): boolean {
        const gameManager = this.getGameManager?.();
        return gameManager ? gameManager.getHandCardsCount() >= gameManager.getMaxHandCards() : false;
    }
    
    public clearAllCards() {
        // 清空手牌数组
        this.handCardNodes = [];
        
        // 清空UI显示 - 使用正确的方法
        if (this.cardLayout && this.cardLayout.node) {
            // 销毁所有子节点
            const children = this.cardLayout.node.children.slice(); // 创建副本避免遍历时修改数组
            for (const child of children) {
                child.destroy();
            }
        }
        
        // 重置选中状态
        this.selectedCardIndex = -1;
        
        console.log("已清空所有手牌");
    }
    
    public getCardCount(): number {
        return this.handCardNodes.length;
    }
    
    /**
     * 移除指定索引的手牌UI节点（用于响应GameManager的弃牌请求）
     */
    public removeHandCardAtIndex(index: number) {
        console.log(`HandCardManager.removeHandCardAtIndex: 移除索引${index}的手牌UI`);
        
        if (index < 0 || index >= this.handCardNodes.length) {
            console.error(`HandCardManager.removeHandCardAtIndex: 索引无效 ${index}, 有效范围: 0-${this.handCardNodes.length - 1}`);
            return;
        }
        
        // 移除UI节点
        const removedNode = this.handCardNodes.splice(index, 1)[0];
        this.cardOriginalPositions.splice(index, 1); // 同步移除位置记录
        
        console.log(`HandCardManager.removeHandCardAtIndex: 销毁节点 ${removedNode.name}`);
        removedNode.destroy();
        
        // 重置选中状态（如果移除的是选中的牌）
        if (this.selectedCardIndex === index) {
            this.selectedCardIndex = -1;
        } else if (this.selectedCardIndex > index) {
            // 如果移除的牌在选中牌之前，需要调整选中索引
            this.selectedCardIndex--;
        }
        
        // 更新显示
        this.updateHandCardDisplay();
        
        console.log(`HandCardManager.removeHandCardAtIndex: 移除完成，剩余手牌数: ${this.handCardNodes.length}`);
    }
    
    /**
     * 🔥 新增：按牌型移除手牌UI节点（用于响应AI弃牌）
     */
    public removeHandCardByType(tileType: string): boolean {
        console.log(`HandCardManager.removeHandCardByType: 寻找要移除的牌型 "${tileType}"`);
        console.log(`HandCardManager.removeHandCardByType: 当前UI手牌数量: ${this.handCardNodes.length}`);
        
        // 显示所有手牌的牌型
        console.log(`HandCardManager.removeHandCardByType: 当前UI手牌列表:`);
        for (let i = 0; i < this.handCardNodes.length; i++) {
            const cardNode = this.handCardNodes[i];
            if (cardNode && cardNode.isValid) {
                const mahjongTile = cardNode.getComponent(MahjongTile);
                if (mahjongTile) {
                    const cardTileType = mahjongTile.getTileType();
                    console.log(`  UI手牌${i}: 牌型="${cardTileType}" (类型: ${typeof cardTileType})`);
                } else {
                    console.log(`  UI手牌${i}: 无MahjongTile组件`);
                }
            } else {
                console.log(`  UI手牌${i}: 节点无效`);
            }
        }
        
        // 查找第一个匹配的节点
        for (let i = 0; i < this.handCardNodes.length; i++) {
            const cardNode = this.handCardNodes[i];
            if (cardNode && cardNode.isValid) {
                const mahjongTile = cardNode.getComponent(MahjongTile);
                if (mahjongTile) {
                    const cardTileType = mahjongTile.getTileType();
                    console.log(`HandCardManager.removeHandCardByType: 检查UI手牌${i}: 牌型="${cardTileType}"`);
                    console.log(`HandCardManager.removeHandCardByType: 比较 "${cardTileType}" === "${tileType}" ? ${cardTileType === tileType}`);
                    
                    if (cardTileType === tileType) {
                        console.log(`HandCardManager.removeHandCardByType: ✅ 找到匹配的UI手牌，索引=${i}, 牌型=${cardTileType}`);
                        
                        // 移除UI节点
                        const removedNode = this.handCardNodes.splice(i, 1)[0];
                        this.cardOriginalPositions.splice(i, 1); // 同步移除位置记录
                        
                        console.log(`HandCardManager.removeHandCardByType: 销毁节点 ${removedNode.name}`);
                        removedNode.destroy();
                        
                        // 重置选中状态（如果移除的是选中的牌）
                        if (this.selectedCardIndex === i) {
                            this.selectedCardIndex = -1;
                        } else if (this.selectedCardIndex > i) {
                            // 如果移除的牌在选中牌之前，需要调整选中索引
                            this.selectedCardIndex--;
                        }
                        
                        // 更新显示
                        this.updateHandCardDisplay();
                        
                        console.log(`HandCardManager.removeHandCardByType: ✅ 移除完成，剩余手牌数: ${this.handCardNodes.length}`);
                        return true;
                    }
                }
            }
        }
        
        console.warn(`HandCardManager.removeHandCardByType: ❌ 未找到要移除的牌型 "${tileType}"`);
        console.warn(`HandCardManager.removeHandCardByType: 所有UI手牌牌型:`, 
            this.handCardNodes.map((node, i) => {
                if (node && node.isValid) {
                    const tile = node.getComponent(MahjongTile);
                    return tile ? `${i}:${tile.getTileType()}` : `${i}:无组件`;
                }
                return `${i}:无效节点`;
            }).join(', ')
        );
        return false;
    }
    
    private sortHandCards() {
        console.log("开始排序手牌");
        
        // 按牌型数值排序
        this.handCardNodes.sort((a, b) => {
            const tileA = a.getComponent(MahjongTile);
            const tileB = b.getComponent(MahjongTile);
            
            if (!tileA || !tileB) {
                return 0;
            }
            
            const typeA = tileA.getTileTypeEnum();
            const typeB = tileB.getTileTypeEnum();
            
            return typeA - typeB;
        });
        
        // 重新排列UI显示顺序
        this.rearrangeHandCardDisplay();
        
        console.log("手牌排序完成");
    }
    
    private rearrangeHandCardDisplay() {
        // 清空容器中的所有子节点
        this.handCardContainer.removeAllChildren();
        
        // 按排序后的顺序重新添加到容器
        for (const cardNode of this.handCardNodes) {
            this.handCardContainer.addChild(cardNode);
        }
        
        // 更新布局
        if (this.cardLayout) {
            this.cardLayout.updateLayout();
        }
        
        // 重新记录原始位置
        this.scheduleOnce(() => {
            this.recordOriginalPositions();
        }, 0.1);
    }
} 