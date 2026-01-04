import { _decorator, Component, Node, Button, Label } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 推荐功能测试脚本 - 用于测试微信小游戏推荐功能
 */
@ccclass('RecommendTest')
export class RecommendTest extends Component {
    
    @property(Button)
    testButton: Button = null!;
    
    @property(Button)
    directTestButton: Button = null!;
    
    @property(Label)
    statusLabel: Label = null!;
    
    onLoad() {
        console.log("RecommendTest: 推荐功能测试脚本初始化");
        this.initUI();
    }
    
    start() {
        this.updateStatus("点击按钮测试推荐功能");
        this.checkWXEnvironment();
    }
    
    /**
     * 初始化UI
     */
    private initUI() {
        if (this.testButton) {
            this.testButton.node.on(Button.EventType.CLICK, this.onTestButtonClicked, this);
        }
        
        if (this.directTestButton) {
            this.directTestButton.node.on(Button.EventType.CLICK, this.onDirectTestButtonClicked, this);
        }
    }
    
    /**
     * 检查微信环境
     */
    private checkWXEnvironment() {
        console.log("RecommendTest: ===== 微信环境检查 =====");
        console.log("RecommendTest: 是否为微信环境:", typeof wx !== 'undefined');
        
        if (typeof wx !== 'undefined') {
            console.log("RecommendTest: wx对象可用，类型:", typeof wx);
            console.log("RecommendTest: wx.recommendGame可用:", typeof (wx as any).recommendGame === 'function');
            console.log("RecommendTest: wx.getSystemInfoSync可用:", typeof (wx as any).getSystemInfoSync === 'function');
            
            // 获取系统信息
            if (typeof (wx as any).getSystemInfoSync === 'function') {
                try {
                    const systemInfo = (wx as any).getSystemInfoSync();
                    console.log("RecommendTest: 微信版本:", systemInfo.version);
                    console.log("RecommendTest: 基础库版本:", systemInfo.SDKVersion);
                } catch (error) {
                    console.log("RecommendTest: 获取系统信息失败", error);
                }
            }
        } else {
            console.log("RecommendTest: 非微信环境，推荐功能将无法使用");
        }
        
        console.log("RecommendTest: ==================");
    }
    
    /**
     * 测试按钮点击事件（通过排行榜弹窗）
     */
    private onTestButtonClicked() {
        console.log("RecommendTest: 开始测试推荐功能（通过排行榜）");
        this.updateStatus("正在通过排行榜测试推荐功能...");
        
        try {
            // 获取 RankListManager 实例
            const rankListManager = this.getRankListManager();
            
            if (rankListManager) {
                console.log("RecommendTest: 找到 RankListManager，显示排行榜");
                this.updateStatus("找到排行榜管理器，显示排行榜");
                
                // 显示排行榜
                rankListManager.showRankList();
                
                setTimeout(() => {
                    this.updateStatus("排行榜已显示，请点击推荐朋友按钮测试");
                }, 1000);
                
            } else {
                console.error("RecommendTest: 未找到 RankListManager");
                this.updateStatus("错误：未找到排行榜管理器");
            }
            
        } catch (error) {
            console.error("RecommendTest: 测试失败", error);
            this.updateStatus(`测试失败：${error}`);
        }
    }
    
    /**
     * 直接测试推荐功能
     */
    private onDirectTestButtonClicked() {
        console.log("RecommendTest: 直接测试推荐功能");
        this.updateStatus("正在直接测试推荐功能...");
        
        this.testRecommendGame();
    }
    
    /**
     * 直接测试推荐游戏功能
     */
    private testRecommendGame() {
        // 检查是否在微信环境中
        if (typeof wx === 'undefined') {
            console.log("RecommendTest: 非微信环境，无法使用推荐功能");
            this.updateStatus("非微信环境，无法测试推荐功能");
            return;
        }
        
        // 检查是否支持推荐API
        if (typeof (wx as any).recommendGame !== 'function') {
            console.log("RecommendTest: 当前微信版本不支持推荐功能");
            this.updateStatus("当前微信版本不支持推荐功能");
            return;
        }
        
        try {
            console.log("RecommendTest: 开始调用微信推荐游戏API");
            this.updateStatus("正在调用微信推荐API...");
            
            // 调用微信推荐游戏API
            (wx as any).recommendGame({
                success: (res: any) => {
                    console.log("RecommendTest: 推荐游戏成功", res);
                    this.updateStatus("推荐成功！感谢您的分享");
                },
                fail: (error: any) => {
                    console.error("RecommendTest: 推荐游戏失败", error);
                    
                    let errorMessage = "推荐失败，请稍后再试";
                    
                    if (error.errCode === 4) {
                        errorMessage = "用户取消了推荐操作";
                    } else if (error.errCode === 1) {
                        errorMessage = "系统错误，请稍后再试";
                    } else if (error.errCode === 2) {
                        errorMessage = "网络错误，请检查网络连接";
                    }
                    
                    console.log(`RecommendTest: 错误详情 - errCode: ${error.errCode}, errMsg: ${error.errMsg}`);
                    this.updateStatus(errorMessage);
                },
                complete: () => {
                    console.log("RecommendTest: 推荐游戏操作完成");
                }
            });
            
        } catch (error) {
            console.error("RecommendTest: 调用推荐游戏API异常", error);
            this.updateStatus("推荐功能出现异常，请稍后再试");
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
            console.error("RecommendTest: 获取 RankListManager 失败", error);
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
            console.error("RecommendTest: 递归查找节点失败", error);
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
            console.error("RecommendTest: 递归查找组件失败", error);
            return null;
        }
    }
    
    /**
     * 更新状态显示
     */
    private updateStatus(message: string) {
        console.log(`RecommendTest: ${message}`);
        if (this.statusLabel) {
            this.statusLabel.string = message;
        }
    }
}