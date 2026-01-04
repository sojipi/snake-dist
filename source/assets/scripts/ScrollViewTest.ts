import { _decorator, Component, Node, Button, Label } from 'cc';
const { ccclass, property } = _decorator;

/**
 * ScrollView测试脚本 - 验证排行榜ScrollView滚动功能
 */
@ccclass('ScrollViewTest')
export class ScrollViewTest extends Component {
    
    @property(Button)
    testButton: Button = null!;
    
    @property(Label)
    statusLabel: Label = null!;
    
    onLoad() {
        console.log("ScrollViewTest: ScrollView测试脚本初始化");
        this.initUI();
    }
    
    start() {
        this.updateStatus("点击按钮测试排行榜ScrollView功能");
    }
    
    /**
     * 初始化UI
     */
    private initUI() {
        if (this.testButton) {
            this.testButton.node.on(Button.EventType.CLICK, this.onTestButtonClicked, this);
        }
    }
    
    /**
     * 测试按钮点击事件
     */
    private onTestButtonClicked() {
        console.log("ScrollViewTest: 开始测试ScrollView功能");
        this.updateStatus("正在测试ScrollView功能...");
        
        try {
            // 获取 RankListManager 实例
            const rankListManager = this.getRankListManager();
            
            if (rankListManager) {
                console.log("ScrollViewTest: 找到 RankListManager，显示排行榜测试ScrollView");
                this.updateStatus("找到排行榜管理器，显示排行榜测试");
                
                // 显示排行榜
                rankListManager.showRankList();
                
                setTimeout(() => {
                    this.updateStatus("排行榜已显示，请尝试滚动查看是否正常");
                    this.checkScrollViewStatus();
                }, 2000);
                
            } else {
                console.error("ScrollViewTest: 未找到 RankListManager");
                this.updateStatus("错误：未找到排行榜管理器");
            }
            
        } catch (error) {
            console.error("ScrollViewTest: 测试失败", error);
            this.updateStatus(`测试失败：${error}`);
        }
    }
    
    /**
     * 检查ScrollView状态
     */
    private checkScrollViewStatus() {
        try {
            // 查找排行榜弹窗
            const rankDialog = this.findRankListDialog();
            if (rankDialog) {
                const dialogComponent = rankDialog.getComponent('RankListDialog');
                if (dialogComponent && (dialogComponent as any).rankScrollView) {
                    const scrollView = (dialogComponent as any).rankScrollView;
                    const content = (dialogComponent as any).rankContent;
                    
                    console.log("ScrollViewTest: === ScrollView状态检查 ===");
                    console.log("ScrollViewTest: ScrollView节点名:", scrollView.node.name);
                    console.log("ScrollViewTest: ScrollView激活状态:", scrollView.node.active);
                    console.log("ScrollViewTest: Content节点名:", content?.name);
                    console.log("ScrollViewTest: Content子节点数量:", content?.children.length || 0);
                    
                    if (content) {
                        const uiTransform = content.getComponent('UITransform');
                        if (uiTransform) {
                            console.log(`ScrollViewTest: Content大小: ${uiTransform.width} x ${uiTransform.height}`);
                        }
                        
                        const layout = content.getComponent('Layout');
                        console.log("ScrollViewTest: Layout组件存在:", !!layout);
                        if (layout) {
                            console.log("ScrollViewTest: Layout类型:", layout.type);
                            console.log("ScrollViewTest: Layout间距:", layout.spacingY);
                        }
                    }
                    
                    // 测试滚动功能
                    console.log("ScrollViewTest: 开始测试滚动功能");
                    this.testScrollFunctions(scrollView);
                    
                } else {
                    console.warn("ScrollViewTest: 未找到排行榜弹窗组件或ScrollView");
                    this.updateStatus("未找到ScrollView组件");
                }
            } else {
                console.warn("ScrollViewTest: 未找到排行榜弹窗");
                this.updateStatus("未找到排行榜弹窗");
            }
        } catch (error) {
            console.error("ScrollViewTest: 检查ScrollView状态失败", error);
            this.updateStatus("检查ScrollView状态失败");
        }
    }
    
