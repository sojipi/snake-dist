import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 排行榜管理器 - 处理微信小游戏排行榜功能
 */
@ccclass('RankListManager')
export class RankListManager extends Component {
    private static instance: RankListManager = null!;
    
    public static getInstance(): RankListManager {
        return RankListManager.instance;
    }
    
    onLoad() {
        RankListManager.instance = this;
        console.log("RankListManager: 排行榜管理器初始化");
    }
    
    start() {
        
        this.showRankList();
    }

    
    /**
     * 更新用户排行榜数据
     */
    public updateUserRankData() {
        // 检查是否在微信环境中并且有需要的API
        if (typeof wx === 'undefined' || 
            typeof (wx as any).setUserCloudStorage !== 'function') {
            console.log("RankListManager: 非微信环境或缺少必要API，跳过更新用户数据");
            return;
        }
        
        try {
            // 获取当前用户的闯关进度
            const levelProgress = this.getCurrentLevelProgress();
            
            console.log("RankListManager: 更新用户排行榜数据", levelProgress);
            
            // 设置用户云存储
            (wx as any).setUserCloudStorage({
                KVDataList: [
                    {
                        key: 'currentLevel',
                        value: levelProgress.currentLevel.toString()
                    },
                    {
                        key: 'level',
                        value: levelProgress.level.toString()
                    },
                    {
                        key: 'totalStars',
                        value: levelProgress.totalStars.toString()
                    },
                    {
                        key: 'timestamp',
                        value: Date.now().toString()
                    }
                ],
                success: (res: any) => {
                    console.log("RankListManager: 用户云存储设置成功", res);
                },
                fail: (error: any) => {
                    console.error("RankListManager: 用户云存储设置失败", error);
                }
            });
        } catch (error) {
            console.error("RankListManager: 更新用户排行榜数据出错", error);
        }
    }
    
    /**
     * 获取当前用户的闯关进度
     */
    private getCurrentLevelProgress(): { currentLevel: number, level: number, totalStars: number } {
        try {
            // 从LevelDataManager获取实际数据
            const levelDataManager = this.getLevelDataManager();
            
            if (levelDataManager) {
                const currentLevel = levelDataManager.getCurrentLevel();
                const maxLevel = levelDataManager.getMaxUnlockedLevel();
                const totalStars = levelDataManager.getTotalStars();
                
                return {
                    currentLevel: currentLevel,
                    level: maxLevel,
                    totalStars: totalStars
                };
            } else {
                // 如果无法获取LevelDataManager，使用本地存储
                return this.getLevelProgressFromStorage();
            }
        } catch (error) {
            console.error("RankListManager: 获取闯关进度失败", error);
            return { currentLevel: 1, level: 1, totalStars: 0 };
        }
    }
    
    /**
     * 从本地存储获取闯关进度
     */
    private getLevelProgressFromStorage(): { currentLevel: number, level: number, totalStars: number } {
        try {
            let currentLevel = 1;
            let level = 1;
            let totalStars = 0;
            
            // 检查是否在微信环境中并且有需要的API
            if (typeof wx !== 'undefined' && 
                typeof (wx as any).getStorageSync === 'function') {
                // 微信环境
                currentLevel = parseInt((wx as any).getStorageSync('current_level') || '1');
                level = parseInt((wx as any).getStorageSync('max_unlocked_level') || '1');
                totalStars = parseInt((wx as any).getStorageSync('total_stars') || '0');
            } else {
                // 其他环境
                currentLevel = parseInt(localStorage.getItem('current_level') || '1');
                level = parseInt(localStorage.getItem('max_unlocked_level') || '1');
                totalStars = parseInt(localStorage.getItem('total_stars') || '0');
            }
            
            return { currentLevel, level, totalStars };
        } catch (error) {
            console.error("RankListManager: 从本地存储获取数据失败", error);
            return { currentLevel: 1, level: 1, totalStars: 0 };
        }
    }
    
    /**
     * 获取LevelDataManager实例
     */
    private getLevelDataManager(): any {
        try {
            // 尝试通过全局查找获取LevelDataManager实例
            // 在Cocos Creator中使用动态导入
            if (typeof window !== 'undefined' && (window as any).LevelDataManager) {
                return (window as any).LevelDataManager.getInstance();
            }
            
            // 尝试从场景中查找
            const canvas = this.node.scene?.getChildByName('Canvas');
            if (canvas) {
                const gameManagerNode = canvas.getChildByName('GameManager');
                if (gameManagerNode) {
                    const levelDataComponent = gameManagerNode.getComponent('LevelDataManager');
                    if (levelDataComponent) {
                        return levelDataComponent;
                    }
                }
            }
            
            console.warn("RankListManager: 无法获取LevelDataManager实例");
            return null;
        } catch (error) {
            console.warn("RankListManager: 无法获取LevelDataManager", error);
            return null;
        }
    }
    
