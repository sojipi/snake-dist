import { _decorator, Component, Node, Vec2, EventTouch, Input, UITransform, Sprite, Color, Label, input, EventKeyboard, KeyCode, find } from 'cc';
import { SnakeController } from './SnakeController';
import { TutorialManager } from './TutorialManager';
const { ccclass, property } = _decorator;

@ccclass('DirectionButtonController')
export class DirectionButtonController extends Component {
    @property(Node)
    upButton: Node = null!;
    
    @property(Node)
    downButton: Node = null!;
    
    @property(Node)
    leftButton: Node = null!;
    
    @property(Node)
    rightButton: Node = null!;
    
    @property(SnakeController)
    snakeController: SnakeController = null!;

    @property({ tooltip: "长按多长时间开始加速（秒）" })
    holdTimeForBoost: number = 0.5;

    private isEnabled: boolean = true;
    private tutorialManager: TutorialManager = null!;
    
    // 长按检测相关
    private currentHoldDirection: Vec2 | null = null;
    private holdTimer: number = 0;
    private isHolding: boolean = false;
    private currentPressedKeys: Set<KeyCode> = new Set(); // 当前按下的键
    
    onLoad() {
        this.initButtons();
        this.setupButtonEvents();
        this.setupKeyboardInput();

        // 初始化教程管理器
        this.tutorialManager = find('Canvas')?.getComponentInChildren(TutorialManager) || null!;

        console.log("方向键控制器初始化完成 - 支持触摸和WASD键盘控制");
    }
    
    update(deltaTime: number) {
        this.updateHoldDetection(deltaTime);
    }
    
    private updateHoldDetection(deltaTime: number) {
        if (this.currentHoldDirection && this.isHolding) {
            this.holdTimer += deltaTime;
            
            // 检查是否达到加速阈值
            if (this.holdTimer >= this.holdTimeForBoost) {
                if (this.snakeController && !this.snakeController.isBoostingActive()) {
                    this.snakeController.setBoostMode(true);
                    console.log("长按检测：开始加速");

                    // 触发教程：长按移动
                    if (this.tutorialManager) {
                        this.tutorialManager.onPlayerHoldMove();
                    }
                }
            }
        }
    }
    
    private startHold(direction: Vec2) {
        // 如果方向改变，重置长按状态
        if (!this.currentHoldDirection ||
            this.currentHoldDirection.x !== direction.x ||
            this.currentHoldDirection.y !== direction.y) {
            this.stopHold();
        }

        this.currentHoldDirection = direction.clone();
        this.holdTimer = 0;
        this.isHolding = true;

        // 发送方向改变
        if (this.snakeController) {
            this.snakeController.setMoveDirection(direction);
        }

        // 触发教程：移动
        if (this.tutorialManager) {
            this.tutorialManager.onPlayerMoved();
        }
    }
    
    private stopHold() {
        this.currentHoldDirection = null;
        this.holdTimer = 0;
        this.isHolding = false;
        
        // 停止加速
        if (this.snakeController && this.snakeController.isBoostingActive()) {
            this.snakeController.setBoostMode(false);
            console.log("停止长按：结束加速");
        }
    }
    
    private initButtons() {
        // 初始化四个方向按键
        this.initSingleButton(this.upButton, "↑", "上");
        this.initSingleButton(this.downButton, "↓", "下");
        this.initSingleButton(this.leftButton, "←", "左");
        this.initSingleButton(this.rightButton, "→", "右");
    }
    
    private initSingleButton(buttonNode: Node, text: string, name: string) {
        if (!buttonNode) {
            console.error(`找不到${name}按键节点`);
            return;
        }

        // 确保按键有UITransform组件
        if (!buttonNode.getComponent(UITransform)) {
            const transform = buttonNode.addComponent(UITransform);
            transform.setContentSize(80, 80);
        }

        // 确保按键有Sprite组件（仅在没有时添加，避免覆盖预设的图片）
        if (!buttonNode.getComponent(Sprite)) {
            const sprite = buttonNode.addComponent(Sprite);
            sprite.color = new Color(200, 200, 200, 180); // 半透明灰色背景
        }

        // 不再自动添加文字标签，使用预设的图片资源
        console.log(`${name}按键初始化完成`);
    }
    
    private setupButtonEvents() {
        // 为每个按键设置触摸事件（包括长按检测）
        if (this.upButton) {
            this.upButton.on(Input.EventType.TOUCH_START, () => this.startHold(new Vec2(0, 1)), this);
            this.upButton.on(Input.EventType.TOUCH_END, () => this.stopHold(), this);
            this.upButton.on(Input.EventType.TOUCH_CANCEL, () => this.stopHold(), this);
        }
        
        if (this.downButton) {
            this.downButton.on(Input.EventType.TOUCH_START, () => this.startHold(new Vec2(0, -1)), this);
            this.downButton.on(Input.EventType.TOUCH_END, () => this.stopHold(), this);
            this.downButton.on(Input.EventType.TOUCH_CANCEL, () => this.stopHold(), this);
        }
        
        if (this.leftButton) {
            this.leftButton.on(Input.EventType.TOUCH_START, () => this.startHold(new Vec2(-1, 0)), this);
            this.leftButton.on(Input.EventType.TOUCH_END, () => this.stopHold(), this);
            this.leftButton.on(Input.EventType.TOUCH_CANCEL, () => this.stopHold(), this);
        }
        
        if (this.rightButton) {
            this.rightButton.on(Input.EventType.TOUCH_START, () => this.startHold(new Vec2(1, 0)), this);
            this.rightButton.on(Input.EventType.TOUCH_END, () => this.stopHold(), this);
            this.rightButton.on(Input.EventType.TOUCH_CANCEL, () => this.stopHold(), this);
        }
    }
    
