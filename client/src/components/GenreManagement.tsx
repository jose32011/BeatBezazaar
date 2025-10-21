import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Trash, Image, Palette, Music } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface Genre {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GenreFormData {
  name: string;
  description: string;
  color: string;
  isActive: boolean;
  imageFile?: File;
}

const PREDEFINED_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#10b981", // Green
  "#f59e0b", // Yellow
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#84cc16", // Lime
  "#ec4899", // Pink
  "#6b7280", // Gray
];

export default function GenreManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState<"name" | "createdAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showGenreDialog, setShowGenreDialog] = useState(false);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [genreFormData, setGenreFormData] = useState<GenreFormData>({
    name: "",
    description: "",
    color: "#3b82f6",
    isActive: true,
  });
  const queryClient = useQueryClient();

  const { data: genres = [], isLoading } = useQuery<Genre[]>({
    queryKey: ['/api/admin/genres'],
  });

  // Filter and sort genres
  const filteredGenres = useMemo(() => {
    let filtered = genres;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(genre => 
        genre.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        genre.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort genres
    filtered.sort((a, b) => {
      let aValue: string | number = a[sortBy];
      let bValue: string | number = b[sortBy];
      
      if (sortBy === "createdAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [genres, searchTerm, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredGenres.length / pageSize);
  const paginatedGenres = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredGenres.slice(startIndex, startIndex + pageSize);
  }, [filteredGenres, currentPage, pageSize]);

  const createGenreMutation = useMutation({
    mutationFn: async (data: GenreFormData) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('color', data.color);
      formData.append('isActive', data.isActive.toString());
      
      if (data.imageFile) {
        formData.append('image', data.imageFile);
      }

      const response = await fetch('/api/admin/genres', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/genres'] });
      queryClient.invalidateQueries({ queryKey: ['/api/genres'] });
      toast({
        title: "Success!",
        description: "Genre created successfully",
      });
      resetGenreForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create genre",
        variant: "destructive",
      });
    },
  });

  const updateGenreMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: GenreFormData }) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('color', data.color);
      formData.append('isActive', data.isActive.toString());
      
      if (data.imageFile) {
        formData.append('image', data.imageFile);
      }

      const response = await fetch(`/api/admin/genres/${id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/genres'] });
      queryClient.invalidateQueries({ queryKey: ['/api/genres'] });
      toast({
        title: "Success!",
        description: "Genre updated successfully",
      });
      resetGenreForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update genre",
        variant: "destructive",
      });
    },
  });

  const deleteGenreMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/genres/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/genres'] });
      queryClient.invalidateQueries({ queryKey: ['/api/genres'] });
      toast({
        title: "Success!",
        description: "Genre deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete genre",
        variant: "destructive",
      });
    },
  });

  const resetGenreForm = () => {
    setGenreFormData({
      name: "",
      description: "",
      color: "#3b82f6",
      isActive: true,
    });
    setEditingGenre(null);
    setShowGenreDialog(false);
  };

  const handleEditGenre = (genre: Genre) => {
    setEditingGenre(genre);
    setGenreFormData({
      name: genre.name,
      description: genre.description || "",
      color: genre.color,
      isActive: genre.isActive,
    });
    setShowGenreDialog(true);
  };

  const handleSubmitGenre = () => {
    if (!genreFormData.name.trim()) {
      toast({
        title: "Error",
        description: "Genre name is required",
        variant: "destructive",
      });
      return;
    }

    if (editingGenre) {
      updateGenreMutation.mutate({ id: editingGenre.id, data: genreFormData });
    } else {
      createGenreMutation.mutate(genreFormData);
    }
  };

  const handleDeleteGenre = (id: string) => {
    if (window.confirm("Are you sure you want to delete this genre?")) {
      deleteGenreMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Genre Management</CardTitle>
          <CardDescription>Loading genres...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Genre Management
              </CardTitle>
              <CardDescription>
                Manage music genres and their visual representations
              </CardDescription>
            </div>
            <Dialog open={showGenreDialog} onOpenChange={setShowGenreDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetGenreForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Genre
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingGenre ? "Edit Genre" : "Add New Genre"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingGenre ? "Update genre information" : "Create a new music genre"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Genre Name *</Label>
                    <Input
                      id="name"
                      value={genreFormData.name}
                      onChange={(e) => setGenreFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Hip-Hop, Electronic, Jazz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={genreFormData.description}
                      onChange={(e) => setGenreFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this genre..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color Theme</Label>
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 ${
                            genreFormData.color === color ? 'border-gray-900' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setGenreFormData(prev => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                    <Input
                      type="color"
                      value={genreFormData.color}
                      onChange={(e) => setGenreFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-20 h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Genre Image</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setGenreFormData(prev => ({ 
                        ...prev, 
                        imageFile: e.target.files?.[0] 
                      }))}
                    />
                    {editingGenre && (
                      <div className="text-sm text-muted-foreground">
                        Current image: {editingGenre.imageUrl}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={genreFormData.isActive}
                      onCheckedChange={(checked) => setGenreFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="isActive">Active (visible in dropdowns)</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetGenreForm}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitGenre}
                    disabled={createGenreMutation.isPending || updateGenreMutation.isPending}
                  >
                    {editingGenre ? "Update" : "Create"} Genre
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search genres..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: "name" | "createdAt") => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="createdAt">Date</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Genres Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGenres.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {searchTerm ? "No genres found matching your search" : "No genres created yet"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedGenres.map((genre) => (
                  <TableRow key={genre.id}>
                    <TableCell>
                      <div className="w-8 h-8 rounded-lg overflow-hidden">
                        <img
                          src={genre.imageUrl}
                          alt={genre.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{genre.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {genre.description || "No description"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: genre.color }}
                        />
                        <span className="text-sm text-muted-foreground">{genre.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={genre.isActive ? "default" : "secondary"}>
                        {genre.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(genre.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGenre(genre)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGenre(genre.id)}
                          disabled={deleteGenreMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredGenres.length)} of {filteredGenres.length} genres
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
