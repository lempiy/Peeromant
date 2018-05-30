import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from "@clr/angular";
import { CampRoutingModule } from './camp-routing.module';
import { CampComponent } from './camp.component';
import { UsercardComponent } from './components/usercard/usercard.component';
import { HostComponent } from './components/host/host.component';
import { PairPipe } from './pipes/pair.pipe';

@NgModule({
  imports: [
    CommonModule,
    CampRoutingModule,
    ClarityModule
  ],
  declarations: [CampComponent, UsercardComponent, HostComponent, PairPipe]
})
export class CampModule { }
