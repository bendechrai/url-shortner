# URL Shortener

This is Ben's latest URL Shortener based on NextJS with Arcjet protection

## Create tables

```sql
-- Table for storing user information
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  google_id TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'admin' -- Other roles can be added later if needed
);

-- Table for redirects
CREATE TABLE IF NOT EXISTS redirects (
  id SERIAL PRIMARY KEY,
  timestamp timestamptz DEFAULT CURRENT_TIMESTAMP,
  shortcode TEXT NOT NULL,
  dest TEXT NOT NULL
);

-- Table for requests with normalization
CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  timestamp timestamptz DEFAULT CURRENT_TIMESTAMP,
  shortcode TEXT,
  referrer TEXT,
  useragent TEXT,
  ipaddress TEXT,
  userinfo_id INT REFERENCES userinfo(id) -- Foreign key to userinfo table
);

-- Table to store userinfo details (normalized fields)
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
  latitude NUMERIC,
  longitude NUMERIC,
  isp TEXT,
  organization TEXT,
  connection_type TEXT,
  timezone_name TEXT,
  timezone_offset NUMERIC,
  timezone_current_time timestamptz,
  languages TEXT,
  country_flag TEXT,
  jsonb_data JSONB -- Store the original JSONB here for now, can be dropped later
);
```

## Install notes

I'll add more later - getting this in for first commit