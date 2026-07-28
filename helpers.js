const validateUPI = (upiId) => {
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  return upiRegex.test(upiId);
};

const formatCurrency = (amount, currency = '₹') => {
  return `${currency}${amount.toFixed(2)}`;
};

const formatDate = (date) => {
  if (!date) return 'No date';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const escapeMarkdown = (text) => {
  if (!text) return '';
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
};

const getTaskStatus = (task) => {
  if (task.status === 'expired') return '❌ Expired';
  if (task.status === 'completed') return '✅ Completed';
  if (task.expiryDate && new Date() > task.expiryDate) return '⏰ Expired';
  if (task.completedBy >= task.maxUsers) return '👥 Full';
  return '🟢 Active';
};

const generateProgressBar = (current, max, length = 10) => {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return '▓'.repeat(filled) + '░'.repeat(empty);
};

module.exports = {
  validateUPI,
  formatCurrency,
  formatDate,
  escapeMarkdown,
  getTaskStatus,
  generateProgressBar
};