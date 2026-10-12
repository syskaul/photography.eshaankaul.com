import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import AdminBatchUploadActions from '@/admin/AdminBatchUploadActions';
import { addUploadsAction } from '@/photo/actions';
import { readStreamableValue } from '@ai-sdk/rsc';
import { useRouter } from 'next/navigation';
import type { UrlAddStatus } from '@/admin/AdminUploadsClient';

jest.mock('@/photo/actions', () => ({ addUploadsAction: jest.fn() }));
jest.mock('@ai-sdk/rsc', () => ({ readStreamableValue: jest.fn() }));
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('@/app/path', () => ({ PATH_ADMIN_PHOTOS: '/admin/photos' }));
jest.mock('@/app/AppState', () => ({
  useAppState: () => ({ updateAdminData: jest.fn() }),
}));
jest.mock('@/utility/date', () => ({
  generateLocalPostgresString: () => '2026-10-11T23:00:00Z',
  generateLocalNaivePostgresString: () => '2026-10-11 23:00:00',
}));
jest.mock('@/utility/sleep', () => ({
  __esModule: true, default: async () => {},
}));
jest.mock('@/utility/useMediaQuery', () => ({
  __esModule: true, default: () => false,
}));
jest.mock('@/components/FieldsetWithStatus', () => ({
  __esModule: true, default: () => null,
}));
jest.mock('@/components/Container', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/album/FieldsetAlbum', () => ({
  __esModule: true, default: () => null,
}));
jest.mock('@/admin/DeleteUploadButton', () => ({
  __esModule: true, default: () => null,
}));
jest.mock('@/components/primitives/ProgressButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, isLoading }: ComponentProps<
    typeof import('@/components/primitives/ProgressButton').default
  >) => <button disabled={disabled || isLoading} onClick={onClick}>
    {children}
  </button>,
}));

const urls = ['upload-a', 'upload-b', 'upload-c'];
const push = jest.fn();

function Harness() {
  const [isAdding, setIsAdding] = useState(false);
  const [statuses, setStatuses] = useState<UrlAddStatus[]>(urls.map(url => ({
    url,
    fileName: url,
  })));
  return <>
    <AdminBatchUploadActions
      uploadUrls={urls}
      uploadTitles={['A', 'B', 'C']}
      uniqueAlbums={[]}
      isAdding={isAdding}
      setIsAdding={setIsAdding}
      setUrlAddStatuses={setStatuses}
      isDeleting={false}
      setIsDeleting={jest.fn()}
    />
    <output>{statuses.filter(s => s.status === 'added').length} added</output>
  </>;
}

describe('batch upload recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    jest.mocked(useRouter).mockReturnValue({
      push, back: jest.fn(), forward: jest.fn(), refresh: jest.fn(),
      replace: jest.fn(), prefetch: jest.fn(),
      bfcacheId: 'test',
    });
    jest.mocked(readStreamableValue).mockImplementation(async function* () {
      yield { url: 'upload-a', status: 'added', progress: 1 };
      throw new Error('Database failed; original remains in Uploads');
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('stops after a failed batch and never claims completion', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Add All Uploads' }));
    await screen.findByRole('button', { name: 'Try Again' });
    expect(screen.getByText(
      'Database failed; original remains in Uploads',
    )).toBeInTheDocument();
    expect(addUploadsAction).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Complete' })).toBeNull();
  });

  it('rejects a stream ending without save confirmation', async () => {
    jest.mocked(readStreamableValue).mockImplementation(async function* () {
      yield { url: 'upload-a', status: 'adding', progress: 0.5 };
    });
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Add All Uploads' }));
    await screen.findByRole('button', { name: 'Try Again' });
    expect(screen.getByText(
      'Some uploads were not confirmed as saved. Retry the unfinished uploads.',
    )).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('retries unfinished uploads and keeps added statuses', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Add All Uploads' }));
    await screen.findByRole('button', { name: 'Try Again' });
    jest.mocked(readStreamableValue).mockImplementation(async function* () {
      yield { url: 'upload-b', status: 'added', progress: 1 };
      yield { url: 'upload-c', status: 'added', progress: 1 };
    });
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    await screen.findByRole('button', { name: 'Complete' });
    expect(addUploadsAction).toHaveBeenLastCalledWith(expect.objectContaining({
      uploadUrls: ['upload-b', 'upload-c'],
      uploadTitles: ['B', 'C'],
    }));
    expect(screen.getByText('3 added')).toBeInTheDocument();
    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/photos'));
  });
});
