import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class DaisangenYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查大三元役...");
        
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
        
        // 统计三元牌（白发中）的数量
        const countMap = {};
        for (const tile of tiles) {
            const num = tile.id || tile.num;
            // 三元牌：白(35)、发(36)、中(37)
            if (num >= 19 && num <= 21) {
                countMap[num] = (countMap[num] || 0) + 1;
            }
        }
        
        // 大三元：三组三元牌的刻子
        let sangenKezi = 0; // 三元牌刻子数
        
        for (const num in countMap) {
            if (countMap[num] >= 3) {
                sangenKezi++;
            }
        }
        
        // 大三元：三组三元牌的刻子
        if (sangenKezi === 3) {
            console.log("符合大三元要求：三组三元牌的刻子");
            return true;
        }
        
        console.log(`不符合大三元要求，三元牌刻子数: ${sangenKezi}`);
        return false;
    }
    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 定义三元牌
        const sangenTiles = [19, 20, 21]; // 中、发、白
        
        // 生成三组三元牌的刻子（每组3张）
        for (const tile of sangenTiles) {
            for (let i = 0; i < 8; i++) {
                numArr.push(tile);
            }
        }
        
        // 生成一对雀头（使用其他牌）
        const suits = [
            { base: 0, name: "饼子" },  // 饼子: 1-9
            { base: 9, name: "条子" },  // 条子: 10-18
            { base: 21, name: "万子" }  // 万子: 22-30
        ];
        
        // 随机选择一个花色和数字作为雀头
        const pairSuit = suits[Math.floor(Math.random() * 3)];
        const pairNum = 1 + Math.floor(Math.random() * 9);
        for (let i = 0; i < 2; i++) {
            numArr.push(pairSuit.base + pairNum);
        }
        
        // 生成其他牌（确保不会破坏大三元）
        const remainingCount = count - 26; // 已经生成了11张牌（3个刻子9张 + 1对雀头2张）
        for (let i = 0; i < remainingCount; i++) {
            // 随机选择花色
            const randomSuit = suits[Math.floor(Math.random() * 3)];
            // 随机选择数字（1-9）
            const num = 1 + Math.floor(Math.random() * 9);
            numArr.push(randomSuit.base + num);
        }
        
        return numArr;
    }
}