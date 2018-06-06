import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FilesService } from '../../services/files.service'
import { Input } from '@angular/core'
import { IPeer } from '../../defs/peer'
import { Status } from '../../../../defs/status.enum';
import { Subscription } from 'rxjs';

@Component({
  selector: 'peer-usercard',
  templateUrl: './usercard.component.html',
  styleUrls: ['./usercard.component.sass']
})
export class UsercardComponent implements OnInit, OnDestroy {
  @Input()
  readonly client: IPeer
  private sub: Subscription
  status: Status = Status.Pending

  selected:any[] = []
  constructor(public fs: FilesService, private zone: NgZone) {}

  ngOnInit() {
    this.sub = this.client.$status.subscribe(
      e => {
        this.zone.run(() => this.status = e)
      }
    )
  }

  ngOnDestroy() {
    this.sub.unsubscribe()
  }
}
