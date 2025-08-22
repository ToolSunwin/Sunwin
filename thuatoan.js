// thuatoan.js
class MasterPredictor {
    constructor(maxHistorySize = 1000) {
        this.history = [];
        this.maxHistorySize = maxHistorySize;
    }

    async updateData(gameData) {
        // gameData: {score, result}
        this.history.push(gameData);
        if (this.history.length > this.maxHistorySize) this.history.shift();
    }

    async predict() {
        if (this.history.length < 10) {
            return {
                prediction: "?",
                confidence: 0.5,
                reason: "Chưa đủ dữ liệu để dự đoán"
            };
        }

        // ================== PHÂN TÍCH ==================
        const seq = this.history.map(h => h.result);     // chuỗi Tài/Xỉu
        const totals = this.history.map(h => h.score);   // tổng điểm
        const last = seq[seq.length - 1];
        const lastScore = totals[totals.length - 1];

        // 1) Tính streak (chuỗi liên tiếp)
        let streakLen = 1;
        for (let i = seq.length - 2; i >= 0; i--) {
            if (seq[i] === last) streakLen++;
            else break;
        }

        // 2) Tính bias gần đây (20 phiên gần nhất)
        const recent = seq.slice(-20);
        const countTai = recent.filter(r => r === "Tài").length;
        const ratioTai = countTai / recent.length;

        // 3) Tín hiệu band (tổng điểm cực trị)
        let bandSignal = null;
        if (lastScore >= 14) bandSignal = "Xỉu";   // quá cao → dễ hồi Xỉu
        if (lastScore <= 7)  bandSignal = "Tài";   // quá thấp → dễ hồi Tài

        // ================== RA QUYẾT ĐỊNH ==================
        let prediction = "Tài";
        let confidence = 0.55;
        let reason = "Không có cầu mạnh, nghiêng Tài nhẹ";

        if (streakLen >= 3) {
            prediction = (last === "Tài") ? "Xỉu" : "Tài";
            confidence = 0.65;
            reason = `Chuỗi ${streakLen} ${last} → dự đoán gãy`;
        } else if (ratioTai > 0.65) {
            prediction = "Xỉu";
            confidence = 0.6;
            reason = "Tỉ lệ Tài 20 phiên gần đây quá cao → hồi mean về Xỉu";
        } else if (ratioTai < 0.35) {
            prediction = "Tài";
            confidence = 0.6;
            reason = "Tỉ lệ Xỉu 20 phiên gần đây quá cao → hồi mean về Tài";
        } else if (bandSignal) {
            prediction = bandSignal;
            confidence = 0.58;
            reason = `Tổng điểm ${lastScore} nằm vùng cực trị → dễ hồi về ${bandSignal}`;
        } else if (lastScore >= 9 && lastScore <= 12) {
            prediction = last === "Tài" ? "Xỉu" : "Tài";
            confidence = 0.57;
            reason = "Tổng điểm gần mốc 10–12 → dễ đảo chiều";
        } else {
            prediction = last; // giữ xu hướng
            confidence = 0.55;
            reason = "Không có cầu mạnh → giữ xu hướng gần nhất";
        }

        return { prediction, confidence, reason };
    }
}

module.exports = { MasterPredictor };