# URL Shortener

This is Ben's latest URL Shortener based on NextJS with Arcjet protection

## Create tables


CREATE TABLE IF NOT EXISTS redirects (
  id SERIAL PRIMARY KEY,
  timestamp timestamptz default CURRENT_TIMESTAMP,
  shortcode TEXT NOT NULL,
  dest TEXT NOT NULL
);
INSERT INTO redirects(shortcode, dest)
  VALUES ('twitter', 'https://twitter.com/bendechrai');

CREATE TABLE requests (
  id SERIAL PRIMARY KEY,
  timestamp timestamptz default CURRENT_TIMESTAMP,
  shortcode TEXT,
  referrer TEXT,
  useragent TEXT,
  ipaddress TEXT,
  userinfo JSONB
);

## Install notes

I'll add more later - getting this in for first commit