import Container from '@/components/Container';
import AppGrid from '@/components/AppGrid';
import { IS_APP_READY } from '@/app/config';
import AdminAppConfiguration from '@/admin/config/AdminAppConfiguration';
import { clsx } from 'clsx/lite';
import { HiOutlinePhotograph } from 'react-icons/hi';
import { getAppText } from '@/i18n/state/server';

export default async function PhotosEmptyState() {
  if (IS_APP_READY) {
    return null;
  }

  const appText = await getAppText();

  return (
    <AppGrid
      mainFullWidth
      contentMain={
        <Container
          key="PhotosEmptyState"
          className="min-h-[20rem] sm:min-h-[30rem] px-8"
          padding="loose"
        >
          <HiOutlinePhotograph
            className="text-medium"
            size={24}
          />
          <div className={clsx(
            'font-normal text-2xl',
            'text-gray-700 dark:text-gray-200',
          )}>
            {appText.onboarding.setupIncomplete}
          </div>
          <AdminAppConfiguration simplifiedView />
        </Container>
      }
    />
  );
};
