import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: 'enter',
    loadChildren: './pages/enter/enter.module#EnterModule'
  },
  {
    path: 'auth',
    loadChildren: './pages/auth/auth.module#AuthModule'
  },
  {
    path: 'camp/:id',
    loadChildren: './pages/camp/camp.module#CampModule'
  },
  {
    path: '',
    redirectTo: 'enter',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'enter'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
