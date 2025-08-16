const { Translate } = require('../process_tools');

module.exports = {
    id: 'repeat',

    async execute(inter, client) {
        const queue = client.player.nodes.get(inter.guildId);
        if (!queue || !queue.isPlaying()) {
            return inter.reply({
                content: await Translate('No music currently playing ❌'),
                ephemeral: true,
            });
        }

        const currentMode = queue.repeatMode;
        let newMode;

        if (currentMode === 0) {
            newMode = 1; // Track repeat
        } else if (currentMode === 1) {
            newMode = 2; // Queue repeat
        } else {
            newMode = 0; // Repeat off
        }

        queue.setRepeatMode(newMode);

        const modeMessage =
            newMode === 0
                ? await Translate('Repeat disabled 🔁')
                : newMode === 1
                ? await Translate('Repeating current track 🔂')
                : await Translate('Repeating entire queue 🔁');

        return inter.reply({
            content: modeMessage,
            ephemeral: true,
        });
    },
};
