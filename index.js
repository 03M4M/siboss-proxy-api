const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const port = process.env.PORT || 3000;

// Menerima MP3 kecil dari SIBOSS SPEKRUM (C#)
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/sync-lyrics', upload.single('audioFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file audio yang dikirim.' });
        }

        const CHUTES_API_KEY = process.env.CHUTES_API_KEY;
        if (!CHUTES_API_KEY) {
            return res.status(500).json({ error: 'API Key Server belum di-setting!' });
        }

        // KITA KEMBALI MENGGUNAKAN FORM-DATA STANDAR (Tanpa Base64!)
        const formData = new FormData();
        formData.append('file', req.file.buffer, { filename: 'audio.mp3', contentType: req.file.mimetype });
        
        // Di artikel tertulis whisper-1, tapi biasanya di Chutes namanya whisper-large-v3. Kita coba yang v3 dulu.
        formData.append('model', 'whisper-large-v3'); 
        
        // Minta balasan berupa SRT (agar ada Start dan End detiknya)
        formData.append('response_format', 'srt');    

        // INI DIA URL VIP-NYA! (Standar OpenAI)
        const chutesUrl = 'https://api.chutes.ai/v1/audio/transcriptions'; 
        
        const chutesResponse = await axios.post(chutesUrl, formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${CHUTES_API_KEY}` 
            }
        });

        // Kirim hasil lirik langsung ke C#
        res.status(200).send(chutesResponse.data);

    } catch (error) {
        console.error('Error dari Chutes:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Gagal memproses lirik di server AI.' });
    }
});

app.listen(port, () => {
    console.log(`Server Proxy VIP berjalan di port ${port}`);
});
