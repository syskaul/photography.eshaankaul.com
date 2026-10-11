import IconAlbum from '@/components/icons/IconAlbum';
import IconFilm from '@/components/icons/IconFilm';
import IconFocalLength from '@/components/icons/IconFocalLength';
import IconRecents from '@/components/icons/IconRecents';
import { CategoryKey } from '.';

export default function CategoryIcon({
  category,
}: {
  category: CategoryKey
}) {
  switch (category) {
    case 'recents': return <IconRecents size={15} />;
    case 'albums': return <IconAlbum
      size={13.5}
      className="translate-x-[1.5px]"
    />;
    case 'films': return <IconFilm size={15} />;
    case 'focal-lengths': return <IconFocalLength size={13} />;
  }
}
