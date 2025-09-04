// thuatoan.js
class MasterPredictor {
    constructor() {
        this.history = []; // lưu phiên đã có kết quả
        this.correctCounts = { thuan: 0, nghich: 0 };
        this.totalCounts = { thuan: 0, nghich: 0 };
    }

    // Cập nhật dữ liệu khi có kết quả mới
    async updateData({ session, dice, total, result }) {
        this.history.push({ session, dice, total, result });
        if (this.history.length > 1000) this.history.shift();

        // Sau khi có kết quả mới, kiểm tra lại dự đoán trước đó (nếu có)
        if (this.history.length >= 3) {
            const last = this.history[this.history.length - 1];     // phiên vừa ra kết quả
            const prevPrediction = this.history[this.history.length - 1].prediction;

            if (prevPrediction) {
                // Cầu thuận
                this.totalCounts.thuan++;
                if (prevPrediction.thuan === last.result) {
                    this.correctCounts.thuan++;
                }
                // Cầu nghịch
                this.totalCounts.nghich++;
                if (prevPrediction.nghich === last.result) {
                    this.correctCounts.nghich++;
                }
            }
        }
    }

    // Hàm tính toán dự đoán
    calculatePrediction() {
        if (this.history.length < 2) return null; // cần ít nhất 2 phiên để tính

        const last = this.history[this.history.length - 1];   // phiên N-1
        const prev = this.history[this.history.length - 2];   // phiên N-2

        const sum = last.total + prev.dice[1]; // tổng phiên N-1 + xúc xắc 2 của N-2

        // Trừ dần 18, 12, 5 nếu >=
        let value = sum;
        if (value >= 18) value -= 18;
        else if (value >= 12) value -= 12;
        else if (value >= 5) value -= 5;

        const basePrediction = (value % 2 === 0) ? "Tài" : "Xỉu";

        // Trả về cả 2 kiểu cầu
        return {
            thuan: basePrediction,
            nghich: (basePrediction === "Tài" ? "Xỉu" : "Tài")
        };
    }

    async predict() {
        if (this.history.length < 2) {
            return { prediction: "?", confidence: 0 };
        }

        const predictionSet = this.calculatePrediction();
        if (!predictionSet) return { prediction: "?", confidence: 0 };

        let finalPrediction = predictionSet.thuan; // mặc định cầu thuận

        // Sau 30 phiên thì xét xem cầu nào đang đúng hơn
        if (this.history.length > 30) {
            const rateThuan = this.totalCounts.thuan === 0 ? 0 : this.correctCounts.thuan / this.totalCounts.thuan;
            const rateNghich = this.totalCounts.nghich === 0 ? 0 : this.correctCounts.nghich / this.totalCounts.nghich;

            if (rateNghich > rateThuan) {
                finalPrediction = predictionSet.nghich;
            } else {
                finalPrediction = predictionSet.thuan;
            }
        }

        // Lưu dự đoán này vào phiên mới nhất để kiểm tra sau này
        this.history[this.history.length - 1].prediction = predictionSet;

        return { prediction: finalPrediction, confidence: 1 };
    }
}

module.exports = { MasterPredictor };