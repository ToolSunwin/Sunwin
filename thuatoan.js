const TAI = "Tài";
const XIU = "Xỉu";

class FormulaPredictor {
    constructor() {
        this.history = [];
        this.subtractValue = 5; // Giá trị trừ
        this.minRange = 12;     // Ngưỡng dưới
        this.maxRange = 18;     // Ngưỡng trên
    }

    async updateData(gameData) {
        this.history.push(gameData);
    }

    // Tính toán kết quả theo công thức
    calculateFormula(dice) {
        const [d1, d2, d3] = dice;
        return (d1 + d2 + d3 + d2) - this.subtractValue;
    }

    async predict() {
        if (this.history.length === 0) {
            return {
                prediction: "?",
                confidence: 0.5,
                reason: "Chưa có dữ liệu để dự đoán"
            };
        }

        // Lấy kết quả xí ngầu gần nhất
        const lastDice = this.history[this.history.length - 1].dice;
        
        // Tính toán theo công thức
        const result = this.calculateFormula(lastDice);
        
        // Dự đoán dựa trên khoảng giá trị
        const prediction = (result >= this.minRange && result <= this.maxRange) ? TAI : XIU;
        
        return {
            prediction: prediction,
            confidence: 0.8, // Độ tin cậy cao
            reason: `Kết quả tính toán: ${result} (${lastDice.join('+')}+${lastDice[1]}-${this.subtractValue}=${result}) -> ${prediction}`,
            calculation: {
                dice: lastDice,
                formula: `(${lastDice.join('+')}+${lastDice[1]}-${this.subtractValue})`,
                result: result,
                range: `${this.minRange}-${this.maxRange}`
            }
        };
    }

    // Phương thức kiểm tra công thức với dữ liệu lịch sử
    async testFormula() {
        if (this.history.length === 0) {
            return "Chưa có dữ liệu để kiểm tra";
        }

        let correct = 0;
        let total = this.history.length;

        for (const game of this.history) {
            const result = this.calculateFormula(game.dice);
            const prediction = (result >= this.minRange && result <= this.maxRange) ? TAI : XIU;
            
            if (prediction === game.result) {
                correct++;
            }
        }

        const accuracy = (correct / total) * 100;
        
        return {
            totalGames: total,
            correctPredictions: correct,
            accuracy: accuracy.toFixed(2) + '%',
            formula: `Tổng 3 xí ngầu + xí ngầu 2 - ${this.subtractValue}`,
            condition: `Nếu kết quả từ ${this.minRange} đến ${this.maxRange} thì Tài, ngược lại Xỉu`
        };
    }
}

module.exports = { FormulaPredictor, TAI, XIU };