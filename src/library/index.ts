import type { CategoryKey } from '@/category';
import type { Photo } from '@/photo';

export interface Library {
  id: number
  title?: string
  subhead?: string
  description?: string
  photoIdAvatar?: string
  photoIdHero?: string
  createdAt: Date
  updatedAt: Date
}

export interface LibrarySetFolder {
  key: string
  caption: string
  path: string
  photos: Photo[]
  count: number
}

export interface LibrarySetFolderRow {
  key: CategoryKey
  title: string
  folders: LibrarySetFolder[]
}
