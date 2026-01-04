import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class PinfuYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查平和役...");
        
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
        
        // 检查是否全部是顺子（没有刻子）
        for (const set of result.sets) {
            // 如果是刻子（三张相同的牌）
            if (set[0] === set[1] && set[1] === set[2]) {
                console.log(`发现刻子 ${set}，不符合平和要求`);
                return false;
            }
        }
        
        // 检查雀头是否是役牌（风牌或三元牌）
        const pairValue = result.pair[0];
        if (this.isHonor(pairValue)) {
            console.log(`雀头 ${pairValue} 是字牌，不符合平和要求`);
            return false;
        }
        
        console.log("符合平和役的要求");
        return true;
    }

    generateTiles(count: number = 1): number[] {
        console.log("生成平和役牌型...");
        
        const numArr: number[] = [];
        
        // 设置不同花色的比例
        const pinTilesRatio = 0.35;  // 饼子
        const souTilesRatio = 0.35;  // 条子
        const manTilesRatio = 0.30;  // 万子
        
        // 计算每种花色需要生成的牌数
        const pinCount = Math.floor(count * pinTilesRatio);
        const souCount = Math.floor(count * souTilesRatio);
        const manCount = count - pinCount - souCount;
        
        console.log(`平和役牌型分配：饼子=${pinCount}, 条子=${souCount}, 万子=${manCount}`);
        
        // 生成饼子顺子和对子 (1-9)
        let remainingPin = pinCount;
        while (remainingPin > 0) {
            if (remainingPin >= 3) {
                // 生成顺子
                const start = 1 + Math.floor(Math.random() * 7);
                numArr.push(start, start + 1, start + 2);
                remainingPin -= 3;
            } else if (remainingPin >= 2) {
                // 生成对子（非字牌）
                const num = 1 + Math.floor(Math.random() * 9);
                numArr.push(num, num);
                remainingPin -= 2;
            } else {
                // 剩余单张
                const num = 1 + Math.floor(Math.random() * 9);
                numArr.push(num);
                remainingPin--;
            }
        }
        
        // 生成条子顺子和对子 (10-18)
        let remainingSou = souCount;
        while (remainingSou > 0) {
            if (remainingSou >= 3) {
                // 生成顺子
                const start = 10 + Math.floor(Math.random() * 7);
                numArr.push(start, start + 1, start + 2);
                remainingSou -= 3;
            } else if (remainingSou >= 2) {
                // 生成对子（非字牌）
                const num = 10 + Math.floor(Math.random() * 9);
                numArr.push(num, num);
                remainingSou -= 2;
            } else {
                // 剩余单张
                const num = 10 + Math.floor(Math.random() * 9);
                numArr.push(num);
                remainingSou--;
            }
        }
        
        // 生成万子顺子和对子 (22-30)
        let remainingMan = manCount;
        while (remainingMan > 0) {
            if (remainingMan >= 3) {
                // 生成顺子
                const start = 22 + Math.floor(Math.random() * 7);
                numArr.push(start, start + 1, start + 2);
                remainingMan -= 3;
            } else if (remainingMan >= 2) {
                // 生成对子（非字牌）
                const num = 22 + Math.floor(Math.random() * 9);
                numArr.push(num, num);
                remainingMan -= 2;
            } else {
                // 剩余单张
                const num = 22 + Math.floor(Math.random() * 9);
                numArr.push(num);
                remainingMan--;
            }
        }
        
        // 确保至少有一个对子（如果总牌数足够）
        if (count >= 2 && !numArr.some((val, idx) => val === numArr[idx + 1])) {
            // 随机选择一个花色
            const suit = Math.floor(Math.random() * 3);
            let pairValue;
            if (suit === 0) {
                pairValue = 1 + Math.floor(Math.random() * 9);
            } else if (suit === 1) {
                pairValue = 10 + Math.floor(Math.random() * 9);
            } else {
                pairValue = 22 + Math.floor(Math.random() * 9);
            }
            
            // 替换最后两张牌为对子
            numArr.splice(numArr.length - 2, 2, pairValue, pairValue);
        }
        
        return numArr;
    }
}