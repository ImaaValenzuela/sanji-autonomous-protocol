const slug = process.argv[2] ?? "brasa-hollywood";
const gateway = (process.env.X402_GATEWAY_URL ?? "http://localhost:4000").replace(/\/$/, "");

const response = await fetch(`${gateway}/api/webhooks/payment-confirmed`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-demo-simulation": "true",
  },
  body: JSON.stringify({
    slug,
    tier: "SANJI_EXPRESS_290",
    amountUsd: 290,
  }),
});

const body = await response.json();
console.log(JSON.stringify(body, null, 2));
if (!response.ok) process.exit(1);
