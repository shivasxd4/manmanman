const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const PORT = 3000;

app.use('/Ozellikler', express.static(path.join(__dirname, 'Ozellikler')));

io.on('connection', (socket) => {
    let tiktok;

    socket.on('set-user', (username) => {
        const cleanUser = username.replace('@', '');
        if (tiktok) tiktok.disconnect();

        tiktok = new WebcastPushConnection(cleanUser);
        tiktok.connect()
            .then(s => console.log(`v10 Ejderha Aktif: @${cleanUser}`))
            .catch(e => console.error("Bağlantı Hatası:", e.message));

        // TÜM HEDİYELER (En küçük gül dahil)
        tiktok.on('gift', d => {
            // Kombo devam ediyorsa veya bittiyse her türlü veriyi gönder
            io.emit('event', { 
                ...d, 
                type: 'gift', 
                text: `${d.giftName.toUpperCase()} FIRLATTI!`,
                isCombo: d.repeatEnd === false
            });
        });

        // TAKİP
        tiktok.on('follow', d => io.emit('event', { ...d, type: 'follow', text: "AİLEYE KATILDI!" }));

        // 100 BEĞENİ
        let likeTracker = {};
        tiktok.on('like', d => {
            likeTracker[d.uniqueId] = (likeTracker[d.uniqueId] || 0) + d.likeCount;
            if (likeTracker[d.uniqueId] >= 100) {
                io.emit('event', { ...d, type: 'like', text: "100 PENÇE ATTI!" });
                likeTracker[d.uniqueId] = 0;
            }
        });
    });
});

httpServer.listen(PORT, () => console.log(`v10 Server: http://localhost:${PORT}/Ozellikler/index.html?k=@kullaniciadi`));