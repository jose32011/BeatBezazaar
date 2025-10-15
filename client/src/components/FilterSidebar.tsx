import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const genres = ["Hip-Hop", "Trap", "R&B", "Pop", "Lo-fi", "Drill", "Afrobeat"];

export default function FilterSidebar() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [bpmRange, setBpmRange] = useState([60, 200]);
  const [priceRange, setPriceRange] = useState([0, 100]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <div className="w-full max-w-xs space-y-8 p-6 bg-card rounded-lg border border-card-border">
      <div>
        <h3 className="font-semibold text-lg mb-4" data-testid="text-filter-title">
          Filters
        </h3>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Genre</Label>
        {genres.map((genre) => (
          <div key={genre} className="flex items-center space-x-2">
            <Checkbox
              id={genre}
              checked={selectedGenres.includes(genre)}
              onCheckedChange={() => toggleGenre(genre)}
              data-testid={`checkbox-genre-${genre.toLowerCase()}`}
            />
            <label
              htmlFor={genre}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {genre}
            </label>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">BPM Range</Label>
        <div className="pt-2">
          <Slider
            value={bpmRange}
            onValueChange={setBpmRange}
            min={60}
            max={200}
            step={5}
            className="mb-2"
            data-testid="slider-bpm"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span data-testid="text-bpm-min">{bpmRange[0]} BPM</span>
            <span data-testid="text-bpm-max">{bpmRange[1]} BPM</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Price Range</Label>
        <div className="pt-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={100}
            step={5}
            className="mb-2"
            data-testid="slider-price"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span data-testid="text-price-min">${priceRange[0]}</span>
            <span data-testid="text-price-max">${priceRange[1]}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Sort By</Label>
        <Select defaultValue="popular">
          <SelectTrigger data-testid="select-sort">
            <SelectValue placeholder="Select sort option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
