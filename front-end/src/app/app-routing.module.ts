import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BalanceComponent } from './balance/balance.component';
import { TransferComponent } from './transfer/transfer.component';
import { SupportComponent } from './support/support.component';
import { MyDashboardComponent } from './my-dashboard/my-dashboard.component';


const routes: Routes = [
  { path: 'balance', component: BalanceComponent },
  { path: 'transfer', component: TransferComponent },
  { path: 'support', component: SupportComponent },
  { path: 'my-dashboard', component: MyDashboardComponent },
  { path: '', redirectTo: 'balance', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
