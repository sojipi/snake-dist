import { _decorator, Component, Node, Button, Label } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 排行榜测试脚本 - 用于测试非微信环境下的排行榜功能
 */
@ccclass('RankListTest')
export class RankListTest extends Component {
    
    @property(Button)
    testButton: Button = null!;
    
    @property(Label)
    statusLabel: Label = null!;
    
    onLoad() {
        console.log("RankListTest: 排行榜测试脚本初始化");
        this.initUI();
    }
    
    start() {
        this.updateStatus("点击按钮测试排行榜功能");
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
        console.log("RankListTest: 开始测试排行榜功能");
        this.updateStatus("正在测试排行榜功能...");
        
        try {
            // 获取 RankListManager 实例
            const rankListManager = this.getRankListManager();
            
            if (rankListManager) {
                console.log("RankListTest: 找到 RankListManager，开始显示排行榜");
                this.updateStatus("找到排行榜管理器，显示排行榜");
                
                // 显示排行榜
                rankListManager.showRankList();
                
                setTimeout(() => {
                    this.updateStatus("排行榜测试完成，检查控制台输出");
                }, 1000);
                
            } else {
                console.error("RankListTest: 未找到 RankListManager");
                this.updateStatus("错误：未找到排行榜管理器");
            }
            
        } catch (error) {
            console.error("RankListTest: 测试失败", error);
            this.updateStatus(`测试失败：${error}`);
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
                const rankManagerNode = canvas.getChildByName('RankListManager');
                if (rankManagerNode) {
                    const component = rankManagerNode.getComponent('RankListManager');
                    if (component) {
                        return component;
                    }
                }
                
                // 递归查找
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
            
            console.warn("RankListTest: 未找到 RankListManager 实例");
            return null;
        } catch (error) {
            console.error("RankListTest: 获取 RankListManager 失败", error);
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
            console.error("RankListTest: 递归查找节点失败", error);
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
            console.error("RankListTest: 递归查找组件失败", error);
            return null;
        }
    }
    
    /**
     * 更新状态显示
     */
    private updateStatus(message: string) {
        console.log(`RankListTest: ${message}`);
        if (this.statusLabel) {
            this.statusLabel.string = message;
        }
    }
    
    /**
     * 验证环境信息
     */
    public checkEnvironment() {
        console.log("RankListTest: ===== 环境检查 =====");
        console.log("RankListTest: 是否为微信环境:", typeof wx !== 'undefined');
        console.log("RankListTest: 浏览器环境:", typeof window !== 'undefined');
        console.log("RankListTest: localStorage可用:", typeof localStorage !== 'undefined');
        
        if (typeof wx !== 'undefined') {
            console.log("RankListTest: wx对象可用，类型:", typeof wx);
            console.log("RankListTest: wx.setUserCloudStorage可用:", typeof (wx as any).setUserCloudStorage === 'function');
            console.log("RankListTest: wx.getFriendCloudStorage可用:", typeof (wx as any).getFriendCloudStorage === 'function');
            console.log("RankListTest: wx.getStorageSync可用:", typeof (wx as any).getStorageSync === 'function');
        }
        
        console.log("RankListTest: ==================");
    }
}