    /**
     * 显示排行榜
     */
    public showRankList() {
        console.log("RankListManager: 开始显示排行榜，进行环境检查");
        
        // 使用统一的微信环境检查
        const wxCheck = this.checkWeChatEnvironment();
        
        if (!wxCheck.isWeChatEnv) {
            console.log("RankListManager: 非微信环境，显示模拟排行榜数据");
            // 创建模拟数据
            const mockData = [
                {
                    nickname: "玩家1",
                    level: 15,
                    currentLevel: 15,
                    totalStars: 45,
                    timestamp: Date.now(),
                    openid: "mock_player_1",
                    avatarUrl: ""
                },
                {
                    nickname: "玩家2", 
                    level: 12,
                    currentLevel: 12,
                    totalStars: 36,
                    timestamp: Date.now() - 100000,
                    openid: "mock_player_2",
                    avatarUrl: ""
                },
                {
                    nickname: "玩家3",
                    level: 10,
                    currentLevel: 10,
                    totalStars: 28,
                    timestamp: Date.now() - 200000,
                    openid: "mock_player_3",
                    avatarUrl: ""
                },
                {
                    nickname: "你",
                    level: 8,
                    currentLevel: 8,
                    totalStars: 22,
                    timestamp: Date.now() - 300000,
                    openid: "mock_current_user",
                    avatarUrl: ""
                }
            ];
            
            // 延迟显示，确保UI准备就绪
            setTimeout(() => {
                this.showRankListUI(mockData);
            }, 100);
            return;
        }
        
        if (!wxCheck.isAPIAvailable) {
            console.log("RankListManager: 微信环境但API不可用，显示空数据");
            console.log("RankListManager: 详细信息:", wxCheck.details);
            
            // 显示空数据的排行榜
            setTimeout(() => {
                this.showRankListUI([]);
            }, 100);
            return;
        }
        
        try {
            console.log("RankListManager: 微信环境和API都可用，开始正常流程");
            
            // 先更新用户数据
            this.updateUserRankData();
            
            // 延迟显示排行榜，确保数据已更新
            setTimeout(() => {
                this.displayRankListDialog();
            }, 500);
            
        } catch (error) {
            console.error("RankListManager: 显示排行榜失败", error);
        }
    }
    
    /**
     * 显示排行榜弹窗
     */
    private displayRankListDialog() {
        console.log("RankListManager: 开始检查微信环境和API可用性");
        
        // 详细的微信环境检查
        const wxCheck = this.checkWeChatEnvironment();
        if (!wxCheck.isWeChatEnv) {
            console.log("RankListManager: 非微信环境，使用空数据");
            this.processRankData([]);
            return;
        }
        
        if (!wxCheck.isAPIAvailable) {
            console.log("RankListManager: API不可用，使用空数据");
            this.processRankData([]);
            return;
        }
        
        try {
            console.log("RankListManager: 微信环境检查通过，开始获取好友排行榜数据");
            
            // 获取好友排行榜数据
            (wx as any).getFriendCloudStorage({
                keyList: [ 'currentLevel', 'level','totalStars', 'timestamp'],
                success: (res: any) => {
                    console.log("RankListManager: 获取好友排行榜数据成功", res);
                    this.processRankData(res.data);
                },
                fail: (error: any) => {
                    console.error("RankListManager: 获取好友排行榜数据失败", error);
                    // 显示空的排行榜
                    this.processRankData([]);
                }
            });
        } catch (error) {
            console.error("RankListManager: 显示排行榜弹窗失败", error);
        }
    }
    
