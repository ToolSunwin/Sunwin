// thuatoan.js
class MasterPredictor {
    constructor(maxHistorySize = 1000) {
        this.history = [];
        this.maxHistorySize = maxHistorySize;
        this.totalCorrect = 0;
        this.totalWrong = 0;
    }

    async updateData({ score, dice, result }) {
        this.history.push({ score, dice, result });
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    async predict() {
        if (this.history.length < 2) {
            return { prediction: "?", confidence: 0.5, reason: "Chưa đủ dữ liệu" };
        }

        // lấy 2 phiên gần nhất
        const prev = this.history[this.history.length - 1];     // phiên trước
        const prev2 = this.history[this.history.length - 2];    // phiên trước nữa

        let calc = prev.score + prev2.dice[1]; // dice[1] = xí ngầu 2

        // trừ theo luật 5, 12, 18
        if (calc >= 18) {
            calc -= 18;
        } else if (calc >= 12) {
            calc -= 12;
        } else if (calc >= 5) {
            calc -= 5;
        }

        let basePrediction = (calc % 2 === 0) ? "Tài" : "Xỉu";

        // cầu thuận / nghịch
        let finalPrediction = basePrediction;
        if (this.history.length > 30) {
            const recent = this.history.slice(-30);
            const correctIfThuan = recent.filter((h, i) => {
                if (i === 0) return false;
                return recent[i - 1].result === h.result;
            }).length;
            const correctIfNghich = recent.filter((h, i) => {
                if (i === 0) return false;
                return recent[i - 1].result !== h.result;
            }).length;

            if (correctIfNghich > correctIfThuan) {
                finalPrediction = (basePrediction === "Tài") ? "Xỉu" : "Tài";
            }
        }

        return { prediction: finalPrediction, confidence: 0.7, reason: "Theo thuật toán cầu" };
    }
}

module.exports = { MasterPredictor };