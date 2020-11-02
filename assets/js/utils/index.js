export const getMyIp = async function () {
  const { ip } = await (
    await fetch("https://api.ipify.org?format=json")
  ).json();
  return ip;
};
