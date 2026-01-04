import { _decorator, Component, Node, UITransform, Sprite, Color, BoxCollider2D, RigidBody2D, ERigidBody2DType, Vec3, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BoundaryManager')
export class BoundaryManager extends Component {
    @property(Node)
    canvas: Node = null!;

    @property({ tooltip: "是否基于背景图尺寸自动计算边界" })
    useBackgroundBounds: boolean = true;

    private boundaries: Node[] = [];
    private boundaryThickness: number = 20; // 边框厚度
    private backgroundBounds: { width: number, height: number } = { width: 0, height: 0 };

    onLoad() {
        console.log("边框管理器初始化完成");
    }

    start() {
        // 在 start 方法中创建边框，确保 canvas 已经被设置
        this.createBoundaries();
    }

    private createBoundaries() {
        if (!this.canvas) {
            console.error("Canvas 节点未设置");
            return;
        }

        let canvasSize = { width: 1280, height: 720 }; // 默认尺寸
        
        if (this.useBackgroundBounds) {
            // 尝试从背景图获取实际游戏区域尺寸
            const backgroundBounds = this.getBackgroundBounds();
            if (backgroundBounds.width > 0 && backgroundBounds.height > 0) {
                canvasSize = backgroundBounds;
                console.log(`使用背景图尺寸作为游戏边界: ${canvasSize.width} x ${canvasSize.height}`);
            } else {
                // 回退到Canvas尺寸
                const canvasTransform = this.canvas.getComponent(UITransform);
                if (canvasTransform) {
                    canvasSize = canvasTransform.contentSize;
                }
                console.log(`背景图尺寸获取失败，使用Canvas尺寸: ${canvasSize.width} x ${canvasSize.height}`);
            }
        } else {
            // 使用Canvas尺寸
            const canvasTransform = this.canvas.getComponent(UITransform);
            if (canvasTransform) {
                canvasSize = canvasTransform.contentSize;
            }
        }

        this.backgroundBounds = canvasSize;
        const halfWidth = canvasSize.width / 2;
        const halfHeight = canvasSize.height / 2;

        console.log(`开始创建边框，游戏区域尺寸: ${canvasSize.width} x ${canvasSize.height}`);

        // 创建四个边框：上、下、左、右
        this.createBoundary("TopBoundary", 0, halfHeight + this.boundaryThickness / 2, canvasSize.width, this.boundaryThickness);
        this.createBoundary("BottomBoundary", 0, -halfHeight - this.boundaryThickness / 2, canvasSize.width, this.boundaryThickness);
        this.createBoundary("LeftBoundary", -halfWidth - this.boundaryThickness / 2, 0, this.boundaryThickness, canvasSize.height);
        this.createBoundary("RightBoundary", halfWidth + this.boundaryThickness / 2, 0, this.boundaryThickness, canvasSize.height);

        console.log(`边框创建完成，游戏区域: ${canvasSize.width} x ${canvasSize.height}`);
    }

    public getBackgroundBounds(): { width: number, height: number } {
        // 递归查找Background节点
        const backgroundNode = this.findNodeByName(this.canvas, 'Background');
        if (!backgroundNode) {
            console.warn("找不到Background节点");
            return { width: 0, height: 0 };
        }

        const bgTransform = backgroundNode.getComponent(UITransform);
        if (!bgTransform) {
            console.warn("Background节点缺少UITransform组件");
            return { width: 0, height: 0 };
        }

        // 获取背景的实际尺寸（考虑缩放）
        const contentSize = bgTransform.contentSize;
        const scale = backgroundNode.scale;
        
        const actualWidth = contentSize.width * scale.x;
        const actualHeight = contentSize.height * scale.y;

        console.log(`背景图原始尺寸: ${contentSize.width} x ${contentSize.height}`);
        console.log(`背景图缩放: ${scale.x} x ${scale.y}`);
        console.log(`背景图实际尺寸: ${actualWidth} x ${actualHeight}`);

        return { width: actualWidth, height: actualHeight };
    }

    private findNodeByName(parent: Node, name: string): Node | null {
        // 检查当前节点
        if (parent.name === name) {
            return parent;
        }
        
        // 检查所有子节点
        for (const child of parent.children) {
            const found = this.findNodeByName(child, name);
            if (found) {
                return found;
            }
        }
        
        return null;
    }

    private createBoundary(name: string, x: number, y: number, width: number, height: number) {
        // 创建边框节点
        const boundary = new Node(name);
        boundary.setParent(this.canvas);
        boundary.setPosition(x, y, 0);

        // 添加 UITransform 组件
        const transform = boundary.addComponent(UITransform);
        transform.setContentSize(width, height);

        // 添加 Sprite 组件用于显示
        const sprite = boundary.addComponent(Sprite);
        sprite.color = new Color(100, 100, 100, 255); // 灰色边框

        // 添加 RigidBody2D 组件
        const rigidBody = boundary.addComponent(RigidBody2D);
        rigidBody.type = ERigidBody2DType.Static; // 静态刚体，不会移动
        rigidBody.gravityScale = 0;

        // 添加 BoxCollider2D 组件
        const collider = boundary.addComponent(BoxCollider2D);
        collider.size.width = width;
        collider.size.height = height;
        collider.sensor = false; // 实体碰撞体，会阻止物体穿过

        // 设置标签，便于识别
        boundary.name = name;

        this.boundaries.push(boundary);
        console.log(`创建边框: ${name}, 位置: (${x}, ${y}), 尺寸: ${width}x${height}`);
    }

    public getBoundaries(): Node[] {
        return this.boundaries;
    }

    public getStoredBackgroundBounds(): { width: number, height: number } {
        return this.backgroundBounds;
    }

    public getGameAreaBounds(): { minX: number, maxX: number, minY: number, maxY: number } {
        const halfWidth = this.backgroundBounds.width / 2;
        const halfHeight = this.backgroundBounds.height / 2;
        
        return {
            minX: -halfWidth,
            maxX: halfWidth,
            minY: -halfHeight,
            maxY: halfHeight
        };
    }

    public setBoundaryColor(color: Color) {
        this.boundaries.forEach(boundary => {
            const sprite = boundary.getComponent(Sprite);
            if (sprite) {
                sprite.color = color;
            }
        });
    }

    public setBoundaryThickness(thickness: number) {
        this.boundaryThickness = thickness;
        // 重新创建边框
        this.destroyBoundaries();
        this.createBoundaries();
    }

    private destroyBoundaries() {
        this.boundaries.forEach(boundary => {
            if (boundary && boundary.isValid) {
                boundary.destroy();
            }
        });
        this.boundaries = [];
    }

    onDestroy() {
        this.destroyBoundaries();
    }
} 