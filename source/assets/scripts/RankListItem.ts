import { _decorator, Component, Node, Label, Sprite, Color } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 排行榜项目组件
 */
@ccclass('RankListItem')
export class RankListItem extends Component {
    @property(Label)
    rankLabel: Label = null!;
    
    @property(Label)
    nicknameLabel: Label = null!;
    
    @property(Label)
    levelLabel: Label = null!;
    
    @property(Label)
    starsLabel: Label = null!;
    
    @property(Sprite)
    avatarSprite: Sprite = null!;
    
    @property(Sprite)
    backgroundSprite: Sprite = null!;
    
    @property(Node)
    rankIcon: Node = null!;
    
    private userData: any = null;
    private rank: number = 0;
    
    onLoad() {
        console.log("RankListItem: 排行榜项目初始化");
    }
    
    /**
     * 设置排行榜数据
     */
    public setRankData(userData: any, rank: number) {
        this.userData = userData;
        this.rank = rank;
        
        console.log(`RankListItem: 设置排行榜数据 - 排名${rank}`, userData);
        
        this.updateUI();
    }
    
    /**
     * 更新UI显示
     */
    private updateUI() {
        // 设置排名
        this.setRank();
        
        // 设置昵称
        this.setNickname();
        
        // 设置关卡信息
        this.setLevelInfo();
        
        // 设置星数
        this.setStars();
        
        // 设置头像
        this.setAvatar();
        
        // 设置背景样式
        this.setBackgroundStyle();
    }
    
    /**
     * 设置排名
     */
    private setRank() {
        if (this.rankLabel) {
            this.rankLabel.string = this.rank.toString();
            
            // 前三名使用特殊颜色
            if (this.rank === 1) {
                this.rankLabel.color = new Color(255, 215, 0); // 金色
            } else if (this.rank === 2) {
                this.rankLabel.color = new Color(192, 192, 192); // 银色
            } else if (this.rank === 3) {
                this.rankLabel.color = new Color(205, 127, 50); // 铜色
            } else {
                this.rankLabel.color = new Color(255, 255, 255); // 白色
            }
        }
        
        // 显示排名图标（如果有）
        if (this.rankIcon) {
            this.rankIcon.active = this.rank <= 3;
        }
    }
    
    /**
     * 设置昵称
     */
    private setNickname() {
        if (this.nicknameLabel && this.userData) {
            const nickname = this.userData.nickname || '匿名玩家';
            
            // 限制昵称长度
            const maxLength = 8;
            const displayName = nickname.length > maxLength 
                ? nickname.substring(0, maxLength) + '...' 
                : nickname;
                
            this.nicknameLabel.string = displayName;
        }
    }
    
    /**
     * 设置关卡信息
     */
    private setLevelInfo() {
        if (this.levelLabel && this.userData) {
            const level = this.userData.level || 1;
            this.levelLabel.string = `第${level}关`;
        }
    }
    
    /**
     * 设置星数
     */
    private setStars() {
        if (this.starsLabel && this.userData) {
            const totalStars = this.userData.totalStars || 0;
            this.starsLabel.string = `${totalStars}★`;
            
            // 根据星数设置颜色
            if (totalStars >= 50) {
                this.starsLabel.color = new Color(255, 215, 0); // 金色
            } else if (totalStars >= 30) {
                this.starsLabel.color = new Color(255, 165, 0); // 橙色
            } else if (totalStars >= 10) {
                this.starsLabel.color = new Color(255, 255, 0); // 黄色
            } else {
                this.starsLabel.color = new Color(255, 255, 255); // 白色
            }
        }
    }
    
    /**
     * 设置头像
     */
    private setAvatar() {
        if (this.avatarSprite && this.userData && this.userData.avatarUrl) {
            // 这里可以实现头像加载逻辑
            // 由于微信小游戏的头像加载比较复杂，暂时跳过
            console.log(`RankListItem: 需要加载头像 ${this.userData.avatarUrl}`);
        }
    }
    
    /**
     * 设置背景样式
     */
    private setBackgroundStyle() {
        if (this.backgroundSprite) {
            // 前三名使用特殊背景
            if (this.rank === 1) {
                this.backgroundSprite.color = new Color(255, 248, 220, 100); // 淡金色背景
            } else if (this.rank === 2) {
                this.backgroundSprite.color = new Color(248, 248, 255, 100); // 淡银色背景
            } else if (this.rank === 3) {
                this.backgroundSprite.color = new Color(255, 248, 240, 100); // 淡铜色背景
            } else {
                this.backgroundSprite.color = new Color(255, 255, 255, 50); // 淡白色背景
            }
        }
    }
    
    /**
     * 获取用户数据
     */
    public getUserData(): any {
        return this.userData;
    }
    
    /**
     * 获取排名
     */
    public getRank(): number {
        return this.rank;
    }
}