    private setupKeyboardInput() {
        // 监听键盘事件 - WASD映射（支持长按）
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        console.log("WASD键盘控制已启用: W=上, A=左, S=下, D=右 (支持长按加速)");
    }
    
    private onKeyDown(event: EventKeyboard) {
        if (!this.isEnabled) {
            return;
        }
        
        // 防止重复触发
        if (this.currentPressedKeys.has(event.keyCode)) {
            return;
        }
        
        this.currentPressedKeys.add(event.keyCode);
        
        let direction: Vec2 | null = null;
        switch (event.keyCode) {
            case KeyCode.KEY_W:
                direction = new Vec2(0, 1); // 上
                break;
            case KeyCode.KEY_A:
                direction = new Vec2(-1, 0); // 左
                break;
            case KeyCode.KEY_S:
                direction = new Vec2(0, -1); // 下
                break;
            case KeyCode.KEY_D:
                direction = new Vec2(1, 0); // 右
                break;
        }
        
        if (direction) {
            this.startHold(direction);
        }
    }
    
    private onKeyUp(event: EventKeyboard) {
        if (!this.isEnabled) {
            return;
        }
        
        this.currentPressedKeys.delete(event.keyCode);
        
        // 检查是否是当前长按的方向键
        let isCurrentDirection = false;
        if (this.currentHoldDirection) {
            switch (event.keyCode) {
                case KeyCode.KEY_W:
                    isCurrentDirection = this.currentHoldDirection.equals(new Vec2(0, 1));
                    break;
                case KeyCode.KEY_A:
                    isCurrentDirection = this.currentHoldDirection.equals(new Vec2(-1, 0));
                    break;
                case KeyCode.KEY_S:
                    isCurrentDirection = this.currentHoldDirection.equals(new Vec2(0, -1));
                    break;
                case KeyCode.KEY_D:
                    isCurrentDirection = this.currentHoldDirection.equals(new Vec2(1, 0));
                    break;
            }
        }
        
        // 只有当释放的是当前长按的方向键时才停止长按
        if (isCurrentDirection) {
            this.stopHold();
        }
    }
    
    // 获取方向名称（用于调试）
    private getDirectionName(direction: Vec2): string {
        if (direction.x > 0) return "右";
        if (direction.x < 0) return "左";
        if (direction.y > 0) return "上";
        if (direction.y < 0) return "下";
        return "无";
    }
    
    public setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
        
        // 设置按键的透明度来表示启用/禁用状态
        const alpha = enabled ? 180 : 100;
        this.setButtonAlpha(this.upButton, alpha);
        this.setButtonAlpha(this.downButton, alpha);
        this.setButtonAlpha(this.leftButton, alpha);
        this.setButtonAlpha(this.rightButton, alpha);
    }
    
    private setButtonAlpha(buttonNode: Node, alpha: number) {
        if (!buttonNode) return;
        
        const sprite = buttonNode.getComponent(Sprite);
        if (sprite) {
            const color = sprite.color.clone();
            color.a = alpha;
            sprite.color = color;
        }
    }
    
    public isButtonEnabled(): boolean {
        return this.isEnabled;
    }
    
    onDestroy() {
        // 移除按钮事件监听
        if (this.upButton && this.upButton.isValid) {
            this.upButton.off(Input.EventType.TOUCH_START);
            this.upButton.off(Input.EventType.TOUCH_END);
            this.upButton.off(Input.EventType.TOUCH_CANCEL);
        }
        if (this.downButton && this.downButton.isValid) {
            this.downButton.off(Input.EventType.TOUCH_START);
            this.downButton.off(Input.EventType.TOUCH_END);
            this.downButton.off(Input.EventType.TOUCH_CANCEL);
        }
        if (this.leftButton && this.leftButton.isValid) {
            this.leftButton.off(Input.EventType.TOUCH_START);
            this.leftButton.off(Input.EventType.TOUCH_END);
            this.leftButton.off(Input.EventType.TOUCH_CANCEL);
        }
        if (this.rightButton && this.rightButton.isValid) {
            this.rightButton.off(Input.EventType.TOUCH_START);
            this.rightButton.off(Input.EventType.TOUCH_END);
            this.rightButton.off(Input.EventType.TOUCH_CANCEL);
        }
        
        // 移除键盘事件监听
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        
        // 清理长按状态
        this.stopHold();
        this.currentPressedKeys.clear();
    }
} 