// src/handler.js
const BASE = process.env.PERENUAL_BASE || "https://perenual.com/api";
const V = process.env.PERENUAL_VERSION || "v2";
const KEY = process.env.PERENUAL_API_KEY;

const ok = (body, headers = {}) => ({
  statusCode: 200,
  headers: { "content-type": "application/json", ...headers },
  body: JSON.stringify(body),
});
const err = (status, message) => ({
  statusCode: status,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ ok: false, error: message }),
});

export const handler = async (event) => {
  try {
    const routeKey = event?.requestContext?.routeKey; // e.g. "GET /plants/v2/species-list"
    const qs = event?.queryStringParameters || {};
    const pathParams = event?.pathParameters || {};
    console.log("routeKey:", routeKey, "qs:", qs, "pathParams:", pathParams);

    const withKey = (params = {}) => {
      const u = new URL(`${BASE}/${V}/species-list`);
      Object.entries({ ...params, key: KEY }).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, v);
      });
      return u.toString();
    };

    switch (routeKey) {
      // GET /plants/v2/species-list
      case "GET /plants/v2/species-list": {
        const url = withKey(qs); // q, page, filters...
        const r = await fetch(url);
        const j = await r.json();
        return ok(j);
      }

      // GET /plants/v2/species/details/{id}
      case "GET /plants/v2/species/details/{id}": {
        const id = pathParams.id;
        if (!id) return err(400, "Missing id");
        const url = `${BASE}/${V}/species/details/${id}?key=${encodeURIComponent(KEY)}`;
        const r = await fetch(url);
        const j = await r.json();
        return ok(j);
      }

      // GET /plants/pest-disease-list
      case "GET /plants/pest-disease-list": {
        const u = new URL(`${BASE}/pest-disease-list`);
        Object.entries({ ...qs, key: KEY }).forEach(([k, v]) => {
          if (v) u.searchParams.set(k, v);
        });
        const r = await fetch(u.toString());
        const j = await r.json();
        return ok(j);
      }

      // GET /plants/species-care-guide-list
      case "GET /plants/species-care-guide-list": {
        const u = new URL(`${BASE}/species-care-guide-list`);
        Object.entries({ ...qs, key: KEY }).forEach(([k, v]) => {
          if (v) u.searchParams.set(k, v);
        });
        const r = await fetch(u.toString());
        const j = await r.json();
        return ok(j);
      }

      // GET /plants/hardiness-map  (returns HTML)
      case "GET /plants/hardiness-map": {
        const u = new URL(`${BASE}/hardiness-map`);
        Object.entries({ ...qs, key: KEY }).forEach(([k, v]) => {
          if (v) u.searchParams.set(k, v);
        });
        const r = await fetch(u.toString());
        const html = await r.text();
        return {
          statusCode: 200,
          headers: { "content-type": "text/html" },
          body: html,
        };
      }

      default:
        return err(404, "Not found");
    }
  } catch (e) {
    console.error(e);
    return err(500, "Internal error");
  }
};
