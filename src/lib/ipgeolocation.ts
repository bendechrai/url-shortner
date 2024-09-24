export type UserInfo = {
  ip: string;
  continent_code: string;
  continent_name: string;
  country_code2: string;
  country_code3: string;
  country_name: string;
  country_capital: string;
  state_prov: string;
  district: string;
  city: string;
  zipcode: string;
  latitude: string;
  longitude: string;
  is_eu: boolean;
  calling_code: string;
  country_tld: string;
  languages: string;
  country_flag: string;
  geoname_id: string;
  isp: string;
  connection_type: string;
  organization: string;
  currency: {
    code: string;
    name: string;
    symbol: string;
  };
  time_zone: {
    name: string;
    offset: number;
    current_time: string;
    current_time_unix: number;
    is_dst: boolean;
    dst_savings: number;
    dst_exists?: boolean;
    dst_start?: {
      utc_time: string;
      duration: string;
      gap: boolean;
      dateTimeAfter: string;
      dateTimeBefore: string;
      overlap: boolean;
    };
    dst_end?: {
      utc_time: string;
      duration: string;
      gap: boolean;
      dateTimeAfter: string;
      dateTimeBefore: string;
      overlap: boolean;
    };
  };
  message?: string;
};

type ClickInfo = {
  referrer: string;
  useragent: string;
  ipaddress: string;
  timestamp: string;
  userinfo: UserInfo;
};

export const getUserGeoInfo = async (ipaddr: string): Promise<ClickInfo> => {
  // Fetch info based on IP address
  const iplookup_url = `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IPGEOLOCATION_APIKEY}&ip=${ipaddr}`;
  const userinfo = await fetch(iplookup_url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());

  return userinfo;
};
