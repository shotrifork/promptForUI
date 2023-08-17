const IP_INFO_TOKEN = process.env.IP_INFO_TOKEN;

export const getIPInfo = async (ipToFetch) => {
  const request = await fetch(`https://ipinfo.io/json?token=${IP_INFO_TOKEN}`);
  return await request.json();
};
