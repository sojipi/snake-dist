import { _decorator, Component, Vec2, Vec3 } from 'cc';
import { SnakeController } from '../SnakeController';
import { Direction, MovementHistory, TargetTracking, DecisionContext } from './AITypes';

const { ccclass, property } = _decorator;

@ccclass('MovementController')
export class MovementController extends Component {
    
    private snakeController: SnakeController = null!;
    private movementHistory: MovementHistory[] = [];
    private targetTracking: TargetTracking = {
        target: null,
        distance: Infinity,
        stuckCounter: 0,
        lastPosition: new Vec3(),
        approachHistory: []
    };
    
    // 配置参数
    public maxHistoryLength: number = 10;
    public stuckThreshold: number = 6;
    public targetRefreshDistance: number = 35;
    
    onLoad() {
        this.snakeController = this.getComponent(SnakeController) || this.node.getComponent(SnakeController);
        
        if (!this.snakeController) {
            console.error("MovementController: 未找到SnakeController组件");
        }
    }
    
    /**
     * 执行移动
     */
    public executeMovement(direction: Direction, context: DecisionContext): boolean {
        if (!this.snakeController) {
            console.error("MovementController: SnakeController未初始化");
            return false;
        }
        
        try {
            // 转换方向并执行移动
            const directionVec = this.directionToVec2(direction);
            this.snakeController.setMoveDirection(directionVec);
            
            // 记录移动历史
            this.recordMovement(context.snakePosition, direction);
            
            // 更新目标跟踪
            this.updateTargetTracking(context);
            
            console.log(`MovementController: 执行移动 ${this.directionToString(direction)}`);
            return true;
            
        } catch (error) {
            console.error("MovementController: 移动执行失败", error);
            return false;
        }
    }
    
    /**
     * 将Direction枚举转换为Vec2
     */
    private directionToVec2(direction: Direction): Vec2 {
        switch (direction) {
            case Direction.UP:
                return new Vec2(0, 1);
            case Direction.DOWN:
                return new Vec2(0, -1);
            case Direction.LEFT:
                return new Vec2(-1, 0);
            case Direction.RIGHT:
                return new Vec2(1, 0);
            default:
                console.warn("MovementController: 未知方向，使用默认右方向");
                return new Vec2(1, 0);
        }
    }
    
    /**
     * 记录移动历史
     */
    private recordMovement(position: Vec3, direction: Direction) {
        const history: MovementHistory = {
            position: position.clone(),
            timestamp: Date.now(),
            direction: direction
        };
        
        this.movementHistory.push(history);
        
        // 限制历史长度
        if (this.movementHistory.length > this.maxHistoryLength) {
            this.movementHistory.shift();
        }
    }
    
    /**
     * 更新目标跟踪
     */
    private updateTargetTracking(context: DecisionContext) {
        // 检查目标是否改变
        if (this.targetTracking.target !== context.currentTarget) {
            this.resetTargetTracking();
            this.targetTracking.target = context.currentTarget;
            
            if (context.currentTarget) {
                this.targetTracking.lastPosition.set(context.currentTarget.position);
                console.log("MovementController: 目标已更新");
            }
        }
        
        if (!this.targetTracking.target) {
            return;
        }
        
        // 更新距离和接近历史
        const currentDistance = Vec3.distance(context.snakePosition, this.targetTracking.target.position);
        this.targetTracking.distance = currentDistance;
        
        this.targetTracking.approachHistory.push(currentDistance);
        if (this.targetTracking.approachHistory.length > 5) {
            this.targetTracking.approachHistory.shift();
        }
        
        // 检查是否在接近目标
        this.checkTargetApproach();
    }
    
    /**
     * 检查目标接近情况
     */
    private checkTargetApproach() {
        if (this.targetTracking.approachHistory.length < 3) {
            return;
        }
        
        const recent = this.targetTracking.approachHistory;
        const isApproaching = recent[recent.length - 1] < recent[0];
        
        if (!isApproaching) {
            this.targetTracking.stuckCounter++;
            console.log(`MovementController: 未在接近目标，卡住计数: ${this.targetTracking.stuckCounter}`);
        } else {
            this.targetTracking.stuckCounter = 0;
        }
    }
    
    /**
     * 重置目标跟踪
     */
    private resetTargetTracking() {
        this.targetTracking.target = null;
        this.targetTracking.distance = Infinity;
        this.targetTracking.stuckCounter = 0;
        this.targetTracking.lastPosition.set(0, 0, 0);
        this.targetTracking.approachHistory = [];
        
        console.log("MovementController: 目标跟踪已重置");
    }
    
    /**
     * 检查是否应该刷新目标
     */
    public shouldRefreshTarget(context: DecisionContext): boolean {
        // 没有目标时需要刷新
        if (!this.targetTracking.target) {
            return true;
        }
        
        // 目标无效时需要刷新
        if (!this.targetTracking.target.isValid) {
            console.log("MovementController: 目标无效，需要刷新");
            return true;
        }
        
        // 距离很近时需要刷新（可能已经可以吃到了）
        if (this.targetTracking.distance < this.targetRefreshDistance) {
            console.log("MovementController: 距离过近，刷新目标");
            return true;
        }
        
        // 卡住太久时需要刷新
        if (this.targetTracking.stuckCounter >= this.stuckThreshold) {
            console.log("MovementController: 长时间无法接近，强制刷新目标");
            return true;
        }
        
        // 目标位置发生变化（被其他东西吃了？）
        if (Vec3.distance(this.targetTracking.lastPosition, this.targetTracking.target.position) > 10) {
            console.log("MovementController: 目标位置变化，刷新目标");
            return true;
        }
        
        return false;
    }
    
    /**
     * 检查是否卡死
     */
    public isStuckInLoop(): boolean {
        if (this.movementHistory.length < 4) {
            return false;
        }
        
        // 检查最近4步是否在很小的范围内重复
        const recent = this.movementHistory.slice(-4);
        const center = recent[0].position;
        const maxDistance = recent.reduce((max, movement) => {
            return Math.max(max, Vec3.distance(center, movement.position));
        }, 0);
        
        // 如果4步都在50像素范围内，认为卡死了
        if (maxDistance < 50) {
            console.log("MovementController: 检测到移动卡死");
            return true;
        }
        
        // 检查是否在重复相同的移动模式
        if (this.isRepeatingPattern()) {
            console.log("MovementController: 检测到重复移动模式");
            return true;
        }
        
        return false;
    }
    
    /**
     * 检查是否存在重复的移动模式
     */
    private isRepeatingPattern(): boolean {
        if (this.movementHistory.length < 6) {
            return false;
        }
        
        const recent = this.movementHistory.slice(-6);
        
        // 检查是否存在A-B-A-B-A-B这样的模式
        for (let i = 0; i < recent.length - 3; i += 2) {
            const dir1 = recent[i].direction;
            const dir2 = recent[i + 1].direction;
            const dir3 = recent[i + 2].direction;
            const dir4 = recent[i + 3].direction;
            
            if (dir1 === dir3 && dir2 === dir4 && dir1 !== dir2) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 强制清空移动历史（卡死恢复）
     */
    public clearMovementHistory() {
        this.movementHistory = [];
        this.resetTargetTracking();
        console.log("MovementController: 移动历史已清空");
    }
    
    /**
     * 获取最近的移动方向
     */
    public getLastDirection(): Direction {
        if (this.movementHistory.length === 0) {
            return Direction.RIGHT; // 默认方向
        }
        
        return this.movementHistory[this.movementHistory.length - 1].direction;
    }
    
    /**
     * 获取路径历史（位置列表）
     */
    public getPathHistory(): Vec3[] {
        return this.movementHistory.map(h => h.position.clone());
    }
    
    /**
     * 获取目标跟踪信息
     */
    public getTargetTracking(): TargetTracking {
        return {
            target: this.targetTracking.target,
            distance: this.targetTracking.distance,
            stuckCounter: this.targetTracking.stuckCounter,
            lastPosition: this.targetTracking.lastPosition.clone(),
            approachHistory: [...this.targetTracking.approachHistory]
        };
    }
    
    /**
     * 获取移动统计信息
     */
    public getMovementStats(): {
        historyLength: number,
        averageSpeed: number,
        recentDirections: string[],
        isStuck: boolean
    } {
        const recentMovements = this.movementHistory.slice(-5);
        const recentDirections = recentMovements.map(m => this.directionToString(m.direction));
        
        // 计算平均速度（基于时间间隔）
        let averageSpeed = 0;
        if (recentMovements.length > 1) {
            const timeSpan = recentMovements[recentMovements.length - 1].timestamp - recentMovements[0].timestamp;
            const distance = recentMovements.reduce((total, movement, index) => {
                if (index === 0) return 0;
                return total + Vec3.distance(movement.position, recentMovements[index - 1].position);
            }, 0);
            
            averageSpeed = timeSpan > 0 ? distance / timeSpan * 1000 : 0; // 像素/秒
        }
        
        return {
            historyLength: this.movementHistory.length,
            averageSpeed: averageSpeed,
            recentDirections: recentDirections,
            isStuck: this.isStuckInLoop()
        };
    }
    
    /**
     * 设置配置参数
     */
    public setMaxHistoryLength(length: number) {
        this.maxHistoryLength = Math.max(5, Math.min(20, length));
        
        // 如果当前历史长度超过新设置，截断它
        if (this.movementHistory.length > this.maxHistoryLength) {
            this.movementHistory = this.movementHistory.slice(-this.maxHistoryLength);
        }
        
        console.log(`MovementController: 最大历史长度设置为 ${this.maxHistoryLength}`);
    }
    
    public setStuckThreshold(threshold: number) {
        this.stuckThreshold = Math.max(3, Math.min(10, threshold));
        console.log(`MovementController: 卡死阈值设置为 ${this.stuckThreshold}`);
    }
    
    public setTargetRefreshDistance(distance: number) {
        this.targetRefreshDistance = Math.max(20, Math.min(100, distance));
        console.log(`MovementController: 目标刷新距离设置为 ${this.targetRefreshDistance}`);
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
} 