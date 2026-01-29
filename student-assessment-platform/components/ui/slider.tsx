import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange([parseFloat(e.target.value)])
    }

    return (
      <input
        type="range"
        ref={ref}
        className={cn(
          "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600",
          className
        )}
        min={min}
        max={max}
        step={step}
        value={value[0] || 0}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }

