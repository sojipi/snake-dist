import { _decorator, Component, Node, Sprite, SpriteFrame, resources, ImageAsset, Texture2D, UITransform } from 'cc';
const { ccclass, property } = _decorator;

export enum MahjongType {
    // 饼子 (1-9)
    Bing1 = 1, Bing2 = 2, Bing3 = 3, Bing4 = 4, Bing5 = 5,
    Bing6 = 6, Bing7 = 7, Bing8 = 8, Bing9 = 9,
    
    // 条子 (10-18)
    Tiao1 = 10, Tiao2 = 11, Tiao3 = 12, Tiao4 = 13, Tiao5 = 14,
    Tiao6 = 15, Tiao7 = 16, Tiao8 = 17, Tiao9 = 18,
    
    // 中发白 (19-21)
    Red = 19, Green = 20, White = 21,
    
    // 万字 (22-30)
    Wan1 = 22, Wan2 = 23, Wan3 = 24, Wan4 = 25, Wan5 = 26,
    Wan6 = 27, Wan7 = 28, Wan8 = 29, Wan9 = 30,
    
    // 东西南北 (31-34)
    East = 31, South = 32, West = 33, North = 34
}

@ccclass('MahjongTile')
export class MahjongTile extends Component {
    @property(Sprite)
    backgroundSprite: Sprite = null!;  // 麻将牌背景（Sprite-001节点）
    
    @property(Sprite)
    patternSprite: Sprite = null!;     // 麻将牌图案（Sprite节点）
    
    @property({ tooltip: "是否在onLoad时自动初始化随机牌型（场上的牌为true，手牌为false）" })
    autoInitRandomTile: boolean = true;  // 新增属性
    
    @property({ tooltip: "是否显示为翻面状态（背面朝上，场上的牌为true，手牌为false）" })
    showAsBackSide: boolean = true;  // 新增属性：是否显示背面
    
    // 🔥 重新实现：麻将牌池管理
    private static tilePool: MahjongType[] = []; // 剩余麻将牌池
    private static readonly TOTAL_TILES = 136; // 总牌数：34种 × 4张
    
    private tileType: MahjongType | undefined; // 不设置默认值，让initRandomTile来初始化
    private backgroundNode: Node = null!;
    
    // 🔥 初始化麻将牌池（游戏开始时调用）
    public static initializeTilePool() {
        MahjongTile.tilePool = [];
        
        // 生成完整的麻将牌池：每种牌型4张
        const allTypes = [
            MahjongType.Bing1, MahjongType.Bing2, MahjongType.Bing3, MahjongType.Bing4, MahjongType.Bing5,
            MahjongType.Bing6, MahjongType.Bing7, MahjongType.Bing8, MahjongType.Bing9,
            MahjongType.Tiao1, MahjongType.Tiao2, MahjongType.Tiao3, MahjongType.Tiao4, MahjongType.Tiao5,
            MahjongType.Tiao6, MahjongType.Tiao7, MahjongType.Tiao8, MahjongType.Tiao9,
            MahjongType.Red, MahjongType.Green, MahjongType.White,
            MahjongType.Wan1, MahjongType.Wan2, MahjongType.Wan3, MahjongType.Wan4, MahjongType.Wan5,
            MahjongType.Wan6, MahjongType.Wan7, MahjongType.Wan8, MahjongType.Wan9,
            MahjongType.East, MahjongType.South, MahjongType.West, MahjongType.North
        ];
        
        // 每种牌型添加4张到池中
        allTypes.forEach(tileType => {
            for (let i = 0; i < 4; i++) {
                MahjongTile.tilePool.push(tileType);
            }
        });
        
        console.log(`MahjongTile.initializeTilePool: 初始化完成，总牌数: ${MahjongTile.tilePool.length}`);
    }
    
