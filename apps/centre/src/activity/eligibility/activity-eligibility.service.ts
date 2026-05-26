import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '@app/database/entities/core/person.entity';
import { JeunesGroup } from '@app/database/entities/jeunes/jeunes-group.entity';
import { JeunesMember } from '@app/database/entities/jeunes/jeunes-member.entity';
import { JrsMember } from '@app/database/entities/jrs/jrs-member.entity';
import { GradeLevel } from '@app/database/entities/core/grade-level.entity';

@Injectable()
export class ActivityEligibilityService {
  // Jeunes Group Order (for hierarchy comparison)
  private readonly JEUNES_GROUP_ORDER = ['preA', 'A', 'B', 'C', 'D', 'D+'];

  constructor(
    @InjectRepository(Person)
    private readonly personRepo: Repository<Person>,
    @InjectRepository(JeunesGroup)
    private readonly jeunesGroupRepo: Repository<JeunesGroup>,
    @InjectRepository(JeunesMember)
    private readonly jeunesMemberRepo: Repository<JeunesMember>,
    @InjectRepository(JrsMember)
    private readonly jrsMemberRepo: Repository<JrsMember>,
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepo: Repository<GradeLevel>,
  ) {}

  /**
   * Parse targetGroups string to determine eligibility criteria
   * Supported formats:
   * - "ab", "cd", "bc" etc. for specific jeunes group ranges
   * - "abcd,preA" for specific combinations
   * - "jrs" for JRS-eligible (D, D+ only)
   * - "ecole interieur" for Eleve aspect 2+, no jeunes
   * - "ecole exterieur" for Membre + Eleve aspect 1+, no jeunes
   * - empty/undefined for no restrictions
   */
  parseTargetGroups(targetGroups: string | undefined): {
    allowedGradeCategory: 'Membre' | 'Eleve' | null;
    requiresEleveAspectMin: number; // 0 = no restriction, 1 = Aspect 1+, 2 = Aspect 2+, etc.
    allowedJeunesGroups: string[]; // e.g. ['A', 'B'] or empty array for none
  } {
    // Default values (no restrictions)
    let allowedGradeCategory: 'Membre' | 'Eleve' | null = null;
    let requiresEleveAspectMin = 0;
    let allowedJeunesGroups: string[] = ['preA', 'A', 'B', 'C', 'D', 'D+'];

    if (!targetGroups) {
      return { allowedGradeCategory, requiresEleveAspectMin, allowedJeunesGroups };
    }

    const normalized = targetGroups.toLowerCase().trim();

    // Handle special cases first
    switch (normalized) {
      case 'ecole interieur':
        // Ecole Interieur = Eleve Aspect 2+, no jeunes allowed
        allowedGradeCategory = 'Eleve';
        requiresEleveAspectMin = 2;
        allowedJeunesGroups = [];
        return { allowedGradeCategory, requiresEleveAspectMin, allowedJeunesGroups };

      case 'ecole exterieur':
        // Ecole Exterieure = Membre + Eleve Aspect 1+, no jeunes allowed
        allowedGradeCategory = null; // Both Membre and Eleve allowed
        requiresEleveAspectMin = 1;
        allowedJeunesGroups = [];
        return { allowedGradeCategory, requiresEleveAspectMin, allowedJeunesGroups };

      case 'jrs':
        // JRS activities = All grades, but only D, D+ jeunes allowed
        allowedGradeCategory = null; // Both Membre and Eleve allowed
        requiresEleveAspectMin = 0; // No aspect restriction
        allowedJeunesGroups = ['D', 'D+'];
        return { allowedGradeCategory, requiresEleveAspectMin, allowedJeunesGroups };
    }

    // Comma-separated values not currently used in targetGroups,
    // but supported here for forward-compatibility (e.g. "a,b,c")
    if (normalized.includes(',')) {
      // Handle combinations like "abcd,preA"
      const parts = normalized.split(',').map(part => part.trim());
      const groupsSet = new Set<string>();
      
      for (const part of parts) {
        switch (part) {
          case 'preA': groupsSet.add('preA'); break;
          case 'a': groupsSet.add('A'); break;
          case 'b': groupsSet.add('B'); break;
          case 'c': groupsSet.add('C'); break;
          case 'd': groupsSet.add('D'); break;
        }
      }
      
      allowedJeunesGroups = Array.from(groupsSet).sort((a, b) => 
        this.JEUNES_GROUP_ORDER.indexOf(a) - this.JEUNES_GROUP_ORDER.indexOf(b)
      );
      
      // No grade or aspect restrictions for jeunes group specs
      allowedGradeCategory = null;
      requiresEleveAspectMin = 0;
      
      return { allowedGradeCategory, requiresEleveAspectMin, allowedJeunesGroups };
    }

    // Handle simple jeunes group specs like "preA", "a", "b", "c", "d"
    const simpleGroups: Record<string, string[]> = {
      'prea': ['preA'],
      'a':    ['A'],
      'b':    ['B'],
      'c':    ['C'],
      'd':    ['D'],
    };

    if (simpleGroups[normalized]) {
      allowedJeunesGroups = simpleGroups[normalized];
      allowedGradeCategory = null; // All grades allowed
      requiresEleveAspectMin = 0; // No aspect restriction
      return { allowedGradeCategory, requiresEleveAspectMin, allowedJeunesGroups };
    }

    // If we get here, treat as no restrictions (fallback)
    return { allowedGradeCategory, requiresEleveAspectMin, allowedJeunesGroups };
  }

