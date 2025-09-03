// thuatoan.js
class MasterPredictor {
    constructor(maxHistorySize = 1000, subtract = 5) {
        this.history = [];
        this.maxHistorySize = maxHistorySize;
        this.subtract = subtract; 
        this.mode = "thuan"; // mặc định, sẽ auto detect lại
    }

    async updateData(gameData) {
        // gameData: {dice:[d1,d2,d3], score, result}
        this.history.push(gameData);
        if (this.history.length > this.maxHistorySize) this.history.shift();

        // đủ dữ liệu thì auto nhận biết cầu
        if (this.history.length >= 20) {
            this.autoDetectMode();
        }
    }

    calcCau(d1, d2, d3, mode) {
        // công thức: tổng 3 xí ngầu + xúc xắc 2 - subtract
        const R = (d1 + d2 + d3 + d2) - this.subtract;
        const parity = Math.abs(R) % 2; // chẵn/lẻ
        if (mode === "thuan") {
            return parity === 0 ? "Xỉu" : "Tài";
        } else {
            return parity === 0 ? "Tài" : "Xỉu";
        }
    }

    autoDetectMode() {
        const recent = this.history.slice(-30); // lấy 30 phiên gần nhất
        let correctThuan = 0, correctNghich = 0;

        for (const h of recent) {
            const predThuan = this.calcCau(...h.dice, "thuan");
            const predNghich = this.calcCau(...h.dice, "nghich");
            if (predThuan === h.result) correctThuan++;
            if (predNghich === h.result) correctNghich++;
        }

        const accThuan = correctThuan / recent.length;
        const accNghich = correctNghich / recent.length;

        // in log theo dõi
        console.log(`[AUTO-DETECT] Cầu Thuận đúng ${correctThuan}/${recent.length} (${(accThuan*100).toFixed(1)}%)`);
        console.log(`[AUTO-DETECT] Cầu Nghịch đúng ${correctNghich}/${recent.length} (${(accNghich*100).toFixed(1)}%)`);

        // chọn cầu mạnh hơn
        this.mode = accThuan >= accNghich ? "thuan" : "nghich";
        console.log(`[AUTO-DETECT] Đang chọn cầu: ${this.mode.toUpperCase()}`);
    }

    async predict() {
        if (this.history.length === 0) {
            return { prediction: "?", confidence: 0.5, reason: "Chưa có dữ liệu" };
        }

        const lastDice = this.history[this.history.length - 1].dice;
        const prediction = this.calcCau(...lastDice, this.mode);

        return {
            prediction,
            confidence: 0.75,
            reason: `Áp dụng cầu ${this.mode} với subtract ${this.subtract}`
        };
    }
}

module.exports = { MasterPredictor };