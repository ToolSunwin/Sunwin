const TAI = "Tài";
const XIU = "Xỉu";

class MasterPredictor {
    constructor(maxHistorySize = 1000) {
        this.history = [];
        this.maxHistorySize = maxHistorySize;
    }

    async updateData(gameData) {
        this.history.push(gameData);
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    async predict() {
        // Dự đoán ngẫu nhiên
        const randomPrediction = Math.random() > 0.5 ? TAI : XIU;
        
        // Độ tin cậy ngẫu nhiên từ 10% đến 90%
        const randomConfidence = Math.random() * 0.8 + 0.1;
        
        return {
            prediction: randomPrediction,
            confidence: randomConfidence,
            reason: "Dự đoán ngẫu nhiên hoàn toàn với độ tin cậy ngẫu nhiên"
        };
    }
}

module.exports = { MasterPredictor };