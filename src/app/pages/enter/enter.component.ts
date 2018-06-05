import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { EVENT_HUB_REMOVED, EVENT_NEW_HUB_CREATED } from '../../defs/constants'
import { SignallerService } from '../../services/signaller.service'
import { switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs'

@Component({
  selector: 'peer-enter',
  templateUrl: './enter.component.html',
  styleUrls: ['./enter.component.sass']
})
export class EnterComponent implements OnInit, OnDestroy {
  subs:Subscription[] = [];

  constructor(private sgn: SignallerService, private r:Router) { }

  ngOnInit() {
    this.subs = []
    this.initSubscriptions()
    this.subs.push(
      this.sgn
        .ensureConnected()
        .pipe(switchMap(() => this.sgn.getAvailableHubs()))
        .subscribe(e => {
          console.log(e.payload.hubs)
        }, e => console.log("error: ", e))
    )
  }

  initSubscriptions() {
    this.subs.push(
      this.sgn.subscribe(EVENT_HUB_REMOVED, data => {
        this.sgn.removeHub(data.payload.name)
      }),
      this.sgn.subscribe(EVENT_NEW_HUB_CREATED, data => {
        this.sgn.addHub(data.payload.name)
      })
    )
  }

  onAddHub(event: string) {
    if (!event) return
    this
      .sgn
      .createHub(event)
      .toPromise()
      .then(data => {
        if (data.payload.success) {
          this.r.navigate([`camp`, event])
        }
      })
  }

  onConnectHub(event: string) {
    if (!event) return
    this
      .sgn
      .connectHub(event)
      .toPromise()
      .then(data => {
        if (data.payload.success) {
          this.r.navigate([`camp`, event])
        }
      })
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe())
  }
}
