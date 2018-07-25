import { Component, OnInit, OnDestroy, NgZone } from '@angular/core'
import { FilesService } from './services/files.service'
import { Router } from '@angular/router'
import { HubService } from './services/hub.service'
import { ActivatedRoute } from '@angular/router'
import { zip, Subscription, from } from 'rxjs'
import { EVENT_CLIENT_REPLY_REQUEST } from '../../defs/constants'
import { TransferService } from './services/transfer.service'

import { switchMap } from 'rxjs/operators'
import { IPeer, IConfirmEvent, IProgress, IResult, } from './defs/peer'
import { LinkState, ClientRoles } from './defs/peer-state.enum'
import { ClientChangeType } from './defs/client-change.enum'
import { AuthService } from '../../services/auth.service';

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
    private auth: AuthService,
    private router: Router,
    private zone: NgZone) { }

  ngOnInit() {
    this.subs = []
    this.fs.setPeers(this.hs.clients.map(c => c.name))
    this.subs.push(
      // Connect to Signaller and create links between peers
      zip(this.r.params, this.r.queryParams)
        .pipe(
          switchMap(([p, q]) => {
            console.log('!this.auth.name', this.auth.name)
            if (!this.auth.name) return from(this.navigateToAuth(!!q.initial, p.id))
            return this.hs.connect(!!q.initial, p.id)
          }),
        ).subscribe(ok => {
          console.log('init is ok', ok)
          if (!ok) {
            this.navigateToAuth(this.hs.initial, this.hs.name)
          }
        }, e => console.log(e)),
      // Subscribe to file transfer confirm/reject events
      this.hs.subscribe(EVENT_CLIENT_REPLY_REQUEST, data => {
        const peer = this.hs.peers.find(peer => peer.name == data.payload.from)
        if (!peer) return
        peer.pendingRequest = {
          files: data.payload.files,
          id: data.id
        }
        peer.$change.next({type: ClientChangeType.State, value: LinkState.Pending, role: ClientRoles.Initiator})
      }),
      // Subscribe to file transfers
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

  navigateToAuth(initial: boolean, hub: string):Promise<boolean> {
    const route = `/camp/${hub}` 
    return this.router.navigate(['/auth'], {
      queryParams: {
        next: route,
        initial: !!initial
      },
    })
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

  transferFiles(peer: IPeer) {
    peer.transferProgress = this.fs.files.map(f => ({name: f.name, value: 0, max: f.size, target: 'Stepan'}))
    this.ts.transferFiles(peer.name, this.fs.files)
      .subscribe(e => {
        peer.transferProgress = e
      },
      err => {
      }, () => {
        console.log("COMPLETE!")
      })
  }

  transferAllFiles() {
    this.hs.peers.forEach(peer => {
      peer.transferProgress = this.fs.files.map(f => ({name: f.name, value: 0, max: f.size, target: 'Stepan'}))
      this.ts.transferFiles(peer.name, this.fs.files)
        .subscribe(e => {
          console.log('transferAllFiles.subsribed', peer.name)
          peer.transferProgress = e
        },
        err => {
        }, () => {
          console.log("COMPLETE!")
        })
    })
  }
}
