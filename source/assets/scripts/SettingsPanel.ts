import { _decorator, Component, Node, Button, Toggle, Slider, Label, Prefab, instantiate } from 'cc';
import { AudioManager } from './AudioManager';

const { ccclass, property } = _decorator;

/**
 * 游戏设置面板主控制器
 * 管理所有设置标签页和通用功能
 */
@ccclass('SettingsPanel')
export class SettingsPanel extends Component {
    
    // ========== UI引用 ==========
    @property(Node)
    panelRoot: Node = null!;
    
    @property(Node)
    tabContainer: Node = null!;
    
    @property(Node)
    contentContainer: Node = null!;
    
    // 标签页按钮
    @property(Button)
    audioTabButton: Button = null!;
    
    @property(Button)
    gameTabButton: Button = null!;
    
    @property(Button)
    displayTabButton: Button = null!;
    
    @property(Button)
    controlTabButton: Button = null!;
    
    @property(Button)
    dataTabButton: Button = null!;
    
    // 底部按钮
    @property(Button)
    resetButton: Button = null!;
    
    @property(Button)
    confirmButton: Button = null!;
    
    @property(Button)
    cancelButton: Button = null!;
    
    @property(Button)
    closeButton: Button = null!;
    
    // 标签页内容预制体
    @property(Prefab)
    audioSettingsPrefab: Prefab = null!;
    
    @property(Prefab)
    gameSettingsPrefab: Prefab = null!;
    
    @property(Prefab)
    displaySettingsPrefab: Prefab = null!;
    
    @property(Prefab)
    controlSettingsPrefab: Prefab = null!;
    
    @property(Prefab)
    dataSettingsPrefab: Prefab = null!;
    
    // ========== 私有属性 ==========
    private currentTab: string = 'audio';
    private tabButtons: Map<string, Button> = new Map();
    private tabContents: Map<string, Node> = new Map();
    private isVisible: boolean = false;
    
    // 设置数据缓存
    private settingsCache: Map<string, any> = new Map();
    
    onLoad() {
        this.initializeTabButtons();
        this.initializeBottomButtons();
        this.hidePanel();
    }
    
    start() {
        this.loadAllSettings();
        this.switchToTab('audio'); // 默认显示音频设置
    }
    
    // ========== 标签页管理 ==========
    
    private initializeTabButtons() {
        this.tabButtons.set('audio', this.audioTabButton);
        this.tabButtons.set('game', this.gameTabButton);
        this.tabButtons.set('display', this.displayTabButton);
        this.tabButtons.set('control', this.controlTabButton);
        this.tabButtons.set('data', this.dataTabButton);
        
        // 绑定标签页点击事件
        this.audioTabButton?.node.on(Button.EventType.CLICK, () => this.switchToTab('audio'), this);
        this.gameTabButton?.node.on(Button.EventType.CLICK, () => this.switchToTab('game'), this);
        this.displayTabButton?.node.on(Button.EventType.CLICK, () => this.switchToTab('display'), this);
        this.controlTabButton?.node.on(Button.EventType.CLICK, () => this.switchToTab('control'), this);
        this.dataTabButton?.node.on(Button.EventType.CLICK, () => this.switchToTab('data'), this);
    }
    
    private initializeBottomButtons() {
        this.resetButton?.node.on(Button.EventType.CLICK, this.onResetClicked, this);
        this.confirmButton?.node.on(Button.EventType.CLICK, this.onConfirmClicked, this);
        this.cancelButton?.node.on(Button.EventType.CLICK, this.onCancelClicked, this);
        this.closeButton?.node.on(Button.EventType.CLICK, this.onCloseClicked, this);
    }
    
    /**
     * 切换到指定标签页
     */
    public switchToTab(tabName: string) {
        if (this.currentTab === tabName) return;
        
        // 播放点击音效
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }
        
        // 更新标签页按钮状态
        this.updateTabButtonStates(tabName);
        
        // 切换内容
        this.switchTabContent(tabName);
        