    // 🔥 从池中随机抽取一张牌
    public static drawRandomTile(): MahjongType | null {
        if (MahjongTile.tilePool.length === 0) {
            console.warn("MahjongTile.drawRandomTile: 牌池已空，无法抽取牌");
            return null;
        }
        
        // 随机选择一张牌
        const randomIndex = Math.floor(Math.random() * MahjongTile.tilePool.length);
        const drawnTile = MahjongTile.tilePool.splice(randomIndex, 1)[0];
        
        console.log(`MahjongTile.drawRandomTile: 抽取牌型 ${drawnTile}，剩余牌数: ${MahjongTile.tilePool.length}`);
        
        // 🔥 检查是否牌池即将耗尽
        if (MahjongTile.tilePool.length <= 10) {
            console.warn(`MahjongTile.drawRandomTile: 牌池即将耗尽，剩余 ${MahjongTile.tilePool.length} 张牌`);
        }
        
        return drawnTile;
    }
    
    // 🔥 获取剩余牌数
    public static getRemainingTileCount(): number {
        return MahjongTile.tilePool.length;
    }
    
    // 🔥 检查是否还有牌可抽
    public static hasRemainingTiles(): boolean {
        return MahjongTile.tilePool.length > 0;
    }
    
    // 🔥 获取剩余牌池状态（用于调试）
    public static getPoolStatus(): { total: number, remaining: number, percentage: number } {
        return {
            total: MahjongTile.TOTAL_TILES,
            remaining: MahjongTile.tilePool.length,
            percentage: Math.round((MahjongTile.tilePool.length / MahjongTile.TOTAL_TILES) * 100)
        };
    }
    
    onLoad() {
        this.initMahjongComponents();
        
        // 只有设置为自动初始化的才生成随机牌型（场上的牌）
        // 手牌预制体应该设置autoInitRandomTile为false
        if (this.autoInitRandomTile) {
            this.initRandomTile();
        }
        
        // 根据showAsBackSide属性决定显示方式
        this.updateDisplayMode();
    }
    
    private initMahjongComponents() {
        // 查找现有的Sprite-001节点作为背景
        if (!this.backgroundSprite) {
            this.backgroundNode = this.node.getChildByName('Sprite-001');
            if (!this.backgroundNode) {
                // 如果没有找到，创建一个新的背景节点
                this.backgroundNode = new Node('Sprite-001');
                this.backgroundNode.setParent(this.node);
                
                // 设置背景位置和大小
                const bgTransform = this.backgroundNode.addComponent(UITransform);
                bgTransform.setContentSize(40, 60);
            }
            this.backgroundSprite = this.backgroundNode.getComponent(Sprite) || this.backgroundNode.addComponent(Sprite);
        }
    }
    
    private initRandomTile() {
        // 🔥 从牌池中随机抽取一张牌
        const drawnTile = MahjongTile.drawRandomTile();
        
        if (drawnTile === null) {
            console.error("MahjongTile.initRandomTile: 牌池已空，无法生成牌型");
            // 🔥 牌池已空，触发游戏结束
            this.triggerGameOver();
            return;
        }
        
        this.tileType = drawnTile;
        console.log(`MahjongTile.initRandomTile: 成功生成牌型 ${this.tileType} (${this.getTileTypeName()})`);
    }
    
    // 🔥 触发游戏结束（牌池耗尽）
    private triggerGameOver() {
        console.error("MahjongTile: 牌池已空，游戏结束！");
        // 通知GameManager游戏结束
        // 这里暂时只记录日志，GameManager会在其他地方检查牌池状态
    }
    
    private updateDisplayMode() {
        if (this.showAsBackSide) {
            // 显示背面：Sprite-001显示chess_back，Sprite隐藏
            this.showBackSide();
        } else {
            // 显示正面：Sprite-001显示chess_front，Sprite显示具体图案
            this.showFrontSide();
        }
    }
    
    private showBackSide() {
        // Sprite-001节点显示chess_back图片
        this.loadBackgroundAsBack();
        
        // 隐藏图案节点
        if (this.patternSprite) {
            this.patternSprite.node.active = false;
        }
    }
    
    private showFrontSide() {
        // Sprite-001节点显示chess_front图片
        this.loadBackgroundAsFront();
        
        // 直接使用编辑器中设置的patternSprite
        if (this.patternSprite) {
            this.patternSprite.node.active = true;
            this.loadPatternImage();
        }
    }
    
    private loadBackgroundAsBack() {
        // 加载麻将牌背面图片
        const backPaths = [
            'chesses/chess_back',
            'textures/chesses/chess_back',
            'chesses/chess_back.png',
            'textures/chesses/chess_back.png'
        ];
        
        this.loadImageWithPaths(backPaths, 0, this.backgroundSprite, '背面');
    }
    
