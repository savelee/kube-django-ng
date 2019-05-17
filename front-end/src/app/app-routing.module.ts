import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BalanceComponent } from './balance/balance.component';
import { SupportComponent } from './support/support.component';
import { FaqComponent } from './faq/faq.component';

import { AdminTestComponent } from './admin-test/admin-test.component';
import { AdminConfigComponent } from './admin-config/admin-config.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';

const routes: Routes = [
  { path: 'balance', component: BalanceComponent },
  { path: 'support', component: SupportComponent },
  { path: 'faq/faq.html', component: FaqComponent },
  { path: 'admin-test', component: AdminTestComponent },
  { path: 'admin-config', component: AdminConfigComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: '', redirectTo: 'balance', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
