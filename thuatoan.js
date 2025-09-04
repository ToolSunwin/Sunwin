// thuatoan.js
class MasterPredictor {
    constructor(maxHistorySize = 1000) {
        this.history = [];
        this.maxHistorySize = maxHistorySize;
    }

    async updateData(gameData) {
        // gameData: {dice1, dice2, dice3, score, result}
        this.history.push(gameData);
        if (this.history.length > this.maxHistorySize) this.history.shift();
    }

    async predict() {
        if (this.history.length < 2) {
            return {
                prediction: "?",
                confidence: 0.5,
                reason: "Chưa đủ dữ liệu (cần ít nhất 2 phiên)"
            };
        }

        const last = this.history[this.history.length - 1];   // phiên gần nhất
        const prev = this.history[this.history.length - 2];   // phiên trước đó

        let calc = prev.score + last.dice2;
        let prediction, reason;

        if (calc < 5) {
            // nghịch đảo phiên trước
            prediction = (prev.result === "Tài") ? "Xỉu" : "Tài";
            reason = `Tổng (${prev.score}+${last.dice2}=${calc}) < 5 → đảo kết quả phiên trước (${prev.result} → ${prediction})`;
        } else {
            if (calc >= 5 && calc <= 11) calc -= 5;
            else if (calc >= 12 && calc <= 17) calc -= 12;
            else if (calc >= 18) calc -= 18;

            prediction = (calc % 2 === 0) ? "Tài" : "Xỉu";
            reason = `Tính: ${prev.score}+${last.dice2} → ${calc} → ${prediction}`;
        }

        return { prediction, confidence: 0.7, reason };
    }
}

module.exports = { MasterPredictor };