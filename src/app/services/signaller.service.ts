import { Injectable } from '@angular/core';
import {
  ID_LENGTH, 
  RUNES, 
  EVENT_NEW_HUB_CREATED, 
  EVENT_HUB_REMOVED
} from '../defs/constants';
import { AuthService } from './auth.service';
import { Subject } from 'rxjs'
import { IEvent } from '../defs/event'
import { ThreadSubject } from '../classes/thread-subject'

@Injectable({
  providedIn: 'root'
})
export class SignallerService {
  private socket: WebSocket
  private _gen: IterableIterator<string> = asciiYielder()
  private _repliesBuffer: {[key:string]:Function} = {}
  private _subject: ThreadSubject<IEvent<any>> = new ThreadSubject()
  constructor(private auth: AuthService) {}

  get online() {
    return this.socket.OPEN
  }

  set online(value) {
    throw new Error('Should not set online state manually.')
  }

  get name ():string {
    return this.auth.name
  }

  set name (value: string) {
    this.auth.name = value
  }

  connect():Promise<Event> {
    this.socket = new WebSocket(`ws://localhost:4000/ws?name=${this.name}`);
    this.socket.onerror  = (e) => console.log(e)
    this.socket.onmessage = (e) => {
      const data = JSON.parse(e.data)
      this.onmessage(data)
    }
    return new Promise(resolve => {
      this.socket.onopen = resolve
    })
  }

  send(event: IEvent<any>) {
    this.socket.send(JSON.stringify(event))
  }

  sendWithReply(event):Promise<IEvent<any>> {
      return new Promise((resolve, reject) => {
          const id = this.generateID()
          event = Object.assign({}, event, {id})
          this._repliesBuffer[id] = resolve
          this.send(event)
      })
  }

  onmessage(event):void {
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
}

function* asciiYielder():IterableIterator<string> {
  while (true) {
      const i = SignallerService.getRandomInt(0, RUNES.length - 1)
      yield RUNES[i]
  }
}
