import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../constants/metadata.constants.js';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
