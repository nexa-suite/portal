import { Injectable, inject, signal } from '@angular/core';
import { DeliveryLiveRefreshService } from '../../core/change-feed/application/delivery-live-refresh.service';
import { DeliveryTrackingApiPort } from './ports/delivery-tracking-api.port';
import { Delivery, DeliveryEvent, DeliveryPage } from '../domain/delivery.models';

@Injectable({providedIn:'root'})
export class DeliveryTrackingFacade {
  private readonly api=inject(DeliveryTrackingApiPort); private readonly refresh=inject(DeliveryLiveRefreshService); readonly loading=signal(false); readonly error=signal<string|null>(null); readonly page=signal<DeliveryPage|null>(null); readonly selected=signal<Delivery|null>(null); readonly events=signal<readonly DeliveryEvent[]>([]);
  constructor(){this.refresh.watch((id)=>{const current=this.selected();if(id&&current?.id===id)this.loadDetail(id);else this.loadList();});}
  loadList():void{this.loading.set(true);this.error.set(null);this.api.list().subscribe({next:value=>{this.page.set(value);this.loading.set(false);},error:()=>{this.error.set('DELIVERY_LOAD_FAILED');this.loading.set(false);}});}
  loadDetail(id:string):void{this.loading.set(true);this.error.set(null);this.api.detail(id).subscribe({next:value=>{this.selected.set(value);this.api.events(id).subscribe({next:events=>this.events.set(events),error:()=>this.error.set('DELIVERY_EVENTS_FAILED')});this.loading.set(false);},error:()=>{this.error.set('DELIVERY_LOAD_FAILED');this.loading.set(false);}});}
  retry():void{const id=this.selected()?.id;if(id)this.loadDetail(id);else this.loadList();}
}
