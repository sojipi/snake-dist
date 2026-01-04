import { _decorator, Component, Button } from 'cc';
import { AudioManager } from './AudioManager';

const { ccclass, property } = _decorator;

/**
 * 音频测试按钮组件
 * 用于测试各种音效是否正常工作
 */
@ccclass('AudioTestButton')
export class AudioTestButton extends Component {
    
    @property(Button)
    testCollectButton: Button = null!;
    
    @property(Button)
    testWinButton: Button = null!;
    
    @property(Button)
    testLoseButton: Button = null!;
    
    @property(Button)
    testClickButton: Button = null!;
    
    onLoad() {
        this.setupButtons();
    }
    
    private setupButtons() {
        if (this.testCollectButton) {
            this.testCollectButton.node.on(Button.EventType.CLICK, this.onTestCollectClicked, this);
        }
        
        if (this.testWinButton) {
            this.testWinButton.node.on(Button.EventType.CLICK, this.onTestWinClicked, this);
        }
        
        if (this.testLoseButton) {
            this.testLoseButton.node.on(Button.EventType.CLICK, this.onTestLoseClicked, this);
        }
        
        if (this.testClickButton) {
            this.testClickButton.node.on(Button.EventType.CLICK, this.onTestClickClicked, this);
        }
    }
    
    private onTestCollectClicked() {
        console.log("测试收集音效");
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('collect');
        } else {
            console.error("AudioManager未找到");
        }
    }
    
    private onTestWinClicked() {
        console.log("测试胜利音效");
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('win');
        } else {
            console.error("AudioManager未找到");
        }
    }
    
    private onTestLoseClicked() {
        console.log("测试失败音效");
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('lose');
        } else {
            console.error("AudioManager未找到");
        }
    }
    
    private onTestClickClicked() {
        console.log("测试点击音效");
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        } else {
            console.error("AudioManager未找到");
        }
    }
    
    onDestroy() {
        // 清理事件监听
        if (this.testCollectButton) {
            this.testCollectButton.node.off(Button.EventType.CLICK, this.onTestCollectClicked, this);
        }
        
        if (this.testWinButton) {
            this.testWinButton.node.off(Button.EventType.CLICK, this.onTestWinClicked, this);
        }
        
        if (this.testLoseButton) {
            this.testLoseButton.node.off(Button.EventType.CLICK, this.onTestLoseClicked, this);
        }
        
        if (this.testClickButton) {
            this.testClickButton.node.off(Button.EventType.CLICK, this.onTestClickClicked, this);
        }
    }
}
