export const startHeartBeatInterval = (channel) =>
  setInterval(() => {
    channel.push("web:heart_beat", {});
  }, 4000);
