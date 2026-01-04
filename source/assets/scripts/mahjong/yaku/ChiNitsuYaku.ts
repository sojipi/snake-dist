import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class ChiNitsuYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查清一色役...");
        
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
        
        // 清一色：所有牌都是同一种花色的数牌
        
        // 统计每种花色的数量
        let suitCounts = [0, 0, 0]; // 饼子、条子、万子
        let ziPaiCount = 0; // 字牌
        
        for (const tile of tiles) {
            const num = tile.id || tile.num;
            
            // 字牌：31-37
            if (num >= 31 && num <= 37) {
                ziPaiCount++;
            } 
            // 数牌
            else {
                const suit = Math.floor(num / 10);
                if (suit >= 0 && suit <= 2) {
                    suitCounts[suit]++;
                }
            }
        }
        
        // 检查是否只有一种花色的数牌，且没有字牌
        let numSuitCount = 0;
        let dominantSuit = -1;
        
        for (let i = 0; i < suitCounts.length; i++) {
            if (suitCounts[i] > 0) {
                numSuitCount++;
                dominantSuit = i;
            }
        }
        
        // 清一色：只有一种花色的数牌，且没有字牌
        if (numSuitCount === 1 && ziPaiCount === 0 && suitCounts[dominantSuit] === 14) {
            console.log(`符合清一色要求，花色: ${dominantSuit}`);
            return true;
        }
        
        console.log(`不符合清一色要求，数牌花色数: ${numSuitCount}，字牌数: ${ziPaiCount}`);
        return false;
    }
    
    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 随机选择一种花色作为主花色
        const mainSuit = Math.floor(Math.random() * 3); // 0:饼子, 1:条子, 2:万子
        const baseNum = mainSuit === 0 ? 0 : (mainSuit === 1 ? 9 : 21);
        
        // 生成主花色的牌（1-9）
        for (let i = 1; i <= 9; i++) {
            const tileCount = Math.ceil(count * 0.8 / 9); // 80%的牌是主花色
            for (let j = 0; j < tileCount && numArr.length < count * 0.8; j++) {
                numArr.push(baseNum + i);
            }
        }
        
        // 生成其他花色的牌（20%）
        const otherSuits = [0, 1, 2].filter(suit => suit !== mainSuit);
        const otherCount = Math.ceil(count * 0.2);
        for (let i = 0; i < otherCount; i++) {
            const randomSuit = otherSuits[Math.floor(Math.random() * otherSuits.length)];
            const otherBaseNum = randomSuit === 0 ? 0 : (randomSuit === 1 ? 9 : 21);
            const randomNum = 1 + Math.floor(Math.random() * 9);
            numArr.push(otherBaseNum + randomNum);
        }
        
        // 如果牌数不够，补充主花色的牌
        while (numArr.length < count) {
            const randomNum = 1 + Math.floor(Math.random() * 9);
            numArr.push(baseNum + randomNum);
        }
        
        return numArr;
    }
}