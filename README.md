# Sanji Autonomous Protocol

Motor de hospitalidad high-ticket para restaurantes en **NA, EU y LATAM**. El protocolo busca un hot lead (150+ reseñas, rating ≥ 4.3, score ≥ 80), cobra el acceso con [x402](https://www.x402.org) en Solana, publica una landing editorial y, cuando el dueño paga, recompra `$SANJI` y abre un bounty para dejar el dominio y la carta en producción. Asia y África responden HTTP 400.

Corre de punta a punta sin credenciales. Con un `.env` real, el mismo flujo firma en mainnet y habla con ClawPump y xAI.

## Ciclo

```text
grokbot-worker                         x402-gateway                         preview-engine
      |                                      |                                      |
      |  GET /api/x402/leads/global          |                                      |
      |------------------------------------->|                                      |
      |  402  500_000 lamports               |                                      |
      |<-------------------------------------|                                      |
      |                                      |                                      |
      |  x402_pay  (o SystemProgram.transfer)|                                      |
      |------------------------------------->|  getParsedTransaction                |
      |  lead PENDING -> CONTACTED           |                                      |
      |<-------------------------------------|                                      |
      |                                      |                                      |
      |  GET /preview/[slug]                 |                                      |
      |-------------------------------------------------------------------------->|
      |  WhatsApp al dueño                   |                                      |
      |                                      |                                      |
      |                                      |  POST /api/webhooks/payment-confirmed|
      |                                      |<-------------------------------------|
      |                                      |  swap SOL -> SANJI + bounty USDC     |
```

1. El worker pide el próximo local en `PENDING_OUTREACH`.
2. El gateway responde **HTTP 402** con el desafío x402: tesorería, `500_000` lamports (`0.0005 SOL`), memo `SANJI_GLOBAL_LEAD_<timestamp>` y skill `sanji_global_lead_enricher`. `/api/x402/leads/caba` sigue vivo como alias. Un `region`, `country` o `city` de Asia o África corta antes del cobro con HTTP 400. El scout solo entrega leads con `region` en `NA | EU | LATAM`, `review_count >= 150`, `google_rating >= 4.3` y `hot_lead_score >= 80`.
3. El worker paga con la tool MCP `x402_pay` de ClawPump. Si el MCP no responde, firma un `SystemProgram.transfer` nativo. Sin llave de agente, simula el pago y reintenta con el header `x-demo-simulation: true`.
4. El gateway verifica la transacción con `connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 })`, marca el local como `CONTACTED` y devuelve el `RestaurantLead` completo.
5. El worker abre `/preview/[slug]`, mira `language` y `country`, y pide a Grok un WhatsApp nativo: inglés de Miami o Austin, inglés de Londres, español de España, español de México o rioplatense. Deja el link `wa.me` en la terminal y en el command center.
6. En la landing, **Activar Sanji Express** o **Activar Autonomous Core** hace `POST /api/webhooks/payment-confirmed`.
7. El webhook aparta el 20 % de la venta para el buyback, pide a ClawPump el swap de SOL (`So11111111111111111111111111111111111111112`) a `SANJI_TOKEN_MINT`, firma la `VersionedTransaction` con la wallet del agente y publica un bounty en USDC para conectar el dominio y cerrar el JSON de la carta en 24 horas.

## Demo de 90 segundos

Desde este directorio, Node 20 y pnpm 10. Tres terminales, en este orden:

```bash
pnpm dev
```

```bash
pnpm worker
```

```bash
pnpm demo:checkout
```

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Gateway en [http://localhost:4000](http://localhost:4000) y preview en [http://localhost:3000](http://localhost:3000). |
| `pnpm worker` | Un ciclo de scout: 402, pago, unlock, chequeo de la landing y pitch de WhatsApp. `--loop` repite cada 20 segundos. |
| `pnpm demo:checkout` | Checkout Express de `$290` para `brasa-palermo`: buyback de `0.35 SOL` y bounty de `$40 USDC`. Otro slug: `pnpm demo:checkout -- fuego-wynwood`. |

Abrí el [command center](http://localhost:3000). Cada local tiene su preview, por ejemplo [Brasa Palermo](http://localhost:3000/preview/brasa-palermo) o [Counter Soho](http://localhost:3000/preview/counter-soho). Los botones de la barra superior pegan al mismo webhook que `pnpm demo:checkout`.

La terminal del worker imprime, en orden:

```text
[MCP] Connecting to ClawPump OS...
[SCOUT] Requesting global hot lead from /api/x402/leads/global...
[x402] Received HTTP 402 Payment Required (500,000 lamports). Executing x402_pay from Sanji Agent Wallet...
[SOLANA] Payment confirmed on-chain (txSignature). Unlocking lead data...
[PREVIEW] Verifying live GSAP landing page at /preview/[slug]...
[GROKBOT] Generating and dispatching personalized WhatsApp pitch to owner...
```

Sin llave de agente, la línea `[SOLANA]` dice que el pago fue de demo y el paywall se abre con `x-demo-simulation`. El pitch igual se genera: Grok si hay `XAI_GROK_API_KEY`, y si no, el texto de la casa con el dolor del local, la URL de la preview y las dos ofertas.

`pnpm demo:reset` borra el store local. La próxima lectura vuelve a sembrar los seis hot leads en `PENDING_OUTREACH`. `pnpm demo:checkout` usa `brasa-palermo`.

## Ofertas

El webhook solo acepta el tier y el monto juntos. Express con `amountUsd: 1200` responde 400.

| Tier | Cobro | Buyback (20 %) | Bounty | Estado del lead |
| --- | --- | --- | --- | --- |
| `SANJI_EXPRESS_290` | $290 USD, una vez | 0.35 SOL | $40 USDC | `PAID_EXPRESS` |
| `SANJI_CORE_1200` | $1,200 USD de setup | 1.40 SOL | $120 USDC | `PAID_CORE` |

Express es la landing, las animaciones GSAP, el menú digital y la reserva directa por WhatsApp. Core suma conserje de reservas, CRM, motor de reseñas e integración con el POS. El bounty le pide a un agente que conecte el dominio del cliente y cierre el JSON de la carta dentro de las 24 horas.

El recibo del webhook:

```json
{
  "buybackTxSignature": "simulated_…",
  "solscanUrl": "",
  "bountyId": "local_brasa-palermo_…",
  "updatedStatus": "PAID_EXPRESS",
  "mode": "simulated",
  "buybackSol": 0.35,
  "bountyUsdc": 40
}
```

`mode: "live"` aparece cuando la swap se firmó y se emitió. `solscanUrl` apunta a `https://solscan.io/tx/<signature>`.

## Monorepo

pnpm workspaces y Turborepo. `pnpm dev` construye `@sanji/database` y después levanta los dos servidores.

```text
sanji-autonomous-protocol/
├── .cursor/mcp.json                 # MCP de ClawPump para Cursor
├── apps/
│   ├── x402-gateway/                # Express. Paywall, leads, webhook, swap y bounty
│   ├── grokbot-worker/              # Cliente MCP, pago x402 y SDR de Grok
│   └── preview-engine/              # Next.js 15. Command center y /preview/[slug]
├── packages/database/               # Tipos, cliente Supabase y seed global
├── scripts/demo-checkout.mjs
├── scripts/demo-reset.mjs
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

| Paquete | Puerto | Responsabilidad |
| --- | --- | --- |
| `@sanji/x402-gateway` | 4000 | 402, verificación on-chain, skills, buyback y bounty. |
| `@sanji/grokbot-worker` | — | Un ciclo (o `--loop`). No queda escuchando. |
| `@sanji/preview-engine` | 3000 | Command center, landing GSAP y botones de activación. |
| `@sanji/database` | — | `RestaurantLead`, Supabase y el store compartido de la demo. |

### Gateway

`apps/x402-gateway`

| Método | Ruta | Auth |
| --- | --- | --- |
| `GET` | `/health` | ninguna |
| `GET` | `/api/x402/leads/global` y el alias `/api/x402/leads/caba` | `x-payment-signature` o `x-demo-simulation: true`. Asia y África: 400, sin cobro. |
| `POST` | `/api/x402/skills/register` | ninguna |
| `POST` | `/api/webhooks/payment-confirmed` | `x-webhook-secret` cuando `WEBHOOK_SECRET` es real |

`GET /api/x402/leads/global?region=NA&city=Miami` filtra dentro del corte hot. `city=Wynwood` resuelve a Miami, `city=CDMX` a Mexico City y `neighborhood=Palermo` sigue aceptado como alias de Buenos Aires. Si no queda un lead que pase el corte, responde 404.

El 402:

```json
{
  "protocol": "x402",
  "version": "1.0",
  "network": "solana-mainnet",
  "recipient": "<SANJI_TREASURY_PUBLIC_KEY>",
  "amountLamports": 500000,
  "memo": "SANJI_GLOBAL_LEAD_<timestamp>",
  "skill": "sanji_global_lead_enricher",
  "message": "Payment Required: Use ClawPump x402_pay tool (0.0005 SOL) to unlock a global high-ticket hospitality lead."
}
```

La verificación exige que la tesorería haya recibido al menos `500_000` lamports en un `system.transfer` exitoso, incluyendo instrucciones internas. Una firma ausente, una tx fallida o un monto corto vuelven a responder 402.

`POST /api/x402/skills/register` declara dos custom skills:

- `sanji_global_lead_enricher` — el paywall de hot leads. `sanji_caba_lead_enricher` queda como alias.
- `sanji_instant_landing` — la landing en `/preview`.

El cuerpo del checkout:

```json
{
  "slug": "brasa-palermo",
  "tier": "SANJI_EXPRESS_290",
  "amountUsd": 290
}
```

`apps/x402-gateway/src/lib/clawpump.ts` importa `@clawpump/sdk` en runtime. Si el paquete no está instalado o la versión no expone el método, llama a:

- `POST https://clawpump.tech/api/swap/execute`
- `POST https://clawpump.tech/api/bounties/create`
- `POST https://clawpump.tech/api/skills/register`

Esas rutas hoy responden 404. El gateway deja el bounty como `local_<slug>_<timestamp>` y el recibo sigue completo. La compilación no depende del SDK: no está en `package.json` porque todavía no está en el registry. Cuando publiques una versión, instalala en el gateway y el wrapper usa `executeSwap`, `createBounty` y `registerSkill` antes que el REST.

### Worker

`apps/grokbot-worker`

Se conecta a `CLAWPUMP_MCP_URL` (`https://mcp.clawpump.tech/mcp`) con `SSEClientTransport` y, si el handshake SSE no abre, con `StreamableHTTPClientTransport`. `listAgentTools()` lista las tools de la sesión. `payWithX402()` llama a `x402_pay` y, si la tool no está, cae al transfer nativo de `src/solana-pay.ts`.

El SDR pega a `https://api.x.ai/v1/chat/completions` con `grok-3-latest`. El system prompt pide un solo WhatsApp, voseo, sin markdown, con el `pain_point`, la URL `${PREVIEW_ENGINE_URL}/preview/${slug}` y las dos ofertas. El mensaje no se manda solo: la terminal imprime el texto y el `https://wa.me/<tel>?text=…` para abrirlo.

### Preview

`apps/preview-engine`

Next.js 15 App Router, Tailwind y GSAP. Fondo `#0A0A0A`, tipo `#F5F2EB`, acento `#FF5500`.

- `/` es el command center. Lista los seis hot leads, el estado y un log que hace poll a `/api/command` cada 2 segundos (pagos x402, buybacks y bounties).
- `/preview/[slug]` lee el lead y renderiza la barra sticky **GENERATED BY SANJI AI AGENT (x402 VERIFIED)**, el sello de la ciudad, el rating de Google, el manifiesto, la carta interactiva y el CTA de reserva por WhatsApp. GSAP anima el ingreso. `prefers-reduced-motion` salta la timeline.

Los botones de la barra llaman al gateway en el browser (`X402_GATEWAY_URL`, default `http://localhost:4000`) con `x-demo-simulation: true`. CORS permite `x-payment-signature`, `x-demo-simulation` y `x-webhook-secret`.

### Datos

`packages/database` exporta el cliente, los tipos y el seed. El estado de un lead:

`PENDING_OUTREACH` → `CONTACTED` → `PAID_EXPRESS` | `PAID_CORE` → `DEPLOYED`

| Slug | Local | Ciudad | Región | Idioma | Score |
| --- | --- | --- | --- | --- | --- |
| `counter-soho` | Counter Soho | London | EU | en | 97 |
| `crudo-salamanca` | Crudo Salamanca | Madrid | EU | es | 95 |
| `fuego-wynwood` | Fuego Wynwood | Miami | NA | en | 92 |
| `brasa-palermo` | Brasa Palermo | Buenos Aires | LATAM | es | 90 |
| `brasa-polanco` | Brasa Polanco | Mexico City | LATAM | es | 88 |
| `ember-austin` | Ember Austin | Austin | NA | en | 86 |

Sin Supabase, los tres procesos comparten `packages/database/data/runtime-leads.json` (gitignored). El primer read lo crea desde `src/seed.ts`. Ese archivo es el que hace que el worker, el gateway y el command center vean el mismo estado.

Para usar Supabase, aplicá `packages/database/supabase/seed.sql` en el SQL editor (tabla `hospitality_leads` más los seis `INSERT`) y completá `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. El cliente ignora los placeholders de `.env.example`. Si la query falla, vuelve al store local y lo avisa una sola vez. Un `runtime-leads.json` del esquema de CABA se reescribe solo: el archivo lleva `schemaVersion: 2`.

## Demo y mainnet

| | Sin `.env` | Con `.env` real |
| --- | --- | --- |
| Leads | Store local, seis hot leads | Tabla `hospitality_leads` |
| Paywall | `x-demo-simulation: true` abre el lead | Firma verificada contra la tesorería |
| Buyback | Recibo `simulated_…`, sin broadcast | Swap firmada y URL de Solscan |
| Bounty | `local_<slug>_<ts>` si ClawPump responde 404 | Id devuelto por el SDK o el REST |
| Pitch | Plantilla de la casa | Grok, con la plantilla si xAI falla |
| Webhook | Abierto, porque el secret de ejemplo es placeholder | Exige `x-webhook-secret` |

`SANJI_DISABLE_DEMO=true` ignora el header `x-demo-simulation` en el webhook. Con el secret de ejemplo el endpoint sigue abierto, porque ese valor es un placeholder. Un `WEBHOOK_SECRET` real exige `x-webhook-secret`.

```bash
cp .env.example .env
```

| Variable | Para qué |
| --- | --- |
| `CLAWPUMP_API_KEY` | Bearer hacia el SDK y el REST de ClawPump. |
| `CLAWPUMP_MCP_URL` | Endpoint MCP. Default `https://mcp.clawpump.tech/mcp`. |
| `CLAWPUMP_SWAP_URL` | Fallback de `executeSwap`. |
| `CLAWPUMP_BOUNTY_URL` | Fallback de creación de bounties. |
| `CLAWPUMP_SKILLS_URL` | Fallback de registro de skills. |
| `SANJI_AGENT_ID` | Agente que figura en el bounty. Default `agent_sanji_caba_01`. |
| `SANJI_AGENT_PRIVATE_KEY` | Secret base58. Firma el transfer x402 y la swap. |
| `SANJI_TREASURY_PUBLIC_KEY` | Destino del 402 y de la verificación on-chain. |
| `SANJI_TOKEN_MINT` | Mint SPL que compra el buyback. |
| `SOLANA_RPC_URL` | Default `https://api.mainnet-beta.solana.com`. |
| `XAI_GROK_API_KEY` | Activa el SDR. Sin esto se usa la plantilla. |
| `XAI_MODEL` | Default `grok-3-latest`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role. No lo expongas en el cliente. |
| `X402_GATEWAY_PORT` | Default `4000`. |
| `X402_GATEWAY_URL` | URL que usan el worker y los botones de la preview. |
| `PREVIEW_ENGINE_URL` | Base de `/preview/[slug]` dentro del pitch y del bounty. |
| `WEBHOOK_SECRET` | Header `x-webhook-secret` cuando deja de ser placeholder. |
| `SANJI_DEMO_STORE_PATH` | Opcional. Mueve el JSON de la demo. |
| `SANJI_DISABLE_DEMO` | `true` exige el secret del webhook. |

Cursor ya tiene el MCP en `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "clawpump": {
      "url": "https://mcp.clawpump.tech/mcp"
    }
  }
}
```

## Scripts

| Script | Efecto |
| --- | --- |
| `pnpm dev` | `turbo dev`. Gateway en watch y Next en el puerto 3000. |
| `pnpm build` | `tsc` de database, gateway y worker, y `next build`. |
| `pnpm lint` | `tsc --noEmit` en los cuatro paquetes. |
| `pnpm start` | Gateway y preview ya compilados. |
| `pnpm worker` | Un ciclo del SDR. |
| `pnpm demo:checkout` | Webhook Express contra el gateway local. |
| `pnpm demo:reset` | Borra el store y deja que el seed vuelva a entrar. |

## Stack

Node 20, pnpm 10, Turborepo, TypeScript estricto, Express 4, Next.js 15, React 19, Tailwind CSS, GSAP, `@solana/web3.js`, `@modelcontextprotocol/sdk`, `@supabase/supabase-js`.
