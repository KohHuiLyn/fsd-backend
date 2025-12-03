import rateLimit from "express-rate-limit";

// export const loginRateLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000, // 10 minutes
//   max: 10, // Limit each IP to 10 login attempts per 10 minutes
//   message: {
//     message: "Too many login attempts. Please try again later.",
//   },
//   standardHeaders: true, // Return rate limit info in headers
//   legacyHeaders: false,
// });
// app.set('trust proxy', true); // we're behind a proxy/LB

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,   // send RateLimit-* headers
  legacyHeaders: false,    // disable X-RateLimit-* headers
  keyGenerator: (req /*, res*/) => {
    // prefer Forwarded / X-Forwarded-For; fall back to req.ip
    const fwd = req.headers['forwarded'];
    if (fwd) {
      // Forwarded: for=1.2.3.4;proto=https;host=example.com
      const m = /for=(?:"?\[?)([^;\s,\]]+)/i.exec(fwd);
      if (m?.[1]) return m[1];
    }
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length) {
      return xff.split(',')[0].trim();
    }
    return req.ip;
  },
});