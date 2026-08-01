import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ErrorStateComponent } from '../../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../../shared/presentation/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/presentation/components/page-header/page-header.component';
import { PurchaseRequestSelfServiceFacade } from '../../application/purchase-request-self-service.facade';
@Component({selector:'nexa-my-requests-page',imports:[MatButtonModule,MatCardModule,MatChipsModule,MatSelectModule,RouterLink,TranslatePipe,ErrorStateComponent,LoadingStateComponent,EmptyStateComponent,PageHeaderComponent],templateUrl:'./my-requests-page.component.html',styleUrl:'./my-requests-page.component.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class MyRequestsPageComponent { readonly facade=inject(PurchaseRequestSelfServiceFacade); constructor(){this.facade.loadList();} filter(status:string){this.facade.loadList(status);} }
