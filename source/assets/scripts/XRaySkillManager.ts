import { _decorator, Component, Button, Label, Node, Camera, sys } from 'cc';
import { GameManager } from './GameManager';
import { TileSpawner } from './TileSpawner';
import { MahjongTile } from './MahjongTile';
import { AudioManager } from './AudioManager';

// 微信小游戏API类型声明
declare global {
    interface Window {
        wx?: {
            createRewardedVideoAd: (options: { adUnitId: string }) => any;
        };
    }
    const wx: {
        createRewardedVideoAd: (options: { adUnitId: string }) => any;
    };
}

const { ccclass, property } = _decorator;

@ccclass('XRaySkillManager')
export class XRaySkillManager extends Component {
    @property(Button)
    xRaySkillButton: Button = null!;

    @property(Label)
    xRaySkillTimerLabel: Label = null!;

    @property(Camera)
    gameCamera: Camera = null!;

    private gameManager: GameManager = null!;
    private tileSpawner: TileSpawner = null!;

    // 透视技能相关
    private xRaySkillActive: boolean = false;
    private xRaySkillTimeLeft: number = 0;
    private xRaySkillDuration: number = 10; // 10秒
    private originalOrthoHeight: number = 0; // 保存原始摄像头高度
    private skillUseCount: number = 0; // 技能使用次数计数器
    private videoAd: any = null; // 激励视频广告实例
    
    // 本地存储键名
    private static readonly XRAY_SKILL_USE_COUNT_KEY = "xray_skill_use_count";

    onLoad() {
        // 获取GameManager实例
        this.gameManager = GameManager.getInstance();
        
        // 初始化UI
        this.initXRaySkillUI();
        
        // 初始化激励视频广告
        this.initRewardedVideoAd();
        
        // 加载技能使用次数
        this.loadSkillUseCount();
    }

    start() {
        console.log("XRaySkillManager started");
    }

    // 初始化XRay技能UI
    private initXRaySkillUI() {
        if (this.xRaySkillButton) {
            this.xRaySkillButton.node.on(Button.EventType.CLICK, this.onXRaySkillButtonClick, this);
            this.xRaySkillButton.node.active = true;
        }

        // 初始化倒计时标签
        if (this.xRaySkillTimerLabel) {
            this.xRaySkillTimerLabel.node.active = false;
        }
    }

    // XRay技能按钮点击处理
    private onXRaySkillButtonClick() {
        console.log("点击透视技能按钮");

        // 检查按钮是否可用
        if (!this.xRaySkillButton || !this.xRaySkillButton.interactable) {
            return;
        }

        // 播放技能音效
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }

