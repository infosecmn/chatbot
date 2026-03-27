require('dotenv').config();

module.exports = {
  PAGE_ACCESS_TOKEN: process.env.PAGE_ACCESS_TOKEN,
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || 'erhembayr_bot_verify',
  APP_SECRET: process.env.APP_SECRET,
  PORT: process.env.PORT || 3000,
  OPERATOR_PHONE: process.env.OPERATOR_PHONE || '96842000',

  // Follow-up delays (milliseconds)
  FOLLOWUP_DELAY_1: 30 * 60 * 1000,   // 30 min
  FOLLOWUP_DELAY_2: 24 * 60 * 60 * 1000, // 24 hours
};