    /**
     * 测试滚动功能
     */
    private testScrollFunctions(scrollView: any) {
        try {
            console.log("ScrollViewTest: 测试scrollToTop方法");
            scrollView.scrollToTop(0.5);
            
            setTimeout(() => {
                console.log("ScrollViewTest: 测试scrollToBottom方法");
                scrollView.scrollToBottom(0.5);
                
                setTimeout(() => {
                    console.log("ScrollViewTest: 测试scrollToTop方法（返回顶部）");
                    scrollView.scrollToTop(0.5);
                    this.updateStatus("ScrollView测试完成，滚动功能正常");
                }, 1000);
            }, 1000);
            
        } catch (error) {
            console.error("ScrollViewTest: 测试滚动功能失败", error);
            this.updateStatus("滚动功能测试失败");
        }
    }
    
    /**
     * 查找排行榜弹窗
     */
    private findRankListDialog(): Node | null {
        try {
            const canvas = this.node.scene?.getChildByName('Canvas');
            if (canvas) {
                // 查找可能的弹窗节点名称
                const possibleNames = ['RankListDialog', 'RankDialog', 'RankList'];
                
                for (const name of possibleNames) {
                    const dialog = this.findNodeRecursively(canvas, name);
                    if (dialog) {
                        console.log(`ScrollViewTest: 找到排行榜弹窗: ${name}`);
                        return dialog;
                    }
                }
            }
            return null;
        } catch (error) {
            console.error("ScrollViewTest: 查找排行榜弹窗失败", error);
            return null;
        }
    }
    
    /**
     * 获取 RankListManager 实例
     */
    private getRankListManager(): any {
        try {
            // 尝试通过全局查找获取实例
            if (typeof window !== 'undefined' && (window as any).RankListManager) {
                return (window as any).RankListManager.getInstance();
            }
            
            // 尝试从场景中查找
            const canvas = this.node.scene?.getChildByName('Canvas');
            if (canvas) {
                const foundNode = this.findNodeRecursively(canvas, 'RankListManager');
                if (foundNode) {
                    const component = foundNode.getComponent('RankListManager');
                    if (component) {
                        return component;
                    }
                }
                
                // 尝试查找任何包含RankListManager组件的节点
                const rankManagerComponent = this.findComponentRecursively(canvas, 'RankListManager');
                if (rankManagerComponent) {
                    return rankManagerComponent;
                }
            }
            
            return null;
        } catch (error) {
            console.error("ScrollViewTest: 获取 RankListManager 失败", error);
            return null;
        }
    }
    
    /**
     * 递归查找节点
     */
    private findNodeRecursively(parent: Node, targetName: string): Node | null {
        try {
            if (parent.name === targetName) {
                return parent;
            }
            
            for (let i = 0; i < parent.children.length; i++) {
                const child = parent.children[i];
                const found = this.findNodeRecursively(child, targetName);
                if (found) {
                    return found;
                }
            }
            
            return null;
        } catch (error) {
            console.error("ScrollViewTest: 递归查找节点失败", error);
            return null;
        }
    }
    
    /**
     * 递归查找组件
     */
    private findComponentRecursively(parent: Node, componentName: string): any {
        try {
            // 检查当前节点是否有目标组件
            const component = parent.getComponent(componentName);
            if (component) {
                return component;
            }
            
            // 递归检查子节点
            for (let i = 0; i < parent.children.length; i++) {
                const child = parent.children[i];
                const found = this.findComponentRecursively(child, componentName);
                if (found) {
                    return found;
                }
            }
            
            return null;
        } catch (error) {
            console.error("ScrollViewTest: 递归查找组件失败", error);
            return null;
        }
    }
    
    /**
     * 更新状态显示
     */
    private updateStatus(message: string) {
        console.log(`ScrollViewTest: ${message}`);
        if (this.statusLabel) {
            this.statusLabel.string = message;
        }
    }
}