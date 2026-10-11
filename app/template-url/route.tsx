import {
  PROJECT_REPO_OWNER,
  PROJECT_REPO_NAME,
  SITE_DOMAIN_SHORT,
  META_DESCRIPTION,
  META_TITLE,
} from '@/app/config';
import { NextResponse } from 'next/server';

export function GET() {
  const url = new URL('https://vercel.com/new/clone');

  url.searchParams.set('demo-title', META_TITLE);
  url.searchParams.set('demo-description', META_DESCRIPTION);
  url.searchParams.set('demo-url', `https://${SITE_DOMAIN_SHORT}`);
  url.searchParams.set('demo-description', META_DESCRIPTION);
  url.searchParams.set(
    'demo-image',
    `https://${SITE_DOMAIN_SHORT}/template-image-tight`,
  );
  url.searchParams.set('project-name', META_TITLE);
  url.searchParams.set('repository-name', PROJECT_REPO_NAME);
  url.searchParams.set(
    'repository-url',
    `https://github.com/${PROJECT_REPO_OWNER}/${PROJECT_REPO_NAME}`,
  );
  url.searchParams.set('from', 'templates');
  url.searchParams.set('skippable-integrations', '1');
  url.searchParams.set('teamCreateStatus', 'hidden');
  url.searchParams.set('stores', JSON.stringify([
    { type: 'postgres' },
    { type: 'blob' },
  ]));

  return NextResponse.json(url.toString());
}
