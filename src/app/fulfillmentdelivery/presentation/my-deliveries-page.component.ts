import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../shared/presentation/components/empty-state/empty-state.component';
import { DeliveryTrackingFacade } from '../application/delivery-tracking.facade';

@Component({selector:'nexa-my-deliveries-page',standalone:true,imports:[RouterLink,TranslatePipe,PageHeaderComponent,LoadingStateComponent,ErrorStateComponent,EmptyStateComponent],template:`<section class="page"><nexa-page-header [eyebrow]="'delivery.title'|translate" [title]="'delivery.title'|translate" [subtitle]="'delivery.subtitle'|translate"/>@if(facade.loading()){<nexa-loading-state [label]="'delivery.loading'|translate"/>}@else if(facade.error();as error){<nexa-error-state [title]="'delivery.title'|translate" [description]="('messages.'+error)|translate" (retry)="facade.retry()"/>}@else if(facade.page()?.items?.length===0){<nexa-empty-state [title]="'delivery.empty'|translate" [description]="'delivery.empty'|translate"/>}@else{<div class="list">@for(item of facade.page()?.items??[];track item.id){<article><h2>{{item.dispatchNumber}}</h2><p>{{item.salesOrderNumber}}</p><p>{{('delivery.status.'+item.status)|translate}}</p><p>{{item.destination||'—'}}</p><a [routerLink]="['/portal/deliveries',item.id]">{{'delivery.open'|translate}}</a></article>}</div>}</section>`,styles:[`.list{display:grid;gap:1rem}.list article{padding:1rem;border:1px solid #ddd;border-radius:.5rem}`],changeDetection:ChangeDetectionStrategy.OnPush})
export class MyDeliveriesPageComponent{readonly facade=inject(DeliveryTrackingFacade);constructor(){this.facade.loadList();}}
