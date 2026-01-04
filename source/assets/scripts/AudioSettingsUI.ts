import { _decorator, Component, Node, Button, Toggle, Slider, Label, BlockInputEvents } from 'cc';
import { AudioManager } from './AudioManager';
const { ccclass, property } = _decorator;

/**
 * 音频设置UI组件
 * 提供BGM和音效的开关、音量控制界面
 */
@ccclass('AudioSettingsUI')
export class AudioSettingsUI extends Component {
    @property(Toggle)
    bgmToggle: Toggle = null!;
    
    @property(Toggle)
    sfxToggle: Toggle = null!;
    
    @property(Slider)
    bgmVolumeSlider: Slider = null!;
    
    @property(Slider)
    sfxVolumeSlider: Slider = null!;
    
    @property(Label)
    bgmVolumeLabel: Label = null!;
    
    @property(Label)
    sfxVolumeLabel: Label = null!;
    
    @property(Button)
    testSFXButton: Button = null!;

    @property(Button)
    creditButton: Button = null!;

    @property(Node)
    creditPanel: Node = null!;

    @property(Button)
    closeButton: Button = null!;

    @property(Node)
    backgroundMask: Node = null!;

    private audioManager: AudioManager = null!;
    
    onLoad() {
        console.log("AudioSettingsUI: 音频设置UI初始化");
        this.setupEventListeners();
    }
    
    start() {
        this.audioManager = AudioManager.getInstance();
        if (!this.audioManager) {
            console.error("AudioSettingsUI: AudioManager未找到！");
            return;
        }
        
        this.loadCurrentSettings();
    }
    
    private setupBackgroundMask() {
        // 避免重复设置
        if (this.node.getComponent(BlockInputEvents)) {
            return;
        }

        // 如果没有设置背景遮罩，尝试自动添加
        if (!this.backgroundMask) {
            // 尝试在当前节点添加BlockInputEvents组件来阻挡点击
            let blockInput = this.node.getComponent(BlockInputEvents);
            if (!blockInput) {
                blockInput = this.node.addComponent(BlockInputEvents);
                console.log("AudioSettingsUI: 自动添加BlockInputEvents组件");
            }
        } else {
            // 如果设置了背景遮罩，为其添加点击事件监听（点击背景关闭面板）
            // 检查是否已经绑定了事件
            if (!this.backgroundMask.hasEventListener(Node.EventType.TOUCH_END, this.onBackgroundClicked, this)) {
                this.backgroundMask.on(Node.EventType.TOUCH_END, this.onBackgroundClicked, this);
            }

            // 确保背景遮罩有BlockInputEvents组件
            let blockInput = this.backgroundMask.getComponent(BlockInputEvents);
            if (!blockInput) {
                blockInput = this.backgroundMask.addComponent(BlockInputEvents);
                console.log("AudioSettingsUI: 为背景遮罩添加BlockInputEvents组件");
            }
        }
    }

