import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { CatalogApiClient } from '../../../../catalog-management/infrastructure/catalog-api.client';
import { CatalogItemDetail } from '../../../../catalog-management/domain/catalog.models';
import { PurchaseRequestDraftCommand, PurchaseRequestLine } from '../../domain/purchase-request.models';
import { PurchaseRequestSelfServiceFacade } from '../../application/purchase-request-self-service.facade';
import { PageHeaderComponent } from '../../../../shared/presentation/components/page-header/page-header.component';
@Component({selector:'nexa-request-builder-page',imports:[ReactiveFormsModule,MatButtonModule,MatCardModule,MatFormFieldModule,MatInputModule,MatSelectModule,PageHeaderComponent],templateUrl:'./request-builder-page.component.html',styleUrl:'./request-builder-page.component.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class RequestBuilderPageComponent {
  private readonly fb=inject(NonNullableFormBuilder); private readonly catalog=inject(CatalogApiClient); private readonly router=inject(Router); readonly facade=inject(PurchaseRequestSelfServiceFacade);
  readonly form=this.fb.group({priority:this.fb.control('NORMAL',Validators.required),requestedDeliveryDate:this.fb.control(''),deliveryProfileSnapshot:this.fb.control(''),paymentOption:this.fb.control('cash_on_delivery',Validators.required),comment:this.fb.control('')});
  readonly catalogItemId=this.fb.control('',Validators.required); readonly quantity=this.fb.control(1,[Validators.required,Validators.min(0.01)]); readonly lines=signal<readonly { item:CatalogItemDetail; quantity:number }[]>([]); readonly message=signal<string|null>(null);
  addCatalogItem():void { if(this.catalogItemId.invalid||this.quantity.invalid)return; this.catalog.getById(this.catalogItemId.value).subscribe({next:(item)=>{if(this.lines().some((line)=>line.item.catalogItemId===item.catalogItemId)){this.message.set('This catalog item is already in the request.');return;}this.lines.update((lines)=>[...lines,{item,quantity:this.quantity.value}]);this.catalogItemId.reset();this.quantity.setValue(1);},error:()=>this.message.set('Catalog item is unavailable.')}); }
  remove(id:string):void { this.lines.update((lines)=>lines.filter((line)=>line.item.catalogItemId!==id)); }
  saveDraft():void { if(this.form.invalid||!this.lines().length){this.form.markAllAsTouched();this.message.set('Add at least one catalog item before saving.');return;}const value=this.form.getRawValue();const command:PurchaseRequestDraftCommand={...value,requestedDeliveryDate:value.requestedDeliveryDate||null,lines:this.lines().map((line)=>({catalogItemId:line.item.catalogItemId,quantity:line.quantity,unit:'unit',notes:''}))};this.facade.create(command,(item)=>{this.message.set('Draft saved.');void this.router.navigate(['/portal/purchase-requests',item.id]);}); }
}
