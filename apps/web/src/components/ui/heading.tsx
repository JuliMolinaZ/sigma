import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  title: string;
  description?: string;
}

export const Heading: React.FC<HeadingProps> = ({
  title,
  description,
  className,
  ...props
}) => {
  return (
    <div className={cn("grid gap-1", className)} {...props}>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      {description && (
        <p className="text-muted-foreground text-sm">
          {description}
        </p>
      )}
    </div>
  );
};