  /**
   * Check if a person is eligible to attend an activity based on targetGroups
   */
  async isEligibleForActivity(
    person: Person,
    targetGroups: string | undefined
  ): Promise<boolean> {
    // Parse the target groups to get eligibility criteria
    const { 
      allowedGradeCategory, 
      requiresEleveAspectMin, 
      allowedJeunesGroups 
    } = this.parseTargetGroups(targetGroups);

    // Check grade eligibility
    const gradeEligible = this.checkGradeEligibility(
      person, 
      allowedGradeCategory, 
      requiresEleveAspectMin
    );
    if (!gradeEligible) return false;

    // Check jeunes eligibility
    const jeunesEligible = await this.checkJeunesEligibility(
      person.id,
      allowedJeunesGroups
    );
    return jeunesEligible;
  }

  /**
   * Check grade-based eligibility
   */
  private checkGradeEligibility(
    person: Person,
    allowedGradeCategory: 'Membre' | 'Eleve' | null,
    requiresEleveAspectMin: number
  ): boolean {
    // If no grade restriction specified, all grades allowed
    if (allowedGradeCategory === null && requiresEleveAspectMin === 0) {
      return true;
    }

    // Person must have a grade assigned
    if (!person.gradeLevel) {
      return false;
    }

    // Check grade category if specified
    if (allowedGradeCategory !== null) {
      if (person.gradeLevel.category.name !== allowedGradeCategory) {
        return false;
      }
    }

    // Check minimum aspect requirement if specified (only applies to Eleve)
    if (requiresEleveAspectMin > 0 && 
        person.gradeLevel.category.name === 'Eleve') {
      return person.gradeLevel.minAspect !== null && 
             person.gradeLevel.minAspect >= requiresEleveAspectMin;
    }

    // If we specified a grade category but no aspect restriction, 
    // and the person is in that category, they're eligible
    if (allowedGradeCategory !== null && 
        requiresEleveAspectMin === 0 &&
        person.gradeLevel.category.name === allowedGradeCategory) {
      return true;
    }

    return false;
  }

  /**
   * Check jeunes-based eligibility with hierarchy
   */
  private async checkJeunesEligibility(
    personId: string,
    allowedJeunesGroups: string[]
  ): Promise<boolean> {
    // If no jeunes restriction specified, all groups allowed
    if (!allowedJeunesGroups?.length) {
      return true;
    }

    // Check if person is a jeunes member
    const jeunesMember = await this.jeunesMemberRepo.findOne({
      where: { personId },
      relations: ['jeunesGroup'],
    });

    // Not in jeunes group
    if (!jeunesMember) {
      // If activity targets specific jeunes groups, non-jeunes cannot attend
      return false;
    }

    // Find person's group index in the hierarchy
    const personGroupIndex = this.JEUNES_GROUP_ORDER.indexOf(jeunesMember.jeunesGroup.name);
    if (personGroupIndex === -1) {
      // Invalid jeunes group name (shouldn't happen with proper data)
      return false;
    }

    // Find the minimum index of allowed groups (the "lowest" allowed group)
    const minTargetedIndex = Math.min(
      ...allowedJeunesGroups.map(group => this.JEUNES_GROUP_ORDER.indexOf(group))
    );

    // Person can attend if their group is >= (higher than or equal to) the lowest allowed group
    // This implements the hierarchical rule: if you're in group B, you can attend B, C, D, D+ activities
    // but NOT preA or A groups
    return personGroupIndex >= minTargetedIndex;
  }
}