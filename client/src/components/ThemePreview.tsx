import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemePreview() {
  const { theme, getThemeColors } = useTheme();
  const themeColors = getThemeColors();

  return (
    <div className="space-y-6">
      <Card className="theme-card">
        <CardHeader>
          <CardTitle className="theme-text">Theme Preview</CardTitle>
          <CardDescription className="theme-text-secondary">
            Current theme: {theme}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preview-input" className="theme-text">Sample Input</Label>
            <Input
              id="preview-input"
              placeholder="Type something..."
              className="theme-input"
            />
          </div>
          
          <div className="flex gap-2">
            <Button className="theme-button-primary">
              Primary Button
            </Button>
            <Button variant="outline" className="theme-button-secondary">
              Secondary Button
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Badge className="theme-surface theme-text">Sample Badge</Badge>
            <Badge variant="outline" className="theme-text">Outline Badge</Badge>
          </div>
          
          <div className="p-4 theme-surface rounded-lg">
            <p className="theme-text">This is a sample card with theme colors applied.</p>
            <p className="theme-text-secondary text-sm mt-2">
              Secondary text with reduced opacity.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
