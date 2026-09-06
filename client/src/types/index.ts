export type UserRole = 'customer' | 'professional' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  isActive: boolean;
}

export interface PortfolioItem {
  title: string;
  imageUrl: string;
  description?: string;
}

export interface Professional {
  _id: string;
  userId: User;
  category: Category;
  title: string;
  bio: string;
  hourlyRate: number;
  experienceYears: number;
  location: {
    address?: string;
    city: string;
    state: string;
    zipCode?: string;
    country: string;
  };
  isApproved: boolean;
  rating: number;
  reviewCount: number;
  portfolio: PortfolioItem[];
  createdAt: string;
}

export interface Service {
  _id: string;
  professionalId: string | Professional;
  category: string | Category;
  title: string;
  description: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  recipient: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  bookingId?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ScoredProfessional {
  professional: Professional;
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
