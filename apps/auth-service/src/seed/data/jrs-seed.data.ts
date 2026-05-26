// DEV ONLY: JRS seed data for development seeding
// Moved from apps/jrs/src/seed/jrs-seed-data.ts and stripped of auth fields
// Removed: hasSystemAccess, isPc, isAp (JRS domain concerns)
// Kept: personData, townName, role (mapped to AppRole enum)

import { MemberStatus, Gender, PersonStatus } from '@app/types';
import { AppRole } from '@app/types';

export const JRS_SEED_DATA = {
  country: {
    name: 'Cameroon',
    code: 'CM',
    phoneCode: '+237',
  },
  towns: [{ name: 'Douala' }, { name: 'Edea' }, { name: 'Yaounde' }],
  members: [
    {
      personData: {
        fullName: 'Jean Dupont',
        email: 'jrs1@lrc.org',
        phone: '+237600000001',
        gender: Gender.MALE,
        status: PersonStatus.ALIVE,
      },
      townName: 'Douala',
      role: AppRole.JRS_PC, // mapped from isPc: false, isAp: false, hasSystemAccess: true
      status: MemberStatus.ACTIVE,
    },
    {
      personData: {
        fullName: 'Marie Claire Ngo',
        email: 'jrs2@lrc.org',
        phone: '+237600000002',
        gender: Gender.FEMALE,
        status: PersonStatus.ALIVE,
      },
      townName: 'Yaounde',
      role: AppRole.JRS_ADMIN, // mapped from isPc: true, isAp: false, hasSystemAccess: true
      status: MemberStatus.ACTIVE,
    },
    {
      personData: {
        fullName: 'Paul Atangana',
        email: 'jrs3@lrc.org',
        phone: '+237600000003',
        gender: Gender.MALE,
        status: PersonStatus.ALIVE,
      },
      townName: 'Edea',
      role: AppRole.JRS_AP, // mapped from isPc: false, isAp: true, hasSystemAccess: true
      status: MemberStatus.ACTIVE,
    },
  ],
};
