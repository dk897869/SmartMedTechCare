const cloudinary = require('cloudinary').v2;

// 1. Configure Cloudinary inline
cloudinary.config({
  cloud_name: 'dgaxq7lw',
  api_key: '978367621945128',
  api_secret: 'zX7Keo8VEfQYDQo0egsZuU6Y0Zo'
});

async function run() {
  try {
    const sampleImageUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
    
    console.log('Uploading sample image to Cloudinary...');
    // 2. Upload an image
    const uploadResult = await cloudinary.uploader.upload(sampleImageUrl, {
      public_id: 'cloudinary_onboarding_sample'
    });
    
    console.log('Secure URL:', uploadResult.secure_url);
    console.log('Public ID:', uploadResult.public_id);
    
    // 3. Get image details
    console.log('Fetching image details...');
    const details = await cloudinary.api.resource(uploadResult.public_id);
    console.log('Width:', details.width);
    console.log('Height:', details.height);
    console.log('Format:', details.format);
    console.log('File size (bytes):', details.bytes);
    
    // 4. Transform the image
    // f_auto: Automatic format selection based on browser compatibility (e.g. delivers WebP/AVIF to Chrome)
    // q_auto: Automatic quality adjustment (delivers the best visual quality at the smallest file size)
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      secure: true,
      fetch_format: 'auto',
      quality: 'auto'
    });
    
    console.log('Done! Click link below to see optimized version of the image. Check the size and the format.');
    console.log(transformedUrl);
  } catch (error) {
    console.error('Error during onboarding execution:', error);
  }
}

run();
