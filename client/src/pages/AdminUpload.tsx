import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Image as ImageIcon, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InsertBeat } from "@shared/schema";

const genres = ["Hip-Hop", "Trap", "R&B", "Pop", "Lo-fi", "Drill", "Afrobeat", "Electronic"];

export default function AdminUpload() {
  const { toast } = useToast();
  const [albumArt, setAlbumArt] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    producer: "",
    bpm: "",
    genre: "",
    price: "",
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: InsertBeat) => {
      return await apiRequest('POST', '/api/beats', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/beats'] });
      toast({
        title: "Success!",
        description: "Beat uploaded successfully",
      });
      // Reset form
      setFormData({
        title: "",
        producer: "",
        bpm: "",
        genre: "",
        price: "",
      });
      setAlbumArt("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload beat",
        variant: "destructive",
      });
    },
  });

  const handleAlbumArtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAlbumArt(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!albumArt) {
      toast({
        title: "Error",
        description: "Please upload album artwork",
        variant: "destructive",
      });
      return;
    }

    const beatData: InsertBeat = {
      title: formData.title,
      producer: formData.producer,
      bpm: parseInt(formData.bpm),
      genre: formData.genre,
      price: formData.price,
      imageUrl: albumArt,
      audioUrl: null,
    };

    uploadMutation.mutate(beatData);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-display mb-2" data-testid="text-upload-title">
            Upload New Beat
          </h1>
          <p className="text-muted-foreground">Add a new instrumental to your catalog</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Album Artwork</CardTitle>
                <CardDescription>Upload cover art for your beat (square image recommended)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-6">
                  {albumArt ? (
                    <div className="relative w-64 h-64">
                      <img
                        src={albumArt}
                        alt="Album artwork preview"
                        className="w-full h-full object-cover rounded-lg"
                        data-testid="img-album-preview"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setAlbumArt("")}
                        data-testid="button-remove-artwork"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="w-64 h-64 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/20">
                      <div className="text-center">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No artwork uploaded</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <Label htmlFor="artwork-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover-elevate active-elevate-2">
                        <Upload className="h-4 w-4" />
                        Upload Artwork
                      </div>
                      <Input
                        id="artwork-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAlbumArtUpload}
                        data-testid="input-artwork"
                      />
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Beat Details</CardTitle>
                <CardDescription>Enter information about your instrumental</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Beat Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter beat title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      data-testid="input-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="producer">Producer Name</Label>
                    <Input
                      id="producer"
                      placeholder="Enter producer name"
                      value={formData.producer}
                      onChange={(e) => setFormData({ ...formData, producer: e.target.value })}
                      required
                      data-testid="input-producer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="bpm">BPM</Label>
                    <Input
                      id="bpm"
                      type="number"
                      placeholder="140"
                      value={formData.bpm}
                      onChange={(e) => setFormData({ ...formData, bpm: e.target.value })}
                      required
                      data-testid="input-bpm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Select
                      value={formData.genre}
                      onValueChange={(value) => setFormData({ ...formData, genre: value })}
                      required
                    >
                      <SelectTrigger id="genre" data-testid="select-genre">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="29.99"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      data-testid="input-price"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="audio">Audio File (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="audio"
                      type="file"
                      accept="audio/*"
                      data-testid="input-audio"
                    />
                    <Music className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload your beat file for preview (30-second preview will be auto-generated)
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    title: "",
                    producer: "",
                    bpm: "",
                    genre: "",
                    price: "",
                  });
                  setAlbumArt("");
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploadMutation.isPending}
                data-testid="button-submit"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload Beat"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
