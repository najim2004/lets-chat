import { FC } from "react";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: number; // size in pixels
  color?: string;
}

const Loader: FC<SpinnerProps> = ({ size = 24, color = "blue-600" }) => {
  return (
    <div className="flex items-center justify-center">
      <Loader2
        className={`animate-spin text-${color}`}
        width={size}
        height={size}
        role="status"
        aria-label="loading"
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Loader;
