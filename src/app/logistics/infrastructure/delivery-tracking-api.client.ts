import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PORTAL_RUNTIME_CONFIG, portalApiUrl } from '../../core/security/runtime-config';
import { Delivery, DeliveryEvent, DeliveryPage } from '../domain/delivery.models';

type Raw = Record<string, unknown>;
function raw(value: unknown): Raw { return value && typeof value === 'object' ? value as Raw : {}; }
function text(value: unknown): string { return typeof value === 'string' ? value : ''; }
function delivery(value: unknown): Delivery { const item=raw(value); return { id:text(item['id']), dispatchNumber:text(item['dispatchNumber']), salesOrderId:text(item['salesOrderId']), salesOrderNumber:text(item['salesOrderNumber']) || text(item['salesOrderId']), clientAccountId:text(item['clientAccountId']), status:(text(item['status'])||'UNKNOWN') as Delivery['status'], destination:typeof item['destination']==='string'?item['destination']:null, deliveryWindowStart:typeof item['deliveryWindowStart']==='string'?item['deliveryWindowStart']:null, deliveryWindowEnd:typeof item['deliveryWindowEnd']==='string'?item['deliveryWindowEnd']:null, eta:typeof item['eta']==='string'?item['eta']:null, podStatus:typeof item['podStatus']==='string'?item['podStatus']:null, version:Number(item['version'])||0, updatedAt:text(item['updatedAt']), alerts:Array.isArray(item['alerts'])?item['alerts'].map(String):[] }; }

@Injectable({providedIn:'root'})
export class DeliveryTrackingApiClient {
  private readonly http=inject(HttpClient); private readonly config=inject(PORTAL_RUNTIME_CONFIG); private api(path:string):string{return portalApiUrl(this.config,`/api/v1${path}`);}
  list():Observable<DeliveryPage>{const params=new HttpParams().set('page',0).set('size',100).set('sort','updatedAt,desc');return this.http.get<unknown>(this.api('/my-deliveries'),{params,withCredentials:true}).pipe(map(value=>{const item=raw(value);return {items:Array.isArray(item['items'])?item['items'].map(delivery):[],page:Number(item['page'])||0,size:Number(item['size'])||100,total:Number(item['total'])||0};}));}
  detail(id:string):Observable<Delivery>{return this.http.get<unknown>(this.api(`/my-deliveries/${encodeURIComponent(id)}`),{withCredentials:true}).pipe(map(delivery));}
  events(id:string):Observable<readonly DeliveryEvent[]>{return this.http.get<unknown>(this.api(`/my-deliveries/${encodeURIComponent(id)}/events`),{withCredentials:true}).pipe(map(value=>{const body=raw(value);const list: readonly unknown[]=Array.isArray(value)?value:(Array.isArray(body['items'])?body['items']:[]);return list.map((item:unknown)=>{const event=raw(item);return {id:text(event['id']),type:text(event['type']),occurredAt:text(event['occurredAt']),summary:typeof event['summary']==='string'?event['summary']:null};});}));}
}
