import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const filename = new URL("../src/lib/merchants/model.ts", import.meta.url);
const source = fs.readFileSync(filename, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sandboxModule = { exports: {} };
vm.runInNewContext(compiled, {
  module: sandboxModule,
  exports: sandboxModule.exports,
  URL,
  Math,
  Number,
  Set,
});
const {
  isConfidentGoogleMatch,
  merchantCategory,
  normalizeMerchant,
} = sandboxModule.exports;

const googleFilename = new URL("../src/lib/merchants/google.ts", import.meta.url);
const googleCompiled = ts.transpileModule(fs.readFileSync(googleFilename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
let mockFetch;
const googleModule = { exports: {} };
vm.runInNewContext(googleCompiled, {
  module: googleModule,
  exports: googleModule.exports,
  process: { env: {} },
  fetch: (...args) => mockFetch(...args),
  encodeURIComponent,
  JSON,
  Number,
  Promise,
  require: (specifier) => {
    if (specifier === "server-only") return {};
    if (specifier === "./model") return sandboxModule.exports;
    throw new Error(`Unexpected require: ${specifier}`);
  },
});
const { getGooglePlace } = googleModule.exports;

test("normaliza datos BTC Map y métodos de pago", () => {
  const merchant = normalizeMerchant({
    id: 42,
    lat: -34.6,
    lon: -58.4,
    icon: "restaurant",
    name: "Café Satoshi",
    website: "https://example.com",
    instagram: "@satoshi.cafe",
    "osm:payment:onchain": "yes",
    "osm:payment:lightning": "only",
  });
  assert.equal(merchant.category, "food");
  assert.equal(merchant.payments.onchain, true);
  assert.equal(merchant.payments.lightning, true);
  assert.equal(merchant.instagram, "https://www.instagram.com/satoshi.cafe/");
});

test("rechaza registros inválidos y eliminados", () => {
  assert.equal(normalizeMerchant({ id: 1, lat: 91, lon: 0 }), null);
  assert.equal(normalizeMerchant({ id: 1, lat: 0, lon: 0, deleted_at: "now" }), null);
});

test("usa Otros para iconos desconocidos", () => {
  assert.equal(merchantCategory("future_unknown_icon"), "other");
  assert.equal(merchantCategory("local_atm"), "finance");
});

test("acepta Google sólo por nombre y proximidad", () => {
  const merchant = { name: "Café Satoshi", lat: -34.6037, lon: -58.3816 };
  assert.equal(
    isConfidentGoogleMatch(merchant, {
      displayName: "Cafe Satoshi",
      location: { latitude: -34.6038, longitude: -58.3817 },
    }),
    true,
  );
  assert.equal(
    isConfidentGoogleMatch(merchant, {
      displayName: "Café Satoshi",
      location: { latitude: -34.62, longitude: -58.4 },
    }),
    false,
  );
  assert.equal(
    isConfidentGoogleMatch(merchant, {
      displayName: "Otro negocio",
      location: { latitude: -34.6038, longitude: -58.3817 },
    }),
    false,
  );
});

const googleMerchant = {
  id: 42,
  name: "Café Satoshi",
  lat: -34.6037,
  lon: -58.3816,
};

test("Google Places se omite sin clave", async () => {
  assert.equal(await getGooglePlace(googleMerchant), null);
});

test("Google Places se degrada ante error upstream o falta de coincidencia", async () => {
  mockFetch = async () => {
    throw new Error("upstream down");
  };
  assert.equal(await getGooglePlace(googleMerchant, "test-key"), null);

  mockFetch = async () => ({
    ok: true,
    json: async () => ({
      places: [
        {
          displayName: { text: "Otro negocio" },
          location: { latitude: -34.6038, longitude: -58.3817 },
          googleMapsUri: "https://maps.google.com/other",
        },
      ],
    }),
  });
  assert.equal(await getGooglePlace(googleMerchant, "test-key"), null);
});

test("Google Places devuelve rating, fuente y fotos para una coincidencia válida", async () => {
  let calls = 0;
  mockFetch = async () => {
    calls++;
    if (calls === 1) {
      return {
        ok: true,
        json: async () => ({
          places: [
            {
              displayName: { text: "Cafe Satoshi" },
              location: { latitude: -34.6038, longitude: -58.3817 },
              rating: 4.8,
              userRatingCount: 120,
              googleMapsUri: "https://maps.google.com/place",
              photos: [
                {
                  name: "places/1/photos/1",
                  googleMapsUri: "https://maps.google.com/photo",
                  authorAttributions: [{ displayName: "Ada", uri: "https://maps.google.com/ada" }],
                },
              ],
            },
          ],
        }),
      };
    }
    return {
      ok: true,
      json: async () => ({ photoUri: "https://lh3.googleusercontent.com/photo" }),
    };
  };

  const place = await getGooglePlace(googleMerchant, "test-key");
  assert.equal(place.rating, 4.8);
  assert.equal(place.googleMapsUri, "https://maps.google.com/place");
  assert.equal(place.photos[0].authors[0].displayName, "Ada");
  assert.equal(calls, 2);
});