        this.currentTab = tabName;
        console.log(`SettingsPanel: 切换到标签页 ${tabName}`);
    }
    
    private updateTabButtonStates(activeTab: string) {
        this.tabButtons.forEach((button, tabName) => {
            if (button) {
                // 更新按钮视觉状态（可以通过颜色或图标变化）
                const isActive = tabName === activeTab;
                button.interactable = !isActive;
                
                // 可以在这里添加更多视觉反馈
                if (isActive) {
                    button.node.setScale(1.1, 1.1, 1.0);
                } else {
                    button.node.setScale(1.0, 1.0, 1.0);
                }
            }
        });
    }
    
    private switchTabContent(tabName: string) {
        // 隐藏所有标签页内容
        this.tabContents.forEach((content) => {
            if (content) {
                content.active = false;
            }
        });
        
        // 显示目标标签页内容
        let targetContent = this.tabContents.get(tabName);
        if (!targetContent) {
            targetContent = this.createTabContent(tabName);
            if (targetContent) {
                this.tabContents.set(tabName, targetContent);
            }
        }
        
        if (targetContent) {
            targetContent.active = true;
        }
    }
    
    private createTabContent(tabName: string): Node | null {
        let prefab: Prefab | null = null;
        
        switch (tabName) {
            case 'audio':
                prefab = this.audioSettingsPrefab;
                break;
            case 'game':
                prefab = this.gameSettingsPrefab;
                break;
            case 'display':
                prefab = this.displaySettingsPrefab;
                break;
            case 'control':
                prefab = this.controlSettingsPrefab;
                break;
            case 'data':
                prefab = this.dataSettingsPrefab;
                break;
        }
        
        if (prefab && this.contentContainer) {
            const contentNode = instantiate(prefab);
            contentNode.setParent(this.contentContainer);
            return contentNode;
        }
        
        return null;
    }
    
    // ========== 面板显示控制 ==========
    
    /**
     * 显示设置面板
     */
    public showPanel() {
        if (this.panelRoot) {
            this.panelRoot.active = true;
            this.isVisible = true;
            
            // 播放打开音效
            const audioManager = AudioManager.getInstance();
            if (audioManager) {
                audioManager.playSFX('click');
            }
            
            console.log("SettingsPanel: 面板已显示");
        }
    }
    
    /**
     * 隐藏设置面板
     */
    public hidePanel() {
        if (this.panelRoot) {
            this.panelRoot.active = false;
            this.isVisible = false;
            console.log("SettingsPanel: 面板已隐藏");
        }
    }
    
    /**
     * 切换面板显示状态
     */
    public togglePanel() {
        if (this.isVisible) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }
    
    // ========== 底部按钮事件 ==========
    
    private onResetClicked() {
        console.log("SettingsPanel: 重置设置");
        
        // 播放点击音效
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }
        
        // 重置当前标签页的设置
        this.resetCurrentTabSettings();
    }
    
    private onConfirmClicked() {
        console.log("SettingsPanel: 确认设置");
        
        // 播放点击音效
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }
        
        // 保存所有设置
        this.saveAllSettings();
        this.hidePanel();
    }
    
    private onCancelClicked() {
        console.log("SettingsPanel: 取消设置");
        
        // 播放点击音效
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }
        
        // 恢复设置到打开面板前的状态
        this.restoreSettings();
        this.hidePanel();
    }
    
    private onCloseClicked() {
        console.log("SettingsPanel: 关闭面板");
        
        // 播放点击音效
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }
        
        this.hidePanel();
    }
    
    // ========== 设置数据管理 ==========
    
    private loadAllSettings() {
        // 加载所有设置到缓存
        // 这里可以从本地存储或服务器加载设置
        console.log("SettingsPanel: 加载所有设置");
    }
    
    private saveAllSettings() {
        // 保存所有设置
        console.log("SettingsPanel: 保存所有设置");
    }
    
    private restoreSettings() {
        // 恢复设置到之前的状态
        console.log("SettingsPanel: 恢复设置");
    }
    
    private resetCurrentTabSettings() {
        // 重置当前标签页的设置到默认值
        console.log(`SettingsPanel: 重置 ${this.currentTab} 标签页设置`);
    }
    
    onDestroy() {
        // 清理事件监听
        this.tabButtons.forEach((button) => {
            if (button && button.node) {
                button.node.off(Button.EventType.CLICK);
            }
        });

        if (this.resetButton && this.resetButton.node) {
            this.resetButton.node.off(Button.EventType.CLICK, this.onResetClicked, this);
        }
        if (this.confirmButton && this.confirmButton.node) {
            this.confirmButton.node.off(Button.EventType.CLICK, this.onConfirmClicked, this);
        }
        if (this.cancelButton && this.cancelButton.node) {
            this.cancelButton.node.off(Button.EventType.CLICK, this.onCancelClicked, this);
        }
        if (this.closeButton && this.closeButton.node) {
            this.closeButton.node.off(Button.EventType.CLICK, this.onCloseClicked, this);
        }
    }
}
