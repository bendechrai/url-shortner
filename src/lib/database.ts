"use server";
import { neon } from "@neondatabase/serverless";

export type LogRequestMessage = {
  shortcode: string;
  referrer: string;
  useragent: string;
  ipaddress: string;
  userinfo: any;
};

export async function getRedirect(shortcode: string): Promise<string> {
  const sql = neon(process.env.DATABASE_URL!);
  const [redirect] =
    await sql`SELECT dest FROM redirects WHERE shortcode = ${shortcode} ORDER BY timestamp DESC LIMIT 1`;

  if (redirect) {
    return redirect.dest;
  }

  return "";
}

export async function logRequest(logMessage: LogRequestMessage) {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`INSERT INTO requests (shortcode, referrer, useragent, ipaddress, userinfo) VALUES (${logMessage.shortcode}, ${logMessage.referrer}, ${logMessage.useragent}, ${logMessage.ipaddress}, ${logMessage.userinfo})`;
}
