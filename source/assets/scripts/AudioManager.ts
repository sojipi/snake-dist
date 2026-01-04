import { _decorator, Component, Node, AudioSource, AudioClip, resources, director, game } from 'cc';
const { ccclass, property } = _decorator;

/**
 * 全局音频管理器 - 单例模式
 * 管理背景音乐和音效的播放、暂停、音量控制等
 */
@ccclass('AudioManager')
export class AudioManager extends Component {
    private static _instance: AudioManager = null!;
    
    @property(AudioSource)
    bgmAudioSource: AudioSource = null!;
    
    @property(AudioSource)
    sfxAudioSource: AudioSource = null!;
    
    @property({ tooltip: "背景音乐音量 (0-1)" })
    bgmVolume: number = 0.5;
    
    @property({ tooltip: "音效音量 (0-1)" })
    sfxVolume: number = 0.7;
    
    @property({ tooltip: "是否启用背景音乐" })
    enableBGM: boolean = true;
    
    @property({ tooltip: "是否启用音效" })
    enableSFX: boolean = true;
    
    // 音频资源缓存
    private audioClips: Map<string, AudioClip> = new Map();
    
    // 当前播放的BGM名称
    private currentBGM: string = '';
    
    // 音频设置键名
    private static readonly BGM_ENABLED_KEY = 'bgm_enabled';
    private static readonly SFX_ENABLED_KEY = 'sfx_enabled';
    private static readonly BGM_VOLUME_KEY = 'bgm_volume';
    private static readonly SFX_VOLUME_KEY = 'sfx_volume';
    
    public static getInstance(): AudioManager {
        return AudioManager._instance;
    }
    
    onLoad() {
        // 单例模式
        if (AudioManager._instance) {
            this.node.destroy();
            return;
        }
        
        AudioManager._instance = this;
        
        // 跨场景保持
        game.addPersistRootNode(this.node);
        
        console.log("AudioManager: 全局音频管理器初始化");
        
        this.initializeAudioSources();
        this.loadSettings();
        this.preloadAudioClips();
    }
    
    start() {
        // 开始播放背景音乐
        this.playBGM('bgm');
    }
    
    private initializeAudioSources() {
        // 如果没有绑定AudioSource，自动创建
        if (!this.bgmAudioSource) {
            const bgmNode = new Node('BGM_AudioSource');
            bgmNode.setParent(this.node);
            this.bgmAudioSource = bgmNode.addComponent(AudioSource);
            this.bgmAudioSource.loop = true;
            this.bgmAudioSource.playOnAwake = false;
        }
        
        if (!this.sfxAudioSource) {
            const sfxNode = new Node('SFX_AudioSource');
            sfxNode.setParent(this.node);
            this.sfxAudioSource = sfxNode.addComponent(AudioSource);
            this.sfxAudioSource.loop = false;
            this.sfxAudioSource.playOnAwake = false;
        }
        
        console.log("AudioManager: 音频源初始化完成");
    }
    
    private loadSettings() {
        // 从本地存储加载音频设置
        console.log("AudioManager: 开始加载音频设置...");

        // 检查是否是首次启动或设置损坏
        const initFlag = localStorage.getItem('audio_settings_initialized');
        const bgmStored = localStorage.getItem(AudioManager.BGM_ENABLED_KEY);
        const sfxStored = localStorage.getItem(AudioManager.SFX_ENABLED_KEY);
        const bgmVolumeStored = localStorage.getItem(AudioManager.BGM_VOLUME_KEY);
        const sfxVolumeStored = localStorage.getItem(AudioManager.SFX_VOLUME_KEY);

        // 如果初始化标记不存在，或者关键设置为空/无效，则认为需要重新初始化
        const isFirstLaunch = initFlag === null ||
                             bgmStored === null || bgmStored === '' ||
                             sfxStored === null || sfxStored === '' ||
                             bgmVolumeStored === null || bgmVolumeStored === '' ||
                             sfxVolumeStored === null || sfxVolumeStored === '';

        console.log(`AudioManager: 初始化检查 - initFlag:${initFlag}, bgm:${bgmStored}, sfx:${sfxStored}, bgmVol:${bgmVolumeStored}, sfxVol:${sfxVolumeStored}`);
        console.log(`AudioManager: 是否需要重新初始化: ${isFirstLaunch}`);

        if (isFirstLaunch) {
            // 首次启动或设置损坏，重新设置默认值并保存
            console.log("AudioManager: 检测到首次启动或设置损坏，重新设置默认值");
            this.enableBGM = true;
            this.enableSFX = true;
            this.bgmVolume = 0.5;
            this.sfxVolume = 0.7;

            // 保存默认设置
            this.saveBoolean(AudioManager.BGM_ENABLED_KEY, this.enableBGM);
            this.saveBoolean(AudioManager.SFX_ENABLED_KEY, this.enableSFX);
            this.saveNumber(AudioManager.BGM_VOLUME_KEY, this.bgmVolume);
            this.saveNumber(AudioManager.SFX_VOLUME_KEY, this.sfxVolume);
            localStorage.setItem('audio_settings_initialized', 'true');

            console.log("AudioManager: 默认设置已保存");
        } else {
            // 非首次启动，从存储加载
            console.log("AudioManager: 从localStorage加载设置");

            // 检查localStorage中的原始值
            const bgmStored = localStorage.getItem(AudioManager.BGM_ENABLED_KEY);
            const sfxStored = localStorage.getItem(AudioManager.SFX_ENABLED_KEY);
            const bgmVolumeStored = localStorage.getItem(AudioManager.BGM_VOLUME_KEY);
            const sfxVolumeStored = localStorage.getItem(AudioManager.SFX_VOLUME_KEY);

            console.log(`AudioManager: localStorage原始值 - BGM:${bgmStored}, SFX:${sfxStored}, BGMVolume:${bgmVolumeStored}, SFXVolume:${sfxVolumeStored}`);

            this.enableBGM = this.getStoredBoolean(AudioManager.BGM_ENABLED_KEY, true);
            this.enableSFX = this.getStoredBoolean(AudioManager.SFX_ENABLED_KEY, true);
            this.bgmVolume = this.getStoredNumber(AudioManager.BGM_VOLUME_KEY, 0.5);
            this.sfxVolume = this.getStoredNumber(AudioManager.SFX_VOLUME_KEY, 0.7);
        }

        console.log(`AudioManager: 最终值 - BGM:${this.enableBGM}, SFX:${this.enableSFX}, BGMVolume:${this.bgmVolume}, SFXVolume:${this.sfxVolume}`);

        this.applySettings();

        console.log(`AudioManager: 设置加载完成 - BGM:${this.enableBGM}, SFX:${this.enableSFX}, BGMVolume:${this.bgmVolume}, SFXVolume:${this.sfxVolume}`);
    }
    
