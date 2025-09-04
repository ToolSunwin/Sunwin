const TAI = "Tài";
const XIU = "Xỉu";

class MasterPredictor {
    constructor(maxHistorySize = 1000) {
        this.history = [];
        this.maxHistorySize = maxHistorySize;
    }

    async updateData(gameData) {
        // gameData: { score, result }
        this.history.push(gameData);
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    async predict() {
        if (this.history.length === 0) {
            // Nếu chưa có dữ liệu, dự đoán ngẫu nhiên
            return {
                prediction: Math.random() > 0.5 ? TAI : XIU,
                confidence: 0.5,
                reason: "Chưa có dữ liệu lịch sử"
            };
        }

        // Lấy 5 phiên gần nhất
        const last5 = this.history.slice(-5);
        const taiCount = last5.filter(h => h.result === TAI).length;
        const xiuCount = last5.filter(h => h.result === XIU).length;

        let prediction = TAI;
        let confidence = 0.5;

        if (taiCount > xiuCount) {
            prediction = XIU; // dự đoán ngược chuỗi gần nhất
            confidence = taiCount / 5;
        } else if (xiuCount > taiCount) {
            prediction = TAI;
            confidence = xiuCount / 5;
        } else {
            prediction = Math.random() > 0.5 ? TAI : XIU;
            confidence = 0.5;
        }

        return { prediction, confidence, reason: "Rule-based theo 5 phiên gần nhất" };
    }
}

module.exports = { MasterPredictor };