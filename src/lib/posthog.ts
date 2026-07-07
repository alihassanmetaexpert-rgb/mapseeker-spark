import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  posthog.init("phc_Dh4TzUi5H8zXX6ddEL9dh38o7A4r5vbNKBU22B5QsrsM", {
    api_host: "https://us.i.posthog.com",
    autocapture: true,
    capture_pageview: true,
  });
  initialized = true;
}

export { posthog };