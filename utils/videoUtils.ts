
/**
 * Configuration for Camera Recording.
 * Prioritizes 4K resolution (3840x2160) on the environment (back) camera.
 * Browsers will fall back to the highest available resolution if 4K is not supported.
 */
export const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: true,
  video: {
    facingMode: 'environment', // Use back camera
    width: { ideal: 3840 },    // Target 4K
    height: { ideal: 2160 }
  }
};

/**
 * Generates a thumbnail from the first frame (0.5s) of a video file.
 */
export const generateVideoThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.currentTime = 0.5; // Capture at 0.5s to avoid black frames

    video.onloadeddata = () => {
      // Wait for seek to complete
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      // The canvas will naturally adopt the video's resolution (e.g., 4K if recorded in 4K)
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(dataUrl);
      // Cleanup
      URL.revokeObjectURL(video.src);
    };
    
    // Trigger load
    video.load();
  });
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
