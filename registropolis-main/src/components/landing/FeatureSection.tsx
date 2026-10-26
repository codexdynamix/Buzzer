
import React from 'react';
import { motion } from 'framer-motion';
import GlassmorphicCard from '@/components/ui/custom/GlassmorphicCard';

interface Feature {
  icon: React.ReactElement;
  name: string;
  description: string;
}

interface FeatureSectionProps {
  title: string;
  features: Feature[];
}

const FeatureSection: React.FC<FeatureSectionProps> = ({ title, features }) => {
  return (
    <GlassmorphicCard 
      className="p-6 sm:p-8 mb-8"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="space-y-4">
        <h2 className="text-2xl font-medium tracking-tight">{title}</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {features.map((feature, index) => (
            <div 
              key={`${feature.name}-${index}`}
              className="flex items-start gap-3 p-4 rounded-xl bg-background/50 hover:bg-background/80 transition-colors"
            >
              {feature.icon}
              <div>
                <h3 className="text-base font-medium">{feature.name}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassmorphicCard>
  );
};

export default FeatureSection;