    /**
     * 检查微信环境和API可用性
     */
    private checkWeChatEnvironment(): { isWeChatEnv: boolean, isAPIAvailable: boolean, details: any } {
        const result = {
            isWeChatEnv: false,
            isAPIAvailable: false,
            details: {
                hasWxObject: false,
                wxType: 'undefined',
                hasGetFriendCloudStorage: false,
                systemInfo: null,
                baseLibraryVersion: 'unknown',
                isOpenDataContext: false
            }
        };
        
        try {
            // 检查 wx 对象是否存在
            result.details.hasWxObject = typeof wx !== 'undefined';
            if (result.details.hasWxObject) {
                result.details.wxType = typeof wx;
                result.isWeChatEnv = true;
                
                console.log("RankListManager: 检测到微信环境");
                
                // 获取系统信息
                if (typeof (wx as any).getSystemInfoSync === 'function') {
                    try {
                        const systemInfo = (wx as any).getSystemInfoSync();
                        result.details.systemInfo = systemInfo;
                        result.details.baseLibraryVersion = systemInfo.SDKVersion || 'unknown';
                        
                        console.log("RankListManager: 系统信息", {
                            version: systemInfo.version,
                            SDKVersion: systemInfo.SDKVersion,
                            platform: systemInfo.platform,
                            system: systemInfo.system
                        });
                        
                        // 检查基础库版本 (需要 >= 1.9.92)
                        if (this.compareVersion(systemInfo.SDKVersion, '1.9.92') >= 0) {
                            console.log("RankListManager: 基础库版本满足要求 (>= 1.9.92)");
                        } else {
                            console.warn(`RankListManager: 基础库版本过低 (${systemInfo.SDKVersion} < 1.9.92)`);
                        }
                        
                    } catch (sysError) {
                        console.error("RankListManager: 获取系统信息失败", sysError);
                    }
                }
                
                // 检查是否在开放数据域
                if (typeof (wx as any).getOpenDataContext === 'function') {
                    try {
                        const openDataContext = (wx as any).getOpenDataContext();
                        result.details.isOpenDataContext = !!openDataContext;
                        console.log("RankListManager: 开放数据域状态:", result.details.isOpenDataContext);
                    } catch (odcError) {
                        console.warn("RankListManager: 检查开放数据域失败", odcError);
                    }
                }
                
                // 检查 getFriendCloudStorage API 是否可用
                result.details.hasGetFriendCloudStorage = typeof (wx as any).getFriendCloudStorage === 'function';
                
                if (result.details.hasGetFriendCloudStorage) {
                    console.log("RankListManager: getFriendCloudStorage API 可用");
                    result.isAPIAvailable = true;
                } else {
                    console.warn("RankListManager: getFriendCloudStorage API 不可用");
                    console.warn("RankListManager: 可能原因:");
                    console.warn("  1. 基础库版本过低 (需要 >= 1.9.92)");
                    console.warn("  2. 不在开放数据域中");
                    console.warn("  3. 缺少用户授权 scope.WxFriendInteraction");
                }
                
                // 检查其他相关 API
                const otherAPIs = [
                    'setUserCloudStorage',
                    'getUserCloudStorage', 
                    'getUserInfo',
                    'authorize'
                ];
                
                console.log("RankListManager: 其他微信API可用性检查:");
                otherAPIs.forEach(api => {
                    const available = typeof (wx as any)[api] === 'function';
                    console.log(`  ${api}: ${available ? '可用' : '不可用'}`);
                });
                
            } else {
                console.log("RankListManager: 未检测到微信环境 (wx 对象不存在)");
            }
            
        } catch (error) {
            console.error("RankListManager: 环境检查过程出错", error);
        }
        
        console.log("RankListManager: 环境检查结果", result);
        return result;
    }
    
    /**
     * 比较版本号
     * @param version1 版本号1
     * @param version2 版本号2
     * @returns 如果 version1 > version2 返回1，相等返回0，小于返回-1
     */
    private compareVersion(version1: string, version2: string): number {
        try {
            const v1parts = version1.split('.').map(Number);
            const v2parts = version2.split('.').map(Number);
            
            const maxLength = Math.max(v1parts.length, v2parts.length);
            
            for (let i = 0; i < maxLength; i++) {
                const v1part = v1parts[i] || 0;
                const v2part = v2parts[i] || 0;
                
                if (v1part > v2part) return 1;
                if (v1part < v2part) return -1;
            }
            
            return 0;
        } catch (error) {
            console.error("RankListManager: 版本号比较失败", error);
            return -1; // 比较失败时返回-1，表示版本过低
        }
    }
    
    /**
     * 处理排行榜数据
     */
    private processRankData(rawData: any[]) {
        try {
            console.log("RankListManager: 处理排行榜数据", rawData);
            
            // 处理和排序数据
            const rankData = rawData.map(item => {
                const userData = {
                    openid: item.openid,
                    nickname: item.nickname || '匿名玩家',
                    avatarUrl: item.avatarUrl || '',
                    level: 1,
                    currentLevel: 1,
                    totalStars: 0,
                    timestamp: 0
                };
                
                // 解析KV数据
                if (item.KVDataList) {
                    item.KVDataList.forEach((kv: any) => {
                        switch (kv.key) {
                            case 'level':
                                userData.level = parseInt(kv.value) || 1;
                                break;
                            case 'currentLevel':
                                userData.currentLevel = parseInt(kv.value) || 1;
                                break;
                            case 'totalStars':
                                userData.totalStars = parseInt(kv.value) || 0;
                                break;
                            case 'timestamp':
                                userData.timestamp = parseInt(kv.value) || 0;
                                break;
                        }
                    });
                }
                
                return userData;
            });
            
            // 按最大关卡排序，然后按总星数排序
            rankData.sort((a, b) => {
                if (a.level !== b.level) {
                    return b.level - a.level;
                }
                return b.totalStars - a.totalStars;
            });
            
            console.log("RankListManager: 排序后的排行榜数据", rankData);
            
            // 显示排行榜UI
            this.showRankListUI(rankData);
            
        } catch (error) {
            console.error("RankListManager: 处理排行榜数据失败", error);
        }
    }
    
