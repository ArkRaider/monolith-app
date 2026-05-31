export function getUserTitle(minutes: number): string {
    if (minutes < 30) return "NEWBIE";
    if (minutes < 120) return "INITIATE";
    if (minutes < 300) return "SCHOLAR";
    if (minutes < 1200) return "DEEP_STUDIER";
    if (minutes < 6000) return "FOCUS_MASTER";
    return "THE_MONOLITH";
}

export function calculateLevel(totalXp: number) {
    const level = Math.floor(0.1 * Math.sqrt(totalXp));
    const currentLevelBaseXp = 100 * Math.pow(level, 2);
    const nextLevelBaseXp = 100 * Math.pow(level + 1, 2);
    const progressRatio = (totalXp - currentLevelBaseXp) / (nextLevelBaseXp - currentLevelBaseXp);
    
    const filledCount = Math.floor(progressRatio * 10);
    const emptyCount = 10 - filledCount;
    const bar = '█'.repeat(filledCount) + '░'.repeat(emptyCount);
    
    const displayString = `LVL ${level.toString().padStart(2, '0')} // [${bar}] ${totalXp} / ${nextLevelBaseXp} XP`;
    
    return {
        level,
        progressRatio,
        currentLevelBaseXp,
        nextLevelBaseXp,
        displayString
    };
}
