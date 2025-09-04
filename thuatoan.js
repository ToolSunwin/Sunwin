// thuatoan.js
class MasterPredictor {
    constructor(maxHistorySize = 1000) {
        this.history = [];           // lưu lịch sử {session, dice[], total, result}
        this.maxHistorySize = maxHistorySize;
    }

    async updateData(gameData) {
        // gameData: {score, result, d1, d2, d3, session}
        this.history.push(gameData);
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    // Hàm tính toán theo công thức bạn đưa
    computeValue() {
        if (this.history.length < 2) return null;

        const last = this.history[this.history.length - 1];     // phiên N-1
        const prev = this.history[this.history.length - 2];     // phiên N-2

        let value = last.score + prev.d2; // tổng phiên N-1 + xúc xắc 2 của N-2

        // trừ dần 18, 12, 5 nếu >=
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
            // 30 phiên đầu: mặc định cầu Thuận
            const prediction = isEven ? "Tài" : "Xỉu";
            return {
                prediction,
                confidence: 0.55,
                reason: `30 phiên đầu → cầu Thuận, giá trị=${value}, ${isEven ? "chẵn=Tài" : "lẻ=Xỉu"}`
            };
        }

        // Sau 30 phiên → so sánh cầu Thuận/Nghịch
        const predictThuan = isEven ? "Tài" : "Xỉu";
        const predictNghich = isEven ? "Xỉu" : "Tài";

        // Tính độ chính xác của Thuận và Nghịch trong 30 phiên gần nhất
        const recent = this.history.slice(-30);
        let correctThuan = 0, correctNghich = 0;
        for (let i = 2; i < recent.length; i++) {
            const val = recent[i - 1].score + recent[i - 2].d2;
            let temp = val;
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
        const confidence = 0.6 + Math.min(0.2, Math.abs(correctThuan - correctNghich) / recent.length);

        return {
            prediction: finalPrediction,
            confidence,
            reason: `Giá trị=${value}, ${isEven ? "chẵn" : "lẻ"} → ${useThuan ? "cầu Thuận" : "cầu Nghịch"} (Thuận đúng ${correctThuan}, Nghịch đúng ${correctNghich} trong 30 phiên)`
        };
    }
}

module.exports = { MasterPredictor };