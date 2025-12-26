const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(express.static(__dirname));

// Ana sayfa (Panel)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Overlay ekranı
app.get('/app.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.html'));
});

io.on('connection', (socket) => {
    let tiktok;
    socket.on('set-user', (username) => {
        const cleanUser = username.replace('@', '').split('?')[0];
        if (tiktok) tiktok.disconnect();
        tiktok = new WebcastPushConnection(cleanUser);
        tiktok.connect().then(() => console.log(`Aktif: ${cleanUser}`)).catch(e => console.log("Hata"));

        tiktok.on('gift', d => io.emit('event', { ...d, type: 'gift', text: `${d.giftName.toUpperCase()} ATTI!`, isCombo: d.repeatEnd === false }));
        tiktok.on('follow', d => io.emit('event', { ...d, type: 'follow', text: "TAKİP ETTİ!" }));
        tiktok.on('like', d => { if(d.likeCount >= 100) io.emit('event', { ...d, type: 'like', text: "100 PENÇE!" }); });
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Sistem Yayında!`));
