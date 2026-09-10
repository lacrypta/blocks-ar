# GET /api/quotes

Public read-only JSON of the numbers the blocks.ar homepage shows.
No auth. No write methods. Missing sources are `null` plus an `errors` map — never invented.

```
GET https://www.blocks.ar/api/quotes
```

Live only after this branch is merged and deployed.

## Fields

- `bitstamp.usd` — Bitstamp BTC/USD last (ticker), OHLC close if ticker fails
- `bitstamp.change.h1` / `h24` / `week` — percent vs the same candle bases as `/api/market/bitstamp`
- `btcArs` — median of two-sided broker mid prices (same as the hero)
- `satoshiArs` — `btcArs / 100_000_000`
- `dollars.promedio|blue|ccl|mep|cripto` — CriptoYa (`fetchDolar`)
- `dollars.bitcoinCm` — `btcArs / Bitstamp USD` (server stand-in for the live Bitstamp feed)
- `fearGreed` — CoinMarketCap, same source as `/api/market/bitstamp`
- `updatedAt` ISO-8601 and `updatedAtMs`

Bitcoin only. Do not treat dollar fields as other assets.
