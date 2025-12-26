const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    let tiktok;
    socket.on('set-user', (username) => {
        const cleanUser = username.replace('@', '').split('&')[0];
        if (tiktok) tiktok.disconnect();
        
        tiktok = new WebcastPushConnection(cleanUser);
        tiktok.connect().then(() => console.log(`BAĞLANDI: ${cleanUser}`)).catch(e => console.log("HATA"));

        tiktok.on('gift', d => {
            io.emit('event', { 
                uniqueId: d.uniqueId, 
                type: 'gift', 
                text: `${d.giftName.toUpperCase()} GÖNDERDİ!`,
                combo: d.repeatCount,
                giftName: d.giftName
            });
        });

        tiktok.on('follow', d => io.emit('event', { uniqueId: d.uniqueId, type: 'follow', text: 'TAKİP ETTİ!' }));
        
        tiktok.on('like', d => {
            if(d.likeCount >= 100) io.emit('event', { uniqueId: d.uniqueId, type: 'like', text: '100 PENÇE ATTI!' });
        });
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`v10.5 HAZIR!`));
