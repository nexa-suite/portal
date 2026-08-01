import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../shared/presentation/components/page-header/page-header.component';
import { LoadingStateComponent } from '../../shared/presentation/components/loading-state/loading-state.component';
import { ErrorStateComponent } from '../../shared/presentation/components/error-state/error-state.component';
import { SectionPanelComponent } from '../../shared/presentation/components/section-panel/section-panel.component';
import { DeliveryTrackingFacade } from '../application/delivery-tracking.facade';

@Component({selector:'nexa-delivery-detail-page',standalone:true,imports:[DatePipe,RouterLink,TranslatePipe,PageHeaderComponent,LoadingStateComponent,ErrorStateComponent,SectionPanelComponent],template:`<section class="page"><a routerLink="/portal/deliveries">← {{'delivery.title'|translate}}</a>@if(facade.loading()){<nexa-loading-state [label]="'delivery.loading'|translate"/>}@else if(facade.error();as error){<nexa-error-state [title]="'delivery.title'|translate" [description]="('messages.'+error)|translate" (retry)="facade.retry()"/>}@else if(facade.selected();as item){<nexa-page-header [title]="item.dispatchNumber" [subtitle]="('delivery.status.'+item.status)|translate"/><nexa-section-panel [title]="'delivery.fields.salesOrder'|translate"><p>{{item.salesOrderNumber}}</p><p>{{'delivery.fields.destination'|translate}}: {{item.destination||'—'}}</p><p>{{'delivery.fields.window'|translate}}: {{item.deliveryWindowStart|date:'short'}} – {{item.deliveryWindowEnd|date:'short'}}</p><p>{{'delivery.fields.updated'|translate}}: {{item.updatedAt|date:'short'}}</p><p>{{'delivery.fields.pod'|translate}}: {{item.podStatus==='COMPLETED'?('delivery.podComplete'|translate):('delivery.podPending'|translate)}}</p></nexa-section-panel><nexa-section-panel [title]="'delivery.timeline'|translate"><ol>@for(event of facade.events();track event.id){<li>{{event.type}} · {{event.occurredAt|date:'short'}}</li>}@empty{<li>{{'delivery.noEvents'|translate}}</li>}</ol></nexa-section-panel>}</section>`,changeDetection:ChangeDetectionStrategy.OnPush})
export class DeliveryDetailPageComponent{readonly facade=inject(DeliveryTrackingFacade);readonly id=inject(ActivatedRoute).snapshot.paramMap.get('dispatchOrderId')!;constructor(){this.facade.loadDetail(this.id);}}
