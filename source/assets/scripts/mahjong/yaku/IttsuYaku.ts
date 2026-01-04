import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class IttsuYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查一气通贯役...");
        
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
        
        // 按照花色分组
        const sequencesBySuit = {};
        for (const seq of sequences) {
            const suit = this.getSuit(seq[0]);
            sequencesBySuit[suit] = sequencesBySuit[suit] || [];
            sequencesBySuit[suit].push(seq);
        }
        
        // 检查每种花色是否有123、456、789的顺子
        for (const suit in sequencesBySuit) {
            const seqs = sequencesBySuit[suit];
            
            // 检查是否有123顺子
            const has123 = seqs.some(seq => {
                const base = suit === 'pin' ? 1 : (suit === 'sou' ? 10 : 22);
                return seq[0] === base && seq[1] === base + 1 && seq[2] === base + 2;
            });
            
            // 检查是否有456顺子
            const has456 = seqs.some(seq => {
                const base = suit === 'pin' ? 4 : (suit === 'sou' ? 13 : 25);
                return seq[0] === base && seq[1] === base + 1 && seq[2] === base + 2;
            });
            
            // 检查是否有789顺子
            const has789 = seqs.some(seq => {
                const base = suit === 'pin' ? 7 : (suit === 'sou' ? 16 : 28);
                return seq[0] === base && seq[1] === base + 1 && seq[2] === base + 2;
            });
            
            if (has123 && has456 && has789) {
                console.log(`发现一气通贯: ${suit}，符合一气通贯要求`);
                return true;
            }
        }
        
        console.log("没有找到一气通贯，不符合一气通贯要求");
        return false;
    }
    // ... existing code ...
    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 随机选择一种花色
        const suit = Math.floor(Math.random() * 3); // 0:饼子, 1:条子, 2:万子
        const baseNum = suit === 0 ? 0 : (suit === 1 ? 9 : 21);
        
        // 生成一气通贯的顺子（123、456、789，共9张）
        const sequences = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9]
        ];
        
        for (const seq of sequences) {
            for (const num of seq) {
                numArr.push(baseNum + num);
            }
        }
        
        // 生成其他牌（确保不会破坏一气通贯）
        const remainingCount = count - 9;
        for (let i = 0; i < remainingCount; i++) {
            // 随机选择花色
            const randomSuit = Math.floor(Math.random() * 3);
            const randomBaseNum = randomSuit === 0 ? 0 : (randomSuit === 1 ? 9 : 21);
            
            // 随机选择数字（1-9）
            const randomNum = 1 + Math.floor(Math.random() * 9);
            numArr.push(randomBaseNum + randomNum);
        }
        
        return numArr;
    }
// ... existing code ...
} 