        // 检查是否需要观看广告
        if (this.skillUseCount === 0) {
            // 第一次免费使用
            this.activateXRaySkill();
        } else {
            // 第二次及以后需要观看广告
            this.showRewardedVideoAd();
        }
    }

    // 激活透视技能
    private activateXRaySkill() {
        console.log("激活透视技能");

        // 增加使用次数
        this.skillUseCount++;
        this.saveSkillUseCount();
        
        // 设置技能状态
        this.xRaySkillActive = true;
        this.xRaySkillTimeLeft = this.xRaySkillDuration;

        // 禁用按钮
        if (this.xRaySkillButton) {
            this.xRaySkillButton.interactable = false;
        }

        // 显示倒计时标签
        if (this.xRaySkillTimerLabel) {
            this.xRaySkillTimerLabel.node.active = true;
            this.xRaySkillTimerLabel.string = `${Math.ceil(this.xRaySkillTimeLeft)}s`;
        }

        // 翻开场景内所有麻将牌
        this.revealAllTiles();

        // 缩放摄像头
        this.scaleCameraView();

        // 开始更新倒计时
        this.schedule(this.updateXRaySkillTimer, 0.1);
    }

    // 更新透视技能计时器
    private updateXRaySkillTimer(dt: number) {
        if (!this.xRaySkillActive) {
            return;
        }

        this.xRaySkillTimeLeft -= dt;

        // 更新倒计时显示
        if (this.xRaySkillTimerLabel) {
            this.xRaySkillTimerLabel.string = `${Math.ceil(this.xRaySkillTimeLeft)}s`;
        }

        // 检查技能是否结束
        if (this.xRaySkillTimeLeft <= 0) {
            this.deactivateXRaySkill();
        }
    }

    // 取消激活透视技能
    private deactivateXRaySkill() {
        console.log("取消激活透视技能");

        this.xRaySkillActive = false;
        this.xRaySkillTimeLeft = 0;

        // 停止计时器更新
        this.unschedule(this.updateXRaySkillTimer);

        // 隐藏倒计时标签
        if (this.xRaySkillTimerLabel) {
            this.xRaySkillTimerLabel.node.active = false;
        }

        // 启用按钮
        if (this.xRaySkillButton) {
            // 延迟一小段时间后重新启用按钮，避免连续点击
            this.scheduleOnce(() => {
                if (this.xRaySkillButton) {
                    this.xRaySkillButton.interactable = true;
                }
            }, 1);
        }

        // 关闭所有麻将牌的正面显示
        this.hideAllTiles();

        // 恢复摄像头视野
        this.restoreCameraView();
    }

    // 关闭场景内所有麻将牌的正面显示
    private hideAllTiles() {
        console.log("关闭场景内所有麻将牌的正面显示");

        // 获取所有麻将牌节点
        const tiles = this.tileSpawner ? this.tileSpawner.getActiveTiles() : this.gameManager.getActiveTiles();

        // 将每一张牌翻回背面
        tiles.forEach(tileNode => {
            const mahjongTile = tileNode.getComponent(MahjongTile);
            if (mahjongTile && !mahjongTile.isBackSide()) {
                mahjongTile.setBackSide();
            }
        });
    }

    // 翻开场景内所有麻将牌
    private revealAllTiles() {
        console.log("翻开场景内所有麻将牌");

        // 获取所有麻将牌节点
        const tiles = this.tileSpawner ? this.tileSpawner.getActiveTiles() : this.gameManager.getActiveTiles();

        // 翻开每一张牌
        tiles.forEach(tileNode => {
            const mahjongTile = tileNode.getComponent(MahjongTile);
            if (mahjongTile && mahjongTile.isBackSide()) {
                mahjongTile.setFrontSide();
            }
        });
    }

    // 检查是否应该自动翻开新生成的牌
    public shouldAutoRevealNewTiles(): boolean {
        return this.xRaySkillActive;
    }

    // 设置TileSpawner引用
    public setTileSpawner(tileSpawner: TileSpawner) {
        this.tileSpawner = tileSpawner;
    }

    // 缩放摄像头视野
    private scaleCameraView() {
        if (!this.gameCamera) {
            console.warn("游戏摄像头未设置");
            return;
        }

        // 保存原始高度
        this.originalOrthoHeight = this.gameCamera.orthoHeight;
        
        // 设置为3倍高度
        this.gameCamera.orthoHeight = this.originalOrthoHeight * 3;
        
        console.log(`摄像头视野已缩放，原始高度: ${this.originalOrthoHeight}, 新高度: ${this.gameCamera.orthoHeight}`);
    }

    // 恢复摄像头视野
    private restoreCameraView() {
        if (!this.gameCamera || this.originalOrthoHeight === 0) {
            console.warn("无法恢复摄像头视野");
            return;
        }

        // 恢复原始高度
        this.gameCamera.orthoHeight = this.originalOrthoHeight;
        
        console.log(`摄像头视野已恢复，高度: ${this.originalOrthoHeight}`);
        
        // 重置保存的高度
        this.originalOrthoHeight = 0;
    }

    // 初始化激励视频广告
    private initRewardedVideoAd() {
        // 检查是否在微信小游戏环境
        if (typeof window !== 'undefined' && (window as any).wx && (window as any).wx.createRewardedVideoAd) {
            const wx = (window as any).wx;
            try {
                // 创建激励视频广告实例
                this.videoAd = wx.createRewardedVideoAd({
                    adUnitId: 'adunit-fc0e220e2862c912'
                });

                // 监听广告关闭事件
                this.videoAd.onClose((res: any) => {
                    // 恢复游戏
                    if (this.gameManager) {
                        this.gameManager.resumeGame();
                    }
                    
                    if (res && res.isEnded) {
                        // 用户看完广告，激活技能
                        console.log("广告观看完成，激活透视技能");
                        this.activateXRaySkill();
                    } else {
                        // 用户中途关闭广告
                        console.log("广告未看完，技能不激活");
                    }
                });

                // 监听广告加载失败事件
                this.videoAd.onError((err: any) => {
                    console.error('激励视频广告加载失败', err);
                });

                console.log("激励视频广告初始化成功");
            } catch (error) {
                console.error("激励视频广告初始化失败", error);
            }
        } else {
            console.log("非微信小游戏环境，跳过广告初始化");
        }
    }

    // 显示激励视频广告
    private showRewardedVideoAd() {
        if (!this.videoAd) {
            console.warn("激励视频广告未初始化，直接激活技能");
            this.activateXRaySkill();
            return;
        }

        console.log("准备显示激励视频广告");
        
        // 显示广告
        this.videoAd.show().then(() => {
            console.log("广告显示成功");
            if (this.gameManager) {
                this.gameManager.pauseGame();
            }
        }).catch((err: any) => {
            console.warn("广告显示失败，尝试重新加载", err);
            
            // 失败重试
            this.videoAd.load()
                .then(() => {
                    return this.videoAd.show();
                })
                .then(() => {
                    console.log("重新加载后广告显示成功");
                    if (this.gameManager) {
                        this.gameManager.pauseGame();
                    }
                })
                .catch((retryErr: any) => {
                    console.error('激励视频广告重试失败，直接激活技能', retryErr);
                    // 广告失败时直接激活技能，确保用户体验
                    this.activateXRaySkill();
                });
        });
    }

    onDestroy() {
        // 清理广告事件监听器
        if (this.videoAd) {
            try {
                this.videoAd.offClose();
                this.videoAd.offError();
            } catch (error) {
                console.warn("清理广告监听器时出错", error);
            }
        }
        
        // 清理事件监听器
        if (this.xRaySkillButton) {
            this.xRaySkillButton.node.off(Button.EventType.CLICK, this.onXRaySkillButtonClick, this);
        }
        
        // 如果组件销毁时技能还在激活状态，恢复摄像头
        if (this.xRaySkillActive && this.gameCamera && this.originalOrthoHeight > 0) {
            this.gameCamera.orthoHeight = this.originalOrthoHeight;
        }
    }
    
    // 加载技能使用次数
    private loadSkillUseCount() {
        try {
            const savedCount = sys.localStorage.getItem(XRaySkillManager.XRAY_SKILL_USE_COUNT_KEY);
            if (savedCount) {
                this.skillUseCount = parseInt(savedCount) || 0;
                console.log(`透视技能使用次数已加载: ${this.skillUseCount}`);
            } else {
                this.skillUseCount = 0;
                console.log("透视技能使用次数初始化为0");
            }
        } catch (error) {
            console.error("加载透视技能使用次数失败:", error);
            this.skillUseCount = 0;
        }
    }
    
    // 保存技能使用次数
    private saveSkillUseCount() {
        try {
            sys.localStorage.setItem(XRaySkillManager.XRAY_SKILL_USE_COUNT_KEY, this.skillUseCount.toString());
            console.log(`透视技能使用次数已保存: ${this.skillUseCount}`);
        } catch (error) {
            console.error("保存透视技能使用次数失败:", error);
        }
    }
    
    // 获取当前技能使用次数（供外部查询）
    public getSkillUseCount(): number {
        return this.skillUseCount;
    }
    
    // 重置技能使用次数（供开发者测试）
    public resetSkillUseCount() {
        this.skillUseCount = 0;
        this.saveSkillUseCount();
        console.log("透视技能使用次数已重置为0");
    }
}