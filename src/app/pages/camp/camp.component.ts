import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FilesService } from './services/files.service';
import { HubService } from './services/hub.service';
import { ActivatedRoute } from '@angular/router';
import { zip, Subscription } from 'rxjs';
import { EVENT_CLIENT_REPLY_REQUEST } from '../../defs/constants';
import { TransferService } from './services/transfer.service'

import { switchMap } from 'rxjs/operators';
import { IPeer, IConfirmEvent, IProgress, IResult } from './defs/peer';
import { LinkState } from './defs/peer-state.enum';

@Component({
  selector: 'peer-camp',
  templateUrl: './camp.component.html',
  styleUrls: ['./camp.component.sass']
})
export class CampComponent implements OnInit, OnDestroy {
  private subs: Subscription[] = []
  constructor(
    public fs: FilesService,
    public hs: HubService,
    private ts: TransferService,
    private r: ActivatedRoute,
    private zone: NgZone) { }

  ngOnInit() {
    this.subs = []
    this.fs.setPeers(this.hs.clients.map(c => c.name))
    this.subs.push(
      zip(this.r.params, this.r.queryParams)
        .pipe(
          switchMap(([p, q]) => {
            return this.hs.connect(!!q.initial, p.id)
          })
        ).subscribe(e => console.log(e), e => console.log(e)),
      this.hs.subscribe(EVENT_CLIENT_REPLY_REQUEST, data => {
        const peer = this.hs.peers.find(peer => peer.name == data.payload.from)
        if (!peer) return
        peer.pendingRequest = {
          files: data.payload.files,
          id: data.id
        }
        peer.state = LinkState.Pending
      }),
      this.ts.watchForTransfers().subscribe(e => {
        if (e.value instanceof File) {
          const event = <IResult>e
          const peer = this.hs.peers.find(peer => peer.name == event.target)
          const p = peer.transferProgress.find(f => f.name === event.value.name)
          const url = URL.createObjectURL(event.value)
          this.zone.run(() => {
            p.value = event.value.size
            p.result = url
          })
        } else {
          const event = <IProgress>e
          const peer = this.hs.peers.find(peer => peer.name == event.target)
          const p = peer.transferProgress.find(f => f.name === event.name)
          this.zone.run(() => {
            p.value = event.value
          })
        }
        console.log("RECIEVE: ", e)
      }, e => console.log(e), () => console.log("RECIEVE COMPELETE!"))
    )
  }
  
  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe())
  }

  replyOnRequest(event: IConfirmEvent) {
    return (event.confirm ?
      this.ts.confirmTransferRequest(
        event.peer.name,
        event.peer.pendingRequest.id,
        event.peer.pendingRequest.files
      ) :
      this.ts.rejectTransferRequest(event.peer.name, event.peer.pendingRequest.id))
  }

  transferFiles() {
    const peer:IPeer = this.hs.peers.find(p => p.name === "Stepan")
    peer.transferProgress = this.fs.files.map(f => ({name: f.name, value: 0, max: f.size, target: 'Stepan'}))
    this.ts.transferFiles("Stepan", this.fs.files)
      .subscribe(e => {
        peer.transferProgress = e
      },
      err => {
      }, () => {
        console.log("COMPLETE!")
      })
    
  }
}