    private loadBackgroundAsFront() {
        // 加载麻将牌正面背景图片
        const frontPaths = [
            'chesses/chess_front',
            'textures/chesses/chess_front',
            'chesses/chess_front.png',
            'textures/chesses/chess_front.png'
        ];
        
        this.loadImageWithPaths(frontPaths, 0, this.backgroundSprite, '正面背景');
    }
    
    private loadPatternImage() {
        if (this.tileType === undefined) {
            // 🔥 修复：手牌创建时不应该重新生成牌型
            if (this.autoInitRandomTile) {
                console.warn("MahjongTile.loadPatternImage: tileType未初始化，调用initRandomTile生成随机牌型");
                this.initRandomTile();
            } else {
                console.warn("MahjongTile.loadPatternImage: tileType未初始化，但autoInitRandomTile为false，跳过初始化");
                return; // 手牌创建时跳过图案加载，等待后续设置
            }
        }
        const imageNumber = this.tileType!;
        
        if (!this.patternSprite) {
            return;
        }
        
        // 加载对应的图案
        const patternPaths = [
            `chesses/${imageNumber}`,
            `textures/chesses/${imageNumber}`,
            `chesses/${imageNumber}.png`,
            `textures/chesses/${imageNumber}.png`
        ];
        
        this.loadImageWithPaths(patternPaths, 0, this.patternSprite, '图案');
    }
    
    private loadImageWithPaths(paths: string[], index: number, targetSprite: Sprite, type: string) {
        if (index >= paths.length) {
            return;
        }
        
        const currentPath = paths[index];
        
        resources.load(currentPath, ImageAsset, (err, imageAsset) => {
            if (err) {
                this.loadImageWithPaths(paths, index + 1, targetSprite, type);
                return;
            }
            
            // 🔥 修复：添加targetSprite和imageAsset的null检查
            if (targetSprite && targetSprite.node && imageAsset) {
                // 创建纹理
                const texture = new Texture2D();
                texture.image = imageAsset;
                
                // 创建精灵帧
                const spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;
                
                // 应用到精灵组件
                targetSprite.spriteFrame = spriteFrame;
            }
        });
    }
    
    // 翻转麻将牌（从背面变正面，或从正面变背面）
    public flipTile() {
        this.showAsBackSide = !this.showAsBackSide;
        this.updateDisplayMode();
    }
    
    // 强制设置为背面显示
    public setBackSide() {
        if (!this.showAsBackSide) {
            this.showAsBackSide = true;
            this.updateDisplayMode();
        }
    }
    
    // 强制设置为正面显示
    public setFrontSide() {
        // 强制设置为正面显示，不管当前状态如何
        this.showAsBackSide = false;
        this.updateDisplayMode();
    }
    
    // 获取当前是否为背面显示
    public isBackSide(): boolean {
        return this.showAsBackSide;
    }
    
    public getTileType(): string {
        if (this.tileType === undefined) {
            console.warn("MahjongTile.getTileType: tileType未初始化，调用initRandomTile生成随机牌型");
            this.initRandomTile();
            // 再次检查是否成功设置
            if (this.tileType === undefined) {
                console.error("MahjongTile.getTileType: initRandomTile失败，使用默认值");
                this.tileType = MahjongType.Bing1;
            }
        }
        const result = this.tileType!.toString();
        return result;
    }
    
    public setTileType(type: MahjongType) {
        this.tileType = type;
        
        // 立即更新显示
        this.updateDisplayMode();
    }
    
    // 强制设置牌型，用于手牌创建（跳过自动初始化影响）
    public forceSetTileType(type: MahjongType) {
        // 确保不会被自动初始化干扰
        this.autoInitRandomTile = false;
        
        // 设置牌型
        this.tileType = type;
        
        // 确保显示为正面
        this.showAsBackSide = false;
        
        // 🔥 修复：立即加载图案，确保显示正确
        this.loadPatternImage();
        
        // 立即更新显示
        this.updateDisplayMode();
    }
    
