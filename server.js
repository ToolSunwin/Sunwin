// server.js
const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const { FormulaPredictor } = require('./thuatoan.js'); // dùng FormulaPredictor

const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

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
let currentSessionId = null;
let lastPrediction = null;
const fullHistory = [];

const predictor = new FormulaPredictor();

const WEBSOCKET_URL = "wss://websocket.azhkthg1.net/websocket?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbW91bnQiOjAsInVzZXJuYW1lIjoiU0NfYXBpc3Vud2luMTIzIn0.hgrRbSV6vnBwJMg9ZFtbx3rRu9mX_hZMZ_m5gMNhkw0";
const WS_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Origin": "https://play.sun.win"
};
const RECONNECT_DELAY = 2500;
const PING_INTERVAL = 15000;

const initialMessages = [
    [1, "MiniGame", "GM_fbbdbebndbbc", "123123p", { "info": "{\"ipAddress\":\"127.0.0.1\"}", "signature": "xxx" }],
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

            if (cmd === 1008 && sid) currentSessionId = sid;

            if (cmd === 1003 && gBB) {
                if (!d1 || !d2 || !d3) return;

                const total = d1 + d2 + d3;
                const result = total > 10 ? "Tài" : "Xỉu";

                // Kiểm tra dự đoán phiên trước
                if (lastPrediction && lastPrediction !== "?") {
                    if (lastPrediction === result) apiResponseData.tong_dung++;
                    else apiResponseData.tong_sai++;
                }

                const totalGames = apiResponseData.tong_dung + apiResponseData.tong_sai;
                apiResponseData.ty_le_thang_lich_su = totalGames === 0 ? "0%" : `${((apiResponseData.tong_dung / totalGames) * 100).toFixed(0)}%`;

                // Lưu lịch sử
                const historyEntry = {
                    session: currentSessionId,
                    d1, d2, d3,
                    totalScore: total,
                    result,
                    prediction: lastPrediction,
                    correctness: lastPrediction === result ? "ĐÚNG" : lastPrediction && lastPrediction !== "?" ? "SAI" : null
                };
                fullHistory.push(historyEntry);
                if (fullHistory.length > MAX_HISTORY_SIZE) fullHistory.shift();

                // Cập nhật predictor
                await predictor.updateData({ dice: [d1, d2, d3], result: result });

                // Lấy dự đoán mới
                const predictionResult = await predictor.predict();
                let finalPrediction = "?";
                let predictionConfidence = "0%";
                if (predictionResult && predictionResult.prediction) {
                    finalPrediction = predictionResult.prediction;
                    predictionConfidence = `${(predictionResult.confidence * 100).toFixed(0)}%`;
                }

                // Cập nhật apiResponseData
                apiResponseData.phien = currentSessionId;
                apiResponseData.xuc_xac_1 = d1;
                apiResponseData.xuc_xac_2 = d2;
                apiResponseData.xuc_xac_3 = d3;
                apiResponseData.tong = total;
                apiResponseData.ket_qua = result;
                apiResponseData.du_doan = finalPrediction;
                apiResponseData.do_tin_cay = predictionConfidence;
                apiResponseData.pattern = fullHistory.map(h => h.result === 'Tài' ? 'T' : 'X').join('');
                apiResponseData.tong_phien_da_phan_tich = fullHistory.length;

                lastPrediction = finalPrediction;
                currentSessionId = null;

                console.log(`Phiên #${apiResponseData.phien}: ${apiResponseData.tong} (${result}) | Dự đoán: ${finalPrediction} | Tin cậy: ${predictionConfidence} | Tỷ lệ thắng: ${apiResponseData.ty_le_thang_lich_su}`);
            }
        } catch (e) {
            console.error('[❌] Lỗi xử lý message:', e.message);
        }
    });

    ws.on('close', (code, reason) => {
        console.log(`[🔌] WebSocket closed. Reconnecting in ${RECONNECT_DELAY}ms...`);
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
    res.json(apiResponseData);
});

// API lịch sử
app.get('/history', (req, res) => {
    let html = `<style>
        body{font-family:monospace;background-color:#121212;color:#e0e0e0;}
        h2{color:#4e8af4;}
        .entry{border-bottom:1px solid #444;padding:8px;margin-bottom:5px;background-color:#1e1e1e;border-radius:4px;}
        .tai,.dung{color:#28a745;font-weight:bold;}
        .xiu,.sai{color:#dc3545;font-weight:bold;}
    </style>
    <h2>Lịch sử ${fullHistory.length} phiên gần nhất</h2>`;

    if (fullHistory.length === 0) html += '<p>Chưa có dữ liệu lịch sử.</p>';
    else {
        [...fullHistory].reverse().forEach(h => {
            const resultClass = h.result === 'Tài' ? 'tai' : 'xiu';
            let statusHtml = '';
            if (h.correctness === "ĐÚNG") statusHtml = ` <span class="dung">✅ ĐÚNG</span>`;
            else if (h.correctness === "SAI") statusHtml = ` <span class="sai">❌ SAI</span>`;
            const predictionHtml = h.prediction && h.prediction !== "?" ? `- Dự đoán: <b>${h.prediction}</b>${statusHtml}<br/>` : '';
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

// Trang chính
app.get('/', (req, res) => {
    res.send(`<h2>🎯 API Phân Tích Sunwin Tài Xỉu</h2>
        <p>Xem kết quả JSON: <a href="/sunlon">/sunlon</a></p>
        <p>Xem lịch sử 1000 phiên gần nhất: <a href="/history">/history</a></p>`);
});

app.listen(PORT, () => {
    console.log(`[🌐] Server is running at http://localhost:${PORT}`);
    connectWebSocket();
});