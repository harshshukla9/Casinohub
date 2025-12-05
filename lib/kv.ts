import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// This file previously contained Farcaster notification details storage
// All Farcaster-related code has been removed
// Redis instance is kept for potential future use