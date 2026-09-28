import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Public Pages
import { HomePage } from './pages/HomePage';
import { MoviesPage } from './pages/MoviesPage';
import { TVPage } from './pages/TVPage';
import { AnimePage } from './pages/AnimePage';
import { GenresPage } from './pages/GenresPage';
import { SearchPage } from './pages/SearchPage';
import { ContentDetailPage } from './pages/ContentDetailPage';
import { WatchPage } from './pages/WatchPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { AboutPage, ContactPage, PrivacyPage, TermsPage } from './pages/StaticPages';
import { NotFoundPage } from './pages/NotFoundPage';

// Admin Page (Dedicated & Protected)
import { AdminPage } from './pages/AdminPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PlayerProvider>
          <BrowserRouter>
            <Suspense
              fallback={
                <div className="min-h-screen bg-[#06080c] flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2 border-red-600/30 border-t-red-600 animate-spin" />
                </div>
              }
            >
              <Routes>
                {/* 1. Public Cinema Routes */}
                <Route
                  path="/"
                  element={
                    <PublicLayout>
                      <HomePage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/movies"
                  element={
                    <PublicLayout>
                      <MoviesPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/tv"
                  element={
                    <PublicLayout>
                      <TVPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/anime"
                  element={
                    <PublicLayout>
                      <AnimePage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/genres"
                  element={
                    <PublicLayout>
                      <GenresPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <PublicLayout>
                      <SearchPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/movie/:slug"
                  element={
                    <PublicLayout>
                      <ContentDetailPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/tv/:slug"
                  element={
                    <PublicLayout>
                      <ContentDetailPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/watch/:slug"
                  element={<WatchPage />}
                />
                <Route
                  path="/watch/:slug/season/:season/episode/:episode"
                  element={<WatchPage />}
                />
                <Route
                  path="/watchlist"
                  element={
                    <PublicLayout>
                      <WatchlistPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <PublicLayout>
                      <HistoryPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PublicLayout>
                      <ProfilePage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/about"
                  element={
                    <PublicLayout>
                      <AboutPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/contact"
                  element={
                    <PublicLayout>
                      <ContactPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/privacy"
                  element={
                    <PublicLayout>
                      <PrivacyPage />
                    </PublicLayout>
                  }
                />
                <Route
                  path="/terms"
                  element={
                    <PublicLayout>
                      <TermsPage />
                    </PublicLayout>
                  }
                />

                {/* 2. Admin Route (Dedicated & Isolated, Zero Public Mentions) */}
                <Route path="/admin/*" element={<AdminPage />} />

                {/* 3. 404 Catch-All */}
                <Route
                  path="*"
                  element={
                    <PublicLayout>
                      <NotFoundPage />
                    </PublicLayout>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </PlayerProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};
