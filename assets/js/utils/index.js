export const getMyIp = async () => {
  const { ip } = await (
    await fetch("https://api.ipify.org?format=json")
  ).json();
  return ip;
};
