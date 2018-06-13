import { Injectable } from '@angular/core';
import { IPeer } from '../defs/peer'
import { Status } from '../../../defs/status.enum'
import {
  EVENT_NEW_HUB_REQUEST, 
  EVENT_ERROR, 
  EVENT_CONFIRM,
  EVENT_HUB_CONNECT,
  EVENT_CLIENT_CONNECTED,
  EVENT_GET_CLIENTS,
  EVENT_CLIENT_REMOVED,
  EVENT_OFFER_CONNECTION
} from '../../../defs/constants'
import { Link } from '../../../classes/link'
import { SignallerService } from '../../../services/signaller.service'
import { AuthService } from '../../../services/auth.service'
import { IEvent } from '../../../defs/event';
import { Subscription, Observable, from, Subject, PartialObserver } from 'rxjs';
import { switchMap } from 'rxjs/operators'
import { PeerState } from '../../../defs/peer-state.enum';
import { ThreadSubject } from '../../../classes/thread-subject';
import { FilesService } from './files.service';

@Injectable({
  providedIn: 'root'
})
export class HubService {
  clients: IPeer[] = []
  name: string
  initial: boolean
  links: {[key:string]:Link}
  private linkSubs: {[key:string]:Subscription[]}
  subs: Subscription[]
  peers: IPeer[] = []
  $threads: ThreadSubject<any> = new ThreadSubject()

  constructor(
    private signaller: SignallerService,
    private auth: AuthService,
    private fs: FilesService) {

  }

  connect(initial:boolean, name:string):Observable<true|void> {
    this.initial = initial
    this.name = name
    return this.signaller
      .ensureConnected()
      .pipe(
        switchMap(() => {
          return from(
            this._initialConnect()
              .then(() => {
                this.subscribeToEvents()
                return this.refreshClientsList()
              })
              .then(() => this.initial || this.createLinks())
            )
        })
      )
  }

  get clientName() {
    return this.auth.name
  }

  subscribe<T>(eventName: string, a?: PartialObserver<T> | Function, onError?: (exception: any) => void, onCompleted?: () => void):Subscription {
    console.log("SUBS HS ", eventName)
    return this.signaller.subscribe(eventName, a, onError)
  }

  private subscribeToEvents() {
    this.subs = []
    this.links = {}
    this.linkSubs = {}
    this.subs.push(
      this.signaller.subscribe(EVENT_CLIENT_CONNECTED, e => this.onClientConnected(e)),
      this.signaller.subscribe(EVENT_CLIENT_REMOVED, e => this.onClientRemoved(e)),
      this.signaller.subscribe(EVENT_OFFER_CONNECTION, e => this.onLinkOffer(e)),
    )
  }

  private destroy() {
    this.subs.forEach(s => s.unsubscribe())
    Object.entries(this.links).forEach(([_, link]) => {
      link.destroy()
    })
    Object.entries(this.linkSubs).forEach(([_, subs]) => {
      subs.forEach(s => s.unsubscribe())
    })
    this.links = {}
    this.clients = []
  }

  private createLinks() {
    this.clients.forEach(client => {
      console.log('Start creating link '+client.name)
      if (client.name === this.clientName) return
      const link = new Link({
        initiator: this.clientName,
        responder: client.name,
        signaller: this.signaller,
        isInitiator: true,
      })
      this.links[client.name] = link
      this.linkSubs[client.name] = [
        link.onChange.subscribe(data => {
          this.onChangeLinkState(client.name, link, data)
        }),
        link.onMessage.subscribe(msg => {
          this.onMessage(client.name, msg)
        })
      ]
      link.connect()
      this.fs.selected[client.name] = []
    })
  }

  private onLinkOffer(e) {
    const link = new Link({
        initiator: e.payload.from,
        responder: this.clientName,
        signaller: this.signaller,
        isInitiator: false,
        initiatorDesc: e.payload.desc
    })
    this.links[e.payload.from] = link
    this.linkSubs[e.payload.from] = [
      link.onChange.subscribe(data => {
        this.onChangeLinkState(e.payload.from, link, data)
      }),
      link.onMessage.subscribe(msg => {
        this.onMessage(e.payload.from, msg)
      })
    ]
    link.connect()
  }

  onMessage(from: string, msg: any) {
    this.$threads.emit(from, msg)
  }

  private onChangeLinkState(name: string, link: Link, state: PeerState) {
    this.peers.forEach(p => {
      if (p.name === name) p.$status.next(this.computeStatus(name))
    })
  }

  private refreshClientsList() {
    return this.signalWithReply(EVENT_GET_CLIENTS, null)
      .then(
          reply => {
            this.clients = reply.payload.clients
            .map(c => ({
              name: c,
              $status: new Subject<Status>()
            }));
            this.peers = this.clients.filter(c => c.name !== this.auth.name)
            return Promise.resolve(this.clients)
          },
          info => {throw new Error(info)}
      )
  }

  private computeStatus(linkName: string):Status {
    const link = this.links[linkName]
    if (!link) return Status.Pending
    if (link.online) return Status.Online
    if (link.pending) return Status.Pending
    if (link.failed) return Status.Offline
    return Status.Offline
  }

  private onClientConnected(e) {
    this.clients.push({
      name: e.payload.name,
      $status: new Subject<Status>()
    })
    this.peers = [{
      name: e.payload.name,
      $status: new Subject<Status>()
    }].concat(this.peers)
    this.fs.selected[e.payload.name] = []
  }

  private onClientRemoved(e) {
      const i = this.clients.findIndex(c => c.name == e.payload.name)
      if (i == -1) return
      this.clients.splice(i, 1)
      this.links[e.payload.name].destroy()
      delete this.links[e.payload.name]
      if (this.linkSubs[e.payload.name]) {
        const subs = this.linkSubs[e.payload.name]
        subs.forEach(s => {
          s.unsubscribe()
        });
      }
      this.peers = this.clients.filter(c => c.name != this.auth.name)
      delete this.fs.selected[e.payload.name]
  }

  private _initialConnect():Promise<IEvent<any>> {
    return this.signalWithReply(
        this.initial ? EVENT_NEW_HUB_REQUEST : EVENT_HUB_CONNECT,
        {name: this.name}
    )
  }

  send(whom: string, data: any) {
    this.links[whom].send(data)
  }

  signalWithReply(action: string, payload:any, id?:string):Promise<IEvent<any>> {
    return this.signaller.sendWithReply({
        action,
        id: id || this.signaller.generateID(),
        payload,
    })
    .then(reply => {
        if (reply.action == EVENT_ERROR) return Promise.reject(reply.payload.info)
        else if (reply.action) return Promise.resolve(reply)
        else throw new Error('Unexpected reply')
    })
  }

  signalWithReplyTo(action: string, to:string, payload:any, id?:string):Promise<IEvent<any>> {
    return this.signaller.sendWithReply({
        action,
        id: id || this.signaller.generateID(),
        payload,
        to,
    })
    .then(reply => {
        if (reply.action == EVENT_ERROR) return Promise.reject(reply.payload.info)
        else if (reply.action) return Promise.resolve(reply)
        else throw new Error('Unexpected reply')
    })
  }
}
