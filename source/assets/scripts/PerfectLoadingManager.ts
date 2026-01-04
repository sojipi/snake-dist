import { _decorator, Component, Node, Label, ProgressBar, director, resources, assetManager } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 完美的加载管理器 - 确保进度条准确显示到100%
 */
@ccclass('PerfectLoadingManager')
export class PerfectLoadingManager extends Component {
    @property(ProgressBar)
    progressBar: ProgressBar = null!;
    
    @property(Label)
    loadingText: Label = null!;
    
    @property(Label)
    tipText: Label = null!;
    
    @property({ tooltip: "目标场景" })
    targetScene: string = "GameScene";
    
    @property({ tooltip: "加载时间（秒）" })
    loadingTime: number = 3.0;
    
    @property({ tooltip: "完成后等待时间（秒）" })
    completeWaitTime: number = 0.5;
    
    @property({ tooltip: "当前游戏版本号" })
    gameVersion: string = "111";
    
    private startTime: number = 0;
    private timer: any = null;
    private isLoading: boolean = false;
    private totalAssets: number = 0; // 总资源数
    private loadedAssets: number = 0; // 已加载资源数
    private resourcesLoaded: boolean = false; // 资源是否加载完成
    private sceneLoaded: boolean = false; // 场景是否加载完成
    private versionChecked: boolean = false; // 版本检查是否完成
    private updateChecked: boolean = false; // 更新检查是否完成
    private cacheCleared: boolean = false; // 缓存是否已清除
    
    // 游戏提示
    private gameTips: string[] = [
        "收集相同的麻将牌可以组成对子",
        "手牌满14张时需要弃牌才能继续收集", 
        "完成目标牌型即可通关",
        "使用方向键控制贪食蛇移动",
        "合理规划路线，避免撞到边界"
    ];
    
    private currentTipIndex: number = 0;
    private tipTimer: any = null;
    
    onLoad() {
        console.log("PerfectLoadingManager: 组件加载");
    }
    
    start() {
        console.log("PerfectLoadingManager: 开始加载");
         // 先进行版本检查和更新检查
        this.checkVersionAndUpdates();
        
        // 检查版本并决定是否清除缓存
        this.checkVersionAndClearCache();
        
       
    }
    
    /**
     * 检查版本并决定是否清除缓存
     */
    private checkVersionAndClearCache() {
        try {
            console.log(`PerfectLoadingManager: 检查版本，当前版本: ${this.gameVersion}`);
            
            // 获取本地存储的版本号
            const storedVersion = this.getStoredVersion();
            console.log(`PerfectLoadingManager: 本地存储版本: ${storedVersion}`);
            
            // 比较版本号
            if (storedVersion !== this.gameVersion) {
                console.log(`PerfectLoadingManager: 版本不匹配，需要清除缓存 (${storedVersion} -> ${this.gameVersion})`);
                
                // 清除缓存
                this.clearResourceCache();
                
                // 保存新版本号
                this.saveCurrentVersion();
            } else {
                console.log("PerfectLoadingManager: 版本匹配，跳过缓存清除");
                this.cacheCleared = true;
            }
            
        } catch (error) {
            console.error("PerfectLoadingManager: 版本检查失败", error);
            // 出错时跳过缓存清除，继续正常流程
            this.cacheCleared = true;
        }
    }
    
    /**
     * 获取本地存储的版本号
     */
    private getStoredVersion(): string {
        try {
            // 检查是否在微信环境中
            if (typeof wx !== 'undefined') {
                // 微信小程序环境，使用 wx.getStorageSync
                const version = wx.getStorageSync('game_version');
                return version || '';
            } else {
                // 其他环境，使用 localStorage
                const version = localStorage.getItem('game_version');
                return version || '';
            }
        } catch (error) {
            console.error("PerfectLoadingManager: 获取本地版本号失败", error);
            return '';
        }
    }
    
