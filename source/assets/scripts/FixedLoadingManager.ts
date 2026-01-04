import { _decorator, Component, Node, Label, ProgressBar, director, tween } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 修复版加载管理器 - 使用tween动画代替schedule避免调度器冲突
 */
@ccclass('FixedLoadingManager')
export class FixedLoadingManager extends Component {
    @property(ProgressBar)
    progressBar: ProgressBar = null!;
    
    @property(Label)
    loadingText: Label = null!;
    
    @property(Label)
    tipText: Label = null!;
    
    @property({ tooltip: "加载完成后跳转的场景名称" })
    targetScene: string = "GameScene";
    
    @property({ tooltip: "加载时间（秒）" })
    loadingTime: number = 3.0;
    
    private loadingTween: any = null;
    private tipTween: any = null;
    
    // 游戏提示
    private gameTips: string[] = [
        "收集相同的麻将牌可以组成对子",
        "手牌满14张时需要弃牌才能继续收集", 
        "完成目标牌型即可通关",
        "使用方向键控制贪食蛇移动",
        "合理规划路线，避免撞到边界",
        "观察场上的麻将牌分布，制定收集策略"
    ];
    
    private currentTipIndex: number = 0;
    
    onLoad() {
        console.log("FixedLoadingManager: 组件加载");
        this.checkComponents();
    }
    
    start() {
        console.log("FixedLoadingManager: 开始加载");
        this.initializeUI();
        this.startLoading();
    }
    
    private checkComponents(): boolean {
        let allGood = true;
        
        if (!this.progressBar) {
            console.error("FixedLoadingManager: ProgressBar 未绑定！");
            allGood = false;
        }
        
        if (!this.loadingText) {
            console.error("FixedLoadingManager: LoadingText 未绑定！");
            allGood = false;
        }
        
        if (allGood) {
            console.log("FixedLoadingManager: 所有组件检查通过");
        }
        
        return allGood;
    }
    
    private initializeUI() {
        // 初始化进度条
        if (this.progressBar) {
            this.progressBar.progress = 0;
            console.log("FixedLoadingManager: 进度条初始化为0");
        }
        
        // 初始化文本
        if (this.loadingText) {
            this.loadingText.string = "开始加载...";
        }
        
        if (this.tipText) {
            this.tipText.string = this.gameTips[0];
        }
    }
    
    private startLoading() {
        if (!this.checkComponents()) {
            console.error("FixedLoadingManager: 组件检查失败，无法开始加载");
            return;
        }
        
        console.log(`FixedLoadingManager: 开始 ${this.loadingTime} 秒加载过程`);
        
        // 使用tween动画更新进度条，避免schedule冲突
        this.startProgressTween();
        
        // 启动提示文本轮播
        this.startTipRotation();
    }
    
    private startProgressTween() {
        if (!this.progressBar) return;
        
        console.log("FixedLoadingManager: 启动进度条tween动画");
        
        // 创建一个临时对象来承载进度值
        const progressObj = { value: 0 };
        
        this.loadingTween = tween(progressObj)
            .to(this.loadingTime, { value: 1 }, {
                onUpdate: (target, ratio) => {
                    if (this.progressBar) {
                        this.progressBar.progress = target.value;
                        
                        // 更新加载文本
                        if (this.loadingText) {
                            const percentage = Math.floor(target.value * 100);
                            this.loadingText.string = `加载中... ${percentage}%`;
                        }
                        
                        // 每20%输出一次日志
                        const currentPercent = Math.floor(target.value * 5) * 20;
                        const lastPercent = Math.floor((target.value - 0.01) * 5) * 20;
                        if (currentPercent > lastPercent && currentPercent > 0) {
                            console.log(`FixedLoadingManager: 进度 ${currentPercent}%`);
                        }
                    }
                }
            })
            .call(() => {
                console.log("FixedLoadingManager: 加载完成");
                this.onLoadingComplete();
            })
            .start();
    }
    
    private startTipRotation() {
        if (!this.tipText || this.gameTips.length === 0) return;
        
        const rotateTip = () => {
            this.currentTipIndex = (this.currentTipIndex + 1) % this.gameTips.length;
            if (this.tipText) {
                this.tipText.string = this.gameTips[this.currentTipIndex];
            }
        };
        
        // 每3秒切换一次提示
        this.tipTween = tween({})
            .delay(3.0)
            .call(rotateTip)
            .union()
            .repeatForever()
            .start();
    }
    
    private onLoadingComplete() {
        // 停止所有动画
        if (this.loadingTween) {
            this.loadingTween.stop();
        }
        if (this.tipTween) {
            this.tipTween.stop();
        }
        
        // 确保进度条显示100%
        if (this.progressBar) {
            this.progressBar.progress = 1.0;
        }
        
        if (this.loadingText) {
            this.loadingText.string = "加载完成！";
        }
        
        console.log("FixedLoadingManager: 准备跳转场景");
        
        // 延迟1秒后跳转
        tween({})
            .delay(1.0)
            .call(() => {
                this.jumpToScene();
            })
            .start();
    }
    
    private jumpToScene() {
        console.log(`FixedLoadingManager: 尝试跳转到 ${this.targetScene}`);
        
        // 直接尝试跳转，如果失败会在控制台显示错误
        try {
            director.loadScene(this.targetScene, (error) => {
                if (error) {
                    console.error(`FixedLoadingManager: 跳转到 ${this.targetScene} 失败:`, error);
                    // 尝试跳转到GameScene
                    console.log("FixedLoadingManager: 尝试跳转到 GameScene");
                    director.loadScene("GameScene", (gameError) => {
                        if (gameError) {
                            console.error("FixedLoadingManager: 跳转到 GameScene 也失败:", gameError);
                            if (this.loadingText) {
                                this.loadingText.string = "场景跳转失败";
                            }
                        } else {
                            console.log("FixedLoadingManager: 成功跳转到 GameScene");
                        }
                    });
                } else {
                    console.log(`FixedLoadingManager: 成功跳转到 ${this.targetScene}`);
                }
            });
        } catch (e) {
            console.error("FixedLoadingManager: 场景跳转异常:", e);
        }
    }
    
    // 公共方法
    public setTargetScene(sceneName: string) {
        this.targetScene = sceneName;
    }
    
    public setLoadingTime(time: number) {
        this.loadingTime = time;
    }
    
    public forceComplete() {
        console.log("FixedLoadingManager: 强制完成加载");
        this.onLoadingComplete();
    }
    
    onDestroy() {
        // 清理所有tween动画
        if (this.loadingTween) {
            this.loadingTween.stop();
        }
        if (this.tipTween) {
            this.tipTween.stop();
        }
        console.log("FixedLoadingManager: 组件销毁，清理动画");
    }
}
