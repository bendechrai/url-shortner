import ip from "@arcjet/ip";

type ClickInfo = {
  referrer: string;
  useragent: string;
  ipaddress: string;
  timestamp: string;
  userinfo: any;
};

export const getUserGeoInfo = async (
  ipaddr: string
): Promise<ClickInfo> => {

  // Fetch info based on IP address
  const iplookup_url = `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IPGEOLOCATION_APIKEY}&ip=${ipaddr}`;
  const userinfo = await fetch(iplookup_url, 
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  ).then((res) => res.json());

  return userinfo;
};
