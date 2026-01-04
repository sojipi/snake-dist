import { _decorator, Component, Node, Label, Button, BlockInputEvents } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 版权声明组件
 * 可以放置在游戏的任何场景中显示版权信息
 */
@ccclass('CopyrightNotice')
export class CopyrightNotice extends Component {
    @property(Label)
    copyrightLabel: Label = null!;
    
    @property(Button)
    linkButton: Button = null!;

    @property(Button)
    closeButton: Button = null!;

    @property(Node)
    backgroundMask: Node = null!;

    @property({ tooltip: "是否在游戏启动时显示版权信息" })
    showOnStart: boolean = false;
    
    @property({ tooltip: "显示持续时间（秒），0表示不自动隐藏" })
    displayDuration: number = 0;
    
    onLoad() {
        console.log("CopyrightNotice: 版权声明组件初始化");
        this.setupBackgroundMask();
        this.setupCopyrightText();
        this.setupEventListeners();
    }
    
    start() {
        if (this.showOnStart) {
            this.showNotice();
        } else {
            this.hideNotice();
        }
    }
    
    private setupCopyrightText() {
        if (!this.copyrightLabel) {
            console.warn("CopyrightNotice: copyrightLabel未设置");
            return;
        }
        
        // 设置版权声明文本
        const copyrightText = `1`;
        
        this.copyrightLabel.string = copyrightText;
        console.log("CopyrightNotice: 版权声明文本已设置");
    }
    
    private setupBackgroundMask() {
        // 如果没有设置背景遮罩，尝试自动添加
        if (!this.backgroundMask) {
            // 尝试在当前节点添加BlockInputEvents组件来阻挡点击
            let blockInput = this.node.getComponent(BlockInputEvents);
            if (!blockInput) {
                blockInput = this.node.addComponent(BlockInputEvents);
                console.log("CopyrightNotice: 自动添加BlockInputEvents组件");
            }
        } else {
            // 如果设置了背景遮罩，为其添加点击事件监听（点击背景关闭面板）
            this.backgroundMask.on(Node.EventType.TOUCH_END, this.onBackgroundClicked, this);

            // 确保背景遮罩有BlockInputEvents组件
            let blockInput = this.backgroundMask.getComponent(BlockInputEvents);
            if (!blockInput) {
                blockInput = this.backgroundMask.addComponent(BlockInputEvents);
                console.log("CopyrightNotice: 为背景遮罩添加BlockInputEvents组件");
            }
        }
    }

    private setupEventListeners() {
        if (this.linkButton) {
            this.linkButton.node.on(Button.EventType.CLICK, this.onLinkClicked, this);
        }

        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this.onCloseClicked, this);
        }
    }
    
    private onLinkClicked() {
        console.log("CopyrightNotice: 链接按钮被点击");

        // 尝试在浏览器中打开链接
        this.openLink('1');

        // 显示详细的版权信息
        this.showDetailedCopyright();
    }

    private onCloseClicked() {
        console.log("CopyrightNotice: 关闭按钮被点击");

        // 直接调用LevelSelectManager的隐藏方法
        this.callManagerHideMethod();
    }

    private onBackgroundClicked() {
        console.log("CopyrightNotice: 背景被点击，关闭面板");

        // 点击背景关闭面板
        this.callManagerHideMethod();
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
            if (levelSelectManager) {
                console.log("CopyrightNotice: 找到LevelSelectManager，调用hideCopyrightPanel");
                levelSelectManager.hideCopyrightPanel();
                return;
            }

            // 如果没找到LevelSelectManager，查找GameManager
            const gameManager = currentNode.getComponentInChildren('GameManager');
            if (gameManager && gameManager.hideCopyrightPanel) {
                console.log("CopyrightNotice: 找到GameManager，调用hideCopyrightPanel");
                gameManager.hideCopyrightPanel();
                return;
            }
        }

        console.error("CopyrightNotice: 未找到管理器组件，无法隐藏面板");
    }
    
    private openLink(url: string) {
        if (typeof window !== 'undefined' && window.open) {
            window.open(url, '_blank');
            console.log(`CopyrightNotice: 在浏览器中打开 ${url}`);
        } else {
            console.log(`CopyrightNotice: 请访问 ${url}`);
        }
    }
    
    private showDetailedCopyright() {
     
        console.log("================================================");
    }
    
    // ========== 公共方法 ==========
    
    /**
     * 显示版权声明
     */
    public showNotice() {
        this.node.active = true;
        console.log("CopyrightNotice: 显示版权声明");
        
        // 如果设置了显示持续时间，自动隐藏
        if (this.displayDuration > 0) {
            this.scheduleOnce(() => {
                this.hideNotice();
            }, this.displayDuration);
        }
    }
    
    /**
     * 隐藏版权声明
     */
    public hideNotice() {
        console.log("CopyrightNotice: hideNotice被调用");

        // 对于预制体，直接调用管理器的隐藏方法
        this.callManagerHideMethod();
    }
    
    /**
     * 切换版权声明显示状态
     */
    public toggleNotice() {
        if (this.node.active) {
            this.hideNotice();
        } else {
            this.showNotice();
        }
    }
    
    /**
     * 更新版权文本
     */
    public updateCopyrightText(newText: string) {
        if (this.copyrightLabel) {
            this.copyrightLabel.string = newText;
            console.log("CopyrightNotice: 版权文本已更新");
        }
    }
    
    /**
     * 获取标准的版权声明文本
     */
    public static getStandardCopyrightText(): string {
        return `1`;
    }

    /**
     * 获取简短的版权声明文本
     */
    public static getShortCopyrightText(): string {
        return "1";
    }


    
    onDestroy() {
        // 清理事件监听器
        if (this.linkButton && this.linkButton.node) {
            this.linkButton.node.off(Button.EventType.CLICK, this.onLinkClicked, this);
        }

        if (this.closeButton && this.closeButton.node) {
            this.closeButton.node.off(Button.EventType.CLICK, this.onCloseClicked, this);
        }

        if (this.backgroundMask && this.backgroundMask.isValid) {
            this.backgroundMask.off(Node.EventType.TOUCH_END, this.onBackgroundClicked, this);
        }

        console.log("CopyrightNotice: 组件销毁，事件监听器已清理");
    }
}
