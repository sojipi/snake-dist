import { _decorator, Component, Node, Prefab, instantiate, ScrollView, Layout, Button, Label, Sprite, Color, director, UITransform, find } from 'cc';
import { LevelDataManager } from './LevelDataManager';
import { MAHJONG_LEVEL_DATA } from './data/LevelData';
import { AudioManager } from './AudioManager';
import { AudioSettingsUI } from './AudioSettingsUI';
import { CreditPanel } from './CreditPanel';
import { RankListManager } from './RankListManager';
const { ccclass, property } = _decorator;

// 关卡数据结构
interface LevelData {
    id: number;
    name: string;
    description: string;
    isUnlocked: boolean;
    isCompleted: boolean;
    bestScore: number;
    thumbnail?: string; // 缩略图路径
    stars?: number; // 新增：星星数量
    time?: number; // 新增：通关时间
}

// 微信广告类型定义
interface CustomAd {
    show(): Promise<void>;
    hide(): Promise<void>;
    isShow(): boolean;
    destroy(): void;
    onClose(listener: Function): void;
    offClose(listener: Function): void;
    onHide(listener: Function): void;
    offHide(listener: Function): void;
    onLoad(listener: Function): void;
    offLoad(listener: Function): void;
    onResize(listener: Function): void;
    offResize(listener: Function): void;
    onError(listener: Function): void;
    offError(listener: Function): void;
    style: {
        left: number;
        top: number;
        width: number;
        fixed?: boolean;
    };
}

@ccclass('LevelSelectManager')
export class LevelSelectManager extends Component {
    @property(Node)
    levelContainer: Node = null!;
    
    @property(Prefab)
    levelItemPrefab: Prefab = null!;

    @property(Prefab)
    settingsPanelPrefab: Prefab = null!;

    @property(ScrollView)
    scrollView: ScrollView = null!;
    
    @property(Button)
    backButton: Button = null!;

    @property(Button)
    bgmButton: Button = null!;

    @property(Button)
    sfxButton: Button = null!;

    @property(Button)
    settingsButton: Button = null!;

    @property(Button)
    copyrightButton: Button = null!;

    @property(Button)
    gameClubButton: Button = null!;

    @property(Button)
    rankListButton: Button = null!;

    @property(Prefab)
    copyrightNoticePrefab: Prefab = null!;

    @property(Prefab)
    rankDialogPrefab: Prefab = null!;

    @property(Label)
    titleLabel: Label = null!;
    
    private levelDataManager: LevelDataManager = null!;
    private settingsPanel: AudioSettingsUI = null!;
    private copyrightNoticePanel: Node = null!;
    private rankListDialog: Node = null!; // 排行榜弹窗
    private wechatGameClubButton: any = null; // 微信游戏圈按钮实例
    private wechatCustomAd: CustomAd | null = null; // 微信原生模板广告实例

    // 根据MAHJONG_LEVEL_DATA生成的关卡数据
    private levelData: LevelData[] = [];
    
    onLoad() {
        this.initLevelData();
        this.initLevelSelect();
        this.setupButtons();
        
        // 🔥 修复：立即初始化LevelDataManager，不要延迟
        try {
            this.levelDataManager = LevelDataManager.getInstance();
            console.log("LevelDataManager初始化成功");
        } catch (error) {
            console.error("LevelDataManager初始化失败:", error);
        }
        
        // 初始化微信原生模板广告
        this.initWechatCustomAd();
        
        // 显示广告
        this.scheduleOnce(() => {
            this.showWechatCustomAd();
        }, 0.5);
    }
    
    start() {
        // 🔥 修复：延迟创建关卡项目，确保LevelDataManager完全就绪
        this.scheduleOnce(() => {
            this.createLevelItems();
            this.setupScrollView();
        }, 0.1);

        // 初始化设置面板
        this.initSettingsPanel();

        // 初始化版权面板
        // 初始化版权面板
        this.initCopyrightPanel();
        
        // 初始化排行榜弹窗
        this.initRankListDialog();
        
        // 初始化微信游戏圈按钮
        this.initWechatGameClub();
        
        // 显示微信原生模板广告
        this.showWechatCustomAd();
    }
    
    private initLevelData() {
        // 将MAHJONG_LEVEL_DATA转换为LevelData格式
        this.levelData = MAHJONG_LEVEL_DATA.map((data, index) => {
            // 解析description，分离标题和描述
            const parts = data.description.split('：');
            const title = parts.length > 1 ? parts[0] : `关卡${index + 1}`;
            const description = parts.length > 1 ? parts[1] : data.description;
            
            return {
                id: index + 1,
                name: title, // 使用解析出的标题
                description: description, // 使用解析出的描述
                isUnlocked: index === 0, // 只有第一关默认解锁
                isCompleted: false,
                bestScore: 0
            };
        });
    }
    
