
import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoryProps {
  name: string;
  imageUrl?: string;
  isViewed?: boolean;
  isAdd?: boolean;
  onClick?: () => void;
}

const StoryBubble: React.FC<StoryProps> = ({
  name,
  imageUrl,
  isViewed = false,
  isAdd = false,
  onClick
}) => {
  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={onClick}>
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center overflow-hidden",
          isViewed ? "border-2 border-gray-300" : "border-2 border-primary",
          isAdd ? "bg-muted" : ""
        )}
      >
        {isAdd ? (
          <Plus className="w-6 h-6 text-primary" />
        ) : imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-medium text-primary">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </motion.div>
      <span className="text-xs text-muted-foreground text-center w-16 truncate">
        {isAdd ? "Add Story" : name}
      </span>
    </div>
  );
};

const StoryBubbles: React.FC = () => {
  // This would typically come from an API or context
  const stories = [
    { id: 1, name: "Your Story", imageUrl: "", isAdd: true },
    { id: 2, name: "John Doe", imageUrl: "https://i.pravatar.cc/150?img=1" },
    { id: 3, name: "Jane Smith", imageUrl: "https://i.pravatar.cc/150?img=5", isViewed: true },
    { id: 4, name: "Alex Johnson", imageUrl: "https://i.pravatar.cc/150?img=3" },
    { id: 5, name: "Emily Davis", imageUrl: "https://i.pravatar.cc/150?img=9", isViewed: true },
    { id: 6, name: "Michael Brown", imageUrl: "https://i.pravatar.cc/150?img=12" },
  ];

  return (
    <div className="pb-4 mb-4 border-b">
      <h2 className="text-lg font-medium mb-3 px-4">Stories</h2>
      <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {stories.map((story) => (
          <StoryBubble
            key={story.id}
            name={story.name}
            imageUrl={story.imageUrl}
            isViewed={story.isViewed}
            isAdd={story.isAdd}
            onClick={() => console.log(`Clicked on ${story.name}'s story`)}
          />
        ))}
      </div>
    </div>
  );
};

export default StoryBubbles;
