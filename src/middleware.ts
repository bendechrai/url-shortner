import arcjet, { createMiddleware, shield, slidingWindow } from "@arcjet/next";
import { NextResponse } from "next/server";
import { checkDatabaseInitialized, initialiseDatabase } from "@/lib/database";
import { NextRequest, NextFetchEvent } from "next/server";

// Specify the paths where the middleware should run
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

// Configure the Arcjet middleware
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

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  // Check if required environment variables are set
  if (!process.env.DATABASE_URL || !process.env.ARCJET_KEY) {
    return new NextResponse(
      `<html><body><h1>Error: Missing environment variables</h1><p>Please set the required environment variables.</p></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }

  // Check if the database is initialized
  const databaseInitialised = await checkDatabaseInitialized();
  if (!databaseInitialised) {
    initialiseDatabase();
    return new NextResponse(
      `<html><body><h1>Database initialized</h1><p>The database has been initialized. You can now <a href="/admin">set up the admin account</a>.</p></body></html>`,
      { status: 201, headers: { "Content-Type": "text/html" } }
    );
  }


  // Continue with Arcjet middleware protection
  const response = await createMiddleware(aj)(req, event);

  return response;
}