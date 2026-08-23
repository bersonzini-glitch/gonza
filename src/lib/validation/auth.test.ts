import { describe, expect, it } from "vitest";

import { resetPasswordSchema, signInSchema, signUpSchema } from "@/lib/validation/auth";

describe("signUpSchema", () => {
  const base = {
    username: "dr_ana",
    fullName: "Ana Martínez",
    email: "ana@example.com",
    password: "Sup3rSecret",
  };

  it("accepts valid input", () => {
    expect(signUpSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a username with invalid characters", () => {
    expect(signUpSchema.safeParse({ ...base, username: "dr ana!" }).success).toBe(false);
  });

  it("rejects a username shorter than 3 characters", () => {
    expect(signUpSchema.safeParse({ ...base, username: "ab" }).success).toBe(false);
  });

  it("rejects a password without an uppercase letter", () => {
    expect(signUpSchema.safeParse({ ...base, password: "lowercase1" }).success).toBe(false);
  });

  it("rejects a password without a number", () => {
    expect(signUpSchema.safeParse({ ...base, password: "NoNumberHere" }).success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(signUpSchema.safeParse({ ...base, password: "Sh0rt" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signUpSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("accepts a username or email as identifier", () => {
    expect(signInSchema.safeParse({ identifier: "dr_ana", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ identifier: "ana@example.com", password: "x" }).success).toBe(
      true,
    );
  });

  it("rejects an empty identifier", () => {
    expect(signInSchema.safeParse({ identifier: "", password: "x" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Sup3rSecret",
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
  });

  it("accepts matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "Sup3rSecret",
      confirmPassword: "Sup3rSecret",
    });
    expect(result.success).toBe(true);
  });
});
