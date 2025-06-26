import { useQuery } from "@tanstack/react-query";
import { Play, Upload } from "lucide-react";
import type { LandingVideo } from "@shared/schema";

export function LandingVideoPlayer() {
  const { data: video, isLoading } = useQuery<LandingVideo | null>({
    queryKey: ["/api/landing-video/current"],
  });

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
        key={video.id}
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        preload="auto"
      >
        <source src={video.filePath} type={video.mimeType} />
        Your browser does not support the video tag.
      </video>
      
      {/* Subtle overlay with play indicator */}
      <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black/50 rounded-full p-4">
          <Play className="w-8 h-8 text-white fill-white" />
        </div>
      </div>
      
      {/* Subtle gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
    </div>
  );
}