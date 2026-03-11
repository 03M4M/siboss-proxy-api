const express = require('express');
const multer = require('multer');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Menerima file MP3 dari aplikasi C# SIBOSS SPEKRUM
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/sync-lyrics', upload.single('audioFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file audio yang dikirim.' });
        }

        const CHUTES_API_KEY = process.env.CHUTES_API_KEY;
        if (!CHUTES_API_KEY) {
            return res.status(500).json({ error: 'API Key Server belum di-setting di Heroku!' });
        }

        // 1. UBAH MP3 MENJADI FORMAT BASE64 (Sesuai permintaan Chutes)
        const audioBase64 = req.file.buffer.toString('base64');

        // 2. SIAPKAN PAKET JSON (Persis seperti kode 'curl' dari web Chutes)
        const payload = {
            audio_b64: audioBase64
        };

        // 3. TEMBAK KE URL CHUTES
        const chutesUrl = 'https://chutes-whisper-large-v3.chutes.ai/transcribe'; 
        
        const chutesResponse = await axios.post(chutesUrl, payload, {
            headers: {
                'Authorization': `Bearer ${CHUTES_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // 4. Kirim hasil lirik (teks/timestamp) kembali ke SIBOSS SPEKRUM
        res.status(200).json(chutesResponse.data);

    } catch (error) {
        console.error('Error dari Chutes:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Gagal memproses lirik di server AI Chutes.' });
    }
});

app.listen(port, () => {
    console.log(`Server SIBOSS Proxy berjalan di port ${port}`);
});
