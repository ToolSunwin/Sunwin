// thuatoan.js
class MasterPredictor {
    constructor(maxHistorySize = 1000) {
        this.history = [];
        this.maxHistorySize = maxHistorySize;
    }

    // Cập nhật dữ liệu một phiên mới
    async updateData(gameData) {
        // gameData: {session, dice1, dice2, dice3, score, result}
        this.history.push(gameData);
        if (this.history.length > this.maxHistorySize) this.history.shift();
    }

    // Dự đoán phiên kế tiếp dựa trên phiên trước
    predictNext() {
        if (this.history.length < 1) {
            return {
                prediction: "?",
                confidence: 0.5,
                reason: "Chưa có phiên trước để dự đoán"
            };
        }

        const prev = this.history[this.history.length - 1]; // phiên trước

        let calc = prev.score + prev.dice2;
        let prediction, reason;

        if (calc < 5) {
            // Đảo ngược phiên trước
            prediction = (prev.result === "Tài") ? "Xỉu" : "Tài";
            reason = `Tổng (${prev.score}+${prev.dice2}=${calc}) < 5 → đảo kết quả phiên trước (${prev.result} → ${prediction})`;
        } else {
            if (calc >= 5 && calc <= 11) calc -= 5;
            else if (calc >= 12 && calc <= 17) calc -= 12;
            else if (calc >= 18) calc -= 18;

            prediction = (calc % 2 === 0) ? "Tài" : "Xỉu";
            reason = `Tổng phiên trước ${prev.score}+xí ngầu2 ${prev.dice2} → ${calc} → ${prediction}`;
        }

        return { prediction, confidence: 0.7, reason };
    }

    // Dự đoán liên tiếp từng phiên từ một mảng dữ liệu mới
    predictSeries(newDataArray) {
        const results = [];
        for (let data of newDataArray) {
            this.updateData(data);  // cập nhật từng phiên
            const pred = this.predictNext();
            results.push({
                session: data.session,
                prediction: pred.prediction,
                reason: pred.reason
            });
        }
        return results;
    }
}

module.exports = { MasterPredictor };