    private setupEventListeners() {
        // BGM开关
        if (this.bgmToggle) {
            this.bgmToggle.node.on('toggle', this.onBGMToggleChanged, this);
        }
        
        // 音效开关
        if (this.sfxToggle) {
            this.sfxToggle.node.on('toggle', this.onSFXToggleChanged, this);
        }
        
        // BGM音量滑块
        if (this.bgmVolumeSlider) {
            this.bgmVolumeSlider.node.on('slide', this.onBGMVolumeChanged, this);
        }
        
        // 音效音量滑块
        if (this.sfxVolumeSlider) {
            this.sfxVolumeSlider.node.on('slide', this.onSFXVolumeChanged, this);
        }
        
        // 测试音效按钮
        if (this.testSFXButton) {
            this.testSFXButton.node.on(Button.EventType.CLICK, this.onTestSFXClicked, this);
        }

        // 版权信息按钮
        if (this.creditButton) {
            this.creditButton.node.on(Button.EventType.CLICK, this.onCreditClicked, this);
        }

        // 关闭按钮
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this.onCloseClicked, this);
        }
    }
    
    private loadCurrentSettings() {
        if (!this.audioManager) {
            console.warn("AudioSettingsUI: AudioManager不存在，无法加载设置");
            return;
        }

        // 获取AudioManager中的当前值
        const bgmEnabled = this.audioManager.isBGMEnabled();
        const sfxEnabled = this.audioManager.isSFXEnabled();
        const bgmVolume = this.audioManager.getBGMVolume();
        const sfxVolume = this.audioManager.getSFXVolume();

        console.log(`AudioSettingsUI: 从AudioManager获取的值 - BGM:${bgmEnabled}, SFX:${sfxEnabled}, BGMVolume:${bgmVolume}, SFXVolume:${sfxVolume}`);

        // 加载当前设置到UI
        if (this.bgmToggle) {
            this.bgmToggle.isChecked = bgmEnabled;
            console.log(`AudioSettingsUI: BGM开关设置为 ${bgmEnabled}`);
        }

        if (this.sfxToggle) {
            this.sfxToggle.isChecked = sfxEnabled;
            console.log(`AudioSettingsUI: SFX开关设置为 ${sfxEnabled}`);
        }

        if (this.bgmVolumeSlider) {
            this.bgmVolumeSlider.progress = bgmVolume;
            console.log(`AudioSettingsUI: BGM音量滑块设置为 ${bgmVolume}`);
        }

        if (this.sfxVolumeSlider) {
            this.sfxVolumeSlider.progress = sfxVolume;
            console.log(`AudioSettingsUI: SFX音量滑块设置为 ${sfxVolume}`);
        }

        this.updateVolumeLabels();

        console.log("AudioSettingsUI: 当前设置已加载到UI");
    }
    
    private onBGMToggleChanged(toggle: Toggle) {
        if (!this.audioManager) return;
        
        const enabled = toggle.isChecked;
        this.audioManager.setBGMEnabled(enabled);
        
        // 播放点击音效
        this.audioManager.playSFX('click');
        
        console.log(`AudioSettingsUI: BGM ${enabled ? '开启' : '关闭'}`);
    }
    
    private onSFXToggleChanged(toggle: Toggle) {
        if (!this.audioManager) return;
        
        const enabled = toggle.isChecked;
        this.audioManager.setSFXEnabled(enabled);
        
        // 如果开启音效，播放确认音效
        if (enabled) {
            this.audioManager.playSFX('click');
        }
        
        console.log(`AudioSettingsUI: 音效 ${enabled ? '开启' : '关闭'}`);
    }
    
    private onBGMVolumeChanged(slider: Slider) {
        if (!this.audioManager) return;
        
        const volume = slider.progress;
        this.audioManager.setBGMVolume(volume);
        this.updateBGMVolumeLabel(volume);
        
        console.log(`AudioSettingsUI: BGM音量设置为 ${Math.round(volume * 100)}%`);
    }
    
    private onSFXVolumeChanged(slider: Slider) {
        if (!this.audioManager) return;
        
        const volume = slider.progress;
        this.audioManager.setSFXVolume(volume);
        this.updateSFXVolumeLabel(volume);
        
        console.log(`AudioSettingsUI: 音效音量设置为 ${Math.round(volume * 100)}%`);
    }
    
    private onTestSFXClicked() {
        if (!this.audioManager) return;

        // 播放测试音效
        this.audioManager.playSFX('click');
        console.log("AudioSettingsUI: 播放测试音效");
    }

    private onCreditClicked() {
        console.log("AudioSettingsUI: 版权信息按钮被点击");

        // 播放点击音效
        if (this.audioManager) {
            this.audioManager.playSFX('click');
        }

        // 显示版权信息面板
        this.showCreditPanel();
    }

    private onCloseClicked() {
        console.log("AudioSettingsUI: 关闭按钮被点击");

        // 播放点击音效
        if (this.audioManager) {
            this.audioManager.playSFX('click');
        }

        // 调用管理器隐藏方法
        this.callManagerHideMethod();
    }

    private onBackgroundClicked() {
        console.log("AudioSettingsUI: 背景被点击，关闭面板");

        // 调用管理器隐藏方法
        this.callManagerHideMethod();
    }
    
    private updateVolumeLabels() {
        if (!this.audioManager) return;
        
        this.updateBGMVolumeLabel(this.audioManager.getBGMVolume());
        this.updateSFXVolumeLabel(this.audioManager.getSFXVolume());
    }
    
    private updateBGMVolumeLabel(volume: number) {
        if (this.bgmVolumeLabel) {
            this.bgmVolumeLabel.string = `${Math.round(volume * 100)}%`;
        }
    }
    
    private updateSFXVolumeLabel(volume: number) {
        if (this.sfxVolumeLabel) {
            this.sfxVolumeLabel.string = `${Math.round(volume * 100)}%`;
        }
    }
    
    // ========== 公共方法 ==========
    
    /**
     * 刷新UI显示
     */
    public refreshUI() {
        this.loadCurrentSettings();
    }
    
    /**
     * 重置为默认设置
     */
    public resetToDefault() {
        if (!this.audioManager) return;
        
        this.audioManager.setBGMEnabled(true);
        this.audioManager.setSFXEnabled(true);
        this.audioManager.setBGMVolume(0.5);
        this.audioManager.setSFXVolume(0.7);
        
        this.loadCurrentSettings();
        
        // 播放确认音效
        this.audioManager.playSFX('click');
        
        console.log("AudioSettingsUI: 已重置为默认设置");
    }
    
    /**
     * 快速切换BGM
     */
    public toggleBGM() {
        if (!this.audioManager) return;
        
        const currentState = this.audioManager.isBGMEnabled();
        this.audioManager.setBGMEnabled(!currentState);
        
        if (this.bgmToggle) {
            this.bgmToggle.isChecked = !currentState;
        }
        
        this.audioManager.playSFX('click');
    }
    
    /**
     * 快速切换音效
     */
    public toggleSFX() {
        if (!this.audioManager) return;

        const currentState = this.audioManager.isSFXEnabled();
        this.audioManager.setSFXEnabled(!currentState);

        if (this.sfxToggle) {
            this.sfxToggle.isChecked = !currentState;
        }

        // 如果开启音效，播放确认音效
        if (!currentState) {
            this.audioManager.playSFX('click');
        }
    }

    // ========== 面板显示控制方法 ==========

    /**
     * 显示设置面板
     */
    public showPanel() {
        this.node.active = true;
        console.log("AudioSettingsUI: 显示设置面板");

        // 在显示时设置背景遮罩
        this.setupBackgroundMask();

        console.log("AudioSettingsUI: 节点名称:", this.node.name);
        console.log("AudioSettingsUI: 节点是否激活:", this.node.active);
        console.log("AudioSettingsUI: 子节点数量:", this.node.children.length);

        // 确保所有子节点也是激活状态
        this.node.children.forEach((child, index) => {
            console.log(`AudioSettingsUI: 子节点${index}: ${child.name}, 激活状态: ${child.active}`);
            if (!child.active) {
                child.active = true;
                console.log(`AudioSettingsUI: 激活子节点 ${child.name}`);
            }
        });
    }

    /**
     * 隐藏设置面板
     */
    public hidePanel() {
        console.log("AudioSettingsUI: hidePanel被调用");

        // 对于预制体，直接调用管理器的隐藏方法
        this.callManagerHideMethod();
    }

    /**
     * 切换设置面板显示状态
     */
    public togglePanel() {
        if (this.node.active) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    /**
     * 调用管理器的隐藏方法
     */
    private callManagerHideMethod() {
        // 查找Canvas节点
        let currentNode = this.node;
        while (currentNode && currentNode.name !== 'Canvas') {
            currentNode = currentNode.parent;
        }

        if (currentNode) {
            // 在Canvas下查找LevelSelectManager
            const levelSelectManager = currentNode.getComponentInChildren('LevelSelectManager');
            if (levelSelectManager && levelSelectManager.hideSettingsPanel) {
                console.log("AudioSettingsUI: 找到LevelSelectManager，调用hideSettingsPanel");
                levelSelectManager.hideSettingsPanel();
                return;
            }

            // 如果没找到LevelSelectManager，查找GameManager
            const gameManager = currentNode.getComponentInChildren('GameManager');
            if (gameManager && gameManager.hideSettingsPanel) {
                console.log("AudioSettingsUI: 找到GameManager，调用hideSettingsPanel");
                gameManager.hideSettingsPanel();
                return;
            }
        }

        console.error("AudioSettingsUI: 未找到管理器组件，使用默认隐藏方式");
        this.node.active = false;
    }

    // ========== 版权信息面板控制 ==========

    /**
     * 显示版权信息面板
     */
    public showCreditPanel() {
        if (this.creditPanel) {
            this.creditPanel.active = true;
            console.log("AudioSettingsUI: 显示版权信息面板");
        } else {
            console.warn("AudioSettingsUI: 版权信息面板未设置");
            // 如果没有设置面板，直接在控制台显示版权信息
            this.showCreditInConsole();
        }
    }

    /**
     * 隐藏版权信息面板
     */
    public hideCreditPanel() {
        if (this.creditPanel) {
            this.creditPanel.active = false;
            console.log("AudioSettingsUI: 隐藏版权信息面板");
        }
    }

    /**
     * 在控制台显示版权信息（备用方案）
     */
    private showCreditInConsole() {
       
        console.log("=====================================");
    }
    
    onDestroy() {
        // 清理事件监听器
        if (this.bgmToggle && this.bgmToggle.node) {
            this.bgmToggle.node.off('toggle', this.onBGMToggleChanged, this);
        }

        if (this.sfxToggle && this.sfxToggle.node) {
            this.sfxToggle.node.off('toggle', this.onSFXToggleChanged, this);
        }
        
        if (this.bgmVolumeSlider && this.bgmVolumeSlider.node) {
            this.bgmVolumeSlider.node.off('slide', this.onBGMVolumeChanged, this);
        }

        if (this.sfxVolumeSlider && this.sfxVolumeSlider.node) {
            this.sfxVolumeSlider.node.off('slide', this.onSFXVolumeChanged, this);
        }

        if (this.testSFXButton && this.testSFXButton.node) {
            this.testSFXButton.node.off(Button.EventType.CLICK, this.onTestSFXClicked, this);
        }

        if (this.creditButton && this.creditButton.node) {
            this.creditButton.node.off(Button.EventType.CLICK, this.onCreditClicked, this);
        }

        if (this.closeButton && this.closeButton.node) {
            this.closeButton.node.off(Button.EventType.CLICK, this.onCloseClicked, this);
        }

        if (this.backgroundMask && this.backgroundMask.isValid) {
            this.backgroundMask.off(Node.EventType.TOUCH_END, this.onBackgroundClicked, this);
        }

        console.log("AudioSettingsUI: 组件销毁，事件监听器已清理");
    }
}
