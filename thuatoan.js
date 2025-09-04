// thuatoan.js
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

    computeValue() {
        if (this.history.length < 2) return null;

        const last = this.history[this.history.length - 1]; // phiên N-1
        const prev = this.history[this.history.length - 2]; // phiên N-2

        let value = last.score + prev.d2;

        [18, 12, 5].forEach(threshold => {
            if (value >= threshold) value -= threshold;
        });

        return value;
    }

    async predict() {
        const value = this.computeValue();
        if (value === null) {
            return { prediction: "?", confidence: 0.5, reason: "Chưa đủ dữ liệu" };
        }

        const isEven = value % 2 === 0;

        if (this.history.length < 30) {
            // ✅ 30 phiên đầu: chỉ áp dụng công thức gốc, tính từng phiên
            const prediction = isEven ? "Tài" : "Xỉu";
            return {
                prediction,
                confidence: 0.55,
                reason: `(<30 phiên) Cầu Thuận mặc định, value=${value} → ${prediction}`
            };
        }

        // ✅ Sau 30 phiên: chọn cầu Thuận/Nghịch dựa vào thống kê
        const predictThuan = isEven ? "Tài" : "Xỉu";
        const predictNghich = isEven ? "Xỉu" : "Tài";

        const recent = this.history.slice(-30);
        let correctThuan = 0, correctNghich = 0;

        for (let i = 2; i < recent.length; i++) {
            let temp = recent[i - 1].score + recent[i - 2].d2;
            [18, 12, 5].forEach(threshold => {
                if (temp >= threshold) temp -= threshold;
            });
            const even = temp % 2 === 0;
            const pThuan = even ? "Tài" : "Xỉu";
            const pNghich = even ? "Xỉu" : "Tài";

            if (pThuan === recent[i].result) correctThuan++;
            if (pNghich === recent[i].result) correctNghich++;
        }

        const useThuan = correctThuan >= correctNghich;
        const finalPrediction = useThuan ? predictThuan : predictNghich;

        return {
            prediction: finalPrediction,
            confidence: 0.6,
            reason: `(>=30 phiên) Value=${value}, chọn ${useThuan ? "Thuận" : "Nghịch"}`
        };
    }
}

module.exports = { MasterPredictor };