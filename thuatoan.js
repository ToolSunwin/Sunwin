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

    /**
     * Logistic Regression đơn giản: score cao thì nghiêng về Tài
     */
    logisticPredict(score) {
        // tham số ước lượng (train sơ bộ từ luật Tài >= 11, Xỉu <= 10)
        const w0 = -7; // bias
        const w1 = 0.8; // trọng số score
        const z = w0 + w1 * score;
        const prob = 1 / (1 + Math.exp(-z));
        return { prediction: prob > 0.5 ? "Tài" : "Xỉu", confidence: prob };
    }

    /**
     * Markov chain: nhìn chuỗi gần nhất
     */
    markovPredict(seqLength = 3) {
        if (this.history.length <= seqLength) return { prediction: "?", confidence: 0 };

        const recentSeq = this.history.slice(-seqLength).map(h => h.result).join('');
        let nextCounts = { "Tài": 0, "Xỉu": 0 };

        for (let i = 0; i < this.history.length - seqLength; i++) {
            const seq = this.history.slice(i, i + seqLength).map(h => h.result).join('');
            if (seq === recentSeq) {
                const next = this.history[i + seqLength].result;
                nextCounts[next]++;
            }
        }

        const total = nextCounts["Tài"] + nextCounts["Xỉu"];
        if (total === 0) return { prediction: "?", confidence: 0 };

        const prediction = nextCounts["Tài"] > nextCounts["Xỉu"] ? "Tài" : "Xỉu";
        const confidence = Math.max(nextCounts["Tài"], nextCounts["Xỉu"]) / total;
        return { prediction, confidence };
    }

    /**
     * Thống kê tỷ lệ Tài/Xỉu toàn bộ lịch sử
     */
    ratioPredict() {
        if (this.history.length === 0) return { prediction: "?", confidence: 0 };

        const taiCount = this.history.filter(h => h.result === "Tài").length;
        const xiuCount = this.history.length - taiCount;
        if (taiCount === xiuCount) return { prediction: "?", confidence: 0.5 };

        const prediction = taiCount > xiuCount ? "Tài" : "Xỉu";
        const confidence = Math.max(taiCount, xiuCount) / this.history.length;
        return { prediction, confidence };
    }

    /**
     * Ensemble: kết hợp 3 dự đoán
     */
    async predict() {
        if (this.history.length < 20) {
            return { prediction: "?", confidence: 0 };
        }

        const lastScore = this.history[this.history.length - 1].score;

        const logistic = this.logisticPredict(lastScore);
        const markov = this.markovPredict(4);  // thử depth 4
        const ratio = this.ratioPredict();

        // gán trọng số
        const weights = { logistic: 0.4, markov: 0.4, ratio: 0.2 };

        // gom dự đoán
        let scoreTai = 0, scoreXiu = 0;
        if (logistic.prediction === "Tài") scoreTai += logistic.confidence * weights.logistic;
        else scoreXiu += (1 - logistic.confidence) * weights.logistic;

        if (markov.prediction === "Tài") scoreTai += markov.confidence * weights.markov;
        else if (markov.prediction === "Xỉu") scoreXiu += markov.confidence * weights.markov;

        if (ratio.prediction === "Tài") scoreTai += ratio.confidence * weights.ratio;
        else if (ratio.prediction === "Xỉu") scoreXiu += ratio.confidence * weights.ratio;

        const prediction = scoreTai >= scoreXiu ? "Tài" : "Xỉu";
        const confidence = Math.max(scoreTai, scoreXiu);

        return { prediction, confidence: parseFloat(confidence.toFixed(3)) };
    }
}

module.exports = { MasterPredictor };