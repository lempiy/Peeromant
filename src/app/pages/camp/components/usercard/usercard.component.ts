import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FilesService } from '../../services/files.service'
import { Input, Output, EventEmitter } from '@angular/core'
import { IPeer, IConfirmEvent } from '../../defs/peer'
import { Status } from '../../../../defs/status.enum';
import { TransferService } from '../../services/transfer.service';
import { Subscription } from 'rxjs';
import { LinkState, ClientRoles } from '../../defs/peer-state.enum';
import { ClientChangeType } from '../../defs/client-change.enum';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'peer-usercard',
  templateUrl: './usercard.component.html',
  styleUrls: ['./usercard.component.sass']
})
export class UsercardComponent implements OnInit, OnDestroy {
  @Input()
  readonly client: IPeer
  @Output()
  confirm: EventEmitter<IConfirmEvent> = new EventEmitter()
  private sub: Subscription
  status: Status = Status.Pending
  public LinkState = LinkState
  public role: ClientRoles
  public ClientRoles = ClientRoles

  selected:any[] = []
  constructor(
    public fs: FilesService,
    private zone: NgZone,
    private ts: TransferService,
    private sanitizer:DomSanitizer) {}

  ngOnInit() {
    this.sub = this.client.$change.subscribe(
      e => {
        switch(e.type) {
          case ClientChangeType.Status:
            this.zone.run(() => this.status = <Status>e.value)
            break
          case ClientChangeType.State:
            this.zone.run(() => {
              this.client.state = <LinkState>e.value
              this.role = e.role || null
            })
            break
        }
      }
    )
  }

  sanitize(url:string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  onConfirmTransfer() {
    this.confirm.emit({
      confirm: true,
      peer: this.client
    })
  }

  resetState() {
    this.ts.resetState(this.client)
  }

  onRejectTransfer() {
    this.confirm.emit({
      confirm: false,
      peer: this.client
    })
  }

  ngOnDestroy() {
    this.sub.unsubscribe()
  }
}
