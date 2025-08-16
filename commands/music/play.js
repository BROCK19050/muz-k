const { QueryType, useMainPlayer } = require('discord-player');
const { ApplicationCommandOptionType, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const { Translate } = require('../../process_tools');
const Canvas = require('@napi-rs/canvas');
const fetch = require('node-fetch');

module.exports = {
    name: 'play',
    description: 'Play a song!',
    voiceChannel: true,
    options: [
        {
            name: 'song',
            description: 'The song you want to play',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],

    async execute({ inter, client }) {
        const player = useMainPlayer();
        const song = inter.options.getString('song');
        const voiceChannel = inter.member.voice.channel;

        if (!voiceChannel) {
            return inter.editReply(await Translate(`You must be in a voice channel to play music! ❌`));
        }

        const permissions = voiceChannel.permissionsFor(client.user);
        if (!permissions.has(PermissionFlagsBits.Connect) || !permissions.has(PermissionFlagsBits.Speak)) {
            return inter.editReply(await Translate(`I don't have permission to connect or speak in this voice channel ❌`));
        }

        const res = await player.search(song, {
            requestedBy: inter.member,
            searchEngine: QueryType.AUTO
        });

        if (!res || !res.tracks.length) {
            return inter.editReply(await Translate(`No results found... try again ❌`));
        }

        try {
            const { track } = await player.play(voiceChannel, res.tracks[0].url, {
                nodeOptions: {
                    metadata: { channel: inter.channel },
                    volume: client.config.opt.volume,
                    leaveOnEmpty: client.config.opt.leaveOnEmpty,
                    leaveOnEmptyCooldown: client.config.opt.leaveOnEmptyCooldown,
                    leaveOnEnd: client.config.opt.leaveOnEnd,
                    leaveOnEndCooldown: client.config.opt.leaveOnEndCooldown
                }
            });

            // 🎨 Canvas kartı
            const canvas = Canvas.createCanvas(800, 250);
            const ctx = canvas.getContext('2d');

            // Arka plan
            let background;
            try {
                const bgRes = await fetch(track.thumbnail);
                const bgBuffer = Buffer.from(await bgRes.arrayBuffer());
                background = await Canvas.loadImage(bgBuffer);
            } catch {
                background = await Canvas.loadImage('https://placehold.co/200/2f3136/FFFFFF?text=No+Image');
            }
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            // Karartma katmanı
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Başlık
            ctx.font = 'bold 28px Sans';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(track.title.length > 40 ? track.title.slice(0, 37) + '...' : track.title, 250, 80);

            // Süre
            ctx.font = '20px Sans';
            ctx.fillStyle = '#cccccc';
            ctx.fillText(`⏱ ${track.duration}`, 250, 120);

            // Ekleyen
            ctx.font = '20px Sans';
            ctx.fillStyle = '#cccccc';
            ctx.fillText(`🎧 Added by ${inter.member.displayName}`, 250, 150);

            // Thumbnail
            let thumb;
            try {
                const thumbRes = await fetch(track.thumbnail);
                const thumbBuffer = Buffer.from(await thumbRes.arrayBuffer());
                thumb = await Canvas.loadImage(thumbBuffer);
            } catch {
                thumb = await Canvas.loadImage('https://placehold.co/200/2f3136/FFFFFF?text=No+Image');
            }
            ctx.drawImage(thumb, 20, 25, 200, 200);

            const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'now-playing.png' });

            return inter.editReply({ files: [attachment] });

        } catch (error) {
            console.error(`Play error:`, error);
            return inter.editReply(await Translate(`I couldn't play the track. ❌\n**Error:** \`${error.message || error}\``));
        }
    }
};
