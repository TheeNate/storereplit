import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Play, Trash2, Eye, EyeOff, FileVideo, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { LandingVideo } from "@shared/schema";

interface VideoUploadProgress {
  uploading: boolean;
  progress: number;
}

export function AdminVideoManagement() {
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<VideoUploadProgress>({
    uploading: false,
    progress: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: videos, isLoading } = useQuery<LandingVideo[]>({
    queryKey: ["/api/admin/landing-videos"],
  });

  const uploadVideoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("video", file);

      setUploadProgress({ uploading: true, progress: 0 });

      const response = await fetch("/api/admin/landing-video/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      setUploadProgress({ uploading: false, progress: 0 });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/landing-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/landing-video/current"] });
      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    },
  });

  const toggleVideoMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/admin/landing-videos/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/landing-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/landing-video/current"] });
      toast({
        title: "Success",
        description: "Video status updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update video status",
        variant: "destructive",
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/landing-videos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/landing-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/landing-video/current"] });
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete video",
        variant: "destructive",
      });
    },
  });

  const validateFile = (file: File): string | null => {
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      return "Only MP4, WebM, and QuickTime files are allowed";
    }

    if (file.size > maxSize) {
      return "File size must be less than 50MB";
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast({
        title: "Invalid File",
        description: error,
        variant: "destructive",
      });
      return;
    }

    uploadVideoMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ["B", "KB", "MB", "GB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const handleDeleteVideo = (id: number) => {
    if (confirm("Are you sure you want to delete this video?")) {
      deleteVideoMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Landing Page Video</h2>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Video</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
          >
            {uploadProgress.uploading ? (
              <div className="space-y-4">
                <FileVideo className="w-12 h-12 mx-auto text-primary animate-pulse" />
                <div>
                  <p className="text-lg font-medium">Uploading video...</p>
                  <div className="w-64 bg-muted rounded-full h-2 mx-auto mt-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Drop video file here</p>
                  <p className="text-sm text-muted-foreground">
                    or{" "}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary hover:underline"
                    >
                      browse to upload
                    </button>
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Supported formats: MP4, WebM, QuickTime</p>
                  <p>Maximum size: 50MB</p>
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Video List */}
      <Card>
        <CardHeader>
          <CardTitle>Uploaded Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading videos...</div>
          ) : videos?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No videos uploaded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {videos?.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <video
                      className="w-24 h-16 object-cover rounded border"
                      muted
                      preload="metadata"
                    >
                      <source src={video.filePath} type={video.mimeType} />
                    </video>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium truncate">{video.originalName}</h3>
                      <Badge variant={video.isActive ? "default" : "secondary"}>
                        {video.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Size: {formatFileSize(video.fileSize)}</p>
                      <p>Uploaded: {new Date(video.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleVideoMutation.mutate(video.id)}
                      disabled={toggleVideoMutation.isPending}
                    >
                      {video.isActive ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteVideo(video.id)}
                      disabled={deleteVideoMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}