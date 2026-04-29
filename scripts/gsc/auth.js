#!/usr/bin/env node
/* eslint-disable */
// One-time OAuth flow for Google Search Console API.
//
// Run: node scripts/gsc/auth.js
//
// What it does:
//   1. Reads OAuth client credentials from /Users/nicolas/.claude/linkedgrow-gsc-oauth.json
//   2. Spawns a tiny local HTTP server on port 53682 to catch the OAuth redirect
//   3. Opens your browser to Google's consent page
//   4. After you approve, exchanges the auth code for a refresh token
//   5. Saves refresh token to /Users/nicolas/.claude/linkedgrow-gsc-token.json
//
// You only run this ONCE. Future weekly runs use the saved refresh token.

const fs = require("fs");
const path = require("path");
const http = require("http");
const { exec } = require("child_process");
const os = require("os");

const HOME = os.homedir();
const CREDENTIALS_PATH = path.join(HOME, ".claude", "linkedgrow-gsc-oauth.json");
const TOKEN_PATH = path.join(HOME, ".claude", "linkedgrow-gsc-token.json");
const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

if (!fs.existsSync(CREDENTIALS_PATH)) {
  console.error(`ERROR: OAuth credentials not found at ${CREDENTIALS_PATH}`);
  process.exit(1);
}

const credsRaw = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
const creds = credsRaw.installed || credsRaw.web;
if (!creds || !creds.client_id || !creds.client_secret) {
  console.error("ERROR: invalid credentials format. Expected 'installed' or 'web' object with client_id + client_secret.");
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", creds.client_id);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

console.log("Starting OAuth flow for Google Search Console...");
console.log("");
console.log("If your browser does not open automatically, paste this URL:");
console.log(authUrl.toString());
console.log("");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end(`<h1>Authorization failed</h1><p>${error}</p><p>You can close this window.</p>`);
    server.close();
    console.error(`Authorization error: ${error}`);
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end("<h1>No authorization code received</h1>");
    return;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: creds.client_id,
        client_secret: creds.client_secret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      throw new Error(`Token exchange failed: ${tokenRes.status} ${errBody}`);
    }

    const tokens = await tokenRes.json();
    if (!tokens.refresh_token) {
      throw new Error(
        "No refresh_token returned. This usually means you've authorized this client before. Revoke it at https://myaccount.google.com/permissions and re-run."
      );
    }

    fs.writeFileSync(
      TOKEN_PATH,
      JSON.stringify(
        {
          refresh_token: tokens.refresh_token,
          client_id: creds.client_id,
          client_secret: creds.client_secret,
          obtained_at: new Date().toISOString(),
        },
        null,
        2
      )
    );
    fs.chmodSync(TOKEN_PATH, 0o600);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      "<h1>Authorization successful</h1><p>Refresh token saved to ~/.claude/linkedgrow-gsc-token.json. You can close this window.</p>"
    );

    console.log(`Refresh token saved to ${TOKEN_PATH}`);
    console.log("Run weekly script: node scripts/gsc/weekly.js");
    server.close();
    process.exit(0);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end(`<h1>Token exchange failed</h1><pre>${err.message}</pre>`);
    server.close();
    console.error(err);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`Local callback listening on ${REDIRECT_URI}`);
  console.log("Opening browser...");
  const opener =
    process.platform === "darwin"
      ? `open "${authUrl.toString()}"`
      : process.platform === "win32"
        ? `start "" "${authUrl.toString()}"`
        : `xdg-open "${authUrl.toString()}"`;
  exec(opener, (err) => {
    if (err) {
      console.warn("Could not auto-open browser. Paste the URL above manually.");
    }
  });
});
