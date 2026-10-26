
import React from 'react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Check } from 'lucide-react';

interface AccentColorSelectorProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const AccentColorSelector: React.FC<AccentColorSelectorProps> = ({ 
  selectedColor, 
  onColorChange 
}) => {
  // Color options with more variety
  const colorOptions = [
    { name: 'Blue', value: 'blue', bg: 'bg-blue-500' },
    { name: 'Green', value: 'green', bg: 'bg-green-500' },
    { name: 'Purple', value: 'purple', bg: 'bg-purple-500' },
    { name: 'Red', value: 'red', bg: 'bg-red-500' },
    { name: 'Orange', value: 'orange', bg: 'bg-orange-500' },
    { name: 'Yellow', value: 'yellow', bg: 'bg-yellow-500' },
    { name: 'Pink', value: 'pink', bg: 'bg-pink-500' },
    { name: 'Gray', value: 'gray', bg: 'bg-gray-500' },
    { name: 'Teal', value: 'teal', bg: 'bg-teal-500' },
    { name: 'Indigo', value: 'indigo', bg: 'bg-indigo-500' },
    { name: 'Amber', value: 'amber', bg: 'bg-amber-500' },
    { name: 'Lime', value: 'lime', bg: 'bg-lime-500' },
    { name: 'Emerald', value: 'emerald', bg: 'bg-emerald-500' },
    { name: 'Cyan', value: 'cyan', bg: 'bg-cyan-500' },
    { name: 'Fuchsia', value: 'fuchsia', bg: 'bg-fuchsia-500' },
    { name: 'Violet', value: 'violet', bg: 'bg-violet-500' },
  ];

  return (
    <div className="pt-4 border-t">
      <h3 className="text-lg font-medium mb-3">Accent Color</h3>
      
      <RadioGroup
        value={selectedColor}
        onValueChange={onColorChange}
        className="grid grid-cols-4 gap-3"
      >
        {colorOptions.map((color) => (
          <div key={color.value} className="relative">
            <RadioGroupItem value={color.value} id={`color-${color.value}`} className="sr-only" />
            <Popover>
              <PopoverTrigger asChild>
                <Label 
                  htmlFor={`color-${color.value}`} 
                  className={`flex h-10 w-10 rounded-full ${color.bg} cursor-pointer ring-offset-2 ring-offset-background transition-all hover:scale-110 data-[state=checked]:ring-2 data-[state=checked]:ring-ring`}
                  data-state={selectedColor === color.value ? "checked" : "unchecked"}
                >
                  {selectedColor === color.value && (
                    <Check className="h-4 w-4 m-auto text-white" />
                  )}
                </Label>
              </PopoverTrigger>
              <PopoverContent side="top" className="p-2 text-xs">
                {color.name}
              </PopoverContent>
            </Popover>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default AccentColorSelector;
