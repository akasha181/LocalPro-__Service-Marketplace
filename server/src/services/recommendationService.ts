import { Professional, IProfessional } from '../models/Professional';
import { Booking } from '../models/Booking';
import { Review } from '../models/Review';
import mongoose from 'mongoose';

export interface ScoredProfessional {
  professional: IProfessional;
  score: number;
  matchFactors: {
    ratingScore: number;
    experienceScore: number;
    popularityScore: number;
    completionScore: number;
    valueScore: number;
  };
  recommendationReason: string;
}

/**
 * Weighted Multi-Factor AI Recommendation Engine
 * Factors:
 * 1. Rating Quality (30% weight) - Bayesian average approximation
 * 2. Completion & Reliability (25% weight) - Ratio of successfully completed jobs
 * 3. Experience & Trade Depth (15% weight) - Proven years in trade
 * 4. Value / Price Competitiveness (15% weight) - Hourly rate relative to category median
 * 5. Platform Popularity & Demand (15% weight) - Total bookings and review velocity
 */
export const getRecommendedProfessionals = async (options: {
  category?: string;
  limit?: number;
  customerId?: string;
}): Promise<ScoredProfessional[]> => {
  const { category, limit = 6, customerId } = options;

  let query: any = { isApproved: true };
  if (category) {
    if (mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    }
  }

  const professionals = await Professional.find(query)
    .populate('userId', 'name email avatar phone')
    .populate('category', 'name slug icon');

  if (professionals.length === 0) return [];

  // Calculate category averages for baseline comparison
  const totalRates = professionals.reduce((acc, p) => acc + (p.hourlyRate || 50), 0);
  const avgRate = totalRates / professionals.length;

  const scoredList: ScoredProfessional[] = [];

  for (const pro of professionals) {
    // 1. Rating Score (0 to 100): Normalized rating out of 5, weighted with review confidence
    const reviewFactor = Math.min(pro.reviewCount / 10, 1); // 10+ reviews gives full confidence
    const ratingScore = ((pro.rating || 0) / 5) * 100 * (0.7 + 0.3 * reviewFactor);

    // 2. Experience Score (0 to 100): 10+ years gets maximum score
    const experienceScore = Math.min((pro.experienceYears || 1) / 10, 1) * 100;

    // 3. Value Score (0 to 100): Below or equal to market average rates score higher
    const priceRatio = avgRate / (pro.hourlyRate || avgRate);
    const valueScore = Math.min(Math.max(priceRatio * 80, 20), 100);

    // 4. Popularity & Booking Velocity (0 to 100)
    const bookingCount = await Booking.countDocuments({
      professionalId: pro._id,
      status: { $in: ['CONFIRMED', 'COMPLETED'] },
    });
    const popularityScore = Math.min(bookingCount * 15 + pro.reviewCount * 5, 100);

    // 5. Completion & Reliability Score (0 to 100)
    const totalJobs = await Booking.countDocuments({ professionalId: pro._id });
    const completedJobs = await Booking.countDocuments({
      professionalId: pro._id,
      status: 'COMPLETED',
    });
    const completionScore = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 85;

    // Total Composite Weighted AI Score
    const finalScore = Math.round(
      ratingScore * 0.3 +
      completionScore * 0.25 +
      experienceScore * 0.15 +
      valueScore * 0.15 +
      popularityScore * 0.15
    );

    // Dynamic AI Highlight Reason
    let recommendationReason = 'Top-rated specialist in your area';
    if (ratingScore >= 90 && pro.reviewCount >= 5) {
      recommendationReason = 'Exceptional client satisfaction & 5-star track record';
    } else if (valueScore >= 85) {
      recommendationReason = 'High-value specialist with competitive rates';
    } else if (experienceScore >= 80) {
      recommendationReason = `Seasoned veteran with ${pro.experienceYears}+ years of trade expertise`;
    } else if (popularityScore >= 70) {
      recommendationReason = 'Trending professional with high booking volume';
    }

    scoredList.push({
      professional: pro,
      score: finalScore,
      matchFactors: {
        ratingScore: Math.round(ratingScore),
        experienceScore: Math.round(experienceScore),
        popularityScore: Math.round(popularityScore),
        completionScore: Math.round(completionScore),
        valueScore: Math.round(valueScore),
      },
      recommendationReason,
    });
  }

  // Sort descending by highest AI score
  scoredList.sort((a, b) => b.score - a.score);

  return scoredList.slice(0, limit);
};
