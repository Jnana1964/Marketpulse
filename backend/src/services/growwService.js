const axios = require("axios");
const crypto = require("crypto");

const GROW_BASE_URL = "https://api.groww.in/v1";

let cachedToken = null;
let tokenExpiry = null;

/**
 * Generate SHA256 checksum.
 *
 * Groww requires:
 * SHA256(API_SECRET + TIMESTAMP)
 */
function generateChecksum(secret, timestamp) {
  const input = `${secret}${timestamp}`;

  return crypto
    .createHash("sha256")
    .update(input)
    .digest("hex");
}

/**
 * Generate Groww Access Token
 */
async function generateAccessToken() {
  try {
    const apiKey = process.env.GROW_API_KEY;
    const apiSecret = process.env.GROW_API_SECRET;

    if (!apiKey) {
      throw new Error("GROW_API_KEY is missing");
    }

    if (!apiSecret) {
      throw new Error("GROW_API_SECRET is missing");
    }

    // Current timestamp in epoch seconds
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // SHA256(API_SECRET + TIMESTAMP)
    const checksum = generateChecksum(
      apiSecret,
      timestamp
    );

    console.log("Generating Groww access token...");

    const response = await axios.post(
      `${GROW_BASE_URL}/token/api/access`,
      {
        key_type: "approval",
        checksum: checksum,
        timestamp: timestamp
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      }
    );

    const data = response.data;

    console.log(
      "Groww token response received"
    );

    // Groww response may contain token directly
    const token =
      data.token ||
      data.payload?.token;

    if (!token) {
      console.error(
        "Unexpected Groww token response:",
        JSON.stringify(data)
      );

      throw new Error(
        "Groww did not return an access token"
      );
    }

    cachedToken = token;

    // Cache for 5 minutes.
    // Token is regenerated when necessary.
    tokenExpiry = Date.now() + 5 * 60 * 1000;

    console.log(
      "Groww access token generated successfully"
    );

    return cachedToken;

  } catch (error) {

    console.error(
      "Groww token generation failed:"
    );

    if (error.response) {
      console.error(
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );
    } else {
      console.error(error.message);
    }

    throw error;
  }
}

/**
 * Get valid Groww access token
 */
async function getAccessToken() {

  if (
    cachedToken &&
    tokenExpiry &&
    Date.now() < tokenExpiry
  ) {

    return cachedToken;
  }

  return generateAccessToken();
}

/**
 * Get authenticated Groww API client
 */
async function getGrowwClient() {

  const token =
    await getAccessToken();

  return axios.create({
    baseURL: GROW_BASE_URL,

    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "X-API-VERSION": "1.0"
    },

    timeout: 10000
  });
}

module.exports = {
  generateAccessToken,
  getAccessToken,
  getGrowwClient
};
