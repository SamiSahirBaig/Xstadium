/**
 * computeMoodStr
 * Evaluates physiological state metrics of a zone to classify the crowd's emotional standing.
 */
export const computeMoodStr = (pressure, trend, phase) => {
  if (pressure > 75 && trend === 'rising' && phase === 'POST_GAME') return 'frustrated';
  if (pressure > 80 && trend === 'rising') return 'anxious';
  if (pressure >= 50 && pressure <= 70 && trend === 'rising' && phase === 'PRE_GAME') return 'excited';
  if (pressure >= 40 && pressure <= 65 && phase === 'HALF_TIME' && trend === 'stable') return 'euphoric';
  if (pressure < 40 && trend === 'stable') return 'relaxed';
  return 'neutral';
};

/**
 * getMoodEmoji
 * Maps classical string states to rendered visual markers for the UI components.
 */
export const getMoodEmoji = (mood) => {
  const map = {
    euphoric: '🎉',
    anxious: '😰',
    frustrated: '😤',
    relaxed: '😌',
    excited: '🤩',
    neutral: '😐'
  };
  return map[mood] || '😐';
};

/**
 * computeMood
 * Master extraction utility returning evaluated strings ready for Pipeline injection.
 */
export const computeMood = (zoneData, phase) => {
  const pressure = zoneData.pressureScore || 0;
  const trend = zoneData.trend || 'stable';
  
  const mood = computeMoodStr(pressure, trend, phase);
  const moodEmoji = getMoodEmoji(mood);

  return { mood, moodEmoji };
};
