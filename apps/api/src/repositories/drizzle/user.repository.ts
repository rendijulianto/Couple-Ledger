import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users, type User, type NewUser } from "../../db/schema";
import type { IUserRepository } from "../interfaces/user.repository.interface";

export class DrizzleUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return result ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result ?? null;
  }

  async create(user: NewUser): Promise<User> {
    const [result] = await db
      .insert(users)
      .values({
        ...user,
        email: user.email.toLowerCase(),
      })
      .returning();

    if (!result) {
      throw new Error("Gagal membuat user");
    }
    return result;
  }
}

export const userRepository = new DrizzleUserRepository();

