export const getMyIp = () => {
  fetch("https://api.ipify.org?format=json")
    .then((response) => {
      return response.json();
    })
    .then((res) => {
      console.log(res);
    })
    .catch((err) => console.error("Problem fetching my IP", err));
};
