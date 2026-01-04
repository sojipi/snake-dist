import { _decorator, Component, Node, Label, Button, tween, Vec3, director } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('GameOverDialog')
export class GameOverDialog extends Component {
    
    @property(Button)
    backToMenuButton: Button = null!;
    
    @property(Button)
    shareButton: Button = null!;
    
    @property(Label)
    titleLabel: Label = null!;
    
    @property(Label)
    messageLabel: Label = null!;
    
    @property(Node)
    dialogPanel: Node = null!;
    
    private isVictory: boolean = false;
    
    onLoad() {
        // 绑定回到选关按钮事件
        if (this.backToMenuButton) {
            this.backToMenuButton.node.on(Button.EventType.CLICK, this.onBackToMenuButtonClick, this);
        }
        
        // 绑定分享按钮事件
        if (this.shareButton) {
            this.shareButton.node.on(Button.EventType.CLICK, this.onShareButtonClick, this);
        }
        
        // 初始状态隐藏
        this.node.active = false;
        
        console.log("游戏结束弹窗初始化完成");
    }
    
    private onBackToMenuButtonClick() {
        console.log("点击回到选关按钮");
        this.hideDialog();
        
        // 跳转到选关界面
        director.loadScene('LevelScene');
    }
    
    private onShareButtonClick() {
        console.log("点击分享按钮");
        
        // 调用游戏管理器的分享功能
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            const shareTitle = this.isVictory 
                ? "我在贪吃蛇麻将游戏中成功过关，你也来挑战吧！" 
                : "贪吃蛇麻将游戏真的很有挑战性，你能比我做得更好吗？";
            
            gameManager.shareGame(shareTitle);
        } else {
            console.log("无法获取游戏管理器实例，分享功能不可用");
        }
    }
    
    public showDialog(isVictory: boolean = false, score: number = 0, failureReason?: string) {
        console.log(`显示游戏结束弹窗 - 胜利: ${isVictory}, 得分: ${score}`);
        
        this.isVictory = isVictory;
        
        // 设置标题和消息
        if (this.titleLabel) {
            this.titleLabel.string = isVictory ? "关卡完成！" : "游戏结束";
        }
        
        if (this.messageLabel) {
            if (isVictory) {
                this.messageLabel.string = `恭喜过关！\n得分: ${score}`;
            } else {
                this.messageLabel.string = failureReason || "再接再厉！";
            }
        }
        
        // 设置按钮显示
        if (this.backToMenuButton) {
            this.backToMenuButton.node.active = true; // 总是显示回到选关按钮
        }
        
        // 显示弹窗
        this.node.active = true;
        
        // 播放弹出动画
        this.playShowAnimation();
        
        // 胜利时暂停游戏
        if (isVictory) {
            const gameManager = GameManager.getInstance();
            if (gameManager) {
                gameManager.pauseGame();
            }
        }
    }
    
    public hideDialog() {
        console.log("隐藏游戏结束弹窗");
        
        // 播放隐藏动画
        this.playHideAnimation(() => {
            this.node.active = false;
        });
    }
    
    private playShowAnimation() {
        if (!this.dialogPanel) return;
        
        // 初始状态：面板缩小到0
        this.dialogPanel.setScale(0, 0, 1);
        
        // 弹出动画：从0缩放到1，带弹性效果
        tween(this.dialogPanel)
            .to(0.3, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'backOut' })
            .to(0.1, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }
    
    private playHideAnimation(callback?: () => void) {
        if (!this.dialogPanel) {
            if (callback) callback();
            return;
        }
        
        // 隐藏动画：缩小到0
        tween(this.dialogPanel)
            .to(0.2, { scale: new Vec3(0, 0, 1) }, { easing: 'backIn' })
            .call(() => {
                if (callback) {
                    callback();
                }
            })
            .start();
    }
    
    onDestroy() {
        // 清理按钮事件监听
        if (this.backToMenuButton && this.backToMenuButton.node) {
            this.backToMenuButton.node.off(Button.EventType.CLICK, this.onBackToMenuButtonClick, this);
        }
        
        // 清理分享按钮事件监听
        if (this.shareButton && this.shareButton.node) {
            this.shareButton.node.off(Button.EventType.CLICK, this.onShareButtonClick, this);
        }
    }
}