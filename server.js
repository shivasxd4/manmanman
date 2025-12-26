const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(express.static(__dirname));

// Ana URL'ye (manmanman.onrender.com) girince Overlay (Canlı Yayın Ekranı) açılır
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

// "/app.html" adresine girince Panel (Link Oluşturma) açılır
app.get('/app.html', (req, res) => { res.sendFile(path.join(__dirname, 'app.html')); });

io.on('connection', (socket) => {
    let tiktok;
    socket.on('set-user', (username) => {
        // URL'den gelen test verilerini de temizle
        const cleanUser = username.replace('@', '').split('&')[0]; 
        
        if (tiktok) tiktok.disconnect();
        tiktok = new WebcastPushConnection(cleanUser);
        tiktok.connect().catch(() => {}); // Hataları konsola yazdırma

        tiktok.on('gift', d => {
            io.emit('event', { ...d, text: `${d.giftName.toUpperCase()} GÖNDERDİ!` });
        });
        tiktok.on('follow', d => io.emit('event', { ...d, text: 'TAKİP ETTİ!' }));
        tiktok.on('like', d => {
            if(d.likeCount >= 100) io.emit('event', { ...d, text: '100 PENÇE ATTI!' });
        });
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log('v10 SaaS Aktif!'));
