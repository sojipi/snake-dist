import { _decorator, Component, Node, Prefab, instantiate, Vec3, math, UITransform } from 'cc';
import { BoundaryManager } from './BoundaryManager';
import { MahjongTile } from './MahjongTile';
import { GameManager } from './GameManager';  
import { XRaySkillManager } from './XRaySkillManager'; // 添加XRaySkillManager导入
const { ccclass, property } = _decorator;

@ccclass('TileSpawner')
export class TileSpawner extends Component {
    @property(Prefab)
    mahjongTilePrefab: Prefab = null!;
    
    @property({ tooltip: "场上同时存在的麻将牌最大数量" })
    maxTilesOnField: number = 30;
    
    private canvas: Node = null!;
    private boundaryManager: BoundaryManager = null!;
    private activeTiles: Node[] = [];
    private xRaySkillManager: XRaySkillManager = null!; // 添加xRaySkillManager变量
    private readonly MIN_DISTANCE = 80;
    private readonly MAX_ATTEMPTS = 20;
    private readonly SAFE_MARGIN = 50;
    
    public initialize(canvas: Node, boundaryManager: BoundaryManager) {
        this.canvas = canvas;
        this.boundaryManager = boundaryManager;
    }
    
    // 设置最大麻将牌数量（根据关卡配置）
    public setMaxTilesOnField(maxTiles: number) {
        this.maxTilesOnField = maxTiles;
        console.log(`设置场上最大麻将牌数量: ${maxTiles}`);
    }
    
    // 获取当前最大麻将牌数量
    public getMaxTilesOnField(): number {
        return this.maxTilesOnField;
    }
    
    public spawnInitialTiles() {
        for (let i = 0; i < this.maxTilesOnField; i++) {
            this.spawnMahjongTile();
        }
    }
    
    public spawnMahjongTile(): Node | null {
        if (this.activeTiles.length >= this.maxTilesOnField) {
            console.log(`TileSpawner: 已达到最大麻将牌数量(${this.maxTilesOnField})，无法生成更多`);
            return null;
        }
        
        // 🔥 检查牌池状态
        const poolStatus = MahjongTile.getPoolStatus();
        
        if (poolStatus.remaining <= 0) {
            console.log(`TileSpawner: 牌池已空，无法生成新牌`);
            return null;
        }
        
        const tile = instantiate(this.mahjongTilePrefab);
        tile.setParent(this.canvas);
        
        const position = this.getRandomSpawnPosition();
        tile.setPosition(position);
        
        // 获取XRaySkillManager实例检查是否需要自动翻开
        if (!this.xRaySkillManager) {
            this.xRaySkillManager = this.getComponent(XRaySkillManager);
        }

        if (this.xRaySkillManager && this.xRaySkillManager.shouldAutoRevealNewTiles()) {
            // 如果透视技能激活中，自动翻开新生成的牌
            const mahjongTile = tile.getComponent(MahjongTile);
            if (mahjongTile) {
                mahjongTile.setFrontSide();
            }
        }
        
        this.activeTiles.push(tile);
        console.log(`TileSpawner: 成功生成麻将牌，当前场上牌数: ${this.activeTiles.length}/${this.maxTilesOnField}, 剩余牌池: ${poolStatus.remaining}`);
        return tile;
    }
    
    private getRandomSpawnPosition(): Vec3 {
        for (let attempts = 0; attempts < this.MAX_ATTEMPTS; attempts++) {
            const position = this.generateRandomPosition();
            
            if (this.isPositionValid(position)) {
                return position;
            }
        }
        
        // 如果找不到合适位置，返回一个随机位置
        return this.generateRandomPosition();
    }
    
    private generateRandomPosition(): Vec3 {
        if (this.boundaryManager) {
            const bounds = this.boundaryManager.getGameAreaBounds();
            const minX = bounds.minX + this.SAFE_MARGIN;
            const maxX = bounds.maxX - this.SAFE_MARGIN;
            const minY = bounds.minY + this.SAFE_MARGIN;
            const maxY = bounds.maxY - this.SAFE_MARGIN;
            
            const x = math.randomRangeInt(minX, maxX);
            const y = math.randomRangeInt(minY, maxY);
            return new Vec3(x, y, 0);
        } else {
            // 回退方案：使用Canvas尺寸
            const canvasSize = this.getCanvasSize();
            const halfWidth = canvasSize.width / 2 - this.SAFE_MARGIN;
            const halfHeight = canvasSize.height / 2 - this.SAFE_MARGIN;
            
            const x = math.randomRangeInt(-halfWidth, halfWidth);
            const y = math.randomRangeInt(-halfHeight, halfHeight);
            return new Vec3(x, y, 0);
        }
    }
    
    private isPositionValid(position: Vec3): boolean {
        for (const existingTile of this.activeTiles) {
            if (existingTile && existingTile.isValid) {
                const distance = Vec3.distance(position, existingTile.position);
                if (distance < this.MIN_DISTANCE) {
                    return false;
                }
            }
        }
        return true;
    }
    
    private getCanvasSize() {
        if (this.canvas) {
            const canvasTransform = this.canvas.getComponent(UITransform);
            if (canvasTransform && canvasTransform.contentSize) {
                return canvasTransform.contentSize;
            }
        }
        return { width: 1280, height: 720 }; // 默认尺寸
    }
    
    public removeTile(tile: Node) {
        const index = this.activeTiles.indexOf(tile);
        if (index > -1) {
            this.activeTiles.splice(index, 1);
        }
    }

    /**
     * 设置XRaySkillManager实例
     * @param xRaySkillManager 
     */
    public setXRaySkillManager(xRaySkillManager: XRaySkillManager) {
        this.xRaySkillManager = xRaySkillManager;
    }
    
    public clearAllTiles() {
        this.activeTiles.forEach(tile => {
            if (tile && tile.isValid) {
                tile.destroy();
            }
        });
        this.activeTiles = [];
    }
    
    public getActiveTilesCount(): number {
        return this.activeTiles.length;
    }
    
    public getActiveTiles(): Node[] {
        return this.activeTiles;
    }
    
    /**
     * 🔥 新增：确保场上有足够的麻将牌（智能牌池管理）
     */
    public ensureMinimumTiles(minTiles: number = 5): number {
        let spawnedCount = 0;
        const currentCount = this.getActiveTilesCount();
        const poolStatus = MahjongTile.getPoolStatus();
        
        console.log(`TileSpawner.ensureMinimumTiles: 检查场上牌数`);
        console.log(`- 当前牌数: ${currentCount}/${minTiles}`);
        console.log(`- 剩余牌池: ${poolStatus.remaining}`);
        
        if (currentCount < minTiles && poolStatus.remaining > 0) {
            // 🔥 智能计算需要生成的牌数
            const maxCanSpawn = Math.min(
                minTiles - currentCount,           // 需要补充的数量
                this.maxTilesOnField - currentCount, // 场上最大数量限制
                poolStatus.remaining               // 牌池剩余数量
            );
            
            console.log(`TileSpawner: 场上牌数不足(${currentCount}/${minTiles})，智能生成${maxCanSpawn}张牌`);
            
            for (let i = 0; i < maxCanSpawn; i++) {
                const tile = this.spawnMahjongTile();
                if (tile) {
                    spawnedCount++;
                } else {
                    break;
                }
            }
            
            console.log(`TileSpawner: 成功补充${spawnedCount}张麻将牌`);
        } else if (poolStatus.remaining <= 0) {
            console.log(`TileSpawner: 牌池已空，无法补充麻将牌`);
        }
        
        return spawnedCount;
    }
} 