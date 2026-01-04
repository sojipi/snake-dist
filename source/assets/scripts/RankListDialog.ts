import { _decorator, Component, Node, Label, ScrollView, Prefab, instantiate, Sprite, Button, Layout, UITransform } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 排行榜弹窗组件
 */
@ccclass('RankListDialog')
export class RankListDialog extends Component {
    @property(Node)
    dialogPanel: Node = null!;
    
    @property(ScrollView)
    rankScrollView: ScrollView = null!;
    
    @property(Node)
    rankContent: Node = null!;
    
    @property(Prefab)
    rankItemPrefab: Prefab = null!;
    
    @property(Button)
    closeButton: Button = null!;
    
    @property(Button)
    recommendButton: Button = null!;
    
    @property(Label)
    titleLabel: Label = null!;
    
    @property(Label)
    emptyLabel: Label = null!;
    
    private rankData: any[] = [];
    
    onLoad() {
        console.log("RankListDialog: 排行榜弹窗初始化");
        this.initUI();
    }
    
    start() {
        // 不再默认隐藏弹窗，让调用者控制显示/隐藏
        console.log("RankListDialog: start方法调用");
    }
    
    /**
     * 初始化UI
     */
    private initUI() {
        // 绑定关闭按钮事件
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this.onCloseButtonClicked, this);
        }
        
        // 绑定推荐朋友按钮事件
        if (this.recommendButton) {
            this.recommendButton.node.on(Button.EventType.CLICK, this.onRecommendButtonClicked, this);
        }
        
        // 设置标题
        if (this.titleLabel) {
            this.titleLabel.string = "闯关排行榜";
        }
        
        // 设置空数据提示
        if (this.emptyLabel) {
            this.emptyLabel.string = "暂无排行榜数据\n快去邀请好友一起游戏吧！";
            this.emptyLabel.node.active = false;
        }
    }
    
    /**
     * 显示排行榜
     */
    public showRankList(rankData: any[]) {
        console.log("RankListDialog: 开始显示排行榜，数据:", rankData);
        console.log("RankListDialog: 数据长度:", rankData.length);
        
        this.rankData = rankData;
        
        // 显示弹窗
        this.showDialog();
        
        // 更新排行榜内容
        this.updateRankContent();
        
        console.log("RankListDialog: 排行榜显示完成");
    }
    
    /**
     * 显示弹窗
     */
    private showDialog() {
        console.log("RankListDialog: 尝试显示弹窗");
        
        if (this.dialogPanel) {
            this.dialogPanel.active = true;
            console.log("RankListDialog: dialogPanel 已激活");
        } else {
            console.warn("RankListDialog: dialogPanel 为空，无法设置激活状态");
        }
        
        this.node.active = true;
        console.log("RankListDialog: 弹窗节点已激活");
        
        console.log("RankListDialog: 弹窗已显示");
    }
    
    /**
     * 隐藏弹窗
     */
    private hideDialog() {
        if (this.dialogPanel) {
            this.dialogPanel.active = false;
        }
        this.node.active = false;
        
        console.log("RankListDialog: 弹窗已隐藏");
    }
    
    /**
     * 更新排行榜内容
     */
    private updateRankContent() {
        console.log("RankListDialog: 开始更新排行榜内容");
        
        if (!this.rankContent) {
            console.error("RankListDialog: rankContent 未设置");
            return;
        }
        
        console.log("RankListDialog: rankContent 已找到，开始检查布局配置");
        
        // 检查并初始化布局
        this.initializeLayout();
        
        console.log("RankListDialog: 开始清空现有内容");
        
        // 清空现有内容
        this.clearRankContent();
        
        // 检查是否有数据
        if (this.rankData.length === 0) {
            console.log("RankListDialog: 没有数据，显示空状态");
            this.showEmptyState();
            return;
        }
        
        console.log(`RankListDialog: 有 ${this.rankData.length} 条数据，开始创建排行榜项目`);
        
        // 隐藏空状态提示
        if (this.emptyLabel) {
            this.emptyLabel.node.active = false;
        }
        
        // 创建排行榜项目
        this.createRankItems();
        
        console.log("RankListDialog: 排行榜内容更新完成");
    }
    
    /**
     * 初始化布局
     */
    private initializeLayout() {
        if (!this.rankContent) {
            return;
        }
        
        try {
            // 检查是否有Layout组件
            let layout = this.rankContent.getComponent(Layout);
            if (!layout) {
                console.log("RankListDialog: 未找到Layout组件，自动添加");
                layout = this.rankContent.addComponent(Layout);
            }
            
            // 配置Layout属性
            if (layout) {
                layout.type = Layout.Type.VERTICAL;  // 垂直排列
                layout.resizeMode = Layout.ResizeMode.CONTAINER;  // 自动调整容器大小
                layout.spacingY = 10;  // 设置项目间距
                layout.paddingTop = 10;
                layout.paddingBottom = 10;
                layout.paddingLeft = 10;
                layout.paddingRight = 10;
                
                console.log("RankListDialog: Layout组件配置完成");
            }
            
            // 检查UITransform组件
            let uiTransform = this.rankContent.getComponent(UITransform);
            if (!uiTransform) {
                console.log("RankListDialog: 未找到UITransform组件，自动添加");
                uiTransform = this.rankContent.addComponent(UITransform);
            }
            
            if (uiTransform) {
                // 设置初始宽度
                uiTransform.width = 600; // 默认宽度
                uiTransform.height = 100; // 初始高度，会根据内容自动调整
                console.log("RankListDialog: UITransform组件配置完成");
            }
            
        } catch (error) {
            console.error("RankListDialog: 初始化布局失败", error);
        }
    }
    
    /**
     * 清空排行榜内容
     */
    private clearRankContent() {
        if (this.rankContent) {
            this.rankContent.removeAllChildren();
        }
    }
    
    /**
     * 显示空状态
     */
    private showEmptyState() {
        if (this.emptyLabel) {
            this.emptyLabel.node.active = true;
        }
        console.log("RankListDialog: 显示空状态");
    }
    
    /**
     * 创建排行榜项目
     */
    private createRankItems() {
        if (!this.rankItemPrefab) {
            console.error("RankListDialog: rankItemPrefab 未设置");
            return;
        }
        
        console.log(`RankListDialog: 开始创建 ${this.rankData.length} 个排行榜项目`);
        
        this.rankData.forEach((userData, index) => {
            const rankItem = instantiate(this.rankItemPrefab);
            
            // 设置父节点
            rankItem.setParent(this.rankContent);
            
            // 设置排行榜项目数据
            this.setupRankItem(rankItem, userData, index + 1);
            
            console.log(`RankListDialog: 创建排行榜项目 ${index + 1}`);
        });
        
        // 延迟刷新布局
        this.scheduleOnce(() => {
            this.refreshLayout();
        }, 0.1);
        
        console.log(`RankListDialog: 创建了 ${this.rankData.length} 个排行榜项目`);
    }
    
    /**
     * 刷新布局
     */
    private refreshLayout() {
        try {
            console.log("RankListDialog: 开始刷新布局");
            
            // 刷新ScrollView的Content布局
            if (this.rankContent) {
                // 获取Layout组件
                const layout = this.rankContent.getComponent(Layout);
                if (layout) {
                    console.log("RankListDialog: 找到Layout组件，开始刷新布局");
                    // 强制更新布局
                    layout.updateLayout();
                    console.log("RankListDialog: Layout组件布局已更新");
                } else {
                    console.warn("RankListDialog: 未找到Layout组件，使用手动排列");
                    // 手动设置子节点位置
                    this.manuallyArrangeItems();
                }
            }
            
            // 刷新ScrollView
            if (this.rankScrollView) {
                console.log("RankListDialog: 开始刷新ScrollView");
                
                // 延迟刷新ScrollView内容
                this.scheduleOnce(() => {
                    if (this.rankScrollView) {
                        try {
                            // 使用正确的ScrollView刷新方法
                            // 在Cocos Creator 3.x中，通常不需要手动调用calculateBoundary
                            // ScrollView会自动更新内容边界
                            
                            // 强制滚动到顶部
                            this.rankScrollView.scrollToTop(0.1);
                            
                            // 手动触发ScrollView的刷新
                            // 通过重新设置content的位置来触发更新
                            if (this.rankContent) {
                                const contentPos = this.rankContent.position;
                                this.rankContent.setPosition(contentPos.x, contentPos.y, contentPos.z);
                            }
                            
                            console.log("RankListDialog: ScrollView已刷新");
                        } catch (scrollError) {
                            console.warn("RankListDialog: ScrollView刷新出现警告", scrollError);
                            // 即使刷新失败，也不影响布局显示
                        }
                    }
                }, 0.2);
            }
            
            console.log("RankListDialog: 布局刷新完成");
        } catch (error) {
            console.error("RankListDialog: 刷新布局失败", error);
            // 如果刷新失败，尝试手动排列
            this.manuallyArrangeItems();
        }
    }
    
    /**
     * 手动排列项目（备用方案）
     */
    private manuallyArrangeItems() {
        if (!this.rankContent) {
            return;
        }
        
        const children = this.rankContent.children;
        const itemHeight = 80; // 默认项目高度
        const spacing = 10;    // 项目间距
        
        console.log(`RankListDialog: 手动排列 ${children.length} 个项目`);
        
        children.forEach((child, index) => {
            const yPos = -(index * (itemHeight + spacing) + itemHeight / 2);
            child.setPosition(0, yPos, 0);
            console.log(`RankListDialog: 设置项目 ${index + 1} 位置: y=${yPos}`);
        });
        
        // 更新Content的高度
        const totalHeight = children.length * (itemHeight + spacing);
        const uiTransform = this.rankContent.getComponent(UITransform);
        if (uiTransform) {
            uiTransform.height = totalHeight;
        }
        
        console.log(`RankListDialog: 设置Content高度: ${totalHeight}`);
    }
    private setupRankItem(rankItem: Node, userData: any, rank: number) {
        try {
            // 获取排行榜项目组件
            const rankItemComponent = rankItem.getComponent('RankListItem');
            if (rankItemComponent && typeof (rankItemComponent as any).setRankData === 'function') {
                (rankItemComponent as any).setRankData(userData, rank);
            } else {
                // 如果没有组件，直接设置子节点
                this.setupRankItemDirect(rankItem, userData, rank);
            }
        } catch (error) {
            console.error("RankListDialog: 设置排行榜项目失败", error);
        }
    }
    
    /**
     * 直接设置排行榜项目（无组件版本）
     */
    private setupRankItemDirect(rankItem: Node, userData: any, rank: number) {
        try {
            console.log(`RankListDialog: 设置排行榜项目 ${rank} - 用户数据:`, userData);
            
            // 设置排名
            const rankLabel = rankItem.getChildByName('RankLabel')?.getComponent(Label);
            if (rankLabel) {
                rankLabel.string = rank.toString();
                console.log(`RankListDialog: 设置排名: ${rank}`);
            } else {
                console.warn("RankListDialog: 未找到 RankLabel 组件");
            }
            
            // 设置昵称
            const nicknameLabel = rankItem.getChildByName('NicknameLabel')?.getComponent(Label);
            if (nicknameLabel) {
                const nickname = userData.nickname || '匿名玩家';
                nicknameLabel.string = nickname;
                console.log(`RankListDialog: 设置昵称: ${nickname}`);
            } else {
                console.warn("RankListDialog: 未找到 NicknameLabel 组件");
            }
            
            // 设置关卡信息
            const levelLabel = rankItem.getChildByName('LevelLabel')?.getComponent(Label);
            if (levelLabel) {
                const level = userData.level || 1;
                levelLabel.string = `第${level}关`;
                console.log(`RankListDialog: 设置关卡: 第${level}关`);
            } else {
                console.warn("RankListDialog: 未找到 LevelLabel 组件");
            }
            
            // 设置星数
            const starsLabel = rankItem.getChildByName('StarsLabel')?.getComponent(Label);
            if (starsLabel) {
                const totalStars = userData.totalStars || 0;
                starsLabel.string = `${totalStars}★`;
                console.log(`RankListDialog: 设置星数: ${totalStars}★`);
            } else {
                console.warn("RankListDialog: 未找到 StarsLabel 组件");
            }
            
            // 设置头像（如果有）
            const avatarSprite = rankItem.getChildByName('Avatar')?.getComponent(Sprite);
            if (avatarSprite && userData.avatarUrl) {
                // 这里可以加载头像，暂时跳过
                console.log(`RankListDialog: 需要加载头像 ${userData.avatarUrl}`);
            }
            
            console.log(`RankListDialog: 排行榜项目 ${rank} 设置完成`);
            
        } catch (error) {
            console.error(`RankListDialog: 直接设置排行榜项目 ${rank} 失败`, error);
        }
    }
    
    /**
     * 关闭按钮点击事件
     */
    private onCloseButtonClicked() {
        console.log("RankListDialog: 关闭按钮被点击");
        this.hideDialog();
    }
    
    /**
     * 推荐朋友按钮点击事件
     */
    private onRecommendButtonClicked() {
        console.log("RankListDialog: 推荐朋友按钮被点击");
        this.recommendGameToFriend();
    }
    
    /**
     * 推荐游戏给朋友
     */
    private recommendGameToFriend() {
        // 检查是否在微信环境中
        if (typeof wx === 'undefined') {
            console.log("RankListDialog: 非微信环境，无法使用推荐功能");
            // 在非微信环境中显示提示
            this.showRecommendMessage("请在微信小游戏中使用推荐功能");
            return;
        }
        
        // 检查是否支持推荐API
        if (typeof (wx as any).recommendGame !== 'function') {
            console.log("RankListDialog: 当前微信版本不支持推荐功能");
            this.showRecommendMessage("当前微信版本不支持推荐功能，请更新微信后重试");
            return;
        }
        
        try {
            console.log("RankListDialog: 开始调用微信推荐游戏API");
            
            // 调用微信推荐游戏API
            (wx as any).recommendGame({
                success: (res: any) => {
                    console.log("RankListDialog: 推荐游戏成功", res);
                    this.showRecommendMessage("推荐成功！感谢您的分享");
                },
                fail: (error: any) => {
                    console.error("RankListDialog: 推荐游戏失败", error);
                    
                    // 根据错误类型显示不同的提示信息
                    let errorMessage = "推荐失败，请稍后再试";
                    
                    if (error.errCode === 4) {
                        errorMessage = "用户取消了推荐操作";
                    } else if (error.errCode === 1) {
                        errorMessage = "系统错误，请稍后再试";
                    } else if (error.errCode === 2) {
                        errorMessage = "网络错误，请检查网络连接";
                    }
                    
                    this.showRecommendMessage(errorMessage);
                },
                complete: () => {
                    console.log("RankListDialog: 推荐游戏操作完成");
                }
            });
            
        } catch (error) {
            console.error("RankListDialog: 调用推荐游戏API异常", error);
            this.showRecommendMessage("推荐功能出现异常，请稍后再试");
        }
    }
    
    /**
     * 显示推荐操作的提示信息
     */
    private showRecommendMessage(message: string) {
        console.log(`RankListDialog: 推荐提示 - ${message}`);
        
        // 在这里可以添加Toast提示或其他UI反馈
        // 暂时只输出到控制台
        
        // 如果需要在UI上显示，可以使用emptyLabel作为临时显示
        if (this.emptyLabel) {
            const originalText = this.emptyLabel.string;
            const originalActive = this.emptyLabel.node.active;
            
            this.emptyLabel.string = message;
            this.emptyLabel.node.active = true;
            
            // 3秒后恢复原样
            this.scheduleOnce(() => {
                if (this.emptyLabel) {
                    this.emptyLabel.string = originalText;
                    this.emptyLabel.node.active = originalActive;
                }
            }, 3);
        }
    }
    
    /**
     * 公共方法：关闭弹窗
     */
    public closeDialog() {
        this.hideDialog();
    }
}