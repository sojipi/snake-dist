import { _decorator, Component, Node, Vec3, Camera } from 'cc';
import { SnakeController } from './SnakeController';

const { ccclass, property } = _decorator;

@ccclass('CameraController')
export class CameraController extends Component {
    @property(Node)
    target: Node = null!; // 跟随目标（蛇头）
    
    @property
    followSpeed: number = 5.0; // 跟随速度
    
    @property
    smoothFollow: boolean = true; // 是否平滑跟随
    
    @property(Vec3)
    offset: Vec3 = new Vec3(0, 0, 0); // 相机偏移
    
    @property({ tooltip: "相机跟随的边界限制" })
    followBounds: { minX: number, maxX: number, minY: number, maxY: number } = {
        minX: -2000, maxX: 2000, minY: -1500, maxY: 1500
    };
    
    onLoad() {
        console.log("相机控制器初始化");
    }
    
    start() {
        // 如果没有设置目标，自动查找蛇头
        if (!this.target) {
            this.findSnakeHead();
        }
    }
    
    private findSnakeHead() {
        // 查找SnakeController组件
        const snakeControllerNode = this.node.scene.getChildByName('SnakeController');
        if (snakeControllerNode) {
            const snakeController = snakeControllerNode.getComponent(SnakeController);
            if (snakeController) {
                this.target = (snakeController as any).snakeHead;
                console.log("找到蛇头，开始相机跟随");
            }
        }
        
        // 如果还是找不到，尝试在Canvas下查找
        if (!this.target) {
            const canvas = this.node.scene.getChildByName('Canvas');
            if (canvas) {
                const gameManager = canvas.getChildByName('GameManager');
                if (gameManager) {
                    const snakeController = gameManager.getComponent(SnakeController);
                    if (snakeController) {
                        this.target = (snakeController as any).snakeHead;
                        console.log("在Canvas下找到蛇头，开始相机跟随");
                    }
                }
            }
        }
    }
    
    update(deltaTime: number) {
        if (!this.target) {
            return;
        }
        
        // 计算目标位置
        const targetPos = this.target.worldPosition.clone();
        targetPos.add(this.offset);
        
        // 应用边界限制
        targetPos.x = Math.max(this.followBounds.minX, Math.min(this.followBounds.maxX, targetPos.x));
        targetPos.y = Math.max(this.followBounds.minY, Math.min(this.followBounds.maxY, targetPos.y));
        
        if (this.smoothFollow) {
            // 平滑跟随
            const currentPos = this.node.worldPosition;
            const newPos = currentPos.lerp(targetPos, this.followSpeed * deltaTime);
            this.node.setWorldPosition(newPos);
        } else {
            // 直接跟随
            this.node.setWorldPosition(targetPos);
        }
    }
    
    // 设置跟随目标
    public setTarget(target: Node) {
        this.target = target;
        console.log("设置相机跟随目标:", target.name);
    }
    
    // 设置跟随速度
    public setFollowSpeed(speed: number) {
        this.followSpeed = speed;
    }
    
    // 设置偏移
    public setOffset(offset: Vec3) {
        this.offset = offset.clone();
    }
    
    // 设置跟随边界
    public setFollowBounds(minX: number, maxX: number, minY: number, maxY: number) {
        this.followBounds = { minX, maxX, minY, maxY };
        console.log(`设置相机跟随边界: X(${minX}, ${maxX}), Y(${minY}, ${maxY})`);
    }
} 