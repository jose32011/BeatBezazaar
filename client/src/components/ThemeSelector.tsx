import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { Check, Palette } from "lucide-react";

const themeOptions: { value: Theme; name: string; description: string; preview: string }[] = [
  {
    value: 'original',
    name: 'Original Theme',
    description: 'The original theme with custom background',
    preview: 'bg-[#363C48]'
  },
  {
    value: 'default',
    name: 'Default Purple',
    description: 'Classic purple and blue gradient',
    preview: 'bg-gradient-to-br from-purple-600 to-blue-600'
  },
  {
    value: 'card-match',
    name: 'Card Match',
    description: 'Matches existing card styling',
    preview: 'bg-gradient-to-br from-slate-900 to-slate-800'
  },
  {
    value: 'black-white',
    name: 'Black & White',
    description: 'Minimalist monochrome design',
    preview: 'bg-gradient-to-br from-black to-gray-800'
  },
  {
    value: 'red-black',
    name: 'Red & Black',
    description: 'Bold red and black theme',
    preview: 'bg-gradient-to-br from-red-600 to-black'
  },
  {
    value: 'blue-purple',
    name: 'Blue & Purple',
    description: 'Cool blue and purple tones',
    preview: 'bg-gradient-to-br from-blue-600 to-purple-600'
  },
  {
    value: 'green-dark',
    name: 'Green Dark',
    description: 'Nature-inspired green theme',
    preview: 'bg-gradient-to-br from-green-600 to-emerald-800'
  },
  {
    value: 'orange-dark',
    name: 'Orange Dark',
    description: 'Warm orange and amber tones',
    preview: 'bg-gradient-to-br from-orange-600 to-red-800'
  },
  {
    value: 'pink-purple',
    name: 'Pink & Purple',
    description: 'Vibrant pink and purple blend',
    preview: 'bg-gradient-to-br from-pink-600 to-purple-600'
  },
  {
    value: 'cyan-dark',
    name: 'Cyan Dark',
    description: 'Cool cyan and blue theme',
    preview: 'bg-gradient-to-br from-cyan-600 to-blue-800'
  }
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Selection
        </CardTitle>
        <CardDescription>
          Choose your preferred color theme for the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {themeOptions.map((option) => (
            <Button
              key={option.value}
              variant={theme === option.value ? "default" : "outline"}
              className={`relative h-24 flex flex-col items-center justify-center p-4 ${
                theme === option.value 
                  ? 'ring-2 ring-primary ring-offset-2' 
                  : 'hover:bg-muted'
              }`}
              onClick={() => setTheme(option.value)}
            >
              <div className={`w-8 h-8 rounded-full mb-2 ${option.preview}`} />
              <span className="text-xs font-medium text-center">{option.name}</span>
              {theme === option.value && (
                <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
              )}
            </Button>
          ))}
        </div>
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Current theme:</strong> {themeOptions.find(t => t.value === theme)?.name}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {themeOptions.find(t => t.value === theme)?.description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
