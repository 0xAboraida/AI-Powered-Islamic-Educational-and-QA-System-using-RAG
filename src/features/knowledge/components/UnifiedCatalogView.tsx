import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookMeta } from '../types/bookTypes';
import { CategoriesView, CategoriesViewProps } from './CategoriesView';
import { AuthorsView, AuthorsViewProps } from './AuthorsView';
import NarratorsView from './NarratorsView';
import FavoriteBooksView from './FavoriteBooksView';
import DownloadsView from './DownloadsView';

export type CatalogSubTab = 'categories' | 'authors' | 'narrators' | 'favorites' | 'downloads';

export interface UnifiedCatalogViewProps {
  activeSubTab?: CatalogSubTab;
  initialSubTab?: CatalogSubTab;
  onSubTabChange?: (tab: CatalogSubTab) => void;
  // Categories props
  categoriesProps: CategoriesViewProps;
  // Authors props
  authorsProps: AuthorsViewProps;
  // Favorites props
  favoriteBooks: BookMeta[];
  onRemoveFavorite: (id: string | number) => void;
  onOpenAuthorBio?: (book: BookMeta) => void;
  // Global actions
  handleReadBook: (book: BookMeta) => void;
  onAskBook: (book: any) => void;
  publishedBooks: BookMeta[];
  onSelectNarrator?: (narrator: any | null) => void;
}

export default function UnifiedCatalogView({
  activeSubTab: controlledSubTab,
  initialSubTab = 'categories',
  onSubTabChange,
  categoriesProps,
  authorsProps,
  favoriteBooks,
  onRemoveFavorite,
  onOpenAuthorBio,
  handleReadBook,
  onAskBook,
  publishedBooks,
  onSelectNarrator,
}: UnifiedCatalogViewProps) {
  const [internalSubTab, setInternalSubTab] = useState<CatalogSubTab>(initialSubTab);
  const currentSubTab = controlledSubTab ?? internalSubTab;

  const handleTabSwitch = (tab: CatalogSubTab) => {
    setInternalSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* ========================================================================= */}
      {/* SUB-TAB CONTENTS WITH ANIMATED TRANSITIONS (انتقال سلس وناعم بين التبويبات) */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSubTab}
            initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            {/* 1. الكتب والأقسام */}
            {currentSubTab === 'categories' && (
              <CategoriesView {...categoriesProps} />
            )}

            {/* 2. المؤلفون */}
            {currentSubTab === 'authors' && (
              <AuthorsView {...authorsProps} />
            )}

            {/* 3. الرواة (18,989 راوٍ) */}
            {currentSubTab === 'narrators' && (
              <NarratorsView
                onReadBook={handleReadBook}
                publishedBooks={publishedBooks}
                onOpenBookInfo={categoriesProps.setActiveInfoBook}
                onSelectNarrator={onSelectNarrator}
              />
            )}

            {/* 4. المفضلة */}
            {currentSubTab === 'favorites' && (
              <FavoriteBooksView
                favoriteBooks={favoriteBooks}
                onRead={handleReadBook}
                onAsk={onAskBook}
                onRemoveFavorite={onRemoveFavorite}
                onBrowseLibrary={() => handleTabSwitch('categories')}
                onOpenAuthorBio={onOpenAuthorBio}
                onOpenBookInfo={categoriesProps.setActiveInfoBook}
              />
            )}

            {/* 5. المحمّلة */}
            {currentSubTab === 'downloads' && (
              <DownloadsView
                onReadBook={handleReadBook}
                onBrowseLibrary={() => handleTabSwitch('categories')}
                publishedBooks={publishedBooks}
                onAskBook={onAskBook}
                onOpenAuthorBio={onOpenAuthorBio}
                onOpenBookInfo={categoriesProps.setActiveInfoBook}
                favoriteBookIds={categoriesProps.favoriteBookIds}
                toggleFavorite={categoriesProps.toggleFavorite}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
