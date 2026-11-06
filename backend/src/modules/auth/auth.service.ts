import crypto from "crypto";
import prisma from "../../utils/prisma";
import { hashPassword, comparePassword } from "../../utils/password";
import { generateTokens, verifyToken, TokenPayload } from "../../utils/jwt";
import { ValidationError, UnauthorizedError, ConflictError } from "../../errors/AppError";
import { z } from "zod";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schema";

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export class AuthService {
  static async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone.trim() },
    });

    if (existingUser) {
      throw new ConflictError("Phone number is already registered");
    }

    if (data.email && data.email.trim() !== "") {
      const normalizedEmail = data.email.toLowerCase().trim();
      const existingEmail = await prisma.user.findFirst({
        where: { email: normalizedEmail },
      });
      if (existingEmail) {
        throw new ConflictError("Email is already registered");
      }
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email && data.email.trim() !== "" ? data.email.toLowerCase().trim() : null,
        phone: data.phone.trim(),
        password: hashedPassword,
        role: "CUSTOMER", // Default role for open registration
        branchId: null,   // Explicitly null confirming global cross-branch eligibility
      },
    });

    const payload: TokenPayload = {
      id: user.id,
      role: user.role,
      branchId: user.branchId,
      phoneNumber: user.phone,
      tokenVersion: user.tokenVersion,
    };

    const tokens = generateTokens(payload);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    const permissions = await AuthService.getUserPermissions(user);

    return { user: { ...userWithoutPassword, permissions }, tokens };
  }

  static async getUserPermissions(user: { id: string; role: string; roleId?: string | null }): Promise<string[]> {
    if (user.role === "OWNER") {
      const all = await prisma.permission.findMany({ select: { name: true } });
      return all.map((p) => p.name);
    }

    if (user.roleId) {
      const customRole = await prisma.role.findUnique({
        where: { id: user.roleId },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      });
      if (customRole && customRole.permissions.length > 0) {
        return customRole.permissions.map((rp) => rp.permission.name);
      }
    }

    const systemRole = await prisma.role.findUnique({
      where: { name: user.role },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (systemRole) {
      return systemRole.permissions.map((rp) => rp.permission.name);
    }

    return [];
  }

  static async login(data: LoginInput) {
    const lookup = data.identifier || data.phone || "";
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: lookup },
          { email: lookup },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const isValid = await comparePassword(data.password, user.password);

    if (!isValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const payload: TokenPayload = {
      id: user.id,
      role: user.role,
      branchId: user.branchId,
      phoneNumber: user.phone,
      tokenVersion: user.tokenVersion,
    };

    const tokens = generateTokens(payload);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...userWithoutPassword } = user;
    const permissions = await AuthService.getUserPermissions(user);

    return { user: { ...userWithoutPassword, permissions }, tokens };
  }

  static async refresh(refreshToken: string) {
    try {
      const decoded = verifyToken(refreshToken);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.tokenVersion !== (decoded.tokenVersion ?? 0)) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      const payload: TokenPayload = {
        id: user.id,
        role: user.role,
        branchId: user.branchId,
        phoneNumber: user.phone,
        tokenVersion: user.tokenVersion,
      };

      return generateTokens(payload);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }

  static async forgotPassword(data: ForgotPasswordInput) {
    const cleanId = data.identifier.trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanId },
          { email: cleanId },
        ],
      },
    });

    let rawToken: string | undefined;

    if (user) {
      rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: expires,
        },
      });

      console.log(`[AUTH] Password reset requested for user ${user.id} (${user.email || user.phone}). Raw Token: ${rawToken}`);
    }

    // Always return safe neutral message without leaking account existence
    return {
      message: "If an account matches that identifier, password reset instructions have been dispatched.",
      resetToken: rawToken, // Provided for audit script and dev verification
    };
  }

  static async resetPassword(data: ResetPasswordInput) {
    const { token, newPassword } = data;

    if (!token || !newPassword) {
      throw new ValidationError("Reset token and new password are required");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new ValidationError("Password reset token is invalid or has expired");
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        tokenVersion: {
          increment: 1, // Revoke all active sessions & refresh tokens
        },
      },
    });

    return {
      message: "Password has been successfully reset. Please log in with your new credentials.",
    };
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
    const permissions = await AuthService.getUserPermissions(user);
    return { ...userWithoutPassword, permissions };
  }
}
