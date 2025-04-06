import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  action: {
    label: string;
    onClick: () => void;
  };
  variant: "primary" | "secondary" | "accent";
  className?: string;
}

const variantStyles = {
  primary: {
    bg: "bg-primary-light",
    iconBg: "bg-primary",
    iconText: "text-white",
    buttonBg: "bg-primary hover:bg-primary-dark",
    buttonText: "text-white",
  },
  secondary: {
    bg: "bg-secondary-light",
    iconBg: "bg-secondary",
    iconText: "text-white",
    buttonBg: "bg-secondary hover:bg-green-600",
    buttonText: "text-white",
  },
  accent: {
    bg: "bg-accent-light",
    iconBg: "bg-accent",
    iconText: "text-neutral-800",
    buttonBg: "bg-accent hover:bg-yellow-500",
    buttonText: "text-neutral-800",
  },
};

export default function QuickActionCard({
  title,
  description,
  icon,
  action,
  variant,
  className,
}: QuickActionCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <Card className={cn(styles.bg, "border-none rounded-xl", className)}>
      <CardContent className="p-6 flex flex-col h-full">
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", styles.iconBg)}>
          <i className={cn(icon, "text-xl", styles.iconText)}></i>
        </div>
        
        <h3 className="text-lg font-heading font-semibold text-neutral-800">{title}</h3>
        <p className="text-neutral-600 mt-2 text-sm mb-4">{description}</p>
        
        <div className="mt-auto">
          <Button
            onClick={action.onClick}
            className={cn("transition-colors", styles.buttonBg, styles.buttonText)}
          >
            {action.label}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