    /**
     * 保存当前版本号到本地存储
     */
    private saveCurrentVersion() {
        try {
            console.log(`PerfectLoadingManager: 保存版本号到本地存储: ${this.gameVersion}`);
            
            // 检查是否在微信环境中
            if (typeof wx !== 'undefined') {
                // 微信小程序环境，使用 wx.setStorageSync
                wx.setStorageSync('game_version', this.gameVersion);
            } else {
                // 其他环境，使用 localStorage
                localStorage.setItem('game_version', this.gameVersion);
            }
            
            console.log("PerfectLoadingManager: 版本号保存成功");
        } catch (error) {
            console.error("PerfectLoadingManager: 保存版本号失败", error);
        }
    }
    
    /**
     * 清除资源缓存并重启小程序
     */
    private clearResourceCache() {
        try {
            console.log("PerfectLoadingManager: 开始清除资源缓存");
            
            // 清除所有缓存
            assetManager.cacheManager.clearCache();
            console.log("PerfectLoadingManager: 资源缓存清除成功");
            
            // 检查是否在微信环境中
            if (typeof wx !== 'undefined') {
                console.log("PerfectLoadingManager: 微信环境，清除缓存后重启小程序");
                this.restartWechatMiniProgram();
            } else {
                console.log("PerfectLoadingManager: 非微信环境，直接继续加载流程");
                this.cacheCleared = true;
            }
            
        } catch (error) {
            console.error("PerfectLoadingManager: 清除资源缓存失败", error);
            // 即使清除失败，也标记为完成，继续游戏流程
            this.cacheCleared = true;
        }
    }
    
    /**
     * 重启微信小程序
     */
    private restartWechatMiniProgram() {
        try {
            console.log("PerfectLoadingManager: 准备重启微信小程序");
            
            // 更新加载文本
            if (this.loadingText) {
                this.loadingText.string = "缓存已清除，正在重启...";
            }
            
            // 延迟1秒后重启，让用户看到提示信息
            this.scheduleOnce(() => {
                try {
                    // 使用微信小程序的重启API
                    wx.restartMiniProgram({
                        success: () => {
                            console.log("PerfectLoadingManager: 小程序重启成功");
                        },
                        fail: (error) => {
                            console.error("PerfectLoadingManager: 小程序重启失败", error);
                            // 重启失败，继续正常流程
                            this.cacheCleared = true;
                        }
                    });
                } catch (error) {
                    console.error("PerfectLoadingManager: 调用重启API失败", error);
                    // API调用失败，继续正常流程
                    this.cacheCleared = true;
                }
            }, 1.0);
            
        } catch (error) {
            console.error("PerfectLoadingManager: 重启小程序过程出错", error);
            // 出错时继续正常流程
            this.cacheCleared = true;
        }
    }
    
    /**
     * 检查版本和更新
     */
    private checkVersionAndUpdates() {
        console.log("PerfectLoadingManager: 开始更新检查");
        
        // 检查是否有更新
        this.checkForUpdates();
    }
    
    /**
     * 检查更新
     */
    private checkForUpdates() {
        console.log("PerfectLoadingManager: 检查更新");
        
        // 如果不是微信环境，直接标记为完成
        if (typeof wx === 'undefined') {
            console.log("PerfectLoadingManager: 非微信环境，跳过更新检查");
            this.updateChecked = true;
            this.tryStartLoading();
            return;
        }
        
        // 更新文本显示检查更新中
        if (this.loadingText) {
            this.loadingText.string = "检查更新中...";
        }
        
        try {
            const updateManager = wx.getUpdateManager();
            
            updateManager.onCheckForUpdate((res) => {
                // 请求完新版本信息的回调
                console.log("PerfectLoadingManager: 检查更新结果", res.hasUpdate);
                if (res.hasUpdate) {
                    // 有更新，更新文本
                    if (this.loadingText) {
                        this.loadingText.string = "发现新版本，准备更新...";
                    }
                } else {
                    // 没有更新，标记更新检查完成
                    this.updateChecked = true;
                    this.tryStartLoading();
                }
            });
            
            updateManager.onUpdateReady(() => {
                console.log("PerfectLoadingManager: 新版本下载完成");
                // 新的版本已经下载好，更新文本
                if (this.loadingText) {
                    this.loadingText.string = "新版本已准备好";
                }
                
                // 新的版本已经下载好
                wx.showModal({
                    title: "更新提示",
                    content: "新版本已经准备好，是否重启应用？",
                    success: (res) => {
                        if (res.confirm) {
                            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                            updateManager.applyUpdate();
                        } else {
                            // 用户取消，继续正常流程
                            this.updateChecked = true;
                            this.tryStartLoading();
                        }
                    },
                    fail: () => {
                        // modal显示失败，继续正常流程
                        this.updateChecked = true;
                        this.tryStartLoading();
                    }
                });
            });
            
            updateManager.onUpdateFailed(() => {
                // 新版本下载失败
                console.log("PerfectLoadingManager: 新版本下载失败");
                if (this.loadingText) {
                    this.loadingText.string = "更新失败，继续加载...";
                }
                
                wx.showModal({
                    title: "更新提示",
                    content: "新版本下载失败，请检查网络后重新尝试",
                    showCancel: false,
                    success: () => {
                        // 继续正常流程
                        this.updateChecked = true;
                        this.tryStartLoading();
                    }
                });
            });
        } catch (error) {
            console.error("PerfectLoadingManager: 更新检查出错", error);
            // 出错时更新文本
            if (this.loadingText) {
                this.loadingText.string = "检查更新出错，继续加载...";
            }
            this.updateChecked = true;
            this.tryStartLoading();
        }
    }
    
