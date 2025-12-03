export function validate(schema) {
  return (req, res, next) => {
    try {
      const parseResult = schema.safeParse(req.body);

      if (!parseResult.success) {
        // Safely extract first error message
        const firstError =
          parseResult.error?.issues?.[0]?.message || "Invalid request data";

        return res.status(400).json({ message: firstError });
      }

      // Attach validated data to request object
      req.validated = parseResult.data;
      next();
    } catch (err) {
      console.error("Validation middleware error:", err.message);
      console.error(err.stack);
      return res.status(400).json({ message: "Invalid request format" });
    }
  };
}
