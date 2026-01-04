import { _decorator, Component, Node, Label, find, tween, UIOpacity, Vec3 } from 'cc';
import { GameManager } from './GameManager';
import { AudioManager } from './AudioManager';

const { ccclass, property } = _decorator;

/**
 * 新手教程步骤枚举
 */
export enum TutorialStep {
    NONE = 0,
    MOVE_GUIDE = 1,        // 指引玩家移动
    HOLD_MOVE_GUIDE = 2,   // 指引玩家长按移动加速
    EAT_TILE_GUIDE = 3,    // 指引玩家吃牌
    ATTACK_AI_GUIDE = 4,   // 指引玩家攻击AI蛇
    COLLECT_14_GUIDE = 5,  // 指引玩家吃够14张牌
    DISCARD_GUIDE = 6,     // 指引玩家弃牌
    OPEN_DISCARD_GUIDE = 7, // 指引玩家打开弃牌弹窗
    WIN_GUIDE = 8,         // 指引玩家胡牌
    COMPLETED = 9          // 教程完成
}

/**
 * 新手教程管理器
 * 在棋盘上显示文字指引，只在第一关出现
 */
@ccclass('TutorialManager')
export class TutorialManager extends Component {

    @property(Node)
    tutorialTextNode: Node = null!;

    @property(Label)
    tutorialLabel: Label = null!;

    private currentStep: TutorialStep = TutorialStep.NONE;
    private gameManager: GameManager = null!;
    private audioManager: AudioManager = null!;

    // 教程完成状态记录
    private completedSteps: Set<TutorialStep> = new Set();
    
    // 教程文本内容
    private tutorialTexts: Map<TutorialStep, string> = new Map([
        [TutorialStep.MOVE_GUIDE, "点击方向按钮移动蛇"],
        [TutorialStep.HOLD_MOVE_GUIDE, "长按方向按钮可以加速移动"],
        [TutorialStep.EAT_TILE_GUIDE, "移动到麻将牌上吃掉它，增加手牌"],
        [TutorialStep.ATTACK_AI_GUIDE, "攻击AI蛇获得它的牌"],
        [TutorialStep.COLLECT_14_GUIDE, "继续收集麻将牌，直到有14张手牌"],
        [TutorialStep.DISCARD_GUIDE, "手牌满了！点击手牌区域弃掉一张牌"],
        [TutorialStep.OPEN_DISCARD_GUIDE, "点击左上角按钮查看该关卡示例和已弃的牌"],
        [TutorialStep.WIN_GUIDE, "胡牌以获得胜利！"]
    ]);
    
    onLoad() {
        console.log("TutorialManager: 新手教程管理器初始化");
        this.loadTutorialProgress();
    }

    start() {
        // 如果GameManager还没有设置，尝试查找
        if (!this.gameManager) {
            this.gameManager = GameManager.getInstance();
        }

        this.audioManager = AudioManager.getInstance();

        console.log("TutorialManager: start方法被调用");
        console.log("TutorialManager: gameManager找到:", !!this.gameManager);

        if (this.gameManager) {
            const currentLevel = this.gameManager.getCurrentLevel();
            console.log("TutorialManager: 当前关卡ID:", currentLevel);
        }

        // 检查是否是第一关且需要显示教程
        if (this.shouldShowTutorial()) {
            console.log("TutorialManager: 满足显示教程条件，开始教程");
            this.startTutorial();
        } else {
            console.log("TutorialManager: 不满足显示教程条件，隐藏教程");
            this.hideTutorialText();
        }
    }

    /**
     * 设置GameManager实例（由GameManager调用）
     */
    public setGameManager(gameManager: GameManager) {
        this.gameManager = gameManager;
        console.log("TutorialManager: GameManager已设置");

        // 只在start方法还没执行时才检查教程
        // 避免重复启动
    }
    
    /**
     * 检查是否应该显示教程
     */
    private shouldShowTutorial(): boolean {
        console.log("TutorialManager: 检查是否应该显示教程");

        // 检查是否是第一关
        if (!this.gameManager) {
            console.log("TutorialManager: gameManager未找到，不显示教程");
            return false;
        }

        const currentLevel = this.gameManager.getCurrentLevel();
        console.log("TutorialManager: 当前关卡:", currentLevel);

        if (currentLevel !== 1) {
            console.log("TutorialManager: 不是第一关，不显示教程");
            return false;
        }

        // 检查教程是否已经完成
        const tutorialCompleted = localStorage.getItem('snake_tutorial_completed');
        console.log("TutorialManager: 教程完成状态:", tutorialCompleted);

        const shouldShow = tutorialCompleted !== 'true';
        console.log("TutorialManager: 最终决定是否显示教程:", shouldShow);

        return shouldShow;
    }

