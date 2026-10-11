'use client';

import {
  Photo,
  altTextForPhoto,
  doesPhotoNeedBlurCompatibility,
  shouldShowCameraDataForPhoto,
  shouldShowExifDataForPhoto,
  shouldShowFilmDataForPhoto,
  shouldShowLensDataForPhoto,
  shouldShowRecipeDataForPhoto,
} from '.';
import AppGrid from '@/components/AppGrid';
import ImageLarge from '@/components/image/ImageLarge';
import { clsx } from 'clsx/lite';
import ShareButton from '@/share/ShareButton';
import DownloadButton from '@/components/DownloadButton';
import PhotoCamera from '../camera/PhotoCamera';
import { cameraFromPhoto } from '@/camera';
import PhotoFilm from '@/film/PhotoFilm';
import DivDebugBaselineGrid from '@/components/DivDebugBaselineGrid';
import PhotoLink from './PhotoLink';
import {
  SHOULD_PREFETCH_ALL_LINKS,
} from '@/app/config';
import AdminPhotoMenu from '@/admin/AdminPhotoMenu';
import { RevalidatePhoto } from './InfinitePhotoScroll';
import { useCallback, useMemo, useRef } from 'react';
import useVisibility from '@/utility/useVisibility';
import PhotoDate from './PhotoDate';
import { useAppState } from '@/app/AppState';
import { LuExpand } from 'react-icons/lu';
import LoaderButton from '@/components/primitives/LoaderButton';
import Tooltip from '@/components/Tooltip';
import ZoomControls, { ZoomControlsRef }
  from '@/components/image/zoom/ZoomControls';
import { AnimatePresence } from 'framer-motion';
import useRecipeOverlay from '../recipe/useRecipeOverlay';
import PhotoRecipeOverlay from '@/recipe/PhotoRecipeOverlay';
import PhotoRecipe from '@/recipe/PhotoRecipe';
import PhotoLens from '@/lens/PhotoLens';
import { lensFromPhoto } from '@/lens';
import MaskedScroll from '@/components/MaskedScroll';
import { useAppText } from '@/i18n/state/client';
import { Album } from '@/album';
import AdminPhotoStorageCheck from '@/admin/storage/AdminPhotoStorageCheck';
import { useEditTitlesState } from '@/admin/edit-titles/EditTitlesState';
import { DATA_KEY_PHOTO_LARGE } from '@/admin/edit-titles/EditTitlesProvider';
import FieldsetWithStatus from '@/components/FieldsetWithStatus';
import PlaceEntity from '@/place/PlaceEntity';

export default function PhotoLarge({
  photo,
  className,
  album,
  priority,
  prefetch = SHOULD_PREFETCH_ALL_LINKS,
  prefetchRelatedLinks = SHOULD_PREFETCH_ALL_LINKS,
  query,
  recent,
  year,
  revalidatePhoto,
  showTitle = true,
  showTitleAsH1,
  showCamera = true,
  showLens = true,
  showFilm = true,
  showRecipe = true,
  showZoomButton = true,
  shouldZoomOnFKeydown = true,
  shouldShare = true,
  shouldShareQuery,
  shouldShareRecents,
  shouldShareYear,
  shouldShareCamera,
  shouldShareLens,
  shouldShareAlbum,
  shouldShareFilm,
  shouldShareRecipe,
  shouldShareFocalLength,
  onVisible,
  showAdminKeyCommands,
  showStorageCheck,
}: {
  photo: Photo
  className?: string
  album?: Album
  priority?: boolean
  prefetch?: boolean
  prefetchRelatedLinks?: boolean
  query?: string
  recent?: boolean
  year?: string
  revalidatePhoto?: RevalidatePhoto
  showTitle?: boolean
  showTitleAsH1?: boolean
  showCamera?: boolean
  showLens?: boolean
  showFilm?: boolean
  showRecipe?: boolean
  showZoomButton?: boolean
  shouldZoomOnFKeydown?: boolean
  shouldShare?: boolean
  shouldShareQuery?: boolean
  shouldShareRecents?: boolean
  shouldShareYear?: boolean
  shouldShareCamera?: boolean
  shouldShareLens?: boolean
  shouldShareAlbum?: boolean
  shouldShareFilm?: boolean
  shouldShareRecipe?: boolean
  shouldShareFocalLength?: boolean
  onVisible?: () => void
  showAdminKeyCommands?: boolean
  showStorageCheck?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null);
  const refZoomControls = useRef<ZoomControlsRef>(null);
  const refPhotoRecipe = useRef<HTMLDivElement>(null);
  const refPhotoFilm = useRef<HTMLDivElement>(null);

  const {
    shouldDebugRecipeOverlays,
    isUserSignedIn,
  } = useAppState();

  const {
    isEditingTitles,
    getPhotoEdit,
    setPhotoEdit,
    isPerformingUpdate,
  } = useEditTitlesState();

  const appText = useAppText();

  const photoEditOriginal = useMemo(() => ({
    title: photo.title ?? '',
    caption: photo.caption ?? '',
  }), [photo.title, photo.caption]);

  const photoEdit = isEditingTitles
    ? getPhotoEdit?.(photo.id, photoEditOriginal) ?? photoEditOriginal
    : photoEditOriginal;

  const selectZoomImageElement = useCallback(
    (container: HTMLElement | null) => Array
      .from(container?.getElementsByTagName('img') ?? [])
      // Ignore fallback blur images
      .filter((img) => !img.src.startsWith('data:image'))[0]
    , []);

  const refRecipe = useRef<HTMLDivElement>(null);
  const refTriggers = useMemo(() => [
    refPhotoRecipe,
    refPhotoFilm,
  ], []);
  const {
    isShowingRecipeOverlay,
    toggleRecipeOverlay,
    hideRecipeOverlay,
  } = useRecipeOverlay({
    ref: refRecipe,
    refTriggers,
  });

  const camera = cameraFromPhoto(photo);
  const lens = lensFromPhoto(photo);
  const { recipeTitle } = photo;

  const showExifContent = shouldShowExifDataForPhoto(photo);

  const showCameraContent = showCamera && shouldShowCameraDataForPhoto(photo);
  const showLensContent = showLens && shouldShowLensDataForPhoto(photo);
  const showRecipeContent = showRecipe && shouldShowRecipeDataForPhoto(photo);
  const showFilmContent = showFilm && shouldShowFilmDataForPhoto(photo);
  const showPlaceContent = Boolean(photo.location);

  useVisibility({ ref, onVisible });

  const hasTitle =
    showTitle &&
    Boolean(photo.title);

  const hasTitleContent =
    isEditingTitles ||
    hasTitle ||
    Boolean(photo.caption);

  const hasMetaContent =
    showCameraContent ||
    showLensContent ||
    showRecipeContent ||
    showFilmContent ||
    showPlaceContent ||
    showExifContent;

  const hasNonDateContent =
    hasTitleContent ||
    hasMetaContent;

  const renderPhotoLink =
    <PhotoLink
      photo={photo}
      className={clsx(
        'font-bold grow',
      )}
      prefetch={prefetch}
    />;

  const renderLargePhoto =
    <div className="relative">
      <ZoomControls
        ref={refZoomControls}
        selectImageElement={selectZoomImageElement}
        {...{ isEnabled: true, shouldZoomOnFKeydown }}
      >
        <ImageLarge
          alt={altTextForPhoto(photo)}
          src={photo.url}
          aspectRatio={photo.aspectRatio}
          blurDataURL={photo.blurData}
          blurCompatibilityMode={doesPhotoNeedBlurCompatibility(photo)}
          loading={priority ? 'eager' : undefined}
        />
      </ZoomControls>
      <div className={clsx(
        'absolute inset-0',
        'flex items-center justify-center',
        // Allow clicks to pass through to zoom controls
        // when not showing recipe overlay
        !(isShowingRecipeOverlay || shouldDebugRecipeOverlays) &&
          'pointer-events-none',
      )}>
        <AnimatePresence>
          {(isShowingRecipeOverlay || shouldDebugRecipeOverlays) &&
            photo.recipeData &&
            photo.film &&
              <PhotoRecipeOverlay
                ref={refRecipe}
                title={photo.recipeTitle}
                data={photo.recipeData}
                film={photo.film}
                iso={photo.isoFormatted}
                exposure={photo.exposureCompensationFormatted}
                onClose={hideRecipeOverlay}
              />}
        </AnimatePresence>
      </div>
    </div>;

  const renderAdminMenu =
    <AdminPhotoMenu {...{
      photo,
      revalidatePhoto,
      showKeyCommands: showAdminKeyCommands,
    }} />;

  return (
    <AppGrid
      containerRef={ref}
      className={className}
      {...{ [DATA_KEY_PHOTO_LARGE]: true }}
      contentMain={<div>{renderLargePhoto}</div>}
      classNameSide="relative"
      sideHiddenOnMobile={false}
      contentSide={
        <div className="md:absolute inset-0 text-xs">
          <MaskedScroll className="sticky top-4 self-start">
            <DivDebugBaselineGrid className={clsx(
              'grid grid-cols-2 md:grid-cols-1',
              'gap-x-0.5 sm:gap-x-1 gap-y-baseline',
              'mb-6 md:mb-4',
            )}>
              {/* Meta */}
              <div className="pr-3 md:pr-0">
                {!isEditingTitles &&
                  <div className="float-end hidden md:block">
                    {renderAdminMenu}
                  </div>}
                {isEditingTitles
                  ? <div className={clsx(
                    'space-y-2 mb-2',
                    // Keep text large for iOS forms
                    'md:[&_input]:text-sm',
                  )}>
                    <FieldsetWithStatus
                      id={`edit-title-${photo.id}`}
                      label="Title"
                      value={photoEdit.title}
                      onChange={title => setPhotoEdit?.(
                        photo.id,
                        { title },
                        photoEditOriginal,
                      )}
                      placeholder="Title"
                      hideLabel
                      readOnly={isPerformingUpdate}
                      className="[&_input]:font-bold"
                    />
                    <FieldsetWithStatus
                      id={`edit-caption-${photo.id}`}
                      label="Caption"
                      value={photoEdit.caption}
                      onChange={caption => setPhotoEdit?.(
                        photo.id,
                        { caption },
                        photoEditOriginal,
                      )}
                      placeholder="Caption"
                      hideLabel
                      readOnly={isPerformingUpdate}
                    />
                  </div>
                  : hasTitle && (showTitleAsH1
                    ? <h1>{renderPhotoLink}</h1>
                    : renderPhotoLink)}
                <div className="space-y-baseline">
                  {!isEditingTitles && photo.caption &&
                    <div>
                      {photo.caption}
                    </div>}
                  {(
                    showCameraContent ||
                    showLensContent ||
                    showRecipeContent ||
                    showPlaceContent
                  ) &&
                    <div>
                      {(showCameraContent || showLensContent) &&
                        <div className="flex flex-col *:self-start">
                          {showCameraContent &&
                            <PhotoCamera
                              camera={camera}
                              contrast="medium"
                            />}
                          {showLensContent &&
                            <PhotoLens
                              lens={lens}
                              contrast="medium"
                            />}
                        </div>}
                      {showRecipeContent && recipeTitle &&
                        <PhotoRecipe
                          ref={refPhotoRecipe}
                          recipe={recipeTitle}
                          contrast="medium"
                          prefetch={prefetchRelatedLinks}
                          toggleRecipeOverlay={toggleRecipeOverlay}
                          isShowingRecipeOverlay={isShowingRecipeOverlay}
                        />}
                    </div>}
                </div>
              </div>
              {/* EXIF Data */}
              <div className={clsx(
                'space-y-baseline',
                !hasTitleContent && !hasMetaContent && 'md:-mt-baseline',
              )}>
                {!isEditingTitles &&
                  <div className="float-end md:hidden">
                    {renderAdminMenu}
                  </div>}
                {showExifContent &&
                  <>
                    <ul className="text-medium">
                      <li>
                        {photo.focalLength && photo.focalLengthFormatted}
                        {(
                          photo.focalLengthIn35MmFormatFormatted &&
                          // eslint-disable-next-line @stylistic/max-len
                          photo.focalLengthIn35MmFormatFormatted !== photo.focalLengthFormatted
                        ) &&
                          <>
                            {' '}
                            <Tooltip
                              content={appText.tooltip['35mm']}
                              sideOffset={3}
                              supportMobile
                            >
                              <span
                                className={clsx(
                                  'text-extra-dim',
                                  'decoration-dotted underline-offset-[3px]',
                                  'hover:underline',
                                )}
                              >
                                {photo.focalLengthIn35MmFormatFormatted}
                              </span>
                            </Tooltip>
                          </>}
                      </li>
                      <li>{photo.fNumberFormatted}</li>
                      <li>{photo.exposureTimeFormatted}</li>
                      <li>{photo.isoFormatted}</li>
                      {photo.exposureCompensationFormatted &&
                        <li>{photo.exposureCompensationFormatted}</li>}
                    </ul>
                    {showFilmContent && photo.film &&
                      <PhotoFilm
                        ref={refPhotoFilm}
                        film={photo.film}
                        make={photo.make}
                        prefetch={prefetchRelatedLinks}
                        {...photo.recipeData && !photo.recipeTitle && {
                          toggleRecipeOverlay,
                          isShowingRecipeOverlay,
                        }}
                      />}
                    {showPlaceContent && photo.location &&
                      <div>
                        <PlaceEntity
                          place={photo.location}
                          contrast="low"
                          className="-translate-x-0.5"
                        />
                      </div>}
                  </>}
                <div className={clsx(
                  'flex gap-x-3 gap-y-baseline',
                  'md:flex-col flex-wrap',
                  'md:justify-normal',
                )}>
                  <PhotoDate
                    photo={photo}
                    className={clsx(
                      'text-medium',
                      // Prevent collision with admin button
                      !hasNonDateContent && isUserSignedIn && 'md:pr-7',
                    )}
                    // 'createdAt' is a naive datetime which does not require
                    // a timezone and will not cause server/client mismatch
                    timezone={null}
                  />
                  <div className={clsx(
                    'flex gap-1 translate-y-[0.5px]',
                    'translate-x-[-2.5px]',
                  )}>
                    {showZoomButton &&
                      <LoaderButton
                        tooltip={appText.tooltip.zoom}
                        aria-label={appText.tooltip.zoom}
                        icon={<LuExpand size={15} />}
                        onClick={() => refZoomControls.current?.open()}
                        styleAs="link"
                        className={clsx(
                          'action-button text-medium',
                          'translate-y-[0.25px]',
                        )}
                        hideFocusOutline
                      />}
                    {shouldShare &&
                      <ShareButton
                        tooltip={appText.tooltip.sharePhoto}
                        photo={photo}
                        query={shouldShareQuery
                          ? query
                          : undefined}
                        recent={shouldShareRecents
                          ? recent
                          : undefined}
                        year={shouldShareYear
                          ? year
                          : undefined}
                        album={shouldShareAlbum
                          ? album
                          : undefined}
                        camera={shouldShareCamera
                          ? camera
                          : undefined}
                        lens={shouldShareLens
                          ? lens
                          : undefined}
                        film={shouldShareFilm
                          ? photo.film
                          : undefined}
                        recipe={shouldShareRecipe
                          ? recipeTitle
                          : undefined}
                        focal={shouldShareFocalLength
                          ? photo.focalLength
                          : undefined}
                        prefetch={prefetchRelatedLinks}
                      />}
                    <DownloadButton
                      className="translate-y-[0.5px] md:translate-y-0"
                      photo={photo}
                    />
                  </div>
                  {showStorageCheck &&
                    <AdminPhotoStorageCheck photo={photo} />}
                </div>
              </div>
            </DivDebugBaselineGrid>
          </MaskedScroll>
        </div>}
    />
  );
};
