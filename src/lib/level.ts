export type LevelSummary = {
    totalXp: number;
    currentLevel: number;
    currentLevelXp: number;
    xpRequiredForNextLevel: number;
    xpToNextLevel: number;
    progressPercent: number;
  };
  
  const XP_REQUIRED_BY_TARGET_LEVEL: Record<number, number> = {
    2: 10,
    3: 10,
    4: 10,
    5: 12,
    6: 12,
    7: 12,
    8: 15,
    9: 15,
    10: 15,
    11: 17,
    12: 17,
    13: 17,
    14: 20,
    15: 20,
    16: 20,
    17: 22,
    18: 22,
    19: 22,
    20: 25,
    21: 25,
    22: 25,
    23: 27,
    24: 27,
    25: 27,
    26: 27,
    27: 27,
    28: 30,
    29: 30,
    30: 30,
    31: 33,
    32: 33,
    33: 33,
    34: 37,
    35: 37,
    36: 37,
    37: 37,
    38: 40,
    39: 40,
    40: 40,
    41: 43,
    42: 43,
    43: 43,
    44: 47,
    45: 47,
    46: 47,
    47: 47,
    48: 50,
    49: 50,
    50: 50,
    51: 60,
    52: 60,
    53: 60,
    54: 60,
    55: 60,
    56: 60,
    57: 60,
    58: 60,
    59: 60,
    60: 60,
  };
  
  export function calculateTotalXp(nextCount: number, replayCount: number) {
    return nextCount + replayCount * 2;
  }
  
  export function getLevelSummary(totalXp: number): LevelSummary {
    let level = 1;
    let remainingXp = totalXp;
  
    while (level < 60) {
      const required = XP_REQUIRED_BY_TARGET_LEVEL[level + 1];
      if (remainingXp < required) {
        return {
          totalXp,
          currentLevel: level,
          currentLevelXp: remainingXp,
          xpRequiredForNextLevel: required,
          xpToNextLevel: required - remainingXp,
          progressPercent: Math.max(0, Math.min(100, (remainingXp / required) * 100)),
        };
      }
  
      remainingXp -= required;
      level += 1;
    }
  
    return {
      totalXp,
      currentLevel: 50,
      currentLevelXp: 0,
      xpRequiredForNextLevel: 0,
      xpToNextLevel: 0,
      progressPercent: 100,
    };
  }