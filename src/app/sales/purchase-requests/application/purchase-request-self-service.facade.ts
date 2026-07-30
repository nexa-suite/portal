import { Injectable, inject, signal } from '@angular/core';
import { PurchaseRequestApiClient } from '../infrastructure/purchase-request-api.client';
import { PurchaseRequest, PurchaseRequestDraftCommand, PurchaseRequestPage } from '../domain/purchase-request.models';

@Injectable({ providedIn: 'root' })
export class PurchaseRequestSelfServiceFacade {
  private readonly api = inject(PurchaseRequestApiClient);
  readonly listState = signal<{ readonly status:'idle'|'loading'|'success'|'empty'|'error'; readonly page:PurchaseRequestPage|null; readonly message:string|null }>({status:'idle',page:null,message:null});
  readonly detailState = signal<{ readonly status:'idle'|'loading'|'success'|'error'; readonly item:PurchaseRequest|null; readonly message:string|null }>({status:'idle',item:null,message:null});
  loadList(status=''):void { this.listState.update((state)=>({...state,status:'loading',message:null})); this.api.list(status).subscribe({next:(page)=>this.listState.set({status:page.items.length?'success':'empty',page,message:null}),error:()=>this.listState.update((state)=>({...state,status:'error',message:'PURCHASE_REQUESTS_LOAD_FAILED'}))}); }
  loadDetail(id:string):void { this.detailState.set({status:'loading',item:null,message:null}); this.api.get(id).subscribe({next:(item)=>this.detailState.set({status:'success',item,message:null}),error:()=>this.detailState.set({status:'error',item:null,message:'PURCHASE_REQUEST_LOAD_FAILED'})}); }
  create(command:PurchaseRequestDraftCommand,done:(item:PurchaseRequest)=>void):void { this.api.create(command).subscribe({next:done,error:()=>this.detailState.set({status:'error',item:null,message:'PURCHASE_REQUEST_CREATE_FAILED'})}); }
  submit(item:PurchaseRequest,done:(next:PurchaseRequest)=>void):void { this.api.submit(item.id,item.version,`portal-${item.id}-${item.version}`).subscribe({next:done,error:()=>this.detailState.update((state)=>({...state,message:'SUBMISSION_FAILED'}))}); }
  cancel(item:PurchaseRequest,done:(next:PurchaseRequest)=>void):void { this.api.cancel(item.id,item.version).subscribe({next:done,error:()=>this.detailState.update((state)=>({...state,message:'CANCELLATION_FAILED'}))}); }
  retryList():void { this.loadList(); }
}
