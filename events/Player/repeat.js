
module.exports = async ({ inter, queue }) => {
  if (!queue) {
    return inter.editReply({ content: await Translate(`No music queue found <❌>`) });
  }

  // Tekrarlama fonksiyonu: mevcut parçayı başa alıp tekrar oynatır
  try {
    await queue.seek(0); // Şarkıyı başa al
    await queue.resume(); // Oynatmayı devam ettir
    return inter.editReply({ content: await Translate(`Track restarted (repeat) <✅>`) });
  } catch (error) {
    console.error('Repeat button error:', error);
    return inter.editReply({ content: await Translate(`An error occurred while trying to repeat <❌>`) });
  }
};