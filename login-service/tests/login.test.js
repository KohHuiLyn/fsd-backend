import assert from "assert";
import jwt from "jsonwebtoken";

describe("JWT generation", function () {
  it("should generate a valid token", function () {
    const token = jwt.sign({ email: "test@plantpal.com" }, "secret", { expiresIn: "1h" });
    const decoded = jwt.verify(token, "secret");
    assert.equal(decoded.email, "test@plantpal.com");
  });
});
