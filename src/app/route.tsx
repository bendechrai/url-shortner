"use server";
import { logRequest, LogRequestMessage } from "@/lib/database";
import { getUserGeoInfo } from "@/lib/ipgeolocation";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import ip from "@arcjet/ip";

export async function GET(req: NextRequest) {
  const dest = "https://bendechrai.com";

   // Get the user's IP Address
   const headers = new Headers()
   const ipaddr = ip(req, headers) || "127.0.0.1";
   if (ipaddr !== "") {
     // If we have an IP address, get the user's Geolocation info
     const userGeoInfo = await getUserGeoInfo(ipaddr);

     // Build default log message
     const logMessage = {
       shortcode: "/",
       referrer: headers.get("referer") || "",
       useragent: headers.get("user-agent") || "",
       ipaddress: ipaddr,
       userinfo: userGeoInfo,
     } as LogRequestMessage;

     // Log the request
     logRequest(logMessage);
   }

   // Redirect the user
   redirect(dest);}
