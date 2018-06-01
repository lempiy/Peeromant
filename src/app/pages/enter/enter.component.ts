import { Component, OnInit } from '@angular/core';
import { SignallerService } from '../../services/signaller.service'
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'peer-enter',
  templateUrl: './enter.component.html',
  styleUrls: ['./enter.component.sass']
})
export class EnterComponent implements OnInit {

  constructor(private sgn: SignallerService) { }

  ngOnInit() {
    this.sgn
    .ensureConnected()
    .pipe(switchMap(() => this.sgn.getAvailableHubs()))
    .subscribe(e => {
      console.log(e.payload.hubs)
    }, e => console.log("error: ", e))
  }
}
