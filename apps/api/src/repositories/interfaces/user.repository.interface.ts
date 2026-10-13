import type { User, NewUser } from "../../db/schema";

export type SafeUser = Omit<User, "passwordHash">;

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: NewUser): Promise<User>;
}

