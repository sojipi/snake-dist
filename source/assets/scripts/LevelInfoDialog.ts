import { _decorator, Component, Node, Label, Button, tween, Vec3, Prefab, instantiate, Layout, Color, UITransform, director, find } from 'cc';
import { GameManager } from './GameManager';
import { MahjongTile } from './MahjongTile';
import { AudioManager } from './AudioManager';
import { TutorialManager } from './TutorialManager';
import { LevelSelectManager } from './LevelSelectManager';
import { ENUM_MAHJONG_YAKU } from './Enum';
const { ccclass, property } = _decorator;

// 关卡信息数据结构
interface LevelInfo {
    name: string;
    description: string;
    exampleTiles: number[];
}

@ccclass('LevelInfoDialog')
export class LevelInfoDialog extends Component {
    
    @property(Node)
    dialogPanel: Node = null!;
    
    @property(Label)
    levelNameLabel: Label = null!;
    
    @property(Label)
    levelDescLabel: Label = null!;
    
    @property(Node)
    exampleTilesContainer: Node = null!;
    
    @property(Node)
    discardedTilesContainer: Node = null!;
    
    @property(Layout)
    exampleTilesLayout: Layout = null!;
    
    @property(Layout)
    discardedTilesLayout: Layout = null!;
    
    @property(Button)
    closeButton: Button = null!;
    
    @property(Button)
    resumeButton: Button = null!;

    @property(Button)
    resetTutorialButton: Button = null!;

    @property(Prefab)
    miniTilePrefab: Prefab = null!;
    
    @property(Label)
    discardHistoryLabel: Label = null!;
    
    onLoad() {
        // 绑定按钮事件
        if (this.closeButton) {
            this.closeButton.node.on(Button.EventType.CLICK, this.onCloseButtonClick, this);
        }
        
        if (this.resumeButton) {
            this.resumeButton.node.on(Button.EventType.CLICK, this.onResumeButtonClick, this);
        }

        if (this.resetTutorialButton) {
            this.resetTutorialButton.node.on(Button.EventType.CLICK, this.onResetTutorialClick, this);
        }
        
        // 初始状态隐藏
        this.node.active = false;
        
        console.log("关卡信息弹窗初始化完成");
    }
    
    private onCloseButtonClick() {
        console.log("点击关闭按钮");
        this.hideDialog();
    }
    
    private onResumeButtonClick() {
        console.log("点击返回按钮，退回到关卡选择场景");

        // 播放点击音效
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }

        // 返回到LevelScene
        this.returnToLevelScene();
    }

    private onResetTutorialClick() {
        console.log("点击重置教程按钮");

        // 播放点击音效
        const audioManager = AudioManager.getInstance();
        if (audioManager) {
            audioManager.playSFX('click');
        }

        // 重置教程状态
        this.resetTutorialState();
    }

    /**
     * 重置教程状态
     */
    private resetTutorialState() {
        console.log("LevelInfoDialog: 开始重置教程状态");

        try {
            // 清除本地存储的教程状态
            localStorage.removeItem('snake_tutorial_completed');
            localStorage.removeItem('snake_tutorial_progress');

            // 查找TutorialManager并重置
            const tutorialManager = find('Canvas')?.getComponentInChildren(TutorialManager);
            if (tutorialManager) {
                tutorialManager.resetTutorial();
                console.log("LevelInfoDialog: TutorialManager状态已重置");
            } else {
                console.log("LevelInfoDialog: 未找到TutorialManager组件");
            }

            console.log("LevelInfoDialog: 教程状态重置完成");

            // 可选：显示重置成功的提示
            // 这里可以添加一个简单的提示文本或者弹窗

        } catch (error) {
            console.error("LevelInfoDialog: 重置教程状态时发生错误:", error);
        }
    }

    /**
     * 触发打开弃牌弹窗教程
     */
    private triggerOpenDiscardGuide() {
        try {
            // 查找TutorialManager并触发教程
            const tutorialManager = find('Canvas')?.getComponentInChildren(TutorialManager);
            if (tutorialManager) {
                tutorialManager.onDiscardDialogOpened();
                console.log("LevelInfoDialog: 触发打开弃牌弹窗教程");
            }
        } catch (error) {
            console.error("LevelInfoDialog: 触发教程时发生错误:", error);
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
     * 显示微信原生模板广告
     */
    private showWechatCustomAd() {
        // 查找LevelSelectManager实例并显示广告
        const canvas = find('Canvas');
        if (canvas) {
            const levelSelectManager = canvas.getComponentInChildren(LevelSelectManager);
            if (levelSelectManager) {
                levelSelectManager.showCustomAd();
            }
        }
    }

    public showDialog() {
        console.log("显示关卡信息弹窗");
        
        // 获取当前关卡信息
        this.loadLevelInfo();
        
        // 暂停游戏
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            gameManager.pauseGame();
        }
        
        // 显示弹窗
        this.node.active = true;

        // 触发教程：打开关卡信息弹窗
        this.triggerOpenDiscardGuide();

        // 播放弹出动画
        this.playShowAnimation();
    }
    
    public hideDialog() {
        console.log("隐藏关卡信息弹窗");
        
        // 播放隐藏动画
        this.playHideAnimation(() => {
            this.node.active = false;
            
            // 恢复游戏
            const gameManager = GameManager.getInstance();
            if (gameManager) {
                gameManager.resumeGame();

                // 显示广告
                if (typeof (gameManager as any).showCustomAd === 'function') {
                    (gameManager as any).showCustomAd();
                }
            }
        });
    }
    
    // 🔥 新增：隐藏广告
    private hideCustomAd() {
        // 查找GameManager实例并隐藏广告
        const gameManager = GameManager.getInstance();
        if (gameManager) {
            (gameManager as any).hideCustomAd();
        }
    }
    
    private loadLevelInfo() {
        const gameManager = GameManager.getInstance();
        if (!gameManager) {
            console.error("GameManager未找到");
            return;
        }
        
        // 获取当前关卡配置
        const levelConfig = gameManager.getCurrentLevelConfig();
        if (!levelConfig) {
            console.error("当前关卡配置未找到");
            return;
        }
        
        // 设置关卡名称和描述
        if (this.levelNameLabel) {
            this.levelNameLabel.string = levelConfig.name || "未知关卡";
        }
        
        if (this.levelDescLabel) {
            this.levelDescLabel.string = levelConfig.description || "暂无描述";
        }
        
        // 获取示例牌型
        const exampleTiles = this.getExampleTiles(levelConfig.targetYaku);
        this.displayExampleTiles(exampleTiles);
        
        // 🔥 获取统一弃牌区的所有弃牌（包括AI角色）
        const discardArea = gameManager.getDiscardArea();
        this.displayDiscardHistory(discardArea);
    }
    
    private getExampleTiles(targetYaku: string): number[] {
        // 根据目标役种返回示例牌型
        // 这里使用您提供的示例数据
        let exampleTiles: number[] = [];
        switch (targetYaku) {
            case ENUM_MAHJONG_YAKU.YAKUHAI:
                // 役牌示例：包含风牌（东）和三元牌（中）的刻子
                exampleTiles = [31, 31, 31, 19, 19, 19, 2, 3, 4, 5, 6, 7, 8, 8];
                break;
            case ENUM_MAHJONG_YAKU.TANYAO:
                // 断幺九示例：不包含字牌和幺九牌（1和9）的和牌
                exampleTiles = [2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6, 7, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.PINFU:
                // 平和示例：由四组顺子和一对雀头组成，且没有役牌的雀头
                exampleTiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.IPEKO:
                // 一杯口示例：包含两组完全相同的顺子
                exampleTiles = [1, 2, 3, 1, 2, 3, 7, 8, 9, 10, 11, 12, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.TOITOI:
                // 对对和示例：由四组刻子和一对雀头组成
                exampleTiles = [1, 1, 1, 4, 4, 4, 7, 7, 7, 10, 10, 10, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.HONROTO:
                // 混老头示例：所有牌都是幺九牌（1和9）或字牌
                exampleTiles = [1, 1, 1, 9, 9, 9, 31, 31, 31, 32, 32, 32, 1, 1];
                break;
            case ENUM_MAHJONG_YAKU.SANSHOKU:
                // 三色同顺示例：包含三种花色的相同数字顺子
                exampleTiles = [1, 2, 3, 10, 11, 12, 22, 23, 24, 7, 8, 9, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.ITTSU:
                // 一气通贯示例：同一花色的123、456、789三组顺子
                exampleTiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.CHANTA:
                // 混全带幺九示例：每组面子和雀头都必须包含幺九牌或字牌
                exampleTiles = [1, 2, 3, 7, 8, 9, 31, 31, 31, 9, 9, 9, 1, 1];
                break;
            case ENUM_MAHJONG_YAKU.RYANPEKO:
                // 两杯口示例：包含两对完全相同的顺子
                exampleTiles = [1, 2, 3, 1, 2, 3, 7, 8, 9, 7, 8, 9, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.TSUISO:
                // 字一色示例：所有牌都是字牌
                exampleTiles = [31, 31, 31, 32, 32, 32, 33, 33, 33, 34, 34, 34, 19, 19];
                break;
            case ENUM_MAHJONG_YAKU.CHINROTO:
                // 清老头示例：所有牌都是幺九牌（1和9），不能包含字牌
                exampleTiles = [1, 1, 1, 9, 9, 9, 10, 10, 10, 18, 18, 18, 1, 1];
                break;
            case ENUM_MAHJONG_YAKU.SHOSANGEN:
                // 小三元示例：包含两组三元牌的刻子和一对三元牌的雀头
                exampleTiles = [1, 1, 1, 2, 3, 4, 19, 19, 19, 20, 20, 20, 21, 21];
                break;
            case ENUM_MAHJONG_YAKU.DAISANGEN:
                // 大三元示例：包含三组三元牌的刻子
                exampleTiles = [1, 1, 1, 31, 31, 19, 19, 19, 20, 20, 20, 21, 21, 21];
                break;
            case ENUM_MAHJONG_YAKU.SANSHOKU_KOKU:
                // 三色同刻示例：包含三种花色的相同数字刻子
                exampleTiles = [1, 1, 1, 10, 10, 10, 22, 22, 22, 7, 8, 9, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.YISE_SANTOUSU:
                // 一色三同顺示例：同一花色的三组完全相同的顺子
                exampleTiles = [1, 2, 3, 1, 2, 3, 1, 2, 3, 7, 8, 9, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.YISE_SISANTOUSU:
                // 一色四同顺示例：同一花色的四组完全相同的顺子
                exampleTiles = [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.HONGKONG:
                // 红孔雀示例：只包含索子的1579，且必须包含中
                exampleTiles = [10, 10, 10, 14, 14, 14, 16, 16, 16, 18, 18, 18, 19, 19];
                break;
            case ENUM_MAHJONG_YAKU.HONGYI_DIAN:
                // 红一点示例：只包含索子的23468，且必须包含中
                exampleTiles = [11, 11, 11, 13, 13, 13, 15, 15, 15, 17, 17, 17, 19, 19];
                break;
            case ENUM_MAHJONG_YAKU.HEIYI_SE:
                // 黑一色示例：只包含筒子的248，和东南西北
                exampleTiles = [2, 2, 2, 4, 4, 4, 8, 8, 8, 31, 31, 31, 32, 32];
                break;
            case ENUM_MAHJONG_YAKU.DACHELUN:
                // 大车轮示例：筒子2-8组成的七对子
                exampleTiles = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8];
                break;
            case ENUM_MAHJONG_YAKU.SHISANBUDA:
                // 十三不搭示例：13张牌都不相邻、不相关，有一组雀头
                exampleTiles = [1, 5, 9, 10, 14, 18, 22, 26, 30, 31, 31, 32, 33, 34];
                break;
            case ENUM_MAHJONG_YAKU.DASHULIN:
                // 大树邻示例：万子2-8组成的七对子
                exampleTiles = [23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29];
                break;
            case ENUM_MAHJONG_YAKU.DADALIN:
                // 大竹林示例：条子2-8组成的七对子
                exampleTiles = [11, 11, 12, 12, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17];
                break;
            case ENUM_MAHJONG_YAKU.BAIWANSHI:
                // 百万石示例：全是万子，数牌之和>=100
                exampleTiles = [27, 27, 27, 28, 28, 28, 29, 29, 29, 30, 30, 30, 26, 26];
                break;
            case ENUM_MAHJONG_YAKU.DONGBEI_XINGANXIAN:
                // 东北新干线示例：包含东、北、同花色牌的1-9
                exampleTiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 34, 34, 34, 31, 31];
                break;
            case ENUM_MAHJONG_YAKU.JINMENQIAO:
                // 金门桥示例：包含同花色的123，345，567，789
                exampleTiles = [1, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8, 9, 31, 31];
                break;
            case ENUM_MAHJONG_YAKU.WUMENQI:
                // 五门齐示例：包含饼子、条子、万子、风牌、三元牌
                exampleTiles = [1, 2, 3, 10, 11, 12, 22, 23, 24, 31, 31, 31, 19, 19];
                break;
            case ENUM_MAHJONG_YAKU.SANSEITSU:
                // 三色通贯示例：三种花色的123、456、789顺子
                exampleTiles = [1, 2, 3, 13, 14, 15, 28, 29, 30, 7, 8, 9, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.SANANKO:
                // 三暗刻示例：三个暗刻（没有副露的刻子）和一个顺子，以及一对雀头
                exampleTiles = [1, 1, 1, 4, 4, 4, 7, 7, 7, 2, 3, 4, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.SISANLIANKE:
                // 四连刻示例：四个连续的刻子
                exampleTiles = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.SANLIANKE:
                // 三连刻示例：三个连续的刻子
                exampleTiles = [1, 1, 1, 2, 2, 2, 3, 3, 3, 10, 11, 12, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.JUNCHAN:
                // 纯全带幺九示例：每组面子和雀头都必须包含幺九牌，不能包含字牌
                exampleTiles = [1, 2, 3, 7, 8, 9, 10, 11, 12, 18, 18, 18, 1, 1];
                break;
            case ENUM_MAHJONG_YAKU.HONITSU:
                // 混一色示例：所有牌都是同一花色或字牌
                exampleTiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 31, 31, 31, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.CHINITSU:
                // 清一色示例：所有牌都是同一花色，不能包含字牌
                exampleTiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.KOKUSHI:
                // 国士无双示例：包含所有幺九牌和字牌，且其中一种有对子
                exampleTiles = [1, 9, 10, 18, 22, 30, 31, 32, 33, 34, 19, 20, 21, 1];
                break;
            case ENUM_MAHJONG_YAKU.KOKUSHI_SHISANMIAN:
                // 国士无双十三面示例：包含所有幺九牌和字牌，且其中一种有对子
                exampleTiles = [1, 9, 10, 18, 22, 30, 31, 32, 33, 34, 19, 20, 21, 1];
                break;
            case ENUM_MAHJONG_YAKU.SUANKO:
                // 四暗刻示例：四个暗刻（没有副露的刻子）
                exampleTiles = [1, 1, 1, 4, 4, 4, 7, 7, 7, 10, 10, 10, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.SUANKO_DANQI:
                // 四暗刻单骑示例：四个暗刻，且雀头是单张
                exampleTiles = [1, 1, 1, 4, 4, 4, 7, 7, 7, 10, 10, 10, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.TENHO:
                // 天和示例：摸齐14张牌直接胡
                exampleTiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.CHIHO:
                // 地和示例：闲家自摸和牌
                exampleTiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.DAISUSHI:
                // 大四喜示例：包含所有风牌的刻子
                exampleTiles = [31, 31, 31, 32, 32, 32, 33, 33, 33, 34, 34, 34, 5, 5];
                break;
            case ENUM_MAHJONG_YAKU.SHOSUSHI:
                // 小四喜示例：包含三个风牌的刻子和一对风牌的雀头
                exampleTiles = [31, 31, 31, 32, 32, 32, 33, 33, 33, 34, 34, 28, 29, 30];
                break;
            case ENUM_MAHJONG_YAKU.RYUISO:
                // 绿一色示例：只包含条子23468和发
                exampleTiles = [11, 12, 13, 17, 17, 17, 15, 15, 15, 20, 20, 20, 12, 12];
                break;
            case ENUM_MAHJONG_YAKU.DASIXING:
                // 大七星示例：包含所有字牌的七对子
                exampleTiles = [31, 31, 32, 32, 33, 33, 34, 34, 19, 19, 20, 20, 21, 21];
                break;
            case ENUM_MAHJONG_YAKU.WUFA_LVYISE:
                // 无发绿一色示例：只包含条子23468
                exampleTiles = [11, 12, 13, 11, 12, 13, 15, 15, 15, 17, 17, 17, 11, 11];
                break;
            case ENUM_MAHJONG_YAKU.CHURENPOTO:
                // 九莲宝灯示例：同一花色的1112345678999加任意一张同花色牌
                exampleTiles = [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 3];
                break;
            case ENUM_MAHJONG_YAKU.CHURENPOTO_ZHENZHENG:
                // 纯正九莲宝灯示例：同一花色的1112345678999,最后九面听
                exampleTiles = [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 5];
                break;
            case ENUM_MAHJONG_YAKU.CHITOITSU:
                // 七对子示例：由7个对子组成
                exampleTiles = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7];
                break;
            default:
                // 默认示例
                exampleTiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4, 5];
        }
        return exampleTiles;
    }
    
    private displayExampleTiles(tileNumbers: number[]) {
        if (!this.exampleTilesContainer || !this.miniTilePrefab) {
            console.error("示例牌型容器或预制体未设置");
            return;
        }
        
        // 清空现有的牌
        this.exampleTilesContainer.removeAllChildren();
        
        // 创建示例牌
        for (const tileNum of tileNumbers) {
            const tileNode = this.createMiniTile(tileNum);
            if (tileNode) {
                this.exampleTilesContainer.addChild(tileNode);
            }
        }
        
        // 更新布局
        if (this.exampleTilesLayout) {
            this.exampleTilesLayout.updateLayout();
        }
        
        console.log(`显示示例牌型，共${tileNumbers.length}张牌`);
    }
    
    private displayDiscardHistory(discardArea: { tileType: string, characterId: string }[]) {
        if (!this.discardedTilesContainer || !this.miniTilePrefab) {
            console.error("弃牌历史容器或预制体未设置");
            return;
        }
        
        // 清空现有的牌
        this.discardedTilesContainer.removeAllChildren();
        
        // 设置弃牌历史标题
        if (this.discardHistoryLabel) {
            this.discardHistoryLabel.string = `弃牌历史 (共${discardArea.length}张)`;
        }
        
        // 🔥 统计每种牌型的数量和角色信息
        const tileCountMap = new Map<number, { count: number, characters: Set<string> }>();
        
        for (const item of discardArea) {
            const tileNum = parseInt(item.tileType);
            if (!isNaN(tileNum)) {
                const existing = tileCountMap.get(tileNum);
                if (existing) {
                    existing.count++;
                    existing.characters.add(item.characterId);
                } else {
                    tileCountMap.set(tileNum, { count: 1, characters: new Set([item.characterId]) });
                }
            }
        }
        
        // 🔥 创建唯一牌型的节点，并在右上角显示数量
        for (const [tileNum, info] of tileCountMap) {
            const tileNode = this.createMiniTile(tileNum);
            if (tileNode) {
                // 🔥 修复：先添加到容器，确保节点层级正确
                this.discardedTilesContainer.addChild(tileNode);
                
                // 🔥 简化：使用预制体中的CountLabel
                console.log(`弃牌区：创建牌型${tileNum}，数量${info.count}，角色: ${Array.from(info.characters).join(', ')}`);
                
                // 🔥 查找预制体中的CountLabel节点
                const countLabel = tileNode.getChildByName('CountLabel');
                if (countLabel) {
                    // 🔥 查找CountLabel的子节点中的Label组件
                    let labelComp: Label | null = null;
                    
                    // 先尝试在CountLabel本身查找Label组件
                    labelComp = countLabel.getComponent(Label);
                    
                    // 如果没找到，遍历子节点查找Label组件
                    if (!labelComp) {
                        for (let i = 0; i < countLabel.children.length; i++) {
                            const child = countLabel.children[i];
                            labelComp = child.getComponent(Label);
                            if (labelComp) {
                                console.log(`弃牌区：在子节点"${child.name}"中找到Label组件`);
                                break;
                            }
                        }
                    }
                    
                    if (labelComp) {
                        // 设置数量文本
                        labelComp.string = info.count.toString();
                        
                        // 只有数量大于1时才显示
                        if (info.count > 1) {
                            countLabel.active = true;
                            console.log(`弃牌区：显示数量标记，牌型${tileNum}，数量${info.count}`);
                        } else {
                            countLabel.active = false;
                            console.log(`弃牌区：隐藏数量标记，牌型${tileNum}，数量为1`);
                        }
                    } else {
                        console.warn(`弃牌区：在CountLabel及其子节点中都未找到Label组件`);
                        console.warn(`弃牌区：CountLabel子节点列表:`, countLabel.children.map(child => child.name));
                    }
                } else {
                    console.warn(`弃牌区：预制体中未找到CountLabel节点`);
                }
            }
        }
        
        // 更新布局
        if (this.discardedTilesLayout) {
            this.discardedTilesLayout.updateLayout();
        }
        
        console.log(`显示弃牌历史，共${tileCountMap.size}种不同牌型，总计${discardArea.length}张牌`);
    }
    
    private createMiniTile(tileNumber: number): Node | null {
        if (!this.miniTilePrefab) {
            return null;
        }
        
        const tileNode = instantiate(this.miniTilePrefab);
        const mahjongTile = tileNode.getComponent(MahjongTile);
        
        if (mahjongTile) {
            // 禁用自动初始化
            (mahjongTile as any).autoInitRandomTile = false;
            
            // 设置为正面显示
            if (typeof (mahjongTile as any).setFrontSide === 'function') {
                (mahjongTile as any).setFrontSide();
            }
            
            // 强制设置牌型
            if (typeof (mahjongTile as any).forceSetTileType === 'function') {
                (mahjongTile as any).forceSetTileType(tileNumber);
            }
            
            // 设置较小的缩放
            tileNode.setScale(0.6, 0.6, 1);
        }
        
        return tileNode;
    }
    
    private playShowAnimation() {
        if (!this.dialogPanel) return;
        
        // 初始状态：面板缩小到0
        this.dialogPanel.setScale(0, 0, 1);
        
        // 弹出动画：从0缩放到1，带弹性效果
        tween(this.dialogPanel)
            .to(0.3, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'backOut' })
            .to(0.1, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }
    
    private playHideAnimation(callback?: () => void) {
        if (!this.dialogPanel) {
            if (callback) callback();
            return;
        }
        
        // 隐藏动画：缩小到0
        tween(this.dialogPanel)
            .to(0.2, { scale: new Vec3(0, 0, 1) }, { easing: 'backIn' })
            .call(() => {
                if (callback) {
                    callback();
                }
            })
            .start();
    }


    onDestroy() {
        // 清理按钮事件监听
        if (this.closeButton && this.closeButton.node) {
            this.closeButton.node.off(Button.EventType.CLICK, this.onCloseButtonClick, this);
        }
        
        if (this.resumeButton && this.resumeButton.node) {
            this.resumeButton.node.off(Button.EventType.CLICK, this.onResumeButtonClick, this);
        }

        if (this.resetTutorialButton && this.resetTutorialButton.node) {
            this.resetTutorialButton.node.off(Button.EventType.CLICK, this.onResetTutorialClick, this);
        }
    }
} 