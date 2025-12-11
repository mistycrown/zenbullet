
import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name?: string;
  size?: number;
  className?: string;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ name, size = 18, className }) => {
  // Default to 'Hash' (Tag icon equivalent) if no name provided or not found
  const iconName = name ? (name.charAt(0).toUpperCase() + name.slice(1)) : 'Hash';
  const Icon = (LucideIcons as any)[iconName] || LucideIcons.Hash;

  return <Icon size={size} className={className} />;
};

export default DynamicIcon;
