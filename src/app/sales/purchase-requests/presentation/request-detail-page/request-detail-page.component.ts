import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { ErrorStateComponent } from '../../../../shared/presentation/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../../../shared/presentation/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../../shared/presentation/components/page-header/page-header.component';
import { PurchaseRequestSelfServiceFacade } from '../../application/purchase-request-self-service.facade';
@Component({selector:'nexa-request-detail-page',imports:[MatButtonModule,MatCardModule,MatChipsModule,RouterLink,ErrorStateComponent,LoadingStateComponent,PageHeaderComponent],templateUrl:'./request-detail-page.component.html',styleUrl:'./request-detail-page.component.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class RequestDetailPageComponent { readonly facade=inject(PurchaseRequestSelfServiceFacade); private readonly route=inject(ActivatedRoute); constructor(){const id=this.route.snapshot.paramMap.get('purchaseRequestId');if(id)this.facade.loadDetail(id);} submit():void{const item=this.facade.detailState().item;if(item)this.facade.submit(item,(next)=>this.facade.detailState.set({status:'success',item:next,message:null}));} cancel():void{const item=this.facade.detailState().item;if(item)this.facade.cancel(item,(next)=>this.facade.detailState.set({status:'success',item:next,message:null}));} }