    /**
     * 尝试开始加载（当版本检查和更新检查都完成时）
     */
    private tryStartLoading() {
            this.startLoading();
    }
    
    private startLoading() {
        // 检查组件
        if (!this.progressBar) {
            console.error("PerfectLoadingManager: ProgressBar 未绑定！");
            return;
        }
        
        if (!this.loadingText) {
            console.error("PerfectLoadingManager: LoadingText 未绑定！");
            return;
        }
        
        console.log("PerfectLoadingManager: 组件检查通过，开始加载");
        
        this.isLoading = true;
        this.startTime = Date.now();
        
        // 初始化UI
        this.progressBar.progress = 0;
        this.loadingText.string = "开始加载...";
        
        if (this.tipText) {
            this.tipText.string = this.gameTips[0];
            this.startTipRotation();
        }
        
        // 开始真实资源加载
        this.loadGameResources();
        
        // 使用高频率更新确保平滑进度
        const updateInterval = 50; // 50ms更新一次，更平滑
        
        console.log(`PerfectLoadingManager: 开始资源加载，每 ${updateInterval}ms 更新一次进度`);
        
        this.timer = setInterval(() => {
            this.updateProgress();
        }, updateInterval);
    }
    
    /**
     * 真实加载游戏资源
     */
    private loadGameResources() {
        console.log("PerfectLoadingManager: 开始加载游戏资源");
        
        // 更新加载文本
        if (this.loadingText) {
            this.loadingText.string = "加载资源中...";
        }
        
        // 加载resources目录下的所有资源
        resources.loadDir("", (err, assets) => {
            if (err) {
                console.error("PerfectLoadingManager: 资源加载出错", err);
            } else {
                console.log(`PerfectLoadingManager: 成功加载 ${assets.length} 个资源`);
                this.totalAssets = assets.length;
            }
            
            this.resourcesLoaded = true;
            this.checkLoadingComplete();
        });
        
        // 同时加载场景
        director.preloadScene(this.targetScene, (error) => {
            if (error) {
                console.error(`PerfectLoadingManager: 场景 ${this.targetScene} 预加载失败`, error);
            } else {
                console.log(`PerfectLoadingManager: 场景 ${this.targetScene} 预加载成功`);
            }
            
            this.sceneLoaded = true;
            this.checkLoadingComplete();
        });
    }
    
    /**
     * 检查是否所有加载都已完成
     */
    private checkLoadingComplete() {
        if (this.resourcesLoaded && this.sceneLoaded) {
            console.log("PerfectLoadingManager: 所有资源加载完成");
            this.completeLoading();
        }
    }
    
