import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class SanankoYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查三暗刻役...");
        
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
        
        // 三暗刻：三组刻子和一对雀头
        
        // 统计每种牌的数量
        const countMap = {};
        
        for (const tile of tiles) {
            const num = tile.id || tile.num;
            countMap[num] = (countMap[num] || 0) + 1;
        }
        
        // 计算刻子数量
        let keziCount = 0;
        
        for (const num in countMap) {
            if (countMap[num] >= 3) {
                keziCount++;
            }
        }
        
        // 三暗刻：三组刻子
        if (keziCount >= 3) {
            console.log("符合三暗刻要求");
            return true;
        }
        
        console.log(`不符合三暗刻要求，刻子数: ${keziCount}`);
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
        
        // 随机选择三个不同的数字作为刻子
        const keziNumbers = [];
        while (keziNumbers.length < 3) {
            const randomNum = 1 + Math.floor(Math.random() * 9);
            if (!keziNumbers.includes(randomNum)) {
                keziNumbers.push(randomNum);
            }
        }
        
        // 为每个刻子选择花色并生成三张相同的牌
        for (const num of keziNumbers) {
            const suit = suits[Math.floor(Math.random() * 3)];
            for (let i = 0; i < 3; i++) {
                numArr.push(suit.base + num);
            }
        }
        
        // 生成一对雀头
        let pairNum;
        do {
            pairNum = 1 + Math.floor(Math.random() * 9);
        } while (keziNumbers.includes(pairNum));
        
        const pairSuit = suits[Math.floor(Math.random() * 3)];
        for (let i = 0; i < 2; i++) {
            numArr.push(pairSuit.base + pairNum);
        }
        
        // 生成其他牌（确保不会破坏三暗刻）
        const remainingCount = count - 11; // 已经生成了11张牌（3个刻子9张 + 1对雀头2张）
        for (let i = 0; i < remainingCount; i++) {
            // 随机选择花色
            const randomSuit = suits[Math.floor(Math.random() * 3)];
            
            // 随机选择数字（1-9），确保不会形成新的刻子
            let randomNum;
            do {
                randomNum = 1 + Math.floor(Math.random() * 9);
            } while (keziNumbers.includes(randomNum) || randomNum === pairNum);
            
            numArr.push(randomSuit.base + randomNum);
        }
        
        return numArr;
    }
} 