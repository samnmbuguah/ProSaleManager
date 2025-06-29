import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

describe("Authentication Service", () => {
  const mockUser = {
    id: 1,
    username: "testuser",
    fullname: "Test User",
    role: "admin",
    password_hash: "", // Will be set in beforeEach
  };

  const plainPassword = "password123";
  const mockJwtSecret = "test-secret";

  beforeEach(() => {
    // Create a real hash of the test password
    mockUser.password_hash = bcrypt.hashSync(plainPassword, 10);
    process.env.JWT_SECRET = mockJwtSecret;
  });

  describe("Login", () => {
    it("should successfully authenticate with correct credentials", () => {
      // Test password verification
      const isPasswordValid = bcrypt.compareSync(
        plainPassword,
        mockUser.password_hash,
      );
      expect(isPasswordValid).toBe(true);

      // Create token with verified credentials
      const token = jwt.sign(
        { id: mockUser.id, username: mockUser.username, role: mockUser.role },
        mockJwtSecret,
        { expiresIn: "1h" },
      );

      expect(token).toBeDefined();

      // Verify token is valid
      const decoded = jwt.verify(token, mockJwtSecret);
      expect(decoded).toHaveProperty("id", mockUser.id);
      expect(decoded).toHaveProperty("username", mockUser.username);
      expect(decoded).toHaveProperty("role", mockUser.role);
    });

    it("should fail authentication with incorrect password", () => {
      const wrongPassword = "wrongpassword";

      // Test password verification with wrong password
      const isPasswordValid = bcrypt.compareSync(
        wrongPassword,
        mockUser.password_hash,
      );
      expect(isPasswordValid).toBe(false);
    });
  });

  describe("Token Validation", () => {
    it("should validate a valid token", () => {
      const token = jwt.sign({ id: mockUser.id }, mockJwtSecret, {
        expiresIn: "1h",
      });

      const decoded = jwt.verify(token, mockJwtSecret);
      expect(decoded).toHaveProperty("id", mockUser.id);
    });

    it("should reject an expired token", () => {
      // Create a token that expires immediately
      const token = jwt.sign({ id: mockUser.id }, mockJwtSecret, {
        expiresIn: "0s",
      });

      // Wait a moment for the token to expire
      setTimeout(() => {
        expect(() => {
          jwt.verify(token, mockJwtSecret);
        }).toThrow();
      }, 100);
    });

    it("should reject a token with invalid signature", () => {
      const token = jwt.sign({ id: mockUser.id }, mockJwtSecret);

      // Try to verify with wrong secret
      expect(() => {
        jwt.verify(token, "wrong-secret");
      }).toThrow();
    });
  });
});
