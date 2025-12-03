export function validate(schema) {
  return (req, res, next) => {
    try {
      const parseResult = schema.safeParse(req.body);

      if (!parseResult.success) {
        const firstError =
          parseResult.error?.issues?.[0]?.message || "Invalid request data";
        return res.status(400).json({ message: firstError });
      }

      req.validated = parseResult.data;
      next();
    } catch (err) {
      console.error("Validation middleware error:", err.message);
      return res.status(400).json({ message: "Invalid request format" });
    }
  };
}
