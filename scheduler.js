const schedule = require('node-schedule');
const Task = require('../models/Task');

const checkExpiredTasks = async (bot) => {
  try {
    const now = new Date();
    
    // Expire tasks past expiry date
    await Task.updateMany(
      { 
        status: 'active',
        expiryDate: { $lt: now, $ne: null }
      },
      { status: 'expired' }
    );
    
    // Complete tasks that reached max users
    const activeTasks = await Task.find({ status: 'active' });
    for (const task of activeTasks) {
      if (task.completedBy >= task.maxUsers) {
        task.status = 'completed';
        await task.save();
      }
    }
    
    console.log('Task expiry check completed');
  } catch (error) {
    console.error('Task expiry check error:', error);
  }
};

const initScheduler = (bot) => {
  // Check expired tasks every hour
  schedule.scheduleJob('0 * * * *', () => checkExpiredTasks(bot));
  
  // Also check on startup
  checkExpiredTasks(bot);
  
  console.log('Scheduler initialized');
};

module.exports = { initScheduler };