import { Injectable } from '@angular/core';
import { HubService } from './hub.service';
import {
  EVENT_CLIENT_REPLY_REQUEST,
  EVENT_CLIENT_REPLY_RESPONSE
} from '../../../defs/constants';
import { IEvent } from '../../../defs/event';
import { PayloadConfirm } from '../../../defs/payloads';
import { Subscription } from 'rxjs';
import { ITFile } from '../defs/peer';
import { SignallerService } from '../../../services/signaller.service';

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private subs: Subscription[] = []
  private pendingTransfers: {[key:string]: ITFile} = {}
  private pendingAccepts: {[key:string]: ITFile} = {}
  constructor(private hs:HubService, private sgn:SignallerService) { }

  transferFiles(to: string, files: File[]) {
    this.requestTransfer(to, files)
      .then(reply => {
        if (reply.payload.success) {
          return this.startStream(to, files)
        }
        // else handle reject
      })
  }

  private startStream(to:string, files: File[]) {
    console.log(this.pendingTransfers)
    console.log('streaming ...')
  }

  private requestTransfer(to:string, files: File[]):Promise<IEvent<PayloadConfirm>> {
    const fls: ITFile[] = files.map(f => 
      ({name: f.name, size: f.size, channel: this.sgn.generateID()})
    )
    fls.forEach(f => this.pendingTransfers[f.channel] = f)
    return this.hs.signalWithReplyTo(EVENT_CLIENT_REPLY_REQUEST,
      to,
      {
        from: this.hs.clientName,
        files: fls
      }
    )
  }

  confirmTransferRequest(to: string, id: string, files: ITFile[]):Promise<IEvent<any>> {
    files.forEach(f => this.pendingAccepts[f.channel] = f)
    console.log(this.pendingAccepts)
    return this.hs.signalWithReplyTo(EVENT_CLIENT_REPLY_RESPONSE, to, {
      success: true
    }, id)
  }

  rejectTransferRequest(to: string, id: string):Promise<IEvent<any>> {
    return this.hs.signalWithReplyTo(EVENT_CLIENT_REPLY_RESPONSE, to, {
      success: false,
      info: 'User rejected file transfer request'
    }, id)
  }
}
