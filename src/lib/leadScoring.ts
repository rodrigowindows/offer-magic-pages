// Lead scoring utility

export interface LeadScoreFactors {
  hasPhone: boolean;
  hasEmail: boolean;
  emailOpened: boolean;
  linkClicked: boolean;
  clickCount: number;
  campaignsSent: number;
  responseTimeHours?: number;
  leadStatus: string;
}

export interface LeadScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: string[];
}

/**
 * Calculate lead score based on engagement factors
 * Score ranges from 0-100
 */
export function calculateLeadScore(factors: LeadScoreFactors): LeadScore {
  let score = 0;
  const scoreFactors: string[] = [];

  // Contact info availability (max 20 points)
  if (factors.hasPhone) {
    score += 10;
    scoreFactors.push('+10: Has phone number');
  }
  if (factors.hasEmail) {
    score += 10;
    scoreFactors.push('+10: Has email');
  }

  // Engagement signals (max 50 points)
  if (factors.emailOpened) {
    score += 15;
    scoreFactors.push('+15: Email opened');
  }
  if (factors.linkClicked) {
    score += 20;
    scoreFactors.push('+20: Link clicked');
  }
  if (factors.clickCount > 1) {
    const multiClickBonus = Math.min(factors.clickCount - 1, 3) * 5;
    score += multiClickBonus;
    scoreFactors.push(`+${multiClickBonus}: Multiple clicks (${factors.clickCount}x)`);
  }

  // Campaign interaction (max 10 points)
  if (factors.campaignsSent > 0) {
    score += Math.min(factors.campaignsSent * 2, 10);
    scoreFactors.push(`+${Math.min(factors.campaignsSent * 2, 10)}: ${factors.campaignsSent} campaigns sent`);
  }

  // Response time bonus (max 10 points)
  if (factors.responseTimeHours !== undefined && factors.responseTimeHours > 0) {
    if (factors.responseTimeHours < 1) {
      score += 10;
      scoreFactors.push('+10: Responded within 1 hour');
    } else if (factors.responseTimeHours < 24) {
      score += 7;
      scoreFactors.push('+7: Responded within 24 hours');
    } else if (factors.responseTimeHours < 72) {
      score += 4;
      scoreFactors.push('+4: Responded within 3 days');
    }
  }

  // Lead status bonus (max 10 points)
  const statusBonus: Record<string, number> = {
    'meeting_scheduled': 10,
    'offer_made': 8,
    'following_up': 5,
    'contacted': 3,
    'new': 0,
    'closed': 0,
    'not_interested': -10,
  };
  
  const statusScore = statusBonus[factors.leadStatus] || 0;
  if (statusScore > 0) {
    score += statusScore;
    scoreFactors.push(`+${statusScore}: Status is ${factors.leadStatus.replace('_', ' ')}`);
  } else if (statusScore < 0) {
    score += statusScore;
    scoreFactors.push(`${statusScore}: Not interested`);
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 80) grade = 'A';
  else if (score >= 60) grade = 'B';
  else if (score >= 40) grade = 'C';
  else if (score >= 20) grade = 'D';
  else grade = 'F';

  return { score, grade, factors: scoreFactors };
}

/**
 * Get color class for lead grade
 */
export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    case 'B': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
    case 'C': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    case 'D': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
    case 'F': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
    default: return 'text-muted-foreground bg-muted';
  }
}
