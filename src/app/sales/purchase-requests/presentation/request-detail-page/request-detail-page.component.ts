import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe } from '@ngx-translate/core';
import { ErrorStateComponent } from '../../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../../shared/presentation/components/page-header/page-header.component';
import { PurchaseRequestSelfServiceFacade } from '../../application/purchase-request-self-service.facade';
import { canCancelPurchaseRequest, canEditPurchaseRequest } from '../../domain/purchase-request.models';
@Component({selector:'nexa-request-detail-page',imports:[MatButtonModule,MatCardModule,MatChipsModule,RouterLink,TranslatePipe,ErrorStateComponent,LoadingStateComponent,PageHeaderComponent],templateUrl:'./request-detail-page.component.html',styleUrl:'./request-detail-page.component.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class RequestDetailPageComponent {
  readonly facade=inject(PurchaseRequestSelfServiceFacade); private readonly route=inject(ActivatedRoute);
  constructor(){const id=this.route.snapshot.paramMap.get('purchaseRequestId');if(id)this.facade.loadDetail(id);}
  canEdit(status: string): boolean { return canEditPurchaseRequest(status as Parameters<typeof canEditPurchaseRequest>[0]); }
  canCancel(status: string): boolean { return canCancelPurchaseRequest(status as Parameters<typeof canCancelPurchaseRequest>[0]); }
  submit():void{const item=this.facade.detailState().item;if(item)this.facade.submit(item);}
  cancel():void{const item=this.facade.detailState().item;if(item)this.facade.cancel(item);}
  reload():void{this.facade.reloadCurrent();}
}
