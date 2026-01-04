import { _decorator, Component, Node, Button, Sprite, SpriteFrame } from 'cc';
import { AudioManager } from './AudioManager';
const { ccclass, property } = _decorator;

/**
 * 音频控制按钮组件
 * 可以放在任何场景中，提供快速的音频开关功能
 */
@ccclass('AudioControlButton')
export class AudioControlButton extends Component {
    @property({ tooltip: "控制类型：BGM 或 SFX" })
    controlType: string = 'BGM'; // 'BGM' 或 'SFX'
    
    @property(SpriteFrame)
    enabledIcon: SpriteFrame = null!;
    
    @property(SpriteFrame)
    disabledIcon: SpriteFrame = null!;
    
    @property({ tooltip: "是否显示音量控制" })
    showVolumeControl: boolean = false;
    
    @property(Node)
    volumeControlPanel: Node = null!;
    
    private button: Button = null!;
    private sprite: Sprite = null!;
    private audioManager: AudioManager = null!;
    
    onLoad() {
        this.button = this.getComponent(Button);
        this.sprite = this.getComponent(Sprite);
        
        if (!this.button) {
            console.error("AudioControlButton: 需要Button组件");
            return;
        }
        
        this.button.node.on(Button.EventType.CLICK, this.onButtonClicked, this);
        console.log(`AudioControlButton: ${this.controlType}控制按钮初始化`);
    }
    
    start() {
        this.audioManager = AudioManager.getInstance();
        if (!this.audioManager) {
            console.error("AudioControlButton: AudioManager未找到");
            return;
        }
        
        this.updateButtonState();
        
        // 隐藏音量控制面板
        if (this.volumeControlPanel) {
            this.volumeControlPanel.active = false;
        }
    }
    
    private onButtonClicked() {
        if (!this.audioManager) return;
        
        if (this.controlType === 'BGM') {
            const currentState = this.audioManager.isBGMEnabled();
            this.audioManager.setBGMEnabled(!currentState);
        } else if (this.controlType === 'SFX') {
            const currentState = this.audioManager.isSFXEnabled();
            this.audioManager.setSFXEnabled(!currentState);
        }
        
        this.updateButtonState();
        
        // 播放点击音效
        this.audioManager.playSFX('click');
        
        // 如果启用音量控制，切换面板显示
        if (this.showVolumeControl && this.volumeControlPanel) {
            this.volumeControlPanel.active = !this.volumeControlPanel.active;
        }
    }
    
    private updateButtonState() {
        if (!this.audioManager || !this.sprite) return;
        
        let isEnabled = false;
        
        if (this.controlType === 'BGM') {
            isEnabled = this.audioManager.isBGMEnabled();
        } else if (this.controlType === 'SFX') {
            isEnabled = this.audioManager.isSFXEnabled();
        }
        
        // 更新图标
        if (isEnabled && this.enabledIcon) {
            this.sprite.spriteFrame = this.enabledIcon;
        } else if (!isEnabled && this.disabledIcon) {
            this.sprite.spriteFrame = this.disabledIcon;
        }
        
        console.log(`AudioControlButton: ${this.controlType} 状态更新为 ${isEnabled ? '开启' : '关闭'}`);
    }
    
    // ========== 公共方法 ==========
    
    /**
     * 设置控制类型
     */
    public setControlType(type: 'BGM' | 'SFX') {
        this.controlType = type;
        this.updateButtonState();
    }
    
    /**
     * 刷新按钮状态
     */
    public refreshState() {
        this.updateButtonState();
    }
    
    /**
     * 设置图标
     */
    public setIcons(enabledIcon: SpriteFrame, disabledIcon: SpriteFrame) {
        this.enabledIcon = enabledIcon;
        this.disabledIcon = disabledIcon;
        this.updateButtonState();
    }
    
    onDestroy() {
        if (this.button) {
            this.button.node.off(Button.EventType.CLICK, this.onButtonClicked, this);
        }
    }
}
