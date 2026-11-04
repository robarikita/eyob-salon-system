import prisma from "../../utils/prisma";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateTokens, verifyToken, TokenPayload } from "../../utils/jwt";
import { ValidationError, UnauthorizedError } from "../../errors/AppError";
import { z } from "zod";
import { registerSchema, loginSchema } from "./auth.schema";

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

export class AuthService {
  static async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingUser) {
      throw new ValidationError("Phone number is already registered");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: "CUSTOMER", // Default role for open registration
      },
    });

    const payload: TokenPayload = {
      id: user.id,
      role: user.role,
      branchId: user.branchId,
      phoneNumber: user.phone,
    };

    const tokens = generateTokens(payload);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid phone number or password");
    }

    const isValid = await comparePassword(data.password, user.password);

    if (!isValid) {
      throw new UnauthorizedError("Invalid phone number or password");
    }

    const payload: TokenPayload = {
      id: user.id,
      role: user.role,
      branchId: user.branchId,
      phoneNumber: user.phone,
    };

    const tokens = generateTokens(payload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  static async refresh(refreshToken: string) {
    try {
      const decoded = verifyToken(refreshToken);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      const payload: TokenPayload = {
        id: user.id,
        role: user.role,
        branchId: user.branchId,
        phoneNumber: user.phone,
      };

      return generateTokens(payload);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
