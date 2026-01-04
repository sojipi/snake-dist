import { _decorator, Component, Node, Button, Label } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 微信环境检测测试脚本
 * 用于详细检测微信环境和API可用性，帮助调试问题
 */
@ccclass('WeChatEnvironmentTest')
export class WeChatEnvironmentTest extends Component {
    
    @property(Button)
    testButton: Button = null!;
    
    @property(Label)
    resultLabel: Label = null!;
    
    @property({ multiline: true })
    detailText: Label = null!;
    
    onLoad() {
        console.log("WeChatEnvironmentTest: 微信环境检测测试脚本初始化");
        this.initUI();
    }
    
    start() {
        this.updateResult("点击按钮开始微信环境检测");
        // 自动执行一次检测
        this.scheduleOnce(() => {
            this.performEnvironmentCheck();
        }, 1);
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
        console.log("WeChatEnvironmentTest: 开始微信环境检测");
        this.updateResult("正在检测微信环境...");
        this.performEnvironmentCheck();
    }
    
    /**
     * 执行环境检测
     */
    private performEnvironmentCheck() {
        console.log("WeChatEnvironmentTest: ===== 微信环境全面检测开始 =====");
        
        const checkResult = this.performDetailedCheck();
        this.displayResults(checkResult);
        
        console.log("WeChatEnvironmentTest: ===== 微信环境全面检测结束 =====");
    }
    
    /**
     * 执行详细检测
     */
    private performDetailedCheck(): any {
        const result: any = {
            timestamp: new Date().toLocaleString(),
            environment: {
                hasWxObject: false,
                wxType: 'undefined',
                userAgent: '',
                isWeChatBrowser: false
            },
            systemInfo: null,
            baseLibrary: {
                version: 'unknown',
                isSupported: false,
                requiredVersion: '1.9.92'
            },
            apis: {
                basic: {},
                storage: {},
                social: {},
                openData: {}
            },
            context: {
                isOpenDataContext: false,
                openDataContextInfo: null
            },
            authorization: {
                hasAuthAPI: false,
                scopes: []
            },
            error: null
        };
        
        try {
            // 1. 基础环境检测
            console.log("WeChatEnvironmentTest: 1. 基础环境检测");
            this.checkBasicEnvironment(result);
            
            // 2. 系统信息检测
            console.log("WeChatEnvironmentTest: 2. 系统信息检测");
            this.checkSystemInfo(result);
            
            // 3. API可用性检测
            console.log("WeChatEnvironmentTest: 3. API可用性检测");
            this.checkAPIAvailability(result);
            
            // 4. 开放数据域检测
            console.log("WeChatEnvironmentTest: 4. 开放数据域检测");
            this.checkOpenDataContext(result);
            
            // 5. 授权状态检测
            console.log("WeChatEnvironmentTest: 5. 授权状态检测");
            this.checkAuthorizationStatus(result);
            
        } catch (error) {
            console.error("WeChatEnvironmentTest: 检测过程出错", error);
            result.error = error.message;
        }
        
        return result;
    }
    
    /**
     * 检测基础环境
     */
    private checkBasicEnvironment(result: any) {
        // 检查wx对象
        result.environment.hasWxObject = typeof wx !== 'undefined';
        result.environment.wxType = typeof wx;
        
        // 检查User Agent
        if (typeof navigator !== 'undefined') {
            result.environment.userAgent = navigator.userAgent;
            result.environment.isWeChatBrowser = /MicroMessenger/i.test(navigator.userAgent);
        }
        
        console.log("WeChatEnvironmentTest: 基础环境", result.environment);
    }
    
