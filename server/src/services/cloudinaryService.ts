import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'mock_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_secret',
  secure: true,
});

export const uploadMedia = async (
  fileBase64: string,
  folder: string = 'localpro'
): Promise<{ url: string; publicId: string }> => {
  // If cloud credentials are mock or not configured, return high-resolution placeholder
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME.includes('mock')
  ) {
    const mockId = `localpro_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    // If it's already a data URL or external URL, return safely
    if (fileBase64.startsWith('http://') || fileBase64.startsWith('https://')) {
      return { url: fileBase64, publicId: mockId };
    }
    // Return mock image URL
    return {
      url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800',
      publicId: mockId,
    };
  }

  const result = await cloudinary.uploader.upload(fileBase64, {
    folder,
    resource_type: 'auto',
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

export const deleteMedia = async (publicId: string): Promise<boolean> => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD_NAME.includes('mock')
  ) {
    return true;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (err) {
    console.error('[Cloudinary] Delete failed:', err);
    return false;
  }
};
