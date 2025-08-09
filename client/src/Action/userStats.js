export const updateUserStats = (userId, stats) => ({
  type: "UPDATE_USER_STATS",
  payload: { userId, stats }
});