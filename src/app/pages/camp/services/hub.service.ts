import { Injectable } from '@angular/core';
import { IPeer } from '../defs/peer'
import { Status } from '../../../defs/status.enum'

@Injectable({
  providedIn: 'root'
})
export class HubService {
  readonly clients: IPeer[] = [
    {
      name: 'Eric Cartman',
      status: Status.Online
    },
    {
      name: 'Kyle Braflowsky',
      status: Status.Online
    }
  ]
  constructor() {

  }
}
