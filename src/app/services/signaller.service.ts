import { Injectable } from '@angular/core';
import {
  ID_LENGTH, 
  RUNES, 
  EVENT_NEW_HUB_CREATED, 
  EVENT_HUB_REMOVED
} from '../defs/constants';
import { AuthService } from './auth.service';
import { Subject } from 'rxjs'
import { EventEmitter } from '@angular/core'
import { IEvent } from '../defs/event'

@Injectable({
  providedIn: 'root'
})
export class SignallerService {
  private socket: WebSocket
  private _gen: IterableIterator<string> = asciiYielder()
  private _repliesBuffer: {[key:string]:Function} = {}
  private _subject: EventEmitter<IEvent<any>> = new EventEmitter()
  constructor(private auth: AuthService) { }

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

  connect() {
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

  onmessage(event) {
    if (this._repliesBuffer[event.id]) {
      return this._repliesBuffer[event.id](event)
    }
    if (event.payload.from) {
      console.log(`${event.action}|${event.payload.from}`)
      this._subject.emit(`${event.action}|${event.payload.from}`, event)
    }
    return this._subject.emit(event.action, event)
  }

  static getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

function* asciiYielder() {
  while (true) {
      const i = SignallerService.getRandomInt(0, RUNES.length - 1)
      yield RUNES[i]
  }
}