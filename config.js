module.exports = { //discord.gg/vsc ❤️ oxyinc, can066
    app: {
        token: 'MTA3ODk3MTM0MzUzOTgwMjE0Mw.G_zQYS.8XSNyuR5pNDi5OOJj79esFR4URXsRyAJm87lAI',
        playing: 'geliştiriliyor',
        global: true, // Eğer global false olur ise sadece gelirlediğiniz sunucuda çalışır
        guild: '1392137987940155526', // GuildID
        extraMessages: false,
        loopMessage: false,
        lang: 'tr',
        enableEmojis: true,
    },

    emojis:{
        'back': '⏪',
        'skip': '⏩',
        'ResumePause': '⏯️',
        'savetrack': '💾',
        'volumeUp': '🔊',
        'volumeDown': '🔉',
        'loop': '🔁',
    },

    opt: {
        DJ: {
            enabled: false,
            roleName: '',
            commands: []
        },
        Translate_Timeout: 1000,
        maxVol: 100,
        spotifyBridge: true,
        volume: 75,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 30000,
        leaveOnEnd: true,
        leaveOnEndCooldown: 30000,
        discordPlayer: {
            ytdlOptions: {
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            }
        }
    }
};
