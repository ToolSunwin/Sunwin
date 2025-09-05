const TAI = "Tài";
const XIU = "Xỉu";

class MasterPredictor {
    constructor() {
        this.history = [];
        this.subtractValue = 5;
        this.minRange = 12;
        this.maxRange = 18;
    }

    async updateData(gameData) {
        // Lưu dữ liệu game vào lịch sử
        this.history.push(gameData);
    }

    calculateFormula(dice) {
        const [d1, d2, d3] = dice;
        return (d1 + d2 + d3 + d2) - this.subtractValue;
    }

    async predict() {
        if (this.history.length === 0) {
            return {
                prediction: "?",
                confidence: 0.5
            };
        }

        // Lấy dữ liệu xúc xắc gần nhất
        const lastGame = this.history[this.history.length - 1];
        
        // Kiểm tra xem có dữ liệu xúc xắc không
        if (!lastGame.dice) {
            return {
                prediction: "?",
                confidence: 0.5
            };
        }

        const result = this.calculateFormula(lastGame.dice);
        const prediction = (result >= this.minRange && result <= this.maxRange) ? TAI : XIU;
        
        return {
            prediction: prediction,
            confidence: 0.8
        };
    }
}

module.exports = { MasterPredictor, TAI, XIU };