import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;       // userId
  tenantId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
