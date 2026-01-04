import { _decorator, Component, Node, tween, Vec3, Color, Sprite, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoadingAnimation')
export class LoadingAnimation extends Component {
    @property(Node)
    rotatingIcon: Node = null!;
    
    @property(Label)
    dotsLabel: Label = null!;
    
    @property({ tooltip: "旋转速度（度/秒）" })
    rotationSpeed: number = 360;
    
    @property({ tooltip: "点点动画间隔（秒）" })
    dotsInterval: number = 0.5;
    
    private dotsCount: number = 0;
    private maxDots: number = 3;
    
    onLoad() {
        this.startRotationAnimation();
        this.startDotsAnimation();
    }
    
    private startRotationAnimation() {
        if (!this.rotatingIcon) return;
        
        // 持续旋转动画
        const rotationTime = 360 / this.rotationSpeed;
        tween(this.rotatingIcon)
            .by(rotationTime, { eulerAngles: new Vec3(0, 0, -360) })
            .union()
            .repeatForever()
            .start();
    }
    
    private startDotsAnimation() {
        if (!this.dotsLabel) return;
        
        const updateDots = () => {
            this.dotsCount = (this.dotsCount + 1) % (this.maxDots + 1);
            let dotsString = "";
            for (let i = 0; i < this.dotsCount; i++) {
                dotsString += ".";
            }
            this.dotsLabel.string = dotsString;
            
            this.scheduleOnce(updateDots, this.dotsInterval);
        };
        
        updateDots();
    }
    
    // 停止所有动画
    public stopAnimations() {
        if (this.rotatingIcon) {
            this.rotatingIcon.stopAllActions();
        }
        this.unscheduleAllCallbacks();
    }
    
    // 设置旋转速度
    public setRotationSpeed(speed: number) {
        this.rotationSpeed = speed;
        if (this.rotatingIcon) {
            this.rotatingIcon.stopAllActions();
            this.startRotationAnimation();
        }
    }
    
    // 设置点点动画间隔
    public setDotsInterval(interval: number) {
        this.dotsInterval = interval;
    }
    
    onDestroy() {
        this.stopAnimations();
    }
}
