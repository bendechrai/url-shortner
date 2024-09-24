import { neon } from "@neondatabase/serverless";

export type LogRequestMessage = {
  shortcode: string;
  referrer: string;
  useragent: string;
  ipaddress: string;
  userinfo: any;
};

// Check if the database is initialized by verifying if the redirects table exists
export async function checkDatabaseInitialized(): Promise<boolean> {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    // Check for existence of the redirects table
    await sql`SELECT * FROM redirects LIMIT 1`;
    console.log("Database is initialized");
    return true;
  } catch (err) {
    console.error("Database is not initialized");
    return false;
  }
}

// Initialize database schema by creating tables if they do not exist
export async function initialiseDatabase() {
  const sql = neon(process.env.DATABASE_URL!);

  // Create the UserInfo table with only relevant fields
  await sql`
    CREATE TABLE IF NOT EXISTS userinfo (
      id SERIAL PRIMARY KEY,
      ip TEXT,
      continent_code TEXT,
      continent_name TEXT,
      country_code TEXT,
      country_name TEXT,
      state_prov TEXT,
      city TEXT,
      zipcode TEXT,
      latitude FLOAT,
      longitude FLOAT,
      isp TEXT,
      organization TEXT,
      connection_type TEXT,
      timezone_name TEXT,
      timezone_offset FLOAT,
      timezone_current_time timestamptz,
      languages TEXT,
      country_flag TEXT,
      jsonb_data JSONB
    );
  `;

  // Create the Redirect table
  await sql`
    CREATE TABLE IF NOT EXISTS redirects (
      id SERIAL PRIMARY KEY,
      shortcode TEXT NOT NULL UNIQUE,
      dest TEXT NOT NULL,
      timestamp timestamptz DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Create the Request table, which references UserInfo and Redirect
  await sql`
    CREATE TABLE IF NOT EXISTS requests (
      id SERIAL PRIMARY KEY,
      shortcode TEXT,
      referrer TEXT,
      useragent TEXT,
      ipaddress TEXT,
      timestamp timestamptz DEFAULT CURRENT_TIMESTAMP,
      userinfoId INT REFERENCES userinfo(id),
      redirectId INT REFERENCES redirects(id)
    );
  `;
}

// Fetch redirect destination by shortcode
export async function getRedirect(shortcode: string): Promise<string> {
  const sql = neon(process.env.DATABASE_URL!);
  const [redirect] = await sql`
    SELECT dest FROM redirects WHERE shortcode = ${shortcode} ORDER BY timestamp DESC LIMIT 1;
  `;

  return redirect ? redirect.dest : "";
}

// Log request details and userinfo reference
export async function logRequest(logMessage: LogRequestMessage) {
  const sql = neon(process.env.DATABASE_URL!);

  // Assuming `userinfo` contains fields that need to be stored in the `userinfo` table
  let userinfoId = null;
  if (logMessage.userinfo) {
    const [insertedUserinfo] = await sql`
      INSERT INTO userinfo (
        ip, continent_code, continent_name, country_code2, country_code3, 
        country_name, country_capital, state_prov, district, city, zipcode, 
        latitude, longitude, isp, organization, connection_type, timezone_name, 
        timezone_offset, timezone_current_time, languages, country_flag, jsonb_data
      ) VALUES (
        ${logMessage.userinfo.ip}, ${logMessage.userinfo.continent_code}, ${logMessage.userinfo.continent_name}, 
        ${logMessage.userinfo.country_code2}, ${logMessage.userinfo.country_code3}, ${logMessage.userinfo.country_name},
        ${logMessage.userinfo.country_capital}, ${logMessage.userinfo.state_prov}, ${logMessage.userinfo.district},
        ${logMessage.userinfo.city}, ${logMessage.userinfo.zipcode}, ${logMessage.userinfo.latitude},
        ${logMessage.userinfo.longitude}, ${logMessage.userinfo.isp}, ${logMessage.userinfo.organization},
        ${logMessage.userinfo.connection_type}, ${logMessage.userinfo.timezone_name}, 
        ${logMessage.userinfo.timezone_offset}, ${logMessage.userinfo.timezone_current_time},
        ${logMessage.userinfo.languages}, ${logMessage.userinfo.country_flag}, 
        ${JSON.stringify(logMessage.userinfo)}
      ) RETURNING id;
    `;
    userinfoId = insertedUserinfo.id;
  }

  // Insert the log request along with the foreign key reference to userinfo
  await sql`
    INSERT INTO requests (shortcode, referrer, useragent, ipaddress, timestamp, userinfoId)
    VALUES (${logMessage.shortcode}, ${logMessage.referrer}, ${logMessage.useragent}, 
      ${logMessage.ipaddress}, CURRENT_TIMESTAMP, ${userinfoId});
  `;
}
