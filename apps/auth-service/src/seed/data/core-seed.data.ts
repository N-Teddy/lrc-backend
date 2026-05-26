// CORE SEED DATA - Production-safe seed data
// This file contains only the minimum data required to run the system

import { AppCode } from '@app/types';
import { AppRole } from '@app/types';

export const CoreSeedData = {
  country: {
    name: 'Cameroon',
    code: 'CM',
    phoneCode: '+237',
  },
  towns: ['Douala', 'Edea', 'Yaounde'],
  admin: {
    fullName: 'System Administrator',
    email: 'admin@lrc.org',
    phone: '',
    townName: 'Douala', // resolved to townId at runtime
    appCode: AppCode.ADMIN,
    role: AppRole.SUPER_ADMIN,
  },
};
