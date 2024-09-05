"use server";
import { redirect } from "next/navigation";
import ip from "@arcjet/ip";
import { getRedirect, logRequest, LogRequestMessage } from "@/lib/database";
import { getUserGeoInfo } from "@/lib/ipgeolocation";
// import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {

  // Get the redirect info
  const dest = await getRedirect(params.slug);

  if (dest !== "") {
    // Get the user's IP Address
    const headers = new Headers()
    const ipaddr = ip(req, headers) || "127.0.0.1";
    if (ipaddr !== "") {
      // If we have an IP address, get the user's Geolocation info
      const userGeoInfo = await getUserGeoInfo(ipaddr);

      // Build default log message
      const logMessage = {
        shortcode: params.slug,
        referrer: headers.get("referer") || "",
        useragent: headers.get("user-agent") || "",
        ipaddress: ipaddr,
        userinfo: userGeoInfo,
      } as LogRequestMessage;

      // Log the request
      logRequest(logMessage);
    }

    // Redirect the user
    redirect(dest);
  }

  // Display error
  return new Response("Not found", { status: 404 });
}
