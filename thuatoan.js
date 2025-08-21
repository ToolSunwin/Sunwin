// thuatoan.js
class MasterPredictor {
    constructor(maxHistorySize = 1000) {
        this.history = [];
        this.maxHistorySize = maxHistorySize;

        this.lastPrediction = null;       // giữ kèo đã random cho phiên hiện tại
        this.lastPredictedHistoryLen = 0; // số phiên khi random lần cuối

        this.winStreak = 0;
        this.loseStreak = 0;

        this.flipNextBecauseWin5 = false;
        this.flipNextBecause3WinThenLose = false;
    }

    async updateData(gameData) {
        this.history.push(gameData);
        if (this.history.length > this.maxHistorySize) this.history.shift();

        if (this.lastPrediction) {
            const isWin = (this.lastPrediction === gameData.result);

            if (isWin) {
                this.winStreak++;
                this.loseStreak = 0;
                if (this.winStreak >= 5) {
                    this.flipNextBecauseWin5 = true;
                }
            } else {
                const hadWinStreakGTE3 = this.winStreak >= 3;
                this.loseStreak++;
                this.winStreak = 0;
                if (hadWinStreakGTE3) {
                    this.flipNextBecause3WinThenLose = true;
                }
            }
        }
    }

    async predict() {
        // Nếu chưa có phiên mới (history chưa đổi) → trả lại kết quả đã random
        if (this.lastPrediction && this.lastPredictedHistoryLen === this.history.length) {
            return { prediction: this.lastPrediction, confidence: 0.5 };
        }

        // Phiên mới: random base 50/50
        let base = Math.random() < 0.5 ? "Tài" : "Xỉu";
        let prediction = base;
        let flipped = false;

        // Áp dụng nguyên lý flip
        if (this.flipNextBecauseWin5) {
            prediction = (base === "Tài") ? "Xỉu" : "Tài";
            flipped = true;
            this.flipNextBecauseWin5 = false;
        } else if (this.flipNextBecause3WinThenLose) {
            prediction = (base === "Tài") ? "Xỉu" : "Tài";
            flipped = true;
            this.flipNextBecause3WinThenLose = false;
        }

        // Ghi nhớ kèo cho phiên hiện tại
        this.lastPrediction = prediction;
        this.lastPredictedHistoryLen = this.history.length;

        return { prediction, confidence: flipped ? 0.55 : 0.5 };
    }
}

module.exports = { MasterPredictor };