import { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        branchId: string | null;
        phoneNumber: string;
      };
    }
  }
}