    private initLevelSelect() {
        if (this.titleLabel) {
            this.titleLabel.string = "选择关卡";
        }
    }
    
    private setupButtons() {
        if (this.backButton) {
            this.backButton.node.on(Button.EventType.CLICK, this.onBackButtonClicked, this);
        }

        // 音频控制按钮
        if (this.bgmButton) {
            this.bgmButton.node.on(Button.EventType.CLICK, this.onBGMButtonClicked, this);
        }

        if (this.sfxButton) {
            this.sfxButton.node.on(Button.EventType.CLICK, this.onSFXButtonClicked, this);
        }

        // 设置按钮
        if (this.settingsButton) {
            this.settingsButton.node.on(Button.EventType.CLICK, this.onSettingsButtonClicked, this);
        }

        // 版权按钮
        if (this.copyrightButton) {
            this.copyrightButton.node.on(Button.EventType.CLICK, this.onCopyrightButtonClicked, this);
        }

        // 微信游戏圈按钮
        // 微信游戏圈按钮
        if (this.gameClubButton) {
            this.gameClubButton.node.on(Button.EventType.CLICK, this.onGameClubButtonClicked, this);
        }

        // 排行榜按钮
        if (this.rankListButton) {
            this.rankListButton.node.on(Button.EventType.CLICK, this.onRankListButtonClicked, this);
            console.log("LevelSelect: 排行榜按钮事件绑定成功");
        } else {
            console.error("LevelSelect: rankListButton 未设置，请在编辑器中拖拽按钮到 rankListButton 属性");
        }

        // 初始化音频按钮状态
        this.updateAudioButtonStates();
    }
    
    private setupScrollView() {
        if (!this.scrollView) {
            console.error("ScrollView组件未设置");
            return;
        }
        
        // 确保ScrollView启用了垂直滚动
        this.scrollView.vertical = true;
        this.scrollView.horizontal = false;
        
        // 启用惯性滚动
        this.scrollView.inertia = true;
        
        // 调试ScrollView配置
        this.debugScrollViewConfig();
        
        console.log("ScrollView配置完成");
    }
    
    private debugScrollViewConfig() {
        if (!this.scrollView) return;
        
        console.log("=== ScrollView 配置信息 ===");
        console.log(`Vertical: ${this.scrollView.vertical}`);
        console.log(`Horizontal: ${this.scrollView.horizontal}`);
        console.log(`Inertia: ${this.scrollView.inertia}`);
        console.log(`Elastic: ${this.scrollView.elastic}`);
        
        // 检查content节点
        const content = this.scrollView.content;
        if (content) {
            const contentTransform = content.getComponent(UITransform);
            if (contentTransform) {
                console.log(`Content Size: ${contentTransform.contentSize.width} x ${contentTransform.contentSize.height}`);
            }
            
            const layout = content.getComponent(Layout);
            if (layout) {
                console.log(`Layout Type: ${layout.type} (0=NONE, 1=HORIZONTAL, 2=VERTICAL, 3=GRID)`);
                console.log(`Layout Spacing: X=${layout.spacingX}, Y=${layout.spacingY}`);
                console.log(`Layout Padding: Top=${layout.paddingTop}, Bottom=${layout.paddingBottom}, Left=${layout.paddingLeft}, Right=${layout.paddingRight}`);
                
                if (layout.type === Layout.Type.GRID) {
                    const constraint = (layout as any).constraint || 1;
                    const constraintType = (layout as any).constraintType || 0;
                    console.log(`Grid Constraint: ${constraint} (Type: ${constraintType === 0 ? 'Fixed Row Count' : 'Fixed Column Count'})`);
                }
            }
        }
        
        // 检查viewport
        const view = this.scrollView.view;
        if (view) {
            const viewTransform = view.getComponent(UITransform);
            if (viewTransform) {
                console.log(`View Size: ${viewTransform.contentSize.width} x ${viewTransform.contentSize.height}`);
            }
        }
        
        console.log("========================");
    }
    
