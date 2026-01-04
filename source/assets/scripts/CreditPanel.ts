import { _decorator, Component, Node, Button, Label, RichText, BlockInputEvents } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 版权信息面板组件
 * 显示游戏中使用的资源版权信息和授权声明
 */
@ccclass('CreditPanel')
export class CreditPanel extends Component {
    @property(RichText)
    creditText: RichText = null!;
    
    @property(Button)
    closeButton: Button = null!;
    
    @property(Button)
    visitLinkButton: Button = null!;

    @property(Button)
    visitOpenGameArtButton: Button = null!;

    @property(Node)
    backgroundMask: Node = null!;

    onLoad() {
        console.log("CreditPanel: 版权信息面板初始化");
        this.setupBackgroundMask();
        this.setupEventListeners();
        this.setupCreditContent();
    }
    
    private setupBackgroundMask() {
        // 如果没有设置背景遮罩，尝试自动添加
        if (!this.backgroundMask) {
            // 尝试在当前节点添加BlockInputEvents组件来阻挡点击
            let blockInput = this.node.getComponent(BlockInputEvents);
            if (!blockInput) {
                blockInput = this.node.addComponent(BlockInputEvents);
                console.log("CreditPanel: 自动添加BlockInputEvents组件");
            }
        } else {
            // 如果设置了背景遮罩，为其添加点击事件监听（点击背景关闭面板）
            this.backgroundMask.on(Node.EventType.TOUCH_END, this.onBackgroundClicked, this);

            // 确保背景遮罩有BlockInputEvents组件
            let blockInput = this.backgroundMask.getComponent(BlockInputEvents);
            if (!blockInput) {
                blockInput = this.backgroundMask.addComponent(BlockInputEvents);
                console.log("CreditPanel: 为背景遮罩添加BlockInputEvents组件");
            }
        }
    }

    private setupEventListeners() {
        // 关闭按钮
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this.onCloseClicked, this);
        }

        // 访问链接按钮
        if (this.visitLinkButton) {
            this.visitLinkButton.node.on(Button.EventType.CLICK, this.onVisitLinkClicked, this);
        }

        // 访问OpenGameArt按钮
        if (this.visitOpenGameArtButton) {
            this.visitOpenGameArtButton.node.on(Button.EventType.CLICK, this.onVisitOpenGameArtClicked, this);
        }
    }
    
    private setupCreditContent() {
        if (!this.creditText) {
            console.error("CreditPanel: creditText组件未设置");
            return;
        }
        
        // 设置版权信息内容
        const creditContent = `1`;
        
        this.creditText.string = creditContent.trim();
        console.log("CreditPanel: 版权信息内容已设置");
    }
    
    private onCloseClicked() {
        console.log("CreditPanel: 关闭按钮被点击");
        this.callManagerHideMethod();
    }

    private onBackgroundClicked() {
        console.log("CreditPanel: 背景被点击，关闭面板");
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
                console.log("CreditPanel: 找到LevelSelectManager，调用hideCopyrightPanel");
                levelSelectManager.hideCopyrightPanel();
                return;
            }

            // 如果没找到LevelSelectManager，查找GameManager
            const gameManager = currentNode.getComponentInChildren('GameManager');
            if (gameManager && gameManager.hideCopyrightPanel) {
                console.log("CreditPanel: 找到GameManager，调用hideCopyrightPanel");
                gameManager.hideCopyrightPanel();
                return;
            }
        }

        console.error("CreditPanel: 未找到管理器组件，使用默认隐藏方式");
        this.node.active = false;
    }
    
    private onVisitLinkClicked() {
        console.log("CreditPanel: ");

        // 在浏览器中打开链接（如果支持）
        if (typeof window !== 'undefined' && window.open) {
            window.open('1', '_blank');
        } else {
            console.log("1");
        }
    }

    private onVisitOpenGameArtClicked() {
        console.log("1");

        // 在浏览器中打开OpenGameArt链接
        if (typeof window !== 'undefined' && window.open) {
            window.open('1', '_blank');
        } else {
            console.log("1");
        }
    }
    
    // ========== 面板显示控制方法 ==========
    
    /**
     * 显示版权信息面板
     */
    public showPanel() {
        this.node.active = true;
        console.log("CreditPanel: 显示版权信息面板");
    }
    
    /**
     * 隐藏版权信息面板
     */
    public hidePanel() {
        console.log("CreditPanel: hidePanel被调用");

        // 对于预制体，直接调用管理器的隐藏方法
        this.callManagerHideMethod();
    }
    
    /**
     * 切换版权信息面板显示状态
     */
    public togglePanel() {
        if (this.node.active) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }
    
    onDestroy() {
        // 清理事件监听器
        if (this.closeButton && this.closeButton.node) {
            this.closeButton.node.off(Button.EventType.CLICK, this.onCloseClicked, this);
        }

        if (this.visitLinkButton && this.visitLinkButton.node) {
            this.visitLinkButton.node.off(Button.EventType.CLICK, this.onVisitLinkClicked, this);
        }

        if (this.visitOpenGameArtButton && this.visitOpenGameArtButton.node) {
            this.visitOpenGameArtButton.node.off(Button.EventType.CLICK, this.onVisitOpenGameArtClicked, this);
        }

        if (this.backgroundMask && this.backgroundMask.isValid) {
            this.backgroundMask.off(Node.EventType.TOUCH_END, this.onBackgroundClicked, this);
        }

        console.log("CreditPanel: 组件销毁，事件监听器已清理");
    }
}
