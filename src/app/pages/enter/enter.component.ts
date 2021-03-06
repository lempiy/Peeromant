import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { EVENT_HUB_REMOVED, EVENT_NEW_HUB_CREATED } from '../../defs/constants'
import { SignallerService } from '../../services/signaller.service'
import { switchMap } from 'rxjs/operators';
import { Subscription, empty } from 'rxjs'

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
        .pipe(switchMap(isOk => {
          if (isOk) {
            return this.sgn.getAvailableHubs()
          }
          this.navigateToAuth()
          return empty()
        }))
        .subscribe(e => {
          console.log(e.payload.hubs)
        }, e => console.log("error: ", e))
    )
  }

  navigateToAuth() {
    return this.r.navigate(['/auth'])
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
    this.r.navigate([`camp`, event], {
      queryParams: {
        initial: 1
      }
    })
  }

  onConnectHub(event: string) {
    if (!event) return
    this.r.navigate([`camp`, event])
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe())
  }
}
