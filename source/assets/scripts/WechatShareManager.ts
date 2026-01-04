import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

// 微信API类型定义
declare const wx: any;

/**
 * 微信小游戏分享管理器
 * 负责处理微信小游戏平台的分享功能
 */
@ccclass('WechatShareManager')
export class WechatShareManager extends Component {
    private static instance: WechatShareManager = null!;
    
    // 分享相关配置
    private defaultShareTitle: string = "来挑战这个有趣的贪吃蛇麻将游戏吧！";
    private defaultShareImage: string = ""; // 可以设置默认分享图片路径
    private isShared: boolean = false;
    private shareTag: string = "";

    protected onLoad(): void {
        WechatShareManager.instance = this;
        this.initWechatShare();
    }

    public static getInstance(): WechatShareManager {
        return WechatShareManager.instance;
    }

    /**
     * 初始化微信分享功能
     */
    private initWechatShare(): void {
        // 检查是否在微信小游戏环境中
        if (typeof wx !== 'undefined') {
            // 显示转发按钮
            wx.showShareMenu({
                menus: ['shareAppMessage', 'shareTimeline'], // 支持分享给朋友和分享到朋友圈
                success: () => {
                    console.log("微信分享菜单显示成功");
                },
                fail: (res) => {
                    console.log("微信分享菜单显示失败", res);
                }
            });

            // 监听被动分享（右上角菜单）
            wx.onShareAppMessage(() => {
                return {
                    title: this.defaultShareTitle,
                    imageUrl: this.defaultShareImage,
                    query: 'from=menu'
                };
            });

            console.log("微信分享功能初始化完成");
        } else {
            console.log("非微信环境，跳过微信分享功能初始化");
        }
    }

    /**
     * 主动调用分享功能
     * @param title 分享标题
     * @param imageUrl 分享图片
     * @param query 查询参数
     */
    public shareAppMessage(title?: string, imageUrl?: string, query?: string): void {
        // 检查是否在微信小游戏环境中
        if (typeof wx !== 'undefined') {
            const shareTitle = title || this.defaultShareTitle;
            const shareImage = imageUrl || this.defaultShareImage;
            const shareQuery = query || 'from=button';

            wx.shareAppMessage({
                title: shareTitle,
                imageUrl: shareImage,
                query: shareQuery,
                success: (res) => {
                    console.log("主动分享成功", res);
                    this.isShared = true;
                },
                fail: (res) => {
                    console.log("主动分享失败", res);
                }
            });
        } else {
            console.log("非微信环境，无法调用分享功能");
        }
    }

    /**
     * 设置默认分享标题
     * @param title 分享标题
     */
    public setDefaultShareTitle(title: string): void {
        this.defaultShareTitle = title;
    }

    /**
     * 设置默认分享图片
     * @param imageUrl 图片路径
     */
    public setDefaultShareImage(imageUrl: string): void {
        this.defaultShareImage = imageUrl;
    }

    /**
     * 检查是否已分享
     */
    public hasShared(): boolean {
        return this.isShared;
    }

    /**
     * 重置分享状态
     */
    public resetShareStatus(): void {
        this.isShared = false;
    }
}