    /**
     * 检测系统信息
     */
    private checkSystemInfo(result: any) {
        if (!result.environment.hasWxObject) return;
        
        try {
            if (typeof (wx as any).getSystemInfoSync === 'function') {
                const systemInfo = (wx as any).getSystemInfoSync();
                result.systemInfo = {
                    version: systemInfo.version,
                    SDKVersion: systemInfo.SDKVersion,
                    platform: systemInfo.platform,
                    system: systemInfo.system,
                    brand: systemInfo.brand,
                    model: systemInfo.model,
                    language: systemInfo.language,
                    pixelRatio: systemInfo.pixelRatio,
                    screenWidth: systemInfo.screenWidth,
                    screenHeight: systemInfo.screenHeight,
                    windowWidth: systemInfo.windowWidth,
                    windowHeight: systemInfo.windowHeight
                };
                
                // 检查基础库版本
                if (systemInfo.SDKVersion) {
                    result.baseLibrary.version = systemInfo.SDKVersion;
                    result.baseLibrary.isSupported = this.compareVersion(systemInfo.SDKVersion, '1.9.92') >= 0;
                }
                
                console.log("WeChatEnvironmentTest: 系统信息", result.systemInfo);
            }
        } catch (error) {
            console.error("WeChatEnvironmentTest: 获取系统信息失败", error);
            result.systemInfo = { error: error.message };
        }
    }
    
    /**
     * 检测API可用性
     */
    private checkAPIAvailability(result: any) {
        if (!result.environment.hasWxObject) return;
        
        // 基础API
        const basicAPIs = [
            'getSystemInfo',
            'getSystemInfoSync',
            'getLaunchOptionsSync',
            'exitMiniProgram'
        ];
        
        // 存储API
        const storageAPIs = [
            'setStorage',
            'getStorage',
            'setStorageSync',
            'getStorageSync',
            'removeStorage',
            'clearStorage'
        ];
        
        // 社交API
        const socialAPIs = [
            'getUserInfo',
            'authorize',
            'getSetting',
            'openSetting',
            'shareAppMessage',
            'recommendGame'
        ];
        
        // 开放数据API
        const openDataAPIs = [
            'setUserCloudStorage',
            'getUserCloudStorage',
            'getFriendCloudStorage',
            'getOpenDataContext',
            'getSharedCanvas'
        ];
        
        result.apis.basic = this.checkAPIList(basicAPIs);
        result.apis.storage = this.checkAPIList(storageAPIs);
        result.apis.social = this.checkAPIList(socialAPIs);
        result.apis.openData = this.checkAPIList(openDataAPIs);
        
        console.log("WeChatEnvironmentTest: API可用性", result.apis);
    }
    
    /**
     * 检测API列表
     */
    private checkAPIList(apiNames: string[]): any {
        const result: any = {};
        
        apiNames.forEach(apiName => {
            try {
                result[apiName] = typeof (wx as any)[apiName] === 'function';
            } catch (error) {
                result[apiName] = false;
            }
        });
        
        return result;
    }
    
    /**
     * 检测开放数据域
     */
    private checkOpenDataContext(result: any) {
        if (!result.environment.hasWxObject) return;
        
        try {
            if (typeof (wx as any).getOpenDataContext === 'function') {
                const openDataContext = (wx as any).getOpenDataContext();
                result.context.isOpenDataContext = !!openDataContext;
                
                if (openDataContext) {
                    result.context.openDataContextInfo = {
                        canvas: !!openDataContext.canvas,
                        postMessage: typeof openDataContext.postMessage === 'function'
                    };
                }
            }
            
            // 检查共享画布
            if (typeof (wx as any).getSharedCanvas === 'function') {
                try {
                    const sharedCanvas = (wx as any).getSharedCanvas();
                    result.context.hasSharedCanvas = !!sharedCanvas;
                } catch (error) {
                    result.context.sharedCanvasError = error.message;
                }
            }
            
            console.log("WeChatEnvironmentTest: 开放数据域", result.context);
        } catch (error) {
            console.error("WeChatEnvironmentTest: 开放数据域检测失败", error);
            result.context.error = error.message;
        }
    }
    
