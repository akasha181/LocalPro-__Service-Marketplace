import { User } from '../models/User';
import { Category } from '../models/Category';
import { Professional } from '../models/Professional';
import { Service } from '../models/Service';

export const seedInitialData = async (): Promise<void> => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return;
    }

    console.log('[Seed] Seeding marketplace demo database...');

    // 1. Core Users
    const adminUser = await User.create({
      name: 'Alex Rivera (Admin)',
      email: 'admin@localpro.com',
      password: 'password123',
      role: 'admin',
      phone: '+1 (555) 019-2834',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    });

    const proUser1 = await User.create({
      name: 'David Vance',
      email: 'pro@localpro.com',
      password: 'password123',
      role: 'professional',
      phone: '+1 (555) 438-9201',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    });

    const proUser2 = await User.create({
      name: 'Elena Rostova',
      email: 'elena@localpro.com',
      password: 'password123',
      role: 'professional',
      phone: '+1 (555) 721-3948',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    });

    const proUser3 = await User.create({
      name: 'Marcus Chen',
      email: 'marcus@localpro.com',
      password: 'password123',
      role: 'professional',
      phone: '+1 (555) 912-4433',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
    });

    await User.create({
      name: 'Sarah Connor (Customer)',
      email: 'customer@localpro.com',
      password: 'password123',
      role: 'customer',
      phone: '+1 (555) 839-1120',
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    });

    // 2. Categories
    const categories = await Category.create([
      {
        name: 'Electrical & Wiring',
        slug: 'electrical',
        icon: 'Zap',
        description: 'Certified electricians for repairs, circuit breakers, rewiring and fixture setups.',
      },
      {
        name: 'Plumbing & Pipes',
        slug: 'plumbing',
        icon: 'Wrench',
        description: 'Leak detection, pipe repairs, faucet fixtures, drain cleaning and water heaters.',
      },
      {
        name: 'Home Cleaning',
        slug: 'cleaning',
        icon: 'Sparkles',
        description: 'Deep residential cleaning, move-out sanitization, carpet cleaning, and recurring housekeeping.',
      },
      {
        name: 'Carpentry & Handyman',
        slug: 'carpentry',
        icon: 'Hammer',
        description: 'Custom cabinetry, furniture assembly, doors, drywall repairs and structural woodwork.',
      },
      {
        name: 'Painting & Decor',
        slug: 'painting',
        icon: 'Paintbrush',
        description: 'Interior and exterior wall painting, priming, wallpaper removal, and decorative finishes.',
      },
      {
        name: 'Appliance Repair',
        slug: 'appliances',
        icon: 'Cpu',
        description: 'Diagnostic troubleshooting and repair for refrigerators, washers, dryers, and HVAC systems.',
      },
    ]);

    const catElectrical = categories[0];
    const catPlumbing = categories[1];
    const catCleaning = categories[2];

    // 3. Professionals
    const pro1 = await Professional.create({
      userId: proUser1._id,
      category: catElectrical._id,
      title: 'Master Licensed Electrician',
      bio: 'Over 12 years of residential & commercial wiring experience. Certified in smart home automation, EV charger installations, and comprehensive breaker panel upgrades.',
      hourlyRate: 85,
      experienceYears: 12,
      location: {
        address: '452 Broadway',
        city: 'New York',
        state: 'NY',
        zipCode: '10013',
        country: 'USA',
      },
      isApproved: true,
      rating: 4.95,
      reviewCount: 48,
      portfolio: [
        {
          title: 'Tesla EV Wall Charger Install',
          imageUrl: 'https://images.unsplash.com/photo-1558441719-8b489c63f77a?auto=format&fit=crop&q=80&w=600',
          description: '240V 60A dedicated circuit with clean conduit run.',
        },
        {
          title: 'Luxury Recessed LED Lighting',
          imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600',
          description: 'Smart dimmable recessed lighting across entire loft.',
        },
      ],
    });

    const pro2 = await Professional.create({
      userId: proUser2._id,
      category: catCleaning._id,
      title: 'Eco-Friendly Deep Cleaning Specialist',
      bio: 'Hospital-grade sanitization using 100% pet-safe and eco-certified organic products. Specialized in move-in/move-out resets and post-renovation detailing.',
      hourlyRate: 55,
      experienceYears: 7,
      location: {
        address: '180 5th Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10010',
        country: 'USA',
      },
      isApproved: true,
      rating: 4.9,
      reviewCount: 62,
      portfolio: [
        {
          title: 'Kitchen & Tile Deep Sanitization',
          imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600',
          description: 'Steam degreasing and marble polish.',
        },
      ],
    });

    const pro3 = await Professional.create({
      userId: proUser3._id,
      category: catPlumbing._id,
      title: 'Emergency Plumbing & Hydro-Jetting Pro',
      bio: 'Rapid emergency plumbing response. Camera pipe inspections, sewer line unclogging, tankless water heater maintenance, and leak restoration.',
      hourlyRate: 95,
      experienceYears: 15,
      location: {
        address: '220 E 42nd St',
        city: 'New York',
        state: 'NY',
        zipCode: '10017',
        country: 'USA',
      },
      isApproved: true,
      rating: 4.88,
      reviewCount: 39,
      portfolio: [
        {
          title: 'Tankless Water Heater Upgrade',
          imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=600',
          description: 'High-efficiency continuous hot water unit with copper piping.',
        },
      ],
    });

    // 4. Services
    await Service.create([
      {
        professionalId: pro1._id,
        category: catElectrical._id,
        title: 'Full Electrical Diagnostic & Inspection',
        description: 'Comprehensive evaluation of breaker panels, outlets, ground faults, and load testing.',
        price: 120,
        durationMinutes: 60,
      },
      {
        professionalId: pro1._id,
        category: catElectrical._id,
        title: 'EV Charger / 240V Outlet Installation',
        description: 'Dedicated heavy-duty line installation for electric vehicle home charging stations.',
        price: 350,
        durationMinutes: 180,
      },
      {
        professionalId: pro2._id,
        category: catCleaning._id,
        title: 'Standard Apartment Refresh (Up to 2 Bedrooms)',
        description: 'Thorough dusting, vacuuming, mopping, bathroom descaling, and kitchen counters wiping.',
        price: 110,
        durationMinutes: 120,
      },
      {
        professionalId: pro2._id,
        category: catCleaning._id,
        title: 'Full Deep Clean & Sanitization',
        description: 'Inside appliances (oven/fridge), baseboards, window sills, and steam grout treatment.',
        price: 240,
        durationMinutes: 240,
      },
      {
        professionalId: pro3._id,
        category: catPlumbing._id,
        title: 'Drain Camera Inspection & Unclogging',
        description: 'Digital fiber-optic camera diagnostic through main lines followed by motorized snake clearing.',
        price: 175,
        durationMinutes: 90,
      },
    ]);

    console.log('[Seed] Marketplace database populated with categories, verified pros, and services.');
  } catch (error) {
    console.error('[Seed] Error seeding marketplace:', error);
  }
};
