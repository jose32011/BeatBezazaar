import { Card } from "@/components/ui/card";

interface GenreCardProps {
  name: string;
  beatCount: number;
  imageUrl: string;
  onClick?: () => void;
}

export default function GenreCard({ name, beatCount, imageUrl, onClick }: GenreCardProps) {
  return (
    <Card
      className="group relative overflow-hidden cursor-pointer hover-elevate transition-all duration-300"
      onClick={onClick}
      data-testid={`card-genre-${name.toLowerCase()}`}
    >
      <div className="aspect-[4/3] relative">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-2xl font-bold font-display mb-1" data-testid={`text-genre-name-${name.toLowerCase()}`}>
            {name}
          </h3>
          <p className="text-sm text-muted-foreground" data-testid={`text-genre-count-${name.toLowerCase()}`}>
            {beatCount} beats
          </p>
        </div>
      </div>
    </Card>
  );
}