    /**
     * 检测授权状态
     */
    private checkAuthorizationStatus(result: any) {
        if (!result.environment.hasWxObject) return;
        
        try {
            result.authorization.hasAuthAPI = typeof (wx as any).authorize === 'function';
            
            if (typeof (wx as any).getSetting === 'function') {
                (wx as any).getSetting({
                    success: (res: any) => {
                        console.log("WeChatEnvironmentTest: 授权设置", res);
                        result.authorization.scopes = res.authSetting || {};
                    },
                    fail: (error: any) => {
                        console.error("WeChatEnvironmentTest: 获取授权设置失败", error);
                        result.authorization.settingsError = error.errMsg;
                    }
                });
            }
            
        } catch (error) {
            console.error("WeChatEnvironmentTest: 授权检测失败", error);
            result.authorization.error = error.message;
        }
    }
    
    /**
     * 比较版本号
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
            return -1;
        }
    }
    
    /**
     * 显示检测结果
     */
    private displayResults(checkResult: any) {
        let summary = "";
        let details = "";
        
        // 生成摘要
        if (checkResult.environment.hasWxObject) {
            if (checkResult.apis.openData.getFriendCloudStorage) {
                summary = "✅ 微信环境正常，API可用";
            } else {
                summary = "⚠️ 微信环境存在，但API不可用";
            }
        } else {
            summary = "❌ 非微信环境";
        }
        
        // 生成详细信息
        details += `检测时间: ${checkResult.timestamp}\n\n`;
        
        details += "=== 环境信息 ===\n";
        details += `wx对象: ${checkResult.environment.hasWxObject ? '存在' : '不存在'}\n`;
        details += `微信浏览器: ${checkResult.environment.isWeChatBrowser ? '是' : '否'}\n\n`;
        
        if (checkResult.systemInfo) {
            details += "=== 系统信息 ===\n";
            details += `微信版本: ${checkResult.systemInfo.version || 'unknown'}\n`;
            details += `基础库版本: ${checkResult.baseLibrary.version}\n`;
            details += `版本支持: ${checkResult.baseLibrary.isSupported ? '满足要求(>=1.9.92)' : '版本过低'}\n`;
            details += `平台: ${checkResult.systemInfo.platform || 'unknown'}\n`;
            details += `系统: ${checkResult.systemInfo.system || 'unknown'}\n\n`;
        }
        
        details += "=== 关键API ===\n";
        details += `getFriendCloudStorage: ${checkResult.apis.openData.getFriendCloudStorage ? '可用' : '不可用'}\n`;
        details += `setUserCloudStorage: ${checkResult.apis.openData.setUserCloudStorage ? '可用' : '不可用'}\n`;
        details += `getOpenDataContext: ${checkResult.apis.openData.getOpenDataContext ? '可用' : '不可用'}\n`;
        details += `authorize: ${checkResult.apis.social.authorize ? '可用' : '不可用'}\n\n`;
        
        details += "=== 数据域状态 ===\n";
        details += `开放数据域: ${checkResult.context.isOpenDataContext ? '是' : '否'}\n\n`;
        
        if (checkResult.authorization.scopes) {
            details += "=== 授权状态 ===\n";
            Object.keys(checkResult.authorization.scopes).forEach(scope => {
                details += `${scope}: ${checkResult.authorization.scopes[scope] ? '已授权' : '未授权'}\n`;
            });
        }
        
        // 更新UI显示
        this.updateResult(summary);
        this.updateDetail(details);
        
        // 输出完整结果到控制台
        console.log("WeChatEnvironmentTest: 完整检测结果", checkResult);
    }
    
    /**
     * 更新结果显示
     */
    private updateResult(message: string) {
        console.log(`WeChatEnvironmentTest: ${message}`);
        if (this.resultLabel) {
            this.resultLabel.string = message;
        }
    }
    
    /**
     * 更新详细信息显示
     */
    private updateDetail(detail: string) {
        if (this.detailText) {
            this.detailText.string = detail;
        }
    }
}