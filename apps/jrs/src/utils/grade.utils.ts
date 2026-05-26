import { Person } from '@app/database/entities/core/person.entity';
import { GradeLevel } from '@app/database/entities/core/grade-level.entity';

export function isEcoleExterieure(person: Person): boolean {
  const grade = person.gradeLevel;
  if (!grade) return false;

  return (
    grade.category?.name === 'Membre' ||
    (grade.category?.name === 'Eleve' && grade.name === 'Eleve Aspect 1')
  );
}

export function isEcoleInterieur(person: Person): boolean {
  const grade = person.gradeLevel;
  if (!grade || !grade.category || grade.category?.name !== 'Eleve') {
    return false;
  }

  return grade.minAspect !== null && grade.minAspect >= 2;
}

export function getGradeAspectNumber(
  gradeLevel: GradeLevel | null,
): number | null {
  if (!gradeLevel || !gradeLevel.minAspect) return null;
  return gradeLevel.minAspect;
}
