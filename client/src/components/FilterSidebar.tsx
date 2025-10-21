import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface FilterSidebarProps {
  onFiltersChange?: (filters: {
    bpmRange: [number, number];
    priceRange: [number, number];
  }) => void;
}

export default function FilterSidebar({ onFiltersChange }: FilterSidebarProps) {
  const [bpmRange, setBpmRange] = useState([60, 200]);
  const [priceRange, setPriceRange] = useState([0, 100]);
  const { getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  return (
    <div 
      className="w-full max-w-xs space-y-8 p-6 rounded-lg border"
      style={{
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border
      }}
    >
      <div>
        <h3 
          className="font-semibold text-lg mb-4" 
          data-testid="text-filter-title"
          style={{ color: themeColors.text }}
        >
          Filters
        </h3>
      </div>

      <div className="space-y-3">
        <Label 
          className="text-base font-semibold"
          style={{ color: themeColors.text }}
        >
          BPM Range
        </Label>
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
          <div className="flex items-center justify-between text-sm">
            <span 
              data-testid="text-bpm-min"
              style={{ color: themeColors.textSecondary }}
            >
              {bpmRange[0]} BPM
            </span>
            <span 
              data-testid="text-bpm-max"
              style={{ color: themeColors.textSecondary }}
            >
              {bpmRange[1]} BPM
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label 
          className="text-base font-semibold"
          style={{ color: themeColors.text }}
        >
          Price Range
        </Label>
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
          <div className="flex items-center justify-between text-sm">
            <span 
              data-testid="text-price-min"
              style={{ color: themeColors.textSecondary }}
            >
              ${priceRange[0]}
            </span>
            <span 
              data-testid="text-price-max"
              style={{ color: themeColors.textSecondary }}
            >
              ${priceRange[1]}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label 
          className="text-base font-semibold"
          style={{ color: themeColors.text }}
        >
          Sort By
        </Label>
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
