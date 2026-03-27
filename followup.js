const { sendText } = require('./messenger');
const { getSession, getAllSessions } = require('./sessions');
const MSG = require('./messages');
const config = require('./config');

const followupTimers = new Map();

function scheduleFollowup(senderId) {
  // Clear existing timers
  cancelFollowup(senderId);

  const session = getSession(senderId);

  // First follow-up: 30 minutes
  const timer1 = setTimeout(async () => {
    const s = getSession(senderId);
    if (s.state !== 'DONE' && s.state !== 'OPERATOR') {
      s.followupCount++;
      await sendText(senderId, MSG.FOLLOWUP_1);
    }
  }, config.FOLLOWUP_DELAY_1);

  // Second follow-up: 24 hours
  const timer2 = setTimeout(async () => {
    const s = getSession(senderId);
    if (s.state !== 'DONE' && s.state !== 'OPERATOR') {
      s.followupCount++;
      await sendText(senderId, MSG.FOLLOWUP_2);
    }
  }, config.FOLLOWUP_DELAY_2);

  followupTimers.set(senderId, [timer1, timer2]);
}

function cancelFollowup(senderId) {
  const timers = followupTimers.get(senderId);
  if (timers) {
    timers.forEach(clearTimeout);
    followupTimers.delete(senderId);
  }
}

module.exports = { scheduleFollowup, cancelFollowup };
