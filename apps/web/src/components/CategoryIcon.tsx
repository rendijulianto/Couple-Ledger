import React from "react";
import {
  Utensils,
  ShoppingCart,
  Car,
  Receipt,
  Home,
  Activity,
  Film,
  ShoppingBag,
  Gift,
  Book,
  CreditCard,
  TrendingUp,
  MoreHorizontal,
  Wallet,
  Award,
  Briefcase,
  PlusCircle,
  Folder,
} from "lucide-react";

interface CategoryIconProps {
  icon?: string | null;
  color?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  utensils: Utensils,
  "shopping-cart": ShoppingCart,
  car: Car,
  receipt: Receipt,
  home: Home,
  activity: Activity,
  film: Film,
  "shopping-bag": ShoppingBag,
  gift: Gift,
  book: Book,
  "credit-card": CreditCard,
  "trending-up": TrendingUp,
  "more-horizontal": MoreHorizontal,
  wallet: Wallet,
  award: Award,
  briefcase: Briefcase,
  "plus-circle": PlusCircle,
};

export function CategoryIcon({
  icon,
  color,
  name,
  size = "md",
  className = "",
}: CategoryIconProps) {
  const IconComponent = (icon && CATEGORY_ICON_MAP[icon]) || Folder;

  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const finalColor = color || "#ff385c";

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 border transition-all ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${finalColor}15`, // Soft tint (9% opacity)
        borderColor: `${finalColor}30`, // Border tint (19% opacity)
        color: finalColor,
      }}
      title={name}
    >
      <IconComponent className={iconSizes[size]} />
    </div>
  );
}