    private createLevelItems() {
        if (!this.levelContainer || !this.levelItemPrefab) {
            console.error("关卡容器或预制体未设置");
            return;
        }
        
        // 清除现有的关卡项目
        this.levelContainer.removeAllChildren();
        
        // 创建关卡项目
        for (const level of this.levelData) {
            this.createLevelItem(level);
        }
        
        // 刷新布局
        const layout = this.levelContainer.getComponent(Layout);
        if (layout) {
            layout.updateLayout();
        }
        
        // 延迟更新ScrollView内容大小
        this.scheduleOnce(() => {
            this.updateScrollViewContentSize();
        }, 0.1);
    }
    
    private updateScrollViewContentSize() {
        if (!this.scrollView || !this.levelContainer) {
            return;
        }
        
        const layout = this.levelContainer.getComponent(Layout);
        if (layout) {
            // 强制更新布局
            layout.updateLayout();
        }
        
        // 获取容器的UITransform
        const containerTransform = this.levelContainer.getComponent(UITransform);
        if (containerTransform) {
            const contentHeight = containerTransform.contentSize.height;
            const contentWidth = containerTransform.contentSize.width;
            
            console.log(`Content Size: ${contentWidth} x ${contentHeight}`);
            console.log(`Items Count: ${this.levelData.length}`);
            
            // 根据Layout类型计算正确的高度
            if (layout) {
                const calculatedHeight = this.calculateRequiredHeight(layout);
                if (calculatedHeight > contentHeight) {
                    containerTransform.setContentSize(contentWidth, calculatedHeight);
                    console.log(`手动设置Content高度: ${calculatedHeight}`);
                }
            }
        }
        
        // 重置ScrollView到顶部
        this.scrollView.scrollToTop(0.1);
    }
    
    private calculateRequiredHeight(layout: Layout): number {
        const itemCount = this.levelData.length;
        
        // 获取Layout配置
        const paddingTop = layout.paddingTop;
        const paddingBottom = layout.paddingBottom;
        const spacingY = layout.spacingY;
        
        if (layout.type === Layout.Type.GRID) {
            // 网格布局
            const constraintCount = (layout as any).constraint || 1;
            const isFixedRowCount = (layout as any).constraintType === 0; // 0是固定行数，1是固定列数
            
            let rows: number;
            if (isFixedRowCount) {
                // 固定行数
                rows = constraintCount;
            } else {
                // 固定列数
                const columns = constraintCount;
                rows = Math.ceil(itemCount / columns);
            }
            
            // 假设每个项目高度为140px（根据预制体实际大小调整）
            const itemHeight = 120;
            const totalHeight = paddingTop + paddingBottom + (rows * itemHeight/3) + ((rows - 1) * spacingY/3);
            
            console.log(`网格布局计算: 行数=${rows}, 项目高度=${itemHeight}, 总高度=${totalHeight}`);
            return totalHeight;
            
        } else if (layout.type === Layout.Type.VERTICAL) {
            // 垂直布局
            const itemHeight = 140;
            const totalHeight = paddingTop + paddingBottom + (itemCount * itemHeight) + ((itemCount - 1) * spacingY);
            
            console.log(`垂直布局计算: 项目数=${itemCount}, 项目高度=${itemHeight}, 总高度=${totalHeight}`);
            return totalHeight;
        }
        
        // 默认情况，返回一个合理的高度
        return Math.max(600, itemCount * 50);
    }
    
    private createLevelItem(levelData: LevelData) {
        const levelItem = instantiate(this.levelItemPrefab);
        levelItem.setParent(this.levelContainer);
        
        // 获取关卡项目组件
        const levelButton = levelItem.getComponent(Button);
        const nameLabel = levelItem.getChildByName('NameLabel')?.getComponent(Label);
        const descLabel = levelItem.getChildByName('DescLabel')?.getComponent(Label);
        const lockIcon = levelItem.getChildByName('LockIcon');
        const completedIcon = levelItem.getChildByName('CompletedIcon');
        
        // 设置关卡信息
        if (nameLabel) {
            nameLabel.string = levelData.name;
        }
        
        if (descLabel) {
            descLabel.string = levelData.description;
            // 启用自动换行
            descLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
            descLabel.enableWrapText = true;
        }
        
        // 从数据管理器获取真实的解锁和完成状态
        const isUnlocked = this.levelDataManager ? this.levelDataManager.isLevelUnlocked(levelData.id) : levelData.isUnlocked;
        const isCompleted = this.levelDataManager ? this.levelDataManager.isLevelCompleted(levelData.id) : levelData.isCompleted;
        const bestScore = this.levelDataManager ? this.levelDataManager.getLevelBestScore(levelData.id) : levelData.bestScore;
        
        // 设置解锁状态
        if (isUnlocked) {
            // 关卡已解锁
            if (lockIcon) {
                lockIcon.active = false;
            }
            
            if (levelButton) {
                levelButton.interactable = true;
                levelButton.node.on(Button.EventType.CLICK, () => this.onLevelSelected(levelData), this);
            }
            
            // 设置完成状态
            if (completedIcon) {
                completedIcon.active = isCompleted;
            }
            
            // 设置正常颜色
            const sprite = levelItem.getComponent(Sprite);
            if (sprite) {
                sprite.color = Color.WHITE;
            }
        } else {
            // 关卡未解锁
            if (lockIcon) {
                lockIcon.active = true;
            }
            
            if (completedIcon) {
                completedIcon.active = false;
            }
            
            if (levelButton) {
                levelButton.interactable = false;
            }
            
            // 设置灰色
            const sprite = levelItem.getComponent(Sprite);
            if (sprite) {
                sprite.color = new Color(128, 128, 128, 255);
            }
            
            // 设置名称和描述为灰色
            if (nameLabel) {
                nameLabel.color = new Color(128, 128, 128, 255);
            }
            if (descLabel) {
                descLabel.color = new Color(128, 128, 128, 255);
            }
        }
    }
    
