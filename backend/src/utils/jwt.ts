import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UserRole } from "@prisma/client";

export interface TokenPayload {
  id: string;
  role: UserRole;
  branchId: string | null;
  phoneNumber: string;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};
