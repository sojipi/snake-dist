import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class RyanpekoYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查两杯口役...");
        
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
        
        // 获取所有顺子
        const sequences = result.sets.filter(set => set[0] !== set[1] || set[1] !== set[2]);
        
        // 如果顺子数量少于4，不可能形成两杯口
        if (sequences.length < 4) {
            console.log(`顺子数量不足，只有${sequences.length}组顺子`);
            return false;
        }
        
        // 转换顺子为字符串，便于比较
        const sequenceStrings = sequences.map(seq => seq.join(','));
        
        // 统计每种顺子的出现次数
        const sequenceCounts: { [key: string]: number } = {};
        for (const seqStr of sequenceStrings) {
            sequenceCounts[seqStr] = (sequenceCounts[seqStr] || 0) + 1;
        }
        
        // 检查是否有两对相同的顺子
        const pairCount = Object.values(sequenceCounts).filter(count => count >= 2).length;
        if (pairCount >= 2) {
            console.log("发现两对相同的顺子，符合两杯口要求");
            return true;
        }
        
        // 检查是否有一组出现了4次的顺子
        const hasQuad = Object.values(sequenceCounts).some(count => count >= 4);
        if (hasQuad) {
            console.log("发现四组相同的顺子，符合两杯口要求");
            return true;
        }
        
        console.log("没有找到两对相同的顺子，不符合两杯口要求");
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
        
        // 随机选择两个不同的数字作为顺子的起始数字
        const sequenceStarts = [];
        while (sequenceStarts.length < 2) {
            const randomNum = 1 + Math.floor(Math.random() * 7); // 1-7，确保可以形成顺子
            if (!sequenceStarts.includes(randomNum)) {
                sequenceStarts.push(randomNum);
            }
        }
        
        // 为每个顺子选择花色并生成两组相同的顺子
        for (const start of sequenceStarts) {
            const suit = suits[Math.floor(Math.random() * 3)];
            // 生成两组相同的顺子
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 3; j++) {
                    numArr.push(suit.base + (start + j));
                    numArr.push(suit.base + (start + j));

                }
            }
        }
        
        // 生成一对雀头
        let pairNum;
        do {
            pairNum = 1 + Math.floor(Math.random() * 9);
        } while (sequenceStarts.includes(pairNum) || 
                 sequenceStarts.includes(pairNum - 1) || 
                 sequenceStarts.includes(pairNum - 2));
        
        const pairSuit = suits[Math.floor(Math.random() * 3)];
        for (let i = 0; i < 2; i++) {
            numArr.push(pairSuit.base + pairNum);
        }
        
        // 生成其他牌（确保不会破坏两杯口）
        const remainingCount = count - 26; // 已经生成了14张牌（4个顺子12张 + 1对雀头2张）
        for (let i = 0; i < remainingCount; i++) {
            // 随机选择花色
            const randomSuit = suits[Math.floor(Math.random() * 3)];
            
            // 随机选择数字（1-9），确保不会形成新的顺子
            let randomNum;
            do {
                randomNum = 1 + Math.floor(Math.random() * 9);
            } while (sequenceStarts.includes(randomNum) || 
                     sequenceStarts.includes(randomNum - 1) || 
                     sequenceStarts.includes(randomNum - 2) || 
                     randomNum === pairNum);
            
            numArr.push(randomSuit.base + randomNum);
        }
        
        return numArr;
    }
} 