    private onLevelSelected(levelData: LevelData) {
        console.log(`选择了关卡: ${levelData.name} (ID: ${levelData.id})`);

        // 播放关卡选择音效
        this.playLevelSelectSound();

        // 这里可以添加关卡选择的逻辑
        // 比如保存选中的关卡ID，然后跳转到游戏场景
        this.loadLevel(levelData.id);
    }
    
    private loadLevel(levelId: number) {
        console.log(`加载关卡 ${levelId}`);
        
        // 保存选中的关卡ID到全局数据管理器
        this.levelDataManager.setCurrentLevel(levelId);
        
        // 隐藏广告
        this.hideWechatCustomAd();
        
        // 跳转到游戏场景
        director.loadScene("GameScene");
    }
    
    private onBackButtonClicked() {
        console.log("返回主菜单");

        // 播放点击音效
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }
        
        // 隐藏广告
        this.hideWechatCustomAd();

        // 这里可以跳转回主菜单场景
        // director.loadScene("MainMenu");
    }
    
    // 解锁关卡（供外部调用）
    public unlockLevel(levelId: number) {
        if (this.levelDataManager.unlockLevel(levelId)) {
            // 重新创建关卡项目以更新显示
            this.createLevelItems();
        }
    }
    
    // 完成关卡（供外部调用）
    public completeLevel(levelId: number, score: number, stars: number = 0) {
        if (this.levelDataManager.completeLevel(levelId, score, stars)) {
            // 重新创建关卡项目以更新显示
            this.createLevelItems();
        }
    }
    
    // 获取关卡数据（供外部查询）
    public getLevelData(levelId: number): LevelData | undefined {
        return this.levelData.find(l => l.id === levelId);
    }

    // 🔥 新增：设置面板相关方法
    private initSettingsPanel() {
        console.log("LevelSelect: 开始初始化设置面板");
        console.log("LevelSelect: settingsPanelPrefab =", this.settingsPanelPrefab);

        if (!this.settingsPanelPrefab) {
            console.error("LevelSelect: 设置面板预制体未设置，请在编辑器中配置 settingsPanelPrefab");
            return;
        }

        // 查找Canvas节点
        const canvas = find('Canvas');
        if (!canvas) {
            console.error("LevelSelect: 未找到Canvas节点");
            return;
        }

        console.log("LevelSelect: 找到Canvas节点，开始实例化预制体");

        try {
            // 实例化设置面板预制体
            const settingsPanelNode = instantiate(this.settingsPanelPrefab);
            settingsPanelNode.setParent(canvas);
            settingsPanelNode.layer = 524288; // UI层

            console.log("LevelSelect: 预制体实例化完成");
            console.log("LevelSelect: 节点名称:", settingsPanelNode.name);
            console.log("LevelSelect: 节点位置:", settingsPanelNode.position);
            console.log("LevelSelect: 节点大小:", settingsPanelNode.getComponent('UITransform')?.contentSize);
            console.log("LevelSelect: 节点层级:", settingsPanelNode.layer);
            console.log("LevelSelect: 父节点:", settingsPanelNode.parent?.name);
            console.log("LevelSelect: 根节点组件列表:", settingsPanelNode.components.map(comp => comp.constructor.name));

            // 从根节点获取AudioSettingsUI组件（这是实际的设置面板脚本）
            this.settingsPanel = settingsPanelNode.getComponent(AudioSettingsUI);

            if (this.settingsPanel) {
                console.log("LevelSelect: 在根节点找到AudioSettingsUI组件");
                // 默认隐藏设置面板（直接设置节点状态，避免调用管理器方法）
                settingsPanelNode.active = false;
            } else {
                console.log("LevelSelect: 根节点未找到AudioSettingsUI组件");
                console.log("LevelSelect: 根节点名称:", settingsPanelNode.name);
                console.log("LevelSelect: 根节点所有组件:", settingsPanelNode.components.map(comp => comp.constructor.name));
            }

            if (this.settingsPanel) {
                console.log("LevelSelect: 设置面板预制体实例化成功");
                // 默认隐藏设置面板
                this.settingsPanel.hidePanel();
            } else {
                console.error("LevelSelect: 设置面板预制体中未找到SettingsPanel组件");
                console.log("LevelSelect: 预制体节点名称:", settingsPanelNode.name);
                console.log("LevelSelect: 预制体子节点:", settingsPanelNode.children.map(child => child.name));
                // 递归打印所有子节点的组件信息
                this.debugNodeComponents(settingsPanelNode, 0);
            }
        } catch (error) {
            console.error("LevelSelect: 实例化设置面板预制体时出错:", error);
        }
    }

    private onSettingsButtonClicked() {
        console.log("LevelSelect: 设置按钮被点击");

        // 播放点击音效
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }

        // 如果设置面板未初始化，尝试重新初始化
        if (!this.settingsPanel) {
            console.log("LevelSelect: 设置面板未初始化，尝试重新初始化");
            this.initSettingsPanel();
        }

        // 切换设置面板显示状态
        this.toggleSettingsPanel();
    }

    /**
     * 显示设置面板
     */
    public showSettingsPanel() {
        if (this.settingsPanel) {
            this.settingsPanel.showPanel();
        } else {
            console.error("LevelSelect: 设置面板未初始化");
        }
    }

    /**
     * 隐藏设置面板
     */
    public hideSettingsPanel() {
        console.log("LevelSelect: hideSettingsPanel被调用");

        if (this.settingsPanel) {
            console.log("LevelSelect: 设置面板存在，直接隐藏节点");
            // 直接隐藏节点，不调用AudioSettingsUI的hidePanel方法，避免循环调用
            this.settingsPanel.node.active = false;
            console.log("LevelSelect: 设置面板已隐藏");
        } else {
            console.error("LevelSelect: 设置面板未初始化");
        }
    }

    /**
     * 切换设置面板显示状态
     */
    public toggleSettingsPanel() {
        if (this.settingsPanel) {
            const isCurrentlyVisible = this.settingsPanel.node.active;
            console.log(`LevelSelect: 设置面板当前状态: ${isCurrentlyVisible ? '显示' : '隐藏'}`);

            if (isCurrentlyVisible) {
                console.log("LevelSelect: 面板已显示，执行隐藏操作");
                this.hideSettingsPanel();
            } else {
                console.log("LevelSelect: 面板已隐藏，执行显示操作");
                this.showSettingsPanel();
            }
        } else {
            console.error("LevelSelect: 设置面板未初始化");
        }
    }

    /**
     * 切换设置面板显示状态
     */
    public toggleSettingsPanel() {
        if (this.settingsPanel) {
            this.settingsPanel.togglePanel();
        } else {
            console.error("LevelSelect: 设置面板未初始化");
        }
    }

    // 🔥 新增：版权面板相关方法
    private initCopyrightPanel() {
        if (!this.copyrightNoticePrefab) {
            console.error("LevelSelect: 版权面板预制体未设置，请在编辑器中配置 copyrightNoticePrefab");
            return;
        }

        // 查找Canvas节点
        const canvas = find('Canvas');
        if (!canvas) {
            console.error("LevelSelect: 未找到Canvas节点");
            return;
        }

        console.log("LevelSelect: 开始实例化版权面板预制体");

        try {
            // 实例化版权面板预制体
            this.copyrightNoticePanel = instantiate(this.copyrightNoticePrefab);
            this.copyrightNoticePanel.setParent(canvas);
            this.copyrightNoticePanel.layer = 524288; // UI层

            console.log("LevelSelect: 版权面板预制体实例化成功");
            console.log("LevelSelect: 版权面板节点名称:", this.copyrightNoticePanel.name);

            // 默认隐藏版权面板
            this.copyrightNoticePanel.active = false;

        } catch (error) {
            console.error("LevelSelect: 实例化版权面板预制体时出错:", error);
        }
    }

    private onCopyrightButtonClicked() {
        console.log("LevelSelect: 版权按钮被点击");

        // 播放点击音效
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }

        // 切换版权面板显示状态
        this.toggleCopyrightPanel();
    }

    /**
     * 显示版权面板
     */
    public showCopyrightPanel() {
        if (this.copyrightNoticePanel) {
            this.copyrightNoticePanel.active = true;
            console.log("LevelSelect: 显示版权面板");

            // 如果版权面板有CreditPanel组件，调用其showPanel方法
            const creditPanel = this.copyrightNoticePanel.getComponent(CreditPanel);
            if (creditPanel && creditPanel.showPanel) {
                creditPanel.showPanel();

                // 设置CreditPanel的事件监听
                this.setupCopyrightNoticeEvents(creditPanel);
            }
        } else {
            console.error("LevelSelect: 版权面板未初始化");
        }
    }

    /**
     * 隐藏版权面板
     */
    public hideCopyrightPanel() {
        console.log("LevelSelect: hideCopyrightPanel被调用");

        if (this.copyrightNoticePanel) {
            console.log("LevelSelect: 版权面板存在，当前状态:", this.copyrightNoticePanel.active);
            console.log("LevelSelect: 版权面板节点名称:", this.copyrightNoticePanel.name);

            this.copyrightNoticePanel.active = false;
            console.log("LevelSelect: 版权面板已设置为隐藏");

            // 验证隐藏是否成功
            console.log("LevelSelect: 隐藏后的状态:", this.copyrightNoticePanel.active);
        } else {
            console.error("LevelSelect: 版权面板未初始化");
        }
    }

    /**
     * 切换版权面板显示状态
     */
    public toggleCopyrightPanel() {
        if (this.copyrightNoticePanel) {
            const isCurrentlyVisible = this.copyrightNoticePanel.active;
            console.log(`LevelSelect: 版权面板当前状态: ${isCurrentlyVisible ? '显示' : '隐藏'}`);

            if (isCurrentlyVisible) {
                console.log("LevelSelect: 面板已显示，执行隐藏操作");
                this.hideCopyrightPanel();
            } else {
                console.log("LevelSelect: 面板已隐藏，执行显示操作");
                this.showCopyrightPanel();
            }
        } else {
            console.error("LevelSelect: 版权面板未初始化");
        }
    }

    /**
     * 设置CopyrightNotice组件的事件监听
     */
    private setupCopyrightNoticeEvents(copyrightNotice: any) {
        console.log("LevelSelect: 设置版权面板事件监听");
        // 不需要重写方法，CopyrightNotice会自动调用我们的hideCopyrightPanel方法
    }

    /**
     * 递归查找AudioSettingsUI组件
     */
    private findSettingsPanelInChildren(node: Node): AudioSettingsUI | null {
        // 检查当前节点
        const component = node.getComponent(AudioSettingsUI);
        if (component) {
            console.log(`LevelSelect: 在节点 ${node.name} 中找到AudioSettingsUI组件`);
            return component;
        }

        // 递归检查子节点
        for (const child of node.children) {
            const result = this.findSettingsPanelInChildren(child);
            if (result) {
                return result;
            }
        }

        return null;
    }

    /**
     * 调试节点组件信息
     */
    private debugNodeComponents(node: Node, depth: number = 0) {
        const indent = "  ".repeat(depth);
        const components = node.components.map(comp => comp.constructor.name);
        console.log(`${indent}节点: ${node.name}, 组件: [${components.join(', ')}]`);

        for (const child of node.children) {
            this.debugNodeComponents(child, depth + 1);
        }
    }
    
    // 获取所有关卡数据
    public getAllLevelData(): LevelData[] {
        return [...this.levelData]; // 返回副本避免外部修改
    }

    // ========== 音频控制方法 ==========

    /**
     * BGM按钮点击事件
     */
    private onBGMButtonClicked() {
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            const currentState = audioManager.isBGMEnabled();
            audioManager.setBGMEnabled(!currentState);
            audioManager.playSFX('click');
            this.updateAudioButtonStates();
            console.log(`LevelSelectManager: BGM ${!currentState ? '开启' : '关闭'}`);
        }
    }

    /**
     * 音效按钮点击事件
     */
    private onSFXButtonClicked() {
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            const currentState = audioManager.isSFXEnabled();
            audioManager.setSFXEnabled(!currentState);
            // 如果开启音效，播放确认音效
            if (!currentState) {
                audioManager.playSFX('click');
            }
            this.updateAudioButtonStates();
            console.log(`LevelSelectManager: 音效 ${!currentState ? '开启' : '关闭'}`);
        }
    }

    /**
     * 更新音频按钮状态显示
     */
    private updateAudioButtonStates() {
        const audioManager = AudioManager.getInstance();
        if (!audioManager) return;

        // 更新BGM按钮显示
        if (this.bgmButton) {
            const bgmEnabled = audioManager.isBGMEnabled();
            // 这里可以根据状态更改按钮的图标或文字
            // 例如：改变按钮的透明度或颜色
            const bgmSprite = this.bgmButton.getComponent(Sprite);
            if (bgmSprite) {
                bgmSprite.color = bgmEnabled ? Color.WHITE : Color.GRAY;
            }
        }

        // 更新音效按钮显示
        if (this.sfxButton) {
            const sfxEnabled = audioManager.isSFXEnabled();
            const sfxSprite = this.sfxButton.getComponent(Sprite);
            if (sfxSprite) {
                sfxSprite.color = sfxEnabled ? Color.WHITE : Color.GRAY;
            }
        }
    }

    /**
     * 播放关卡选择音效
     */
    private playLevelSelectSound() {
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }
    }

    /**
     * 初始化微信游戏圈按钮
     */
    private initWechatGameClub() {
        // 检查是否在微信环境中且支持 createGameClubButton API
        if (typeof window['wx'] !== 'undefined' && typeof window['wx'].createGameClubButton === 'function') {
            console.log("LevelSelect: 微信环境，初始化游戏圈按钮");
            
            try {
                // 创建游戏圈按钮实例
                this.wechatGameClubButton = window['wx'].createGameClubButton({
                    icon: 'green',
                    style: {
                        left: 10,
                        top: 10,
                        width: 40,
                        height: 40
                    }
                });
                
                // 监听游戏圈按钮点击事件
                this.wechatGameClubButton.onTap(() => {
                    console.log("LevelSelect: 游戏圈按钮被点击");
                });
                
            } catch (err) {
                console.error("LevelSelect: 创建游戏圈按钮失败", err);
                this.wechatGameClubButton = null;
            }
        } else {
            console.log("LevelSelect: 非微信环境，跳过游戏圈按钮初始化");
        }
    }
    
    /**
     * 初始化微信原生模板广告
     */
    private initWechatCustomAd() {
        // 检查是否在微信环境中且支持 createCustomAd API
        if (typeof window['wx'] !== 'undefined' && typeof window['wx'].createCustomAd === 'function') {
            console.log("LevelSelect: 微信环境，初始化原生模板广告");
            
            try {
                // 获取系统信息以计算屏幕尺寸
                const systemInfo = window['wx'].getSystemInfoSync();
                const adWidth = Math.min(300, systemInfo.windowWidth * 0.8); // 最大宽度300，或者屏幕宽度的80%
                const adLeft = (systemInfo.windowWidth - adWidth) / 2;
                const adTop = systemInfo.windowHeight - 100; // 距离底部80像素
                
                // 创建原生模板广告实例
                this.wechatCustomAd = window['wx'].createCustomAd({
                    adUnitId: 'adunit-7ab1a2d8b6c4c107',
                    style: {
                        left: adLeft,
                        top: adTop,
                        width: adWidth
                    }
                }) as CustomAd;
                
                // 监听原生模板广告加载事件
                this.wechatCustomAd.onLoad(() => {
                    console.log("LevelSelect: 原生模板广告加载成功");
                });
                
                // 监听原生模板广告错误事件
                this.wechatCustomAd.onError((err) => {
                    console.error("LevelSelect: 原生模板广告错误", err);
                });
                
                // 监听原生模板广告关闭事件
                this.wechatCustomAd.onClose(() => {
                    console.log("LevelSelect: 原生模板广告关闭");
                });
                
                // 监听原生模板广告隐藏事件
                this.wechatCustomAd.onHide(() => {
                    console.log("LevelSelect: 原生模板广告隐藏");
                });
                
                // 监听原生模板广告尺寸变化事件
                this.wechatCustomAd.onResize((res) => {
                    console.log("LevelSelect: 原生模板广告尺寸变化", res);
                    // 根据新尺寸调整广告位置，保持底部居中
                    if (this.wechatCustomAd && res && res.width) {
                        const systemInfo = window['wx'].getSystemInfoSync();
                        const newLeft = (systemInfo.windowWidth - res.width) / 2;
                        this.wechatCustomAd.style.left = newLeft;
                    }
                });
                
            } catch (err) {
                console.error("LevelSelect: 创建原生模板广告失败", err);
                this.wechatCustomAd = null;
            }
        } else {
            console.log("LevelSelect: 非微信环境，跳过原生模板广告初始化");
        }
    }
    
    /**
     * 显示微信原生模板广告
     */
    private showWechatCustomAd() {
        if (this.wechatCustomAd) {
            this.wechatCustomAd.show()
                .then(() => {
                    console.log("LevelSelect: 原生模板广告显示成功");
                })
                .catch((err) => {
                    console.error("LevelSelect: 原生模板广告显示失败", err);
                });
        }
    }
    
    /**
     * 隐藏微信原生模板广告
     */
    private hideWechatCustomAd() {
        if (this.wechatCustomAd) {
            this.wechatCustomAd.hide()
                .then(() => {
                    console.log("LevelSelect: 原生模板广告隐藏成功");
                })
                .catch((err) => {
                    console.error("LevelSelect: 原生模板广告隐藏失败", err);
                });
        }
    }
    
    /**
     * 返回到关卡选择场景
     */
    private returnToLevelScene() {
        console.log("LevelInfoDialog: 准备返回到LevelScene");

        try {
            // 显示广告
            this.showWechatCustomAd();
            
            // 直接切换场景，不需要等待动画
            console.log("LevelInfoDialog: 开始切换到LevelScene");
            director.loadScene('LevelScene', (err) => {
                if (err) {
                    console.error("LevelInfoDialog: 切换到LevelScene失败:", err);
                } else {
                    console.log("LevelInfoDialog: 成功切换到LevelScene");
                }
            });

        } catch (error) {
            console.error("LevelInfoDialog: 返回LevelScene时发生错误:", error);
        }
    }
    
    /**
     * 公共方法：显示微信原生模板广告（供其他场景调用）
     */
    public showCustomAd() {
        this.showWechatCustomAd();
    }
    
    /**
     * 公共方法：隐藏微信原生模板广告（供其他场景调用）
     */
    public hideCustomAd() {
        this.hideWechatCustomAd();
    }

    // ========== 排行榜相关方法 ==========

    /**
     * 初始化排行榜弹窗
     */
    private initRankListDialog() {
        if (!this.rankDialogPrefab) {
            console.error("LevelSelect: 排行榜弹窗预制体未设置，请在编辑器中配置 rankDialogPrefab");
            return;
        }

        // 查找Canvas节点
        const canvas = find('Canvas');
        if (!canvas) {
            console.error("LevelSelect: 未找到Canvas节点");
            return;
        }

        console.log("LevelSelect: 开始实例化排行榜弹窗预制体");

        try {
            // 实例化排行榜弹窗预制体
            this.rankListDialog = instantiate(this.rankDialogPrefab);
            this.rankListDialog.setParent(canvas);
            this.rankListDialog.layer = 524288; // UI层

            console.log("LevelSelect: 排行榜弹窗预制体实例化成功");

            // 默认隐藏排行榜弹窗
            this.rankListDialog.active = false;

        } catch (error) {
            console.error("LevelSelect: 实例化排行榜弹窗预制体时出错:", error);
        }
    }

    /**
     * 排行榜按钮点击事件
     */
    private onRankListButtonClicked() {
        console.log("LevelSelect: 排行榜按钮被点击");

        // 播放点击音效
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }

        // 显示排行榜
        this.showRankList();
    }

    /**
     * 显示排行榜
     */
    public showRankList() {
        console.log("LevelSelect: 显示排行榜");

        // 如果排行榜弹窗未初始化，尝试重新初始化
        if (!this.rankListDialog) {
            console.log("LevelSelect: 排行榜弹窗未初始化，尝试重新初始化");
            this.initRankListDialog();
        }

        // 直接显示排行榜弹窗
        if (this.rankListDialog) {
            console.log("LevelSelect: 显示排行榜弹窗");
            this.rankListDialog.active = true;
         
        } else {
            console.error("LevelSelect: 排行榜弹窗未初始化");
        }
    }



    /**
     * 隐藏排行榜
     */
    public hideRankList() {
        console.log("LevelSelect: 隐藏排行榜");

        if (this.rankListDialog) {
            this.rankListDialog.active = false;
        }
    }

    /**
     * 微信游戏圈按钮点击事件
     */
    private onGameClubButtonClicked() {
        console.log("LevelSelect: 微信游戏圈按钮被点击");

        // 播放点击音效
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }

        // 这里可以添加微信游戏圈相关的逻辑
        // 例如：打开微信游戏圈、分享到朋友圈等
    }

    onDestroy() {
        // 场景销毁时隐藏广告
        this.hideWechatCustomAd();
    }
}