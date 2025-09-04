// thuatoan.js
class MasterPredictor {
    constructor(maxHistorySize = 1000) {
        this.history = [];           // lưu lịch sử {session, d1, d2, d3, score, result}
        this.maxHistorySize = maxHistorySize;
    }

    async updateData(gameData) {
        this.history.push(gameData);
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    // Hàm tính giá trị công thức
    computeValue() {
        if (this.history.length < 2) return null;

        const last = this.history[this.history.length - 1]; // phiên N-1
        const prev = this.history[this.history.length - 2]; // phiên N-2

        let value = last.score + prev.d2;

        console.log(`\n[DEBUG] --- Tính toán phiên mới ---`);
        console.log(`[DEBUG] Phiên N-1: ${last.session}, score=${last.score}`);
        console.log(`[DEBUG] Phiên N-2: ${prev.session}, d2=${prev.d2}`);
        console.log(`[DEBUG] Sum ban đầu = ${value}`);

        // trừ 18, 12, 5 nếu đủ
        [18, 12, 5].forEach(threshold => {
            if (value >= threshold) {
                value -= threshold;
                console.log(`[DEBUG] Trừ ${threshold} => ${value}`);
            }
        });

        console.log(`[DEBUG] Value cuối cùng = ${value}`);
        return value;
    }

    async predict() {
        const value = this.computeValue();
        if (value === null) {
            return {
                prediction: "?",
                confidence: 0.5,
                reason: "Chưa đủ dữ liệu"
            };
        }

        // công thức gốc: chẵn = Tài, lẻ = Xỉu
        const isEven = value % 2 === 0;
        let prediction;

        if (this.history.length < 30) {
            // 30 phiên đầu: mặc định cầu Thuận
            prediction = isEven ? "Tài" : "Xỉu";
            console.log(`[DEBUG] (<30 phiên) Cầu Thuận mặc định: value=${value} (${isEven ? "chẵn" : "lẻ"}) => ${prediction}`);
            return {
                prediction,
                confidence: 0.55,
                reason: `30 phiên đầu → cầu Thuận mặc định, value=${value}, ${isEven ? "chẵn=Tài" : "lẻ=Xỉu"}`
            };
        }

        // Sau 30 phiên → chọn cầu Thuận hay Nghịch
        const predictThuan = isEven ? "Tài" : "Xỉu";   // đúng công thức
        const predictNghich = isEven ? "Xỉu" : "Tài";  // đảo ngược

        // Kiểm tra 30 phiên gần nhất
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
        prediction = useThuan ? predictThuan : predictNghich;

        console.log(`[DEBUG] (>=30 phiên) Value=${value}, ${isEven ? "chẵn" : "lẻ"}`);
        console.log(`[DEBUG] Thống kê 30 phiên: Thuận=${correctThuan}, Nghịch=${correctNghich}`);
        console.log(`[DEBUG] => Dùng ${useThuan ? "Thuận" : "Nghịch"} => ${prediction}`);

        return {
            prediction,
            confidence: 0.6,
            reason: `Value=${value}, ${isEven ? "chẵn" : "lẻ"} → ${useThuan ? "Thuận" : "Nghịch"}`
        };
    }
}

module.exports = { MasterPredictor };