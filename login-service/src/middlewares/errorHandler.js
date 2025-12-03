export default function errorHandler(err, req, res, next) {
  console.error("❌ Unhandled Error:", err.message);
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
}
