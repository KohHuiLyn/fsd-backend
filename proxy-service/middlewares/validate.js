/**
 * Validate `req.body` against a Zod schema.
 *
 * On success the parsed value is attached as `req.validated`; on failure a
 * 400 response with the Zod issues is returned.
 */
export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "ValidationError", details: parsed.error.issues });
  }
  req.validated = parsed.data;
  next();
};

/**
 * Validate `req.params` against a Zod schema.
 *
 * Parsed params are attached as `req.validatedParams`.
 */
export const validateParams = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: "ValidationError", details: parsed.error.issues });
  }
  req.validatedParams = parsed.data;
  next();
};

/**
 * Validate `req.query` against a Zod schema.
 *
 * Parsed query string parameters are attached as `req.validatedQuery`.
 */
export const validateQuery = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "ValidationError", details: parsed.error.issues });
  }
  req.validatedQuery = parsed.data;
  next();
};