    /**
     * 加载教程进度
     */
    private loadTutorialProgress() {
        const savedProgress = localStorage.getItem('snake_tutorial_progress');
        if (savedProgress) {
            try {
                const progressArray = JSON.parse(savedProgress);
                this.completedSteps = new Set(progressArray);
            } catch (error) {
                console.error("TutorialManager: 加载教程进度失败", error);
            }
        }
    }
    
    /**
     * 保存教程进度
     */
    private saveTutorialProgress() {
        const progressArray = Array.from(this.completedSteps);
        localStorage.setItem('snake_tutorial_progress', JSON.stringify(progressArray));
    }

    /**
     * 开始教程
     */
    public startTutorial() {
        // 如果教程已经在进行中，不重复启动
        if (this.currentStep !== TutorialStep.NONE) {
            console.log("TutorialManager: 教程已在进行中，跳过启动");
            return;
        }

        console.log("TutorialManager: 开始新手教程");
        this.showStep(TutorialStep.MOVE_GUIDE);
    }
    
    /**
     * 显示指定的教程步骤
     */
    public showStep(step: TutorialStep) {
        console.log(`TutorialManager: 尝试显示教程步骤 ${step}`);

        // 如果这个步骤已经完成过，查找下一个未完成的步骤
        if (this.completedSteps.has(step)) {
            console.log(`TutorialManager: 步骤 ${step} 已完成，查找下一个未完成步骤`);
            this.findNextIncompleteStep(step);
            return;
        }

        this.currentStep = step;
        const text = this.tutorialTexts.get(step);

        console.log(`TutorialManager: 教程文本:`, text);
        console.log(`TutorialManager: tutorialLabel存在:`, !!this.tutorialLabel);
        console.log(`TutorialManager: tutorialTextNode存在:`, !!this.tutorialTextNode);

        if (text && this.tutorialLabel) {
            this.tutorialLabel.string = text;
            this.showTutorialText();

            console.log(`TutorialManager: 成功显示教程步骤 ${step}: ${text}`);
        } else {
            console.error(`TutorialManager: 无法显示教程步骤 ${step}，text:`, text, "tutorialLabel:", !!this.tutorialLabel);
        }
    }

    /**
     * 查找下一个未完成的步骤
     */
    private findNextIncompleteStep(currentStep: TutorialStep) {
        for (let step = currentStep + 1; step <= TutorialStep.WIN_GUIDE; step++) {
            if (!this.completedSteps.has(step)) {
                console.log(`TutorialManager: 找到下一个未完成步骤 ${step}`);
                this.showStep(step);
                return;
            }
        }

        // 如果所有步骤都完成了
        console.log("TutorialManager: 所有教程步骤都已完成");
        this.completeTutorial();
    }

    /**
     * 完成当前步骤
     */
    public completeCurrentStep() {
        if (this.currentStep !== TutorialStep.NONE && !this.completedSteps.has(this.currentStep)) {
            this.completedSteps.add(this.currentStep);
            this.saveTutorialProgress();

            console.log(`TutorialManager: 完成教程步骤 ${this.currentStep}`);

            // 隐藏当前提示
            this.hideTutorialText();

            // 重置当前步骤
            this.currentStep = TutorialStep.NONE;

            // 检查是否教程全部完成
            if (this.completedSteps.has(TutorialStep.WIN_GUIDE)) {
                this.completeTutorial();
            }
        } else {
            console.log(`TutorialManager: 步骤 ${this.currentStep} 已完成或无效，跳过`);
        }
    }
    
    /**
     * 完成整个教程
     */
    private completeTutorial() {
        console.log("TutorialManager: 新手教程完成");
        localStorage.setItem('snake_tutorial_completed', 'true');

        // 播放完成音效
        if (this.audioManager) {
            this.audioManager.playSFX('win');
        }
    }
    
