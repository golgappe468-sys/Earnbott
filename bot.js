const { Telegraf } = require('telegraf');
const connectDB = require('./database/connection');
const config = require('./config');
const { initScheduler } = require('./utils/scheduler');
const { isAdmin, isNotBanned, checkForceJoin } = require('./middlewares/auth');

// Import handlers
const { startHandler, verifyJoinHandler } = require('./handlers/startHandler');
const { accountHandler } = require('./handlers/accountHandler');
const { tasksHandler, verifyTaskHandler } = require('./handlers/taskHandler');
const { withdrawHandler, handleWithdrawalSession, processWithdrawal } = require('./handlers/withdrawHandler');
const { adminHandler, adminCallbackHandler, handleAdminSession } = require('./admin/adminHandler');

// Initialize bot
const bot = new Telegraf(config.BOT_TOKEN);

// Connect to MongoDB
connectDB();

// Initialize scheduler for task expiry
initScheduler(bot);

// Apply middlewares
bot.use(isNotBanned);

// Start command with force join check
bot.start(checkForceJoin, startHandler);
bot.command('start', checkForceJoin, startHandler);

// Verify join callback
bot.action('verify_join', verifyJoinHandler);

// Main menu handlers
bot.hears('👤 Account', checkForceJoin, accountHandler);
bot.hears('📋 Tasks', checkForceJoin, tasksHandler);
bot.hears('💸 Withdraw', checkForceJoin, withdrawHandler);

// Commands
bot.command('account', checkForceJoin, accountHandler);
bot.command('tasks', checkForceJoin, tasksHandler);
bot.command('withdraw', checkForceJoin, withdrawHandler);

// Task verification
bot.action(/verify_task_(.+)/, checkForceJoin, verifyTaskHandler);
bot.action('task_done', (ctx) => ctx.answerCbQuery('✅ Task already completed!'));

// Withdrawal processing
bot.action(/approve_wd_(.+)/, processWithdrawal);
bot.action(/reject_wd_(.+)/, processWithdrawal);

// Admin panel
bot.command('admin', isAdmin, adminHandler);
bot.action(/admin_.+/, adminCallbackHandler);
bot.action(/edit_task_(.+)/, adminCallbackHandler);
bot.action(/delete_task_(.+)/, adminCallbackHandler);
bot.action(/broadcast_.+/, adminCallbackHandler);
bot.action(/settings_.+/, adminCallbackHandler);

// Handle text messages (for sessions)
bot.on('text', async (ctx) => {
  // Check if in withdrawal session
  await handleWithdrawalSession(ctx);
  // Check if in admin session
  await handleAdminSession(ctx);
});

// Handle photo messages (for broadcast)
bot.on('photo', async (ctx) => {
  const userId = ctx.from.id;
  if (config.ADMIN_IDS.includes(userId)) {
    // Handle broadcast photo
    await handleAdminSession(ctx);
  }
});

// Help command
bot.command('help', (ctx) => {
  ctx.reply(
    '🆘 *Help*\n\n' +
    '📋 Complete tasks to earn money\n' +
    '💸 Withdraw via UPI (Min ₹100)\n\n' +
    '*Commands:*\n' +
    '/start - Start bot\n' +
    '/tasks - View tasks\n' +
    '/account - Your account\n' +
    '/withdraw - Withdraw earnings\n' +
    '/help - This message',
    { parse_mode: 'Markdown' }
  );
});

// Error handler
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('❌ An error occurred. Please try again later.').catch(console.error);
});

// Graceful shutdown
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  console.log('Bot stopped (SIGINT)');
});

process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  console.log('Bot stopped (SIGTERM)');
});

// Start bot
bot.launch()
  .then(() => {
    console.log('Bot started successfully!');
    console.log(`Admins: ${config.ADMIN_IDS.join(', ')}`);
  })
  .catch((err) => {
    console.error('Bot failed to start:', err);
    process.exit(1);
  });

module.exports = bot;