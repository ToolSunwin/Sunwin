// server.js
const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const { MasterPredictor } = require('./thuatoan.js');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

// Dữ liệu JSON phản hồi
let apiResponseData = {
    id: "MR SIMON - S77",
    phien: null,
    xuc_xac_1: null,
    xuc_xac_2: null,
    xuc_xac_3: null,
    tong: null,
    ket_qua: "",
    du_doan: "?",
    do_tin_cay: "0%",
    tong_dung: 0,
    tong_sai: 0,
    ty_le_thang_lich_su: "0%",
    pattern: "",
    tong_phien_da_phan_tich: 0
};

const MAX_HISTORY_SIZE = 1000;
const fullHistory = [];

const predictor = new MasterPredictor(MAX_HISTORY_SIZE);

let lastPrediction = null; // Lưu dự đoán cho phiên tiếp theo

// WebSocket config
const WEBSOCKET_URL = "wss://websocket.azhkthg1.net/websocket?token=YOUR_TOKEN";
const WS_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Origin": "https://play.sun.win"
};
const RECONNECT_DELAY = 2500;
const PING_INTERVAL = 15000;

const initialMessages = [
    [1, "MiniGame", "GM_fbbdbebndbbc", "123123p", { info: "{}", signature: "abc" }],
    [6, "MiniGame", "taixiuPlugin", { cmd: 1005 }],
    [6, "MiniGame", "lobbyPlugin", { cmd: 10001 }]
];

let ws = null;
let pingInterval = null;
let reconnectTimeout = null;

function connectWebSocket() {
    if (ws) {
        ws.removeAllListeners();
        ws.close();
    }
    ws = new WebSocket(WEBSOCKET_URL, { headers: WS_HEADERS });

    ws.on('open', () => {
        console.log('[✅] WebSocket connected.');
        initialMessages.forEach((msg, i) => {
            setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
            }, i * 600);
        });
        clearInterval(pingInterval);
        pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.ping();
        }, PING_INTERVAL);
    });

    ws.on('pong', () => console.log('[📶] Ping OK.'));

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            if (!Array.isArray(data) || typeof data[1] !== 'object') return;

            const { cmd, sid, d1, d2, d3, gBB } = data[1];

            // Khi có kết quả ra (cmd=1003)
            if (cmd === 1003 && gBB) {
                if (!d1 || !d2 || !d3) return;

                const total = d1 + d2 + d3;
                const result = (total > 10) ? "Tài" : "Xỉu";

                // So sánh dự đoán cũ với kết quả hiện tại
                let correctnessStatus = null;
                if (lastPrediction && lastPrediction.prediction !== "?") {
                    if (lastPrediction.prediction === result) {
                        apiResponseData.tong_dung++;
                        correctnessStatus = "ĐÚNG";
                    } else {
                        apiResponseData.tong_sai++;
                        correctnessStatus = "SAI";
                    }
                }

                // Update vào history
                await predictor.updateData({ session: sid, d1, d2, d3, score: total, result });

                const totalGames = apiResponseData.tong_dung + apiResponseData.tong_sai;
                apiResponseData.ty_le_thang_lich_su =
                    totalGames === 0 ? "0%" : `${((apiResponseData.tong_dung / totalGames) * 100).toFixed(0)}%`;

                fullHistory.push({
                    session: sid,
                    d1, d2, d3,
                    totalScore: total,
                    result,
                    prediction: lastPrediction ? lastPrediction.prediction : "?",
                    correctness: correctnessStatus
                });
                if (fullHistory.length > MAX_HISTORY_SIZE) fullHistory.shift();

                // Gọi dự đoán cho phiên tiếp theo (N+1)
                const predictionResult = await predictor.predict();
                lastPrediction = predictionResult;

                apiResponseData.phien = sid;
                apiResponseData.xuc_xac_1 = d1;
                apiResponseData.xuc_xac_2 = d2;
                apiResponseData.xuc_xac_3 = d3;
                apiResponseData.tong = total;
                apiResponseData.ket_qua = result;
                apiResponseData.du_doan = predictionResult.prediction;
                apiResponseData.do_tin_cay = `${(predictionResult.confidence * 100).toFixed(0)}%`;
                apiResponseData.pattern = fullHistory.map(h => h.result === 'Tài' ? 'T' : 'X').join('');
                apiResponseData.tong_phien_da_phan_tich = fullHistory.length;

                console.log(`Phiên #${sid}: ${total} (${result}) | Dự đoán phiên sau: ${predictionResult.prediction} (${apiResponseData.do_tin_cay})`);
            }
        } catch (e) {
            console.error('[❌] Lỗi xử lý message:', e.message);
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`[🔌] WebSocket closed. Code: ${code}, Reason: ${reason.toString()}. Reconnecting...`);
        clearInterval(pingInterval);
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connectWebSocket, RECONNECT_DELAY);
    });

    ws.on('error', (err) => {
        console.error('[❌] WebSocket error:', err.message);
        ws.close();
    });
}

// API JSON
app.get('/sunlon', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(JSON.stringify(apiResponseData, null, 4));
});

// API lịch sử HTML
app.get('/history', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    let html = `<style>
                    body{font-family:monospace;background:#121212;color:#e0e0e0;}
                    h2{color:#4e8af4;}
                    .entry{border-bottom:1px solid #444;padding:8px;margin-bottom:5px;background:#1e1e1e;border-radius:4px;}
                    .tai,.dung{color:#28a745;font-weight:bold;}
                    .xiu,.sai{color:#dc3545;font-weight:bold;}
                </style>
                <h2>Lịch sử ${fullHistory.length} phiên gần nhất</h2>`;
    if (fullHistory.length === 0) {
        html += '<p>Chưa có dữ liệu.</p>';
    } else {
        [...fullHistory].reverse().forEach(h => {
            const resultClass = h.result === 'Tài' ? 'tai' : 'xiu';
            let statusHtml = '';
            if (h.correctness === "ĐÚNG") statusHtml = ` <span class="dung">✅ ĐÚNG</span>`;
            else if (h.correctness === "SAI") statusHtml = ` <span class="sai">❌ SAI</span>`;

            const predictionHtml = h.prediction && h.prediction !== "?"
                ? `- Dự đoán: <b>${h.prediction}</b>${statusHtml}<br/>`
                : '';

            html += `<div class="entry">
                        - Phiên: <b>${h.session}</b><br/>
                        ${predictionHtml}
                        - Kết quả: <span class="${resultClass}">${h.result}</span><br/>
                        - Xúc xắc: [${h.d1}]-[${h.d2}]-[${h.d3}] (Tổng: ${h.totalScore})
                     </div>`;
        });
    }
    res.send(html);
});

// Root
app.get('/', (req, res) => {
    res.send(`<h2>🎯 API Phân Tích Sunwin Tài Xỉu</h2>
              <p>Xem JSON: <a href="/sunlon">/sunlon</a></p>
              <p>Xem lịch sử: <a href="/history">/history</a></p>`);
});

app.listen(PORT, () => {
    console.log(`[🌐] Server running at http://localhost:${PORT}`);
    connectWebSocket();
});