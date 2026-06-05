'use client';

import { useSearchParams } from 'next/navigation';
import { MinimalProfileView } from './MinimalProfileView';
import { TraditionalProfileView } from './TraditionalProfileView';

interface ProfileLayoutSwitcherProps {
  profile: any;
  level: number;
  title: string;
  studyGrid: any;
  isOwner?: boolean;
}

export function ProfileLayoutSwitcher({ profile, level, title, studyGrid, isOwner }: ProfileLayoutSwitcherProps) {
  const searchParams = useSearchParams();
  const themeParam = searchParams.get('theme');
  
  if (themeParam === 'minimal') {
    return (
      <MinimalProfileView 
        profile={profile} 
        level={level} 
        title={title} 
        studyGrid={studyGrid} 
        isOwner={isOwner}
      />
    );
  }

  return (
    <TraditionalProfileView 
      profile={profile} 
      level={level} 
      title={title} 
      studyGrid={studyGrid} 
      isOwner={isOwner}
    />
  );
}