    private applySettings() {
        if (this.bgmAudioSource) {
            this.bgmAudioSource.volume = this.enableBGM ? this.bgmVolume : 0;
        }
        
        if (this.sfxAudioSource) {
            this.sfxAudioSource.volume = this.enableSFX ? this.sfxVolume : 0;
        }
    }
    
    private preloadAudioClips() {
        // 预加载常用音频文件
        const audioFiles = ['bgm', 'click', 'collect', 'win', 'lose'];
        
        audioFiles.forEach(fileName => {
            resources.load(`audio/${fileName}`, AudioClip, (err, clip) => {
                if (err) {
                    console.warn(`AudioManager: 无法加载音频文件 ${fileName}:`, err);
                    return;
                }
                
                this.audioClips.set(fileName, clip);
                console.log(`AudioManager: 音频文件 ${fileName} 加载成功`);
            });
        });
    }
    
    // ========== 背景音乐控制 ==========
    
    /**
     * 播放背景音乐
     * @param clipName 音频文件名（不含扩展名）
     * @param fadeIn 是否淡入
     */
    public playBGM(clipName: string, fadeIn: boolean = false) {
        if (!this.enableBGM || !this.bgmAudioSource) {
            return;
        }
        
        // 如果已经在播放相同的BGM，不重复播放
        if (this.currentBGM === clipName && this.bgmAudioSource.playing) {
            return;
        }
        
        const clip = this.audioClips.get(clipName);
        if (clip) {
            this.playBGMWithClip(clip, clipName, fadeIn);
        } else {
            // 动态加载音频文件
            resources.load(`audio/${clipName}`, AudioClip, (err, clip) => {
                if (err) {
                    console.error(`AudioManager: 无法加载BGM ${clipName}:`, err);
                    return;
                }
                
                this.audioClips.set(clipName, clip);
                this.playBGMWithClip(clip, clipName, fadeIn);
            });
        }
    }
    
    private playBGMWithClip(clip: AudioClip, clipName: string, fadeIn: boolean) {
        this.bgmAudioSource.stop();
        this.bgmAudioSource.clip = clip;
        this.currentBGM = clipName;
        
        if (fadeIn) {
            // 淡入效果
            this.bgmAudioSource.volume = 0;
            this.bgmAudioSource.play();
            
            // 简单的淡入动画
            let currentVolume = 0;
            const targetVolume = this.enableBGM ? this.bgmVolume : 0;
            const fadeStep = targetVolume / 20; // 20步淡入
            
            const fadeInterval = setInterval(() => {
                currentVolume += fadeStep;
                if (currentVolume >= targetVolume) {
                    currentVolume = targetVolume;
                    clearInterval(fadeInterval);
                }
                this.bgmAudioSource.volume = currentVolume;
            }, 50);
        } else {
            this.bgmAudioSource.volume = this.enableBGM ? this.bgmVolume : 0;
            this.bgmAudioSource.play();
        }
        
        console.log(`AudioManager: 开始播放BGM ${clipName}`);
    }
    
    /**
     * 停止背景音乐
     * @param fadeOut 是否淡出
     */
    public stopBGM(fadeOut: boolean = false) {
        if (!this.bgmAudioSource) return;
        
        if (fadeOut) {
            // 淡出效果
            let currentVolume = this.bgmAudioSource.volume;
            const fadeStep = currentVolume / 20;
            
            const fadeInterval = setInterval(() => {
                currentVolume -= fadeStep;
                if (currentVolume <= 0) {
                    currentVolume = 0;
                    this.bgmAudioSource.stop();
                    clearInterval(fadeInterval);
                }
                this.bgmAudioSource.volume = currentVolume;
            }, 50);
        } else {
            this.bgmAudioSource.stop();
        }
        
        this.currentBGM = '';
        console.log("AudioManager: BGM已停止");
    }
    
    /**
     * 暂停背景音乐
     */
    public pauseBGM() {
        if (this.bgmAudioSource && this.bgmAudioSource.playing) {
            this.bgmAudioSource.pause();
            console.log("AudioManager: BGM已暂停");
        }
    }
    
    /**
     * 恢复背景音乐
     */
    public resumeBGM() {
        if (this.bgmAudioSource && !this.bgmAudioSource.playing && this.currentBGM) {
            this.bgmAudioSource.play();
            console.log("AudioManager: BGM已恢复");
        }
    }
    
    // ========== 音效控制 ==========
    
    /**
     * 播放音效
     * @param clipName 音频文件名
     * @param volume 音量（可选，使用默认音效音量）
     */
    public playSFX(clipName: string, volume?: number) {
        if (!this.enableSFX || !this.sfxAudioSource) {
            return;
        }
        
        const clip = this.audioClips.get(clipName);
        if (clip) {
            this.playSFXWithClip(clip, volume);
        } else {
            // 动态加载音效文件
            resources.load(`audio/${clipName}`, AudioClip, (err, clip) => {
                if (err) {
                    console.warn(`AudioManager: 无法加载音效 ${clipName}:`, err);
                    return;
                }
                
                this.audioClips.set(clipName, clip);
                this.playSFXWithClip(clip, volume);
            });
        }
    }
    
    private playSFXWithClip(clip: AudioClip, volume?: number) {
        this.sfxAudioSource.playOneShot(clip, volume || this.sfxVolume);
    }
    
    // ========== 设置控制 ==========
    
    /**
     * 设置BGM开关
     */
    public setBGMEnabled(enabled: boolean) {
        this.enableBGM = enabled;
        this.saveBoolean(AudioManager.BGM_ENABLED_KEY, enabled);

        if (enabled) {
            // 启用BGM：重新播放BGM
            console.log("AudioManager: 启用BGM，重新播放");
            this.playBGM('bgm');
        } else {
            // 禁用BGM：停止播放
            if (this.bgmAudioSource) {
                this.bgmAudioSource.stop();
                console.log("AudioManager: BGM已停止");
            }
        }

        console.log(`AudioManager: BGM ${enabled ? '开启' : '关闭'}`);
    }
    
    /**
     * 设置音效开关
     */
    public setSFXEnabled(enabled: boolean) {
        this.enableSFX = enabled;
        this.saveBoolean(AudioManager.SFX_ENABLED_KEY, enabled);
        
        console.log(`AudioManager: 音效 ${enabled ? '开启' : '关闭'}`);
    }
    
    /**
     * 设置BGM音量
     */
    public setBGMVolume(volume: number) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        this.saveNumber(AudioManager.BGM_VOLUME_KEY, this.bgmVolume);
        
        if (this.bgmAudioSource && this.enableBGM) {
            this.bgmAudioSource.volume = this.bgmVolume;
        }
    }
    
    /**
     * 设置音效音量
     */
    public setSFXVolume(volume: number) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.saveNumber(AudioManager.SFX_VOLUME_KEY, this.sfxVolume);
    }
    
    // ========== 获取状态 ==========
    
    public isBGMEnabled(): boolean {
        return this.enableBGM;
    }
    
    public isSFXEnabled(): boolean {
        return this.enableSFX;
    }
    
    public getBGMVolume(): number {
        return this.bgmVolume;
    }
    
    public getSFXVolume(): number {
        return this.sfxVolume;
    }
    
    public isPlaying(): boolean {
        return this.bgmAudioSource ? this.bgmAudioSource.playing : false;
    }
    
    // ========== 本地存储工具方法 ==========
    
    private saveBoolean(key: string, value: boolean) {
        localStorage.setItem(key, value.toString());
    }
    
    private getStoredBoolean(key: string, defaultValue: boolean): boolean {
        const stored = localStorage.getItem(key);
        // 检查是否为null、空字符串或无效值
        if (stored === null || stored === '' || (stored !== 'true' && stored !== 'false')) {
            return defaultValue;
        }
        return stored === 'true';
    }

    private saveNumber(key: string, value: number) {
        localStorage.setItem(key, value.toString());
    }

    private getStoredNumber(key: string, defaultValue: number): number {
        const stored = localStorage.getItem(key);
        // 检查是否为null、空字符串或无效数字
        if (stored === null || stored === '' || isNaN(parseFloat(stored))) {
            return defaultValue;
        }
        return parseFloat(stored);
    }
    
    onDestroy() {
        if (AudioManager._instance === this) {
            AudioManager._instance = null!;
        }
    }
}
