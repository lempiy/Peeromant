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
import {Link} from '../../../classes/link'
import {SignallerService} from '../../../services/signaller.service'
import {AuthService} from '../../../services/auth.service'
import { IEvent } from '../../../defs/event';
import { Subscription, Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class HubService {
  clients: IPeer[] = []
  name: string
  initial: boolean
  links: {[key:string]:Link}
  subs: Subscription[]
  peers: IPeer[] = []

  constructor(
    private signaller: SignallerService,
    private auth: AuthService) {

  }

  connect(initial:boolean, name:string):Observable<true|void> {
    this.initial = initial
    this.name = name
    return this.signaller
      .ensureConnected()//
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

  subscribeToEvents() {
    this.subs = []
    this.links = {}
    this.subs.push(
      this.signaller.subscribe(EVENT_CLIENT_CONNECTED, e => this.onClientConnected(e)),
      this.signaller.subscribe(EVENT_CLIENT_REMOVED, e => this.onClientRemoved(e)),
      this.signaller.subscribe(EVENT_OFFER_CONNECTION, e => this.onLinkOffer(e)),
    )
  }

  destroy() {
    this.subs.forEach(s => s.unsubscribe())
    Object.entries(this.links).forEach(([_, link]) => {
      link.destroy()
    })
    this.links = {}
    this.clients = []
  }

  createLinks() {
    this.clients.forEach(client => {
      console.log('Begin create link '+client.name)
      if (client.name === this.clientName) return
      const link = new Link({
        initiator: this.clientName,
        responder: client.name,
        signaller: this.signaller,
        isInitiator: true,
      })
      this.links[client.name] = link
      link.connect()
    })
  }

  onLinkOffer(e) {
    console.log('onlinkoffer', e)
    const link = new Link({
        initiator: e.payload.from,
        responder: this.clientName,
        signaller: this.signaller,
        isInitiator: false,
        initiatorDesc: e.payload.desc
    })
    this.links[e.payload.from] = link
    link.connect()
  }

  refreshClientsList() {
    return this.signalWithReply(EVENT_GET_CLIENTS, null)
      .then(
          reply => {
            this.clients = reply.payload.clients
            .map(c => ({
              name: c,
              status: Status.Online
            }));
            this.peers = this.clients.filter(c => c.name !== this.auth.name)
            return Promise.resolve(this.clients)
          },
          info => {throw new Error(info)}
      )
  }

  onClientConnected(e) {
    this.clients.push({
      name: e.payload.name,
      status: Status.Pending
    })
    this.peers = [{
      name: e.payload.name,
      status: Status.Pending
    }].concat(this.peers)
  }

  onClientRemoved(e) {
      const i = this.clients.findIndex(c => c.name == e.payload.name)
      if (i == -1) return
      this.clients.splice(i, 1)
      this.peers = this.clients.filter(c => c.name != this.auth.name)
      console.log(EVENT_CLIENT_REMOVED, this.clients)
  }

  _initialConnect():Promise<IEvent<any>> {
    return this.signalWithReply(
        this.initial ? EVENT_NEW_HUB_REQUEST : EVENT_HUB_CONNECT,
        {name: this.name}
    )
  }

  signalWithReply(action: string, payload:any):Promise<IEvent<any>> {
    return this.signaller.sendWithReply({
        action,
        id: this.signaller.generateID(),
        payload,
    })
    .then(reply => {
        console.log(reply)
        if (reply.action == EVENT_ERROR) return Promise.reject(reply.payload.info)
        else if (reply.action) return Promise.resolve(reply)
        else throw new Error('Unexpected reply')
    })
  }
}