    /**
     * 显示教程文字
     */
    private showTutorialText() {
        if (this.tutorialTextNode) {
            this.tutorialTextNode.active = true;

            // 添加淡入动画
            const opacity = this.tutorialTextNode.getComponent(UIOpacity);
            if (opacity) {
                opacity.opacity = 0;
                tween(opacity)
                    .to(0.5, { opacity: 255 })
                    .start();
            }

            // 添加轻微的缩放动画吸引注意
            this.tutorialTextNode.setScale(0.8, 0.8, 1);
            tween(this.tutorialTextNode)
                .to(0.3, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }

    /**
     * 隐藏教程文字
     */
    private hideTutorialText() {
        if (this.tutorialTextNode) {
            const opacity = this.tutorialTextNode.getComponent(UIOpacity);
            if (opacity) {
                tween(opacity)
                    .to(0.3, { opacity: 0 })
                    .call(() => {
                        this.tutorialTextNode.active = false;
                    })
                    .start();
            } else {
                this.tutorialTextNode.active = false;
            }
        }
    }

    // ========== 外部调用接口 ==========

    /**
     * 触发移动教程检查
     */
    public onPlayerMoved() {
        if (this.currentStep === TutorialStep.MOVE_GUIDE && !this.completedSteps.has(TutorialStep.MOVE_GUIDE)) {
            this.completeCurrentStep();
            // 延迟显示下一步
            this.scheduleOnce(() => {
                this.showStep(TutorialStep.HOLD_MOVE_GUIDE);
            }, 1.0);
        }
    }

    /**
     * 触发长按移动教程检查
     */
    public onPlayerHoldMove() {
        if (this.currentStep === TutorialStep.HOLD_MOVE_GUIDE && !this.completedSteps.has(TutorialStep.HOLD_MOVE_GUIDE)) {
            this.completeCurrentStep();
            // 延迟显示下一步
            this.scheduleOnce(() => {
                this.showStep(TutorialStep.EAT_TILE_GUIDE);
            }, 1.0);
        }
    }

    /**
     * 触发吃牌教程检查
     */
    public onTileEaten() {
        if (this.currentStep === TutorialStep.EAT_TILE_GUIDE && !this.completedSteps.has(TutorialStep.EAT_TILE_GUIDE)) {
            this.completeCurrentStep();
            // 延迟显示下一步
            this.scheduleOnce(() => {
                this.showStep(TutorialStep.ATTACK_AI_GUIDE);
            }, 1.0);
        }
    }

    /**
     * 触发攻击AI教程检查
     */
    public onAIAttacked() {
        if (this.currentStep === TutorialStep.ATTACK_AI_GUIDE && !this.completedSteps.has(TutorialStep.ATTACK_AI_GUIDE)) {
            this.completeCurrentStep();
            // 延迟显示下一步
            this.scheduleOnce(() => {
                this.showStep(TutorialStep.COLLECT_14_GUIDE);
            }, 1.0);
        }
    }

    /**
     * 触发收集14张牌教程检查
     */
    public onHandCardsFull() {
        if (this.currentStep === TutorialStep.COLLECT_14_GUIDE && !this.completedSteps.has(TutorialStep.COLLECT_14_GUIDE)) {
            this.completeCurrentStep();
            // 延迟显示下一步
            this.scheduleOnce(() => {
                this.showStep(TutorialStep.DISCARD_GUIDE);
            }, 1.0);
        }
    }

    /**
     * 触发弃牌教程检查
     */
    public onCardDiscarded() {
        if (this.currentStep === TutorialStep.DISCARD_GUIDE && !this.completedSteps.has(TutorialStep.DISCARD_GUIDE)) {
            this.completeCurrentStep();
            // 延迟显示下一步
            this.scheduleOnce(() => {
                this.showStep(TutorialStep.OPEN_DISCARD_GUIDE);
            }, 1.0);
        }
    }

    /**
     * 触发打开弃牌弹窗教程检查
     */
    public onDiscardDialogOpened() {
        if (this.currentStep === TutorialStep.OPEN_DISCARD_GUIDE && !this.completedSteps.has(TutorialStep.OPEN_DISCARD_GUIDE)) {
            this.completeCurrentStep();
            // 延迟显示下一步
            this.scheduleOnce(() => {
                this.showStep(TutorialStep.WIN_GUIDE);
            }, 1.0);
        }
    }

    /**
     * 触发胡牌教程检查
     */
    public onPlayerWin() {
        if (this.currentStep === TutorialStep.WIN_GUIDE && !this.completedSteps.has(TutorialStep.WIN_GUIDE)) {
            this.completeCurrentStep();
        }
    }

    /**
     * 重置教程进度（用于测试）
     */
    public resetTutorial() {
        localStorage.removeItem('snake_tutorial_completed');
        localStorage.removeItem('snake_tutorial_progress');
        this.completedSteps.clear();
        this.currentStep = TutorialStep.NONE;
        console.log("TutorialManager: 教程进度已重置");
    }

    /**
     * 获取当前教程步骤
     */
    public getCurrentStep(): TutorialStep {
        return this.currentStep;
    }

    /**
     * 检查教程是否已完成
     */
    public isTutorialCompleted(): boolean {
        return localStorage.getItem('snake_tutorial_completed') === 'true';
    }

    onDestroy() {
        console.log("TutorialManager: 组件销毁");
    }
}
