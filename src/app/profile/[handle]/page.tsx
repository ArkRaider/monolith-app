import { getUserProfile } from '@/app/actions/user-actions';
import { getUserStudyGrid } from '@/app/actions/gamification-actions';
import { calculateLevel, getUserTitle } from '@/lib/title-calculator';
import { notFound } from 'next/navigation';
import { ProfileLayoutSwitcher } from './ProfileLayoutSwitcher';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ handle: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { handle } = await params;
  const decodedHandle = decodeURIComponent(handle);
  const profile = await getUserProfile(decodedHandle);

  if (!profile || 'error' in profile) {
    notFound();
  }

  const studyGrid = await getUserStudyGrid(profile.id);
  const totalMinutes = studyGrid.reduce((sum, d) => sum + d.minutesStudied, 0);
  const { level } = calculateLevel(profile.xp);
  const title = getUserTitle(totalMinutes);

  return (
    <ProfileLayoutSwitcher 
      profile={profile} 
      level={level} 
      title={title} 
      studyGrid={studyGrid} 
    />
  );
}
