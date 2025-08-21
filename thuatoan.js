// thuatoan.js
class MasterPredictor {
    constructor() {
        this.history = [];             // lưu lịch sử {score, result}
        this.currentPrediction = null; // dự đoán đang dùng cho phiên hiện tại
        this.winStreak = 0;            // số ván ăn liên tiếp
        this.loseStreak = 0;           // số ván thua liên tiếp
        this.lastSession = null;       // để kiểm tra có sang phiên mới chưa
    }

    async updateData(gameData) {
        this.history.push(gameData);
        if (this.history.length > 1000) this.history.shift();

        // cập nhật kết quả thắng/thua dựa vào dự đoán trước đó
        if (this.currentPrediction) {
            if (gameData.result === this.currentPrediction) {
                this.winStreak++;
                this.loseStreak = 0;
            } else {
                this.loseStreak++;
                this.winStreak = 0;
            }
        }
    }

    async predict(sessionId) {
        // Nếu là phiên mới thì mới tính toán dự đoán
        if (this.lastSession !== sessionId) {
            let prediction;

            if (!this.currentPrediction) {
                // lần đầu tiên thì random
                prediction = Math.random() > 0.5 ? "Tài" : "Xỉu";
            } else {
                prediction = this.currentPrediction;

                // đảo khi đủ điều kiện
                if (this.winStreak >= 5 || this.loseStreak >= 3) {
                    prediction = prediction === "Tài" ? "Xỉu" : "Tài";
                    this.winStreak = 0;
                    this.loseStreak = 0;
                }
            }

            this.currentPrediction = prediction;
            this.lastSession = sessionId;
        }

        // luôn trả về cùng 1 kết quả trong phiên
        return { prediction: this.currentPrediction, confidence: 0.5 };
    }
}

module.exports = { MasterPredictor };