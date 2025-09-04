const TAI = "Tài";
const XIU = "Xỉu";

class MasterPredictor {
    constructor(maxHistorySize = 1000) {
        this.history = []; // Lưu lịch sử các phiên đã phân tích
        this.maxHistorySize = maxHistorySize;
    }

    // Cập nhật dữ liệu mới (score, result)
    async updateData(gameData) {
        // gameData = { score, result }
        this.history.push(gameData);
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    // Dự đoán phiên tiếp theo
    async predict() {
        if (this.history.length === 0) {
            // Nếu chưa có dữ liệu, dự đoán ngẫu nhiên
            const randomPrediction = Math.random() > 0.5 ? TAI : XIU;
            const randomConfidence = Math.random() * 0.8 + 0.1; // 10% → 90%
            return {
                prediction: randomPrediction,
                confidence: randomConfidence,
                reason: "Chưa có dữ liệu lịch sử, dự đoán ngẫu nhiên"
            };
        }

        // Lấy 5 phiên gần nhất
        const last5 = this.history.slice(-5);
        const taiCount = last5.filter(h => h.result === TAI).length;
        const xiuCount = last5.filter(h => h.result === XIU).length;

        let prediction, confidence;

        // Dự đoán ngược chuỗi gần nhất
        if (taiCount > xiuCount) {
            prediction = XIU;
            confidence = taiCount / 5; // tỷ lệ Tài trong 5 phiên
        } else if (xiuCount > taiCount) {
            prediction = TAI;
            confidence = xiuCount / 5; // tỷ lệ Xỉu trong 5 phiên
        } else {
            // Nếu bằng nhau, dự đoán ngẫu nhiên
            prediction = Math.random() > 0.5 ? TAI : XIU;
            confidence = 0.5;
        }

        return {
            prediction,
            confidence,
            reason: `Rule-based dựa trên 5 phiên gần nhất (Tài:${taiCount}, Xỉu:${xiuCount})`
        };
    }
}

module.exports = { MasterPredictor };