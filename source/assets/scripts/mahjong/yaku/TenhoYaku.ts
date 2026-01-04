import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class TenhoYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查天和役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 天和：庄家在第一巡没有摸牌前就和牌
        // 由于游戏逻辑限制，这里只能简单检查是否符合标准和牌形式
        
        const result = this.checkStandardForm(tiles);
        if (!result.valid) {
            console.log("不符合标准和牌形式");
            return false;
        }
        
        // 天和需要额外的游戏状态信息，这里假设已经满足条件
        console.log("符合天和要求（假设已满足游戏状态条件）");
        return true;
    }
    
    generateTiles(count: number): number[] {
        console.log("生成天和役牌型...");
        
        // 天和役只需要符合标准和牌形式
        // 生成4个刻子（或顺子）和1个对子
        
        const numArr: number[] = [];
        
        // 定义花色
        const suits = [
            { name: "饼子", base: 1, max: 9 },
            { name: "条子", base: 10, max: 18 },
            { name: "万子", base: 22, max: 30 }
        ];
        
        // 生成4个刻子（或顺子）
        for (let i = 0; i < 4; i++) {
            // 随机决定是生成刻子还是顺子
            const isPung = Math.random() < 0.5;
            
            if (isPung) {
                // 生成刻子
                const suit = suits[Math.floor(Math.random() * suits.length)];
                const value = Math.floor(Math.random() * 9) + 1;
                const tileNum = suit.base + value - 1;
                
                // 添加三张相同的牌
                for (let j = 0; j < 3; j++) {
                    numArr.push(tileNum);
                }
            } else {
                // 生成顺子
                const suit = suits[Math.floor(Math.random() * suits.length)];
                // 确保有足够的空间生成顺子（1-7）
                const startValue = Math.floor(Math.random() * 7) + 1;
                
                // 添加三张连续的牌
                for (let j = 0; j < 3; j++) {
                    numArr.push(suit.base + startValue + j - 1);
                }
            }
        }
        
        // 生成1个对子
        const pairSuit = suits[Math.floor(Math.random() * suits.length)];
        const pairValue = Math.floor(Math.random() * 9) + 1;
        const pairTileNum = pairSuit.base + pairValue - 1;
        
        // 添加两张相同的牌
        numArr.push(pairTileNum);
        numArr.push(pairTileNum);
        
        // 补充剩余的牌
        const remainingCount = count - numArr.length;
        if (remainingCount > 0) {
            // 随机生成剩余的牌
            for (let i = 0; i < remainingCount; i++) {
                const suit = suits[Math.floor(Math.random() * suits.length)];
                const value = Math.floor(Math.random() * 9) + 1;
                numArr.push(suit.base + value - 1);
            }
        }
        
        console.log(`生成天和役牌型完成，共${numArr.length}张牌`);
        return numArr;
    }
} 