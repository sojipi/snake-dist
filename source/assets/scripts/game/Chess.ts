import { Animation, Component, Event, EventTouch, Label, Node, Sprite, Touch, UITransform, Vec2, Vec3, _decorator, color, find, instantiate, tween, v2, v3} from "cc";
import { ENUM_AUDIO_CLIP, ENUM_GAME_EVENT, ENUM_GAME_MODE, ENUM_UI_TYPE } from "../Enum";



const { ccclass, property } = _decorator;

@ccclass
export default class Chess extends Component {

    x: number = 0
    y: number = 0
    num: number = 0
    id: number = 0
    isClear: boolean = false
    isInHand: boolean = false  // 是否在手牌中

    touchPos: Vec2 = null
    startPos: Vec2 = null
    // 移动阀值：达到才算开始移动
    moveSafetyDis: number = 2
    // 移动方向
    moveDir: Vec2 = v2(0, 0)
    // 是否移动
    isMoving: boolean = false
    // 移动距离
    moveDis: Vec2 = v2(0, 0)
    // 当前选中
    current: Chess = null

    init(x: number, y: number, num: number, isClear: boolean = false) {
        // 初始化
        this.x = x
        this.y = y
        this.num = num
        this.id = num
        this.touchPos = null
        this.startPos = null
        this.moveDir = v2(0, 0)
        this.isMoving = false
        this.moveDis = v2(0, 0)
        this.isInHand = false
        
        // 渲染麻将牌图像
        const icon = this.node.getChildByName('icon').getComponent(Sprite);
        
        // 在日麻模式下判断是否为字牌（东南西北）
        let spriteKey = "";
        // if (DataManager.instance.mode === ENUM_GAME_MODE.MAHJONG) {
        //     // 东南西北字牌（31=东，32=南，33=西，34=北）
        //     if (num >= 31 && num <= 34) {
        //         // 直接使用数字作为图片名称
        //         spriteKey = `${num}`;
        //         console.log(`使用字牌图像: ${spriteKey}.png`);
        //     } else {
        //         // 数字牌（1-9）使用正常的数字图像
        //         spriteKey = `${num}`;
        //     }
        // } else {
            // 在其他模式下使用正常的数字图像
            spriteKey = `${num}`;
        // }
        
   
    }



    setAnim(isAnim: boolean = true) {
        const anim = this.node.getComponent(Animation)
        if (isAnim) {
            anim.play()
        } else {
            this.node.setScale(v3(1, 1, 1))
            anim.stop()
        }
    }

    setEffect(name: string = 'eff_touch', isShow: boolean = true) {
        this.node.getChildByName(name).active = isShow
    }

  
  



 
}
