import { _decorator, Component, Node, Button, Label, Sprite, Color } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LevelItemController')
export class LevelItemController extends Component {
    @property(Button)
    levelButton: Button = null!;
    
    @property(Label)
    nameLabel: Label = null!;
    
    @property(Label)
    descLabel: Label = null!;
    

    
    @property(Node)
    lockIcon: Node = null!;
    
    @property(Node)
    completedIcon: Node = null!;
    
    @property(Sprite)
    backgroundSprite: Sprite = null!;
    
    private levelId: number = 0;
    private isUnlocked: boolean = false;
    private onClickCallback: ((levelId: number) => void) | null = null;
    
    onLoad() {
        this.setupButton();
    }
    
    private setupButton() {
        if (this.levelButton) {
            this.levelButton.node.on(Button.EventType.CLICK, this.onButtonClicked, this);
        }
    }
    
    private onButtonClicked() {
        if (this.isUnlocked && this.onClickCallback) {
            this.onClickCallback(this.levelId);
        }
    }
    
    // 设置关卡数据
    public setLevelData(
        id: number, 
        name: string, 
        description: string, 
        isUnlocked: boolean,
        isCompleted: boolean,
        clickCallback: (levelId: number) => void
    ) {
        this.levelId = id;
        this.isUnlocked = isUnlocked;
        this.onClickCallback = clickCallback;
        
        // 设置文本
        if (this.nameLabel) {
            this.nameLabel.string = name;
        }
        
        if (this.descLabel) {
            this.descLabel.string = description;
        }
        
        // 设置解锁状态
        this.setUnlockState(isUnlocked, isCompleted);
    }
    
    private setUnlockState(isUnlocked: boolean, isCompleted: boolean) {
        if (isUnlocked) {
            // 已解锁
            if (this.lockIcon) {
                this.lockIcon.active = false;
            }
            
            if (this.levelButton) {
                this.levelButton.interactable = true;
            }
            
            if (this.completedIcon) {
                this.completedIcon.active = isCompleted;
            }
            
            // 正常颜色
            if (this.backgroundSprite) {
                this.backgroundSprite.color = Color.WHITE;
            }
            
            if (this.nameLabel) {
                this.nameLabel.color = Color.WHITE;
            }
            
            if (this.descLabel) {
                this.descLabel.color = new Color(200, 200, 200, 255);
            }
        } else {
            // 未解锁
            if (this.lockIcon) {
                this.lockIcon.active = true;
            }
            
            if (this.completedIcon) {
                this.completedIcon.active = false;
            }
            
            if (this.levelButton) {
                this.levelButton.interactable = false;
            }
            
            // 灰色显示
            const grayColor = new Color(128, 128, 128, 255);
            
            if (this.backgroundSprite) {
                this.backgroundSprite.color = grayColor;
            }
            
            if (this.nameLabel) {
                this.nameLabel.color = grayColor;
            }
            
            if (this.descLabel) {
                this.descLabel.color = grayColor;
            }
        }
    }
    
    // 播放点击动画
    public playClickAnimation() {
        // 简单的缩放动画
        this.node.setScale(0.95, 0.95, 1);
        this.scheduleOnce(() => {
            this.node.setScale(1, 1, 1);
        }, 0.1);
    }
    
    // 播放解锁动画
    public playUnlockAnimation() {
        // 可以添加解锁时的特效动画
        console.log(`关卡 ${this.levelId} 解锁动画播放`);
    }
} 