import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Whitespace-nowrap: Badges should never wrap.
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate " ,
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",

        outline: " border [border-color:var(--badge-outline)] shadow-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, style, ...props }: BadgeProps) {
  // Get theme-based styles for different variants
  const getThemeStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: 'var(--theme-primary)',
          color: '#ffffff',
          borderColor: 'transparent'
        }
      case 'secondary':
        return {
          backgroundColor: 'var(--theme-secondary)',
          color: '#ffffff',
          borderColor: 'transparent'
        }
      case 'destructive':
        return {
          backgroundColor: '#dc2626',
          color: '#ffffff',
          borderColor: 'transparent'
        }
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--theme-text)',
          borderColor: 'var(--theme-border)'
        }
      default:
        return {}
    }
  }

  return (
    <div 
      className={cn(badgeVariants({ variant }), className)} 
      style={{
        ...getThemeStyles(),
        ...style
      }}
      {...props} 
    />
  );
}

export { Badge, badgeVariants }
