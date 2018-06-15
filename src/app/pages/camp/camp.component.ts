import { Component, OnInit, OnDestroy } from '@angular/core';
import { FilesService } from './services/files.service';
import { HubService } from './services/hub.service';
import { ActivatedRoute } from '@angular/router';
import { zip, Subscription } from 'rxjs';
import { EVENT_CLIENT_REPLY_REQUEST } from '../../defs/constants';
import { TransferService } from './services/transfer.service'

import { switchMap } from 'rxjs/operators';
import { IPeer, IConfirmEvent } from './defs/peer';
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
    private r: ActivatedRoute) { }

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
      this.ts.watchForTransfers()
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
    this.ts.transferFiles("Stepan", this.fs.files)
      .subscribe(e => {
        console.log("PROGRESS:", e)
      },
      err => console.log("ERROR:", err), () => console.log("COMPLETE!"))
    
  }
}
