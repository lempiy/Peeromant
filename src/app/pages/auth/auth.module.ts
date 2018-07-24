import { NgModule } from '@angular/core';
import { AuthComponent } from './auth.component';
import { AuthRoutingModule } from './auth-routing.module';
import { ClarityModule } from "@clr/angular";
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    AuthRoutingModule,
    ClarityModule,
    CommonModule
  ],
  declarations: [AuthComponent]
})
export class AuthModule { }