    /**
     * 显示排行榜UI
     */
    private showRankListUI(rankData: any[]) {
        try {
            console.log("RankListManager: 尝试显示排行榜UI，数据长度:", rankData.length);
            
            // 获取或创建排行榜弹窗
            const rankListDialog = this.getRankListDialog();
            if (rankListDialog) {
                console.log("RankListManager: 找到排行榜弹窗组件，开始显示数据");
                rankListDialog.showRankList(rankData);
            } else {
                console.error("RankListManager: 无法获取排行榜弹窗组件，尝试创建或查找");
                // 尝试延迟重试
                setTimeout(() => {
                    const retryDialog = this.getRankListDialog();
                    if (retryDialog) {
                        console.log("RankListManager: 重试成功，找到排行榜弹窗组件");
                        retryDialog.showRankList(rankData);
                    } else {
                        console.error("RankListManager: 重试失败，仍无法找到排行榜弹窗组件");
                        // 在控制台输出排行榜数据作为备选方案
                        this.logRankDataToConsole(rankData);
                    }
                }, 200);
            }
        } catch (error) {
            console.error("RankListManager: 显示排行榜UI失败", error);
        }
    }
    
    /**
     * 获取排行榜弹窗组件
     */
    private getRankListDialog(): any {
        try {
            // 尝试从场景中查找排行榜弹窗
            const canvas = this.node.scene?.getChildByName('Canvas');
            if (canvas) {
                console.log("RankListManager: 找到Canvas节点");
                
                // 尝试多种可能的节点名称
                const possibleNames = ['RankListDialog', 'RankDialog', 'RankList'];
                
                for (const name of possibleNames) {
                    const rankListNode = canvas.getChildByName(name);
                    if (rankListNode) {
                        console.log(`RankListManager: 找到排行榜节点: ${name}`);
                        const component = rankListNode.getComponent('RankListDialog');
                        if (component) {
                            console.log("RankListManager: 找到排行榜组件");
                            return component;
                        } else {
                            console.warn(`RankListManager: 节点 ${name} 存在但缺少 RankListDialog 组件`);
                        }
                    }
                }
                
                // 尝试递归查找
                const foundNode = this.findNodeRecursively(canvas, 'RankListDialog');
                if (foundNode) {
                    console.log("RankListManager: 通过递归查找找到排行榜节点");
                    const component = foundNode.getComponent('RankListDialog');
                    if (component) {
                        return component;
                    }
                }
            } else {
                console.warn("RankListManager: 未找到Canvas节点");
            }
            
            console.warn("RankListManager: 未找到排行榜弹窗，需要先创建");
            return null;
        } catch (error) {
            console.error("RankListManager: 获取排行榜弹窗失败", error);
            return null;
        }
    }
    
    /**
     * 当关卡完成时调用，更新排行榜数据
     */
    public onLevelCompleted(level: number, stars: number) {
        console.log(`RankListManager: 关卡完成 - 关卡${level}, 星数${stars}`);
        
        // 延迟更新，确保LevelDataManager已经保存了数据
        setTimeout(() => {
            this.updateUserRankData();
        }, 100);
    }
    
    /**
     * 递归查找节点
     */
    private findNodeRecursively(parent: Node, targetName: string): Node | null {
        try {
            // 检查当前节点
            if (parent.name === targetName) {
                return parent;
            }
            
            // 递归检查子节点
            for (let i = 0; i < parent.children.length; i++) {
                const child = parent.children[i];
                const found = this.findNodeRecursively(child, targetName);
                if (found) {
                    return found;
                }
            }
            
            return null;
        } catch (error) {
            console.error("RankListManager: 递归查找节点失败", error);
            return null;
        }
    }
    
    /**
     * 输出排行榜数据到控制台（备选方案）
     */
    private logRankDataToConsole(rankData: any[]) {
        console.log("========== 排行榜数据 ==========");
        console.log("排名 | 昵称 | 最高关卡 | 总星数");
        console.log("-----|------|----------|-------");
        
        rankData.forEach((userData, index) => {
            const rank = index + 1;
            const nickname = userData.nickname || '匿名玩家';
            const level = userData.level || 1;
            const totalStars = userData.totalStars || 0;
            
            // 使用简单的字符串格式化，避免使用padStart和padEnd
            const rankStr = rank.toString();
            const levelStr = `第${level}关`;
            const starsStr = `${totalStars}★`;
            
            console.log(`${rankStr} | ${nickname} | ${levelStr} | ${starsStr}`);
        });
        
        console.log("===============================");
        console.log("提示：由于无法找到排行榜UI组件，数据已在控制台显示");
    }
}