export default function errorHandler(err, req, res, next) {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ message: "Internal server error" });
}
