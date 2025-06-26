
import { useQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { Upload } from "lucide-react";
import type { LandingVideo } from "@shared/schema";

export function LandingVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { data: video, isLoading } = useQuery<LandingVideo | null>({
    queryKey: ["/api/landing-video/current"],
  });

  useEffect(() => {
    if (video && videoRef.current) {
      const videoElement = videoRef.current;
      
      const attemptPlay = async () => {
        try {
          videoElement.muted = true; // Ensure muted for autoplay
          videoElement.load(); // Force reload
          await videoElement.play();
          console.log("Video playback started successfully");
        } catch (error) {
          console.log("Autoplay blocked by browser policy:", error);
        }
      };

      // Set up event listeners
      const handleCanPlay = () => {
        console.log("Video can start playing");
        attemptPlay();
      };

      const handleLoadedData = () => {
        console.log("Video data loaded");
        attemptPlay();
      };

      const handleError = (e: Event) => {
        console.error("Video loading error:", e);
      };

      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('error', handleError);
      
      // Force load the video
      videoElement.load();

      return () => {
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('error', handleError);
      };
    }
  }, [video]);

  if (isLoading) {
    return (
      <div className="w-full h-[400px] bg-darker-surface rounded-lg flex items-center justify-center">
        <div className="animate-pulse text-matrix font-mono">Loading video...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="w-full h-[400px] bg-darker-surface rounded-lg border-2 border-dashed border-matrix/30 flex flex-col items-center justify-center text-center p-8">
        <Upload className="w-16 h-16 text-matrix/50 mb-4" />
        <h3 className="text-xl font-display text-matrix mb-2">No Video Uploaded</h3>
        <p className="text-gray-400 font-mono text-sm max-w-md">
          An admin can upload a landing page video to showcase your designs in action.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] relative overflow-hidden rounded-lg border border-matrix/30 bg-black">
      <video
        ref={videoRef}
        key={video.id}
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        preload="auto"
        onLoadStart={() => console.log("Video load started")}
        onCanPlay={() => console.log("Video can play")}
        onError={(e) => console.error("Video error:", e)}
      >
        <source src={video.filePath} type={video.mimeType} />
        Your browser does not support the video tag.
      </video>
      
      {/* Subtle gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
    </div>
  );
}
