"use server";
import { redirect } from "next/navigation";
import { getRedirect, logRequest, LogRequestMessage } from "@/lib/database";
import { getUserGeoInfo } from "@/lib/ipgeolocation";
import { headers } from "next/headers";

export default async function Page({
  req,
  params,
}: {
  req: Request;
  params: { slug: string };
}) {
  //   // Build default log message
  //   return {
  //     shortcode: data.shortcode,
  //     referrer: userRequest.headers["referer"],
  //     useragent: userRequest.headers["user-agent"],
  //     ipaddress: userRequest.headers["x-forwarded-for"],
  //     timestamp: new Date().toISOString(),
  //     userinfo: userinfo,
  //   };
  // };

  // Get the redirect info
  const dest = await getRedirect(params.slug);
  if (dest !== "") {
    // Get the user's Geolocation info
    const ipaddr = "216.130.58.76"; //ip(req, headers);
    const userGeoInfo = await getUserGeoInfo(ipaddr);

    // Build default log message
    const logMessage = {
      shortcode: params.slug,
      referrer: headers().get("referer") || "",
      useragent: headers().get("user-agent") || "",
      ipaddress: ipaddr,
      userinfo: userGeoInfo,
    } as LogRequestMessage;

    // Log the request
    logRequest(logMessage);

    // Redirect the user
    redirect(dest);
  }

  // Display error
  return <h1>{params.slug} has no destination</h1>;
}
