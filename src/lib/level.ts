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
    5: 10,
    6: 12,
    7: 12,
    8: 12,
    9: 12,
    10: 15,
    11: 15,
    12: 15,
    13: 15,
    14: 15,
    15: 20,
    16: 20,
    17: 20,
    18: 20,
    19: 20,
    20: 25,
    21: 25,
    22: 25,
    23: 25,
    24: 25,
    25: 30,
    26: 30,
    27: 30,
    28: 30,
    29: 30,
    30: 35,
    31: 35,
    32: 35,
    33: 35,
    34: 35,
    35: 40,
    36: 40,
    37: 40,
    38: 40,
    39: 40,
    40: 45,
    41: 45,
    42: 45,
    43: 45,
    44: 45,
    45: 50,
    46: 50,
    47: 50,
    48: 50,
    49: 50,
    50: 60,
    51: 60,
    52: 60,
    53: 60,
    54: 60,
    55: 60,
    56: 60,
    57: 60,
    58: 60,
    59: 60,
    60: 70,
    61: 70,
    62: 70,
    63: 70,
    64: 70,
    65: 70,
    66: 70,
    67: 70,
    68: 70,
    69: 70,
    70: 80,

    71: 80,
    72: 80,
    73: 80,
    74: 80,
    75: 80,
    76: 80,
    77: 80,
    78: 80,
    79: 80,

    80: 90,
    81: 90,
    82: 90,
    83: 90,
    84: 90,
    85: 90,
    86: 90,
    87: 90,
    88: 90,
    89: 90,

    90: 100,
    91: 100,
    92: 100,
    93: 100,
    94: 100,
    95: 100,
    96: 100,
    97: 100,
    98: 100,
    99: 100,

    100: 120,
    101: 120,
    102: 120,
    103: 120,
    104: 120,
    105: 120,
    106: 120,
    107: 120,
    108: 120,
    109: 120,
    110: 120,
    111: 120,
    112: 120,
    113: 120,
    114: 120,
    115: 120,
    116: 120,
    117: 120,
    118: 120,
    119: 120,

    120: 150,
    121: 150,
    122: 150,
    123: 150,
    124: 150,
    125: 150,
    126: 150,
    127: 150,
    128: 150,
    129: 150,
    130: 150,
    131: 150,
    132: 150,
    133: 150,
    134: 150,
    135: 150,
    136: 150,
    137: 150,
    138: 150,
    139: 150,
    140: 150,
    141: 150,
    142: 150,
    143: 150,
    144: 150,
    145: 150,
    146: 150,
    147: 150,
    148: 150,
    149: 150,

    150: 200,
  };
  
  export function calculateTotalXp(nextCount: number, replayCount: number) {
    return nextCount + replayCount * 2;
  }
  
  export function getLevelSummary(totalXp: number): LevelSummary {
    let level = 1;
    let remainingXp = totalXp;
  
    while (level < 151) {
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