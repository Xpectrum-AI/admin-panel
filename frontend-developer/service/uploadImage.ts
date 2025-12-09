export async function uploadImage(file: File, folder: string = '/bg'): Promise<string> {
  try {
    console.log('Starting direct image upload for:', file.name, 'Size:', file.size, 'Folder:', folder);
    
    const formData = new FormData();
    formData.append('image', file, file.name);
    formData.append('folder', folder); // Add folder parameter
    
      
      const url ='/api/upload/image' 
      try {
        console.log(`Trying upload to: ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const uploadResponse = await fetch(url, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        console.log(`Upload response status for ${url}:`, uploadResponse.status);

        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          console.log('Upload successful:', result);
          
          const imageUrl = result.url || result.imageUrl;
          if (imageUrl) {
            return imageUrl;
          }
        } else {
          const errorText = await uploadResponse.text();
          console.error(`Upload failed for ${url}:`, errorText);
        }
      } catch (error) {
        console.error(`Error with ${url}:`, error);
        // Continue to next URL
      }

    
    throw new Error('All upload methods failed');
  } catch (error: any) {
    console.error('Direct image upload failed:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}