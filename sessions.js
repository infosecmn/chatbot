// In-memory session store
// States: NEW, HOOK, GOAL, PRODUCT, TRUST, URGENCY, CLOSE, DELIVERY, FOLLOWUP, OPERATOR, DONE
const sessions = new Map();

function getSession(senderId) {
  if (!sessions.has(senderId)) {
    sessions.set(senderId, {
      state: 'NEW',
      product: null,
      order: {},
      lastActivity: Date.now(),
      followupCount: 0,
    });
  }
  const session = sessions.get(senderId);
  session.lastActivity = Date.now();
  return session;
}

function resetSession(senderId) {
  sessions.delete(senderId);
}

function getAllSessions() {
  return sessions;
}

module.exports = { getSession, resetSession, getAllSessions };
