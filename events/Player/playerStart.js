const {
  ActionRowBuilder,
  ButtonBuilder,
  AttachmentBuilder,
  ButtonStyle,
} = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const fetch = require('node-fetch');
const { loadImage } = require('@napi-rs/canvas');

// Resim yükleme fonksiyonu (Canvas uyumlu)
async function loadImageFromURL(url) {
  try {
    if (!url || typeof url !== 'string') throw new Error('Invalid image URL');
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`Image fetch failed: ${res.status} ${res.statusText}`);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('svg')) {
      throw new Error('SVG images are not supported by Canvas.');
    }

    const buffer = await res.buffer();
    return await loadImage(buffer);
  } catch (err) {
    console.error(`[Canvas Load Error]: ${err.message}`);
    return null;
  }
}

// Yuvarlak köşe çizimi
function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

// Metin sarma işlevi
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '', lineCount = 0;
  for (const word of words) {
    const testLine = line + word + ' ';
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = word + ' ';
      lineCount++;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y + lineCount * lineHeight);
}

// Süre formatlama (saniye -> mm:ss)
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Ana fonksiyon: queue ve track parametrelerini bot yapına göre ver
module.exports = async (queue, track) => {
  if (!queue || !track) return;

  const client = queue.client;
  const EmojiState = client?.config?.app?.enableEmojis ?? false;
  const emojis = client?.config?.emojis ?? {};
  const channel = queue.metadata?.channel;
  const user = queue.metadata?.requestedBy;

  if (!channel) {
    console.warn('NowPlaying: Channel not found.');
    return;
  }

  const canvas = Canvas.createCanvas(1100, 450);
  const ctx = canvas.getContext('2d');

  // Albüm kapağı Spotify'dan
  const albumCover = track?.album?.coverUrl || track.thumbnail;
  const coverImage = await loadImageFromURL(albumCover);

  if (coverImage) {
    ctx.drawImage(coverImage, 0, 0, 450, 450);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; // Karartma azaltıldı
    ctx.fillRect(0, 0, 450, 450);
  } else {
    ctx.fillStyle = '#222'; // Kapak yoksa koyu gri
    ctx.fillRect(0, 0, 450, 450);
  }

  // Sağ panel arka planı
  const panel = { x: 470, y: 30, width: 600, height: 390 };
  ctx.fillStyle = '#121212';
  roundRect(ctx, panel.x, panel.y, panel.width, panel.height, 25);
  ctx.fill();

  // Başlık
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px sans-serif';
  wrapText(ctx, track.title, panel.x + 30, panel.y + 50, panel.width - 60, 44);

  // Sanatçı
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '28px sans-serif';
  ctx.fillText(track.author || 'Unknown Artist', panel.x + 30, panel.y + 140);

  // Süre
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '24px sans-serif';
  ctx.fillText(`Duration: ${track.duration || 'N/A'}`, panel.x + 30, panel.y + 190);

  // İlerleme çubuğu
  const currentSec = track.position || 0;
  const totalSec = track.rawDuration || 1;
  const ratio = Math.min(currentSec / totalSec, 1);

  const bar = {
    x: panel.x + 30,
    y: panel.y + 240,
    width: panel.width - 60,
    height: 30,
  };

  ctx.fillStyle = '#333';
  roundRect(ctx, bar.x, bar.y, bar.width, bar.height, 15);
  ctx.fill();

  const gradient = ctx.createLinearGradient(bar.x, bar.y, bar.x + bar.width, bar.y);
  gradient.addColorStop(0, '#1DB954'); // Spotify yeşili başı
  gradient.addColorStop(1, '#1ED760'); // Spotify yeşili sonu

  ctx.fillStyle = gradient;
  roundRect(ctx, bar.x, bar.y, bar.width * ratio, bar.height, 15);
  ctx.fill();

  // Zamanlar
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText(formatTime(currentSec), bar.x, bar.y + bar.height + 25);
  ctx.fillText(formatTime(totalSec), bar.x + bar.width - 60, bar.y + bar.height + 25);

  // Kullanıcı avatarı ve adı
  const fallbackAvatar = 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; // Fallback avatar
  const addedAvatar = typeof user?.avatarURL === 'function' ? user.avatarURL() : user?.avatarURL || fallbackAvatar;

  if (addedAvatar) {
    try {
      const avatar = await loadImageFromURL(addedAvatar);
      if (avatar) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(panel.x + 90, panel.y + panel.height - 60, 40, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, panel.x + 50, panel.y + panel.height - 100, 80, 80);
        ctx.restore();
      }
    } catch (err) {
      console.error('Avatar load error:', err);
    }
  }

  ctx.fillStyle = '#ccc';
  ctx.font = '22px sans-serif';
  ctx.fillText(`Added by ${user?.username || 'Unknown'}`, panel.x + 140, panel.y + panel.height - 60);

  // Platform logosu sadece Spotify
  const logoUrl = 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg';

  // SVG Canvas desteklemediği için PNG'yi kullanalım:
  const pngLogoUrl = 'https://cdn-icons-png.flaticon.com/512/174/174872.png';

  const logo = await loadImageFromURL(pngLogoUrl);
  if (logo) ctx.drawImage(logo, 1020, 370, 60, 60);

  // PNG olarak dışa aktar
  const buffer = canvas.toBuffer('image/png');
  const attachment = new AttachmentBuilder(buffer, { name: 'now-playing.png' });

  // Butonlar
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('back')
      .setLabel(EmojiState ? emojis.back : 'Back')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('skip')
      .setLabel(EmojiState ? emojis.skip : 'Skip')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('resume&pause')
      .setLabel(EmojiState ? emojis.ResumePause : 'Pause/Play')
      .setStyle(ButtonStyle.Danger),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('loop')
      .setLabel(EmojiState ? emojis.loop : 'Loop')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('repeat')
      .setLabel(EmojiState ? emojis.repeat : 'Repeat')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('lyrics')
      .setLabel('Lyrics')
      .setStyle(ButtonStyle.Secondary),
  );

  // Mesaj gönderimi
  await channel.send({ files: [attachment], components: [row1, row2] });
};