    public getTileTypeEnum(): MahjongType {
        if (this.tileType === undefined) {
            console.warn("MahjongTile.getTileTypeEnum: tileType未初始化，调用initRandomTile生成随机牌型");
            this.initRandomTile();
            // 再次检查是否成功设置
            if (this.tileType === undefined) {
                console.error("MahjongTile.getTileTypeEnum: initRandomTile失败，使用默认值");
                this.tileType = MahjongType.Bing1;
            }
        }
        return this.tileType!;
    }
    
    // 获取牌的名称（用于调试）
    public getTileTypeName(): string {
        if (this.tileType === undefined) {
            console.warn("MahjongTile.getTileTypeName: tileType未初始化，调用initRandomTile生成随机牌型");
            this.initRandomTile();
        }
        switch (this.tileType!) {
            // 饼子
            case MahjongType.Bing1: return "一饼";
            case MahjongType.Bing2: return "二饼";
            case MahjongType.Bing3: return "三饼";
            case MahjongType.Bing4: return "四饼";
            case MahjongType.Bing5: return "五饼";
            case MahjongType.Bing6: return "六饼";
            case MahjongType.Bing7: return "七饼";
            case MahjongType.Bing8: return "八饼";
            case MahjongType.Bing9: return "九饼";
            
            // 条子
            case MahjongType.Tiao1: return "一条";
            case MahjongType.Tiao2: return "二条";
            case MahjongType.Tiao3: return "三条";
            case MahjongType.Tiao4: return "四条";
            case MahjongType.Tiao5: return "五条";
            case MahjongType.Tiao6: return "六条";
            case MahjongType.Tiao7: return "七条";
            case MahjongType.Tiao8: return "八条";
            case MahjongType.Tiao9: return "九条";
            
            // 中发白
            case MahjongType.Red: return "红中";
            case MahjongType.Green: return "发财";
            case MahjongType.White: return "白板";
            
            // 万字
            case MahjongType.Wan1: return "一万";
            case MahjongType.Wan2: return "二万";
            case MahjongType.Wan3: return "三万";
            case MahjongType.Wan4: return "四万";
            case MahjongType.Wan5: return "五万";
            case MahjongType.Wan6: return "六万";
            case MahjongType.Wan7: return "七万";
            case MahjongType.Wan8: return "八万";
            case MahjongType.Wan9: return "九万";
            
            // 东西南北
            case MahjongType.East: return "东";
            case MahjongType.South: return "南";
            case MahjongType.West: return "西";
            case MahjongType.North: return "北";
            
            default: return "未知";
        }
    }
    
    // 获取牌的数值（用于排序和组合判断）
    public getTileValue(): number {
        if (this.tileType === undefined) {
            console.warn("MahjongTile.getTileValue: tileType未初始化，调用initRandomTile生成随机牌型");
            this.initRandomTile();
        }
        return this.tileType!;
    }
    
    // 获取牌的花色
    public getTileSuit(): string {
        if (this.tileType === undefined) {
            console.warn("MahjongTile.getTileSuit: tileType未初始化，调用initRandomTile生成随机牌型");
            this.initRandomTile();
        }
        if (this.tileType! >= 1 && this.tileType! <= 9) return '饼';
        if (this.tileType! >= 10 && this.tileType! <= 18) return '条';
        if (this.tileType! >= 19 && this.tileType! <= 21) return '箭';
        if (this.tileType! >= 22 && this.tileType! <= 30) return '万';
        if (this.tileType! >= 31 && this.tileType! <= 34) return '风';
        return '';
    }
    
    // 检查是否是字牌（风牌或箭牌）
    public isHonorTile(): boolean {
        if (this.tileType === undefined) {
            console.warn("MahjongTile.isHonorTile: tileType未初始化，调用initRandomTile生成随机牌型");
            this.initRandomTile();
        }
        const suit = this.getTileSuit();
        return suit === '风' || suit === '箭';
    }
    
    // 检查是否是数牌（万筒条）
    public isNumberTile(): boolean {
        if (this.tileType === undefined) {
            console.warn("MahjongTile.isHonorTile: tileType未初始化，调用initRandomTile生成随机牌型");
            this.initRandomTile();
        }
        const suit = this.getTileSuit();
        return suit === '万' || suit === '饼' || suit === '条';
    }
} 