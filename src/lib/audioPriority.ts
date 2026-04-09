let levelUpPriorityToken = 0;
let releaseLevelUpPriority: (() => void) | null = null;
let levelUpPriorityPromise: Promise<void> | null = null;

export function beginLevelUpPriority() {
  levelUpPriorityToken += 1;
  const token = levelUpPriorityToken;

  levelUpPriorityPromise = new Promise<void>((resolve) => {
    releaseLevelUpPriority = resolve;
  });

  return () => {
    if (token !== levelUpPriorityToken) return;
    releaseLevelUpPriority?.();
    releaseLevelUpPriority = null;
    levelUpPriorityPromise = null;
  };
}

export async function waitForLevelUpPriorityToEnd() {
  if (!levelUpPriorityPromise) return;
  await levelUpPriorityPromise;
}
