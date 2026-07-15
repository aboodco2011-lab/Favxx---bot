import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { logger } from '../../utils/logger.js';
import { handleInteractionError } from '../../utils/errorHandler.js';
import { db } from '../../database.js'; // استبدل بمسار قاعدة بياناتك الصحيح
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription("عرض قائمة المتصدرين في السيرفر")
    .setDMPermission(false),
  category: 'Leveling',

  async execute(interaction, config, client) {
    try {
      await InteractionHelper.safeDefer(interaction);

      // جلب بيانات المتصدرين من الجدول مباشرة
      const textQuery = await db.query(
        'SELECT user_id, text_xp FROM users_xp WHERE guild_id = $1 ORDER BY text_xp DESC LIMIT 5', 
        [interaction.guildId]
      );
      const voiceQuery = await db.query(
        'SELECT user_id, voice_xp FROM users_xp WHERE guild_id = $1 ORDER BY voice_xp DESC LIMIT 5', 
        [interaction.guildId]
      );

      // تنسيق النصوص بناءً على طلبك (XP فقط)
      const textLeaderboard = textQuery.rows.length === 0 
        ? 'لا يوجد بيانات كافية' 
        : textQuery.rows.map((row, index) => `🔸 | #${index + 1} <@!${row.user_id}> - XP: **${Math.floor(row.text_xp)}**`).join('\n');

      const voiceLeaderboard = voiceQuery.rows.length === 0 
        ? 'لا يوجد بيانات كافية' 
        : voiceQuery.rows.map((row, index) => `🔸 | #${index + 1} <@!${row.user_id}> - XP: **${Math.floor(row.voice_xp)}**`).join('\n');

      const embed = new EmbedBuilder()
        .setTitle('🏆 قائمة المتصدرين')
        .setColor('#2ecc71')
        .addFields(
          { name: '<:voice:1311747451778105415> TOP TEXT', value: textLeaderboard, inline: false },
          { name: '<:voice:1311747444941258834> TOP VOICE', value: voiceLeaderboard, inline: false }
        )
        .setFooter({ text: 'Nova bot' })
        .setTimestamp();

      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
      
    } catch (error) {
      logger.error('Leaderboard command error:', error);
      await handleInteractionError(interaction, error, {
        type: 'command',
        commandName: 'leaderboard'
      });
    }
  }
};
