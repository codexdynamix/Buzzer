
import React from 'react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface TextSizeSelectorProps {
  selectedSize: string;
  onSizeChange: (size: string) => void;
}

const TextSizeSelector: React.FC<TextSizeSelectorProps> = ({ 
  selectedSize, 
  onSizeChange 
}) => {
  return (
    <div className="pt-4 border-t">
      <h3 className="text-lg font-medium mb-3">Text Size</h3>
      
      <RadioGroup
        value={selectedSize}
        onValueChange={onSizeChange}
        className="flex gap-3"
      >
        <div className="flex flex-col items-center">
          <RadioGroupItem value="small" id="text-small" className="sr-only" />
          <Label 
            htmlFor="text-small" 
            className="text-sm p-3 rounded-md border cursor-pointer hover:bg-secondary/50 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
            data-state={selectedSize === "small" ? "checked" : "unchecked"}
          >
            Small
          </Label>
        </div>
        
        <div className="flex flex-col items-center">
          <RadioGroupItem value="medium" id="text-medium" className="sr-only" />
          <Label 
            htmlFor="text-medium" 
            className="text-base p-3 rounded-md border cursor-pointer hover:bg-secondary/50 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
            data-state={selectedSize === "medium" ? "checked" : "unchecked"}
          >
            Medium
          </Label>
        </div>
        
        <div className="flex flex-col items-center">
          <RadioGroupItem value="large" id="text-large" className="sr-only" />
          <Label 
            htmlFor="text-large" 
            className="text-lg p-3 rounded-md border cursor-pointer hover:bg-secondary/50 transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
            data-state={selectedSize === "large" ? "checked" : "unchecked"}
          >
            Large
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default TextSizeSelector;
