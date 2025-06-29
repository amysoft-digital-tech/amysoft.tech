import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
  },
  {
    path: 'chapters',
    loadComponent: () => import('./pages/chapters/chapters.page').then(m => m.ChaptersPage)
  },
  {
    path: 'chapter/:id',
    loadComponent: () => import('./pages/chapter-detail/chapter-detail.page').then(m => m.ChapterDetailPage)
  },
  {
    path: 'templates',
    loadComponent: () => import('./pages/templates/templates.page').then(m => m.TemplatesPage)
  },
  {
    path: 'bookmarks',
    loadComponent: () => import('./pages/bookmarks/bookmarks.page').then(m => m.BookmarksPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];