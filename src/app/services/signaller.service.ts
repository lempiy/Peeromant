import { Injectable } from '@angular/core';
import {
  ID_LENGTH, 
  RUNES, 
  EVENT_NEW_HUB_CREATED, 
  EVENT_HUB_REMOVED,
  EVENT_GET_HUBS,
  EVENT_NEW_HUB_REQUEST
} from '../defs/constants';
import { WsState } from '../defs/wsstate.enum';
import { AuthService } from './auth.service';
import { 
  Observable,
  Subscription, 
  PartialObserver, 
  fromEvent, 
  race, 
  from, 
  of as obsOf, 
  throwError 
} from 'rxjs'
import { shareReplay, filter, switchMap } from 'rxjs/operators'
import { IEvent } from '../defs/event'
import { PayloadHubs, PayloadCreateHub } from '../defs/payloads'
import { ThreadSubject } from '../classes/thread-subject'

@Injectable({
  providedIn: 'root'
})
export class SignallerService {
  private socket: WebSocket
  private _gen: IterableIterator<string> = asciiYielder()
  private _repliesBuffer: {[key:string]:Function} = {}
  private _subject: ThreadSubject<IEvent<any>> = new ThreadSubject()
  private $onOpen: Observable<Event>
  private $onError: Observable<Event>

  constructor(private auth: AuthService) {}

  ensureConnected():Observable<boolean> {
    return this.getState().pipe(
      switchMap(state => {
        switch (state) {
          case WsState.Closed:
          case WsState.Closing:
          case WsState.NotCreated:
            this.socket = new WebSocket(`ws://localhost:4000/ws?name=${this.name}`);
            this.socket.onmessage = (e) => {
              const data = JSON.parse(e.data)
              this._onmessage(data)
            }
            console.log('connecting to signaller...')
            this.$onOpen = fromEvent(this.socket, 'open').pipe(
              shareReplay(1)
            )
            this.$onError = fromEvent(this.socket, 'error').pipe(
              filter(e => (<WebSocket>e.target).readyState === WebSocket.CLOSED),
              shareReplay(1)
            )
        }
        return race(this.$onOpen, this.$onError)
      }),
      switchMap((event:Event) => {
        if (event.type === 'error') return throwError('Error on connection to signaller')
        return obsOf(true)
      })
    )
  }

  getState():Observable<WsState> {
    if (!this.socket) return obsOf(WsState.NotCreated)
    return obsOf(this.socket.readyState)
  }

  get name ():string {
    return this.auth.name
  }

  set name (value: string) {
    this.auth.name = value
  }

  send(event: IEvent<any>) {
    this.socket.send(JSON.stringify(event))
  }

  sendWithReply(event: IEvent<any>):Promise<IEvent<any>> {
      return new Promise((resolve, reject) => {
          const id = this.generateID()
          event = Object.assign({}, event, {id})
          this._repliesBuffer[id] = resolve
          this.send(event)
      })
  }

  subscribe<T>(eventName: string, a?: PartialObserver<T> | Function, onError?: (exception: any) => void, onCompleted?: () => void):Subscription {
    return this
      ._subject
      .threadSubscribe(eventName, a as (value:T) => void, onError, onCompleted)
  }

  private _onmessage(event:IEvent<any>):void {
    console.log(event)
    if (this._repliesBuffer[event.id]) {
      return this._repliesBuffer[event.id](event)
    }
    if (event.payload.from) {
      console.log(`${event.action}|${event.payload.from}`)
      this._subject.emit(`${event.action}|${event.payload.from}`, event)
    }
    return this._subject.emit(event.action, event)
  }

  static getRandomInt(min, max):number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateID():string {
    let id = ""
    while (id.length != ID_LENGTH) {
        id += this._gen.next().value
    }
    return id
  }

  getAvailableHubs():Observable<IEvent<PayloadHubs>> {
    return from(this.sendWithReply({
      action: EVENT_GET_HUBS,
      id: this.generateID()
    }))
  }

  createHub(name: string):Observable<IEvent<PayloadCreateHub>> {
    return from(this.sendWithReply({
      action: EVENT_NEW_HUB_REQUEST,
      id: this.generateID(),
      payload: { name }
    }))
  }
}

function* asciiYielder():IterableIterator<string> {
  while (true) {
      const i = SignallerService.getRandomInt(0, RUNES.length - 1)
      yield RUNES[i]
  }
}
