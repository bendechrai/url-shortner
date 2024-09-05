import arcjet, { createMiddleware, shield, slidingWindow } from "@arcjet/next";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({
      mode: "LIVE",
    }),
    slidingWindow({
      mode: "LIVE",
      interval: 60,
      max: 10,
    }),
  ],
});

export default createMiddleware(aj);
