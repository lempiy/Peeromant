import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnterComponent } from './enter.component';
import { EnterRoutingModule } from './enter-routing.module';
import { NicknameComponent } from './components/nickname/nickname.component'
import { ClarityModule } from "@clr/angular";

@NgModule({
  imports: [
    CommonModule,
    EnterRoutingModule,
    ClarityModule
  ],
  declarations: [EnterComponent, NicknameComponent]
})
export class EnterModule {
  static forRoot():ModuleWithProviders {
    return <ModuleWithProviders> {
      ngModule: EnterModule,
      providers: []
    }
  }
}