    private updateProgress() {
        if (!this.isLoading) {
            if (this.timer) {
                clearInterval(this.timer);
            }
            return;
        }
        
        // 根据实际加载状态计算进度
        let progress = 0;
        if (this.resourcesLoaded && this.sceneLoaded) {
            // 如果资源和场景都加载完成，进度为100%
            progress = 1.0;
        } else if (this.totalAssets > 0) {
            // 根据已加载资源数计算进度（资源加载占80%，场景加载占20%）
            const resourceProgress = this.loadedAssets / this.totalAssets * 0.8;
            const sceneProgress = this.sceneLoaded ? 0.2 : 0;
            progress = resourceProgress + sceneProgress;
        } else {
            // 如果还没有获取到资源总数，使用时间作为后备方案
            const elapsedTime = (Date.now() - this.startTime) / 1000; // 转换为秒
            progress = Math.min(elapsedTime / this.loadingTime, 1.0);
        }
        
        // 更新进度条
        if (this.progressBar) {
            this.progressBar.progress = progress;
        }
        
        // 更新文本
        if (this.loadingText) {
            const percentage = Math.floor(progress * 100);
            this.loadingText.string = `加载中... ${percentage}%`;
        }
        
        // 输出进度日志（每20%一次）
        const currentStep = Math.floor(progress * 5);
        const lastStep = Math.floor(((Date.now() - this.startTime - 50) / 1000 / this.loadingTime) * 5);
        if (currentStep > lastStep && currentStep > 0 && currentStep <= 5) {
            console.log(`PerfectLoadingManager: 进度 ${currentStep * 20}%`);
        }
    }
    
    private startTipRotation() {
        if (!this.tipText || this.gameTips.length === 0) return;
        
        this.tipTimer = setInterval(() => {
            this.currentTipIndex = (this.currentTipIndex + 1) % this.gameTips.length;
            if (this.tipText) {
                this.tipText.string = this.gameTips[this.currentTipIndex];
            }
        }, 2500); // 每2.5秒切换一次提示
    }
    
    private completeLoading() {
        console.log("PerfectLoadingManager: 加载完成");
        this.isLoading = false;
        
        // 停止提示轮播
        if (this.tipTimer) {
            clearInterval(this.tipTimer);
        }
        
        // 确保显示100%
        if (this.progressBar) {
            this.progressBar.progress = 1.0;
            console.log("PerfectLoadingManager: 进度条确认为100%");
        }
        
        if (this.loadingText) {
            this.loadingText.string = "加载完成！";
        }
        
        // 延迟跳转，让用户看到完成状态
        this.jumpToScene();
    }
    
    private jumpToScene() {
        console.log(`PerfectLoadingManager: 跳转到场景 ${this.targetScene}`);
        
        try {
            director.loadScene(this.targetScene, (error) => {
                if (error) {
                    console.error(`PerfectLoadingManager: 跳转到 ${this.targetScene} 失败:`, error);
                    // 尝试跳转到GameScene
                    console.log("PerfectLoadingManager: 尝试跳转到 GameScene");
                    director.loadScene("GameScene", (gameError) => {
                        if (gameError) {
                            console.error("PerfectLoadingManager: GameScene 跳转也失败:", gameError);
                            if (this.loadingText) {
                                this.loadingText.string = "场景跳转失败";
                            }
                        } else {
                            console.log("PerfectLoadingManager: 成功跳转到 GameScene");
                        }
                    });
                } else {
                    console.log(`PerfectLoadingManager: 成功跳转到 ${this.targetScene}`);
                }
            });
        } catch (error) {
            console.error("PerfectLoadingManager: 场景跳转异常:", error);
        }
    }
    
    // 公共方法
    public forceComplete() {
        console.log("PerfectLoadingManager: 强制完成加载");
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.completeLoading();
    }
    
    public setTargetScene(sceneName: string) {
        this.targetScene = sceneName;
        console.log(`PerfectLoadingManager: 目标场景设置为 ${sceneName}`);
    }
    
    public setLoadingTime(time: number) {
        this.loadingTime = time;
        console.log(`PerfectLoadingManager: 加载时间设置为 ${time} 秒`);
    }
    
    onDestroy() {
        this.isLoading = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        if (this.tipTimer) {
            clearInterval(this.tipTimer);
            this.tipTimer = null;
        }
        console.log("PerfectLoadingManager: 组件销毁");
    }
}