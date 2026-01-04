import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class SuankoDanqiYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查四暗刻单骑役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 检查是否符合标准和牌形式
        const result = this.checkStandardForm(tiles);
        if (!result.valid) {
            console.log("不符合标准和牌形式");
            return false;
        }
        
        // 四暗刻单骑：四组刻子和一对雀头，且和牌时是单骑听牌（只听一种牌）
        // 雀头必须是最后一张牌
        
        // 统计刻子数量
        let keziCount = 0;
        
        // 遍历所有面子
        for (const set of result.sets) {
            // 检查这个面子是否为刻子（三张相同的牌）
            if (set.length === 3 && set[0] === set[1] && set[1] === set[2]) {
                keziCount++;
            }
        }
        
        // 检查雀头是否是最后一张牌
        const lastTile = tiles[tiles.length - 1];
        const pairTile = tiles[result.pairIndex];
        
        // 四暗刻单骑：四组刻子和一对雀头，且和牌时是单骑听牌
        // 简化处理：只要有四组刻子，且雀头是最后一张牌就算符合
        if (keziCount === 4 && lastTile.num === pairTile.num) {
            console.log("符合四暗刻单骑要求");
            return true;
        }
        
        console.log(`不符合四暗刻单骑要求，刻子数: ${keziCount}，雀头是否是最后一张: ${lastTile.num === pairTile.num}`);
        return false;
    }
    
    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 定义三种花色和对应的基础数字
        const suits = [
            { base: 0, name: "饼子" },  // 饼子: 1-9
            { base: 9, name: "条子" },  // 条子: 10-18
            { base: 21, name: "万子" }  // 万子: 22-30
        ];
        
        // 生成四组刻子
        for (let i = 0; i < 4; i++) {
            // 随机选择一个花色
            const suit = suits[Math.floor(Math.random() * 3)];
            
            // 随机选择一个数字（1-9）
            const num = 1 + Math.floor(Math.random() * 9);
            
            for (let j = 0; j < 8; j++) {
                numArr.push(suit.base + num);
            }
        }
        
        // 生成其他牌（确保不会破坏四暗刻单骑）
        const remainingCount = count - 32; // 已经生成了12张牌（4个刻子）
        for (let i = 0; i < remainingCount - 1; i++) { // 减1是为了留出最后一张牌作为雀头
            // 随机选择花色
            const randomSuit = suits[Math.floor(Math.random() * 3)];
            
            // 随机选择数字（1-9）
            const randomNum = 1 + Math.floor(Math.random() * 9);
            numArr.push(randomSuit.base + randomNum);
        }
        
        // 生成雀头（最后一张牌）
        const pairSuit = suits[Math.floor(Math.random() * 3)];
        const pairNum = 1 + Math.floor(Math.random() * 9);
        numArr.push(pairSuit.base + pairNum);
        
        return numArr;
    }
} 