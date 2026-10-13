import { Type, type Static } from "@sinclair/typebox";

export const RegisterInputSchema = Type.Object({
  name: Type.String({ minLength: 2, maxLength: 100 }),
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8, maxLength: 100 }),
});

export type RegisterInput = Static<typeof RegisterInputSchema>;

export const LoginInputSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 1 }),
});

export type LoginInput = Static<typeof LoginInputSchema>;

export const UserResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  email: Type.String(),
  createdAt: Type.String(),
});

export type UserResponse = Static<typeof UserResponseSchema>;

