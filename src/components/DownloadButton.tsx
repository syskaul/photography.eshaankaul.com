import { MdOutlineFileDownload } from 'react-icons/md';
import { clsx } from 'clsx/lite';
import { downloadFileNameForPhoto, Photo } from '@/photo';
import LoaderButton from './primitives/LoaderButton';
import { useState } from 'react';
import { downloadFileFromBrowser } from '@/utility/url';
import { useAppText } from '@/i18n/state/client';
import { useMixpanel } from '@/analytics/MixpanelProvider';

export default function DownloadButton({
  photo,
  className,
}: {
  photo: Photo
  className?: string
}) {
  const [isLoading, setIsLoading] = useState(false);

  const appText = useAppText();
  const { track } = useMixpanel();

  return (
    <LoaderButton
      tooltip={appText.tooltip.download}
      aria-label={appText.tooltip.download}
      className={clsx(
        'action-button',
        className,
        'text-medium',
      )}
      icon={<MdOutlineFileDownload size={18} />}
      spinnerColor='dim'
      styleAs='link'
      isLoading={isLoading}
      onClick={async () => {
        setIsLoading(true);
        track('photo_download', {
          photo_id: photo.id,
          photo_title: photo.title ?? '',
          download_method: 'button',
        });
        downloadFileFromBrowser(photo.url, downloadFileNameForPhoto(photo))
          .finally(() => setIsLoading(false));
      }}
      hideFocusOutline
    />
  );
}
