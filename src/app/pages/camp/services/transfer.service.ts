import { Injectable } from '@angular/core';
import { HubService } from './hub.service';
import {
  EVENT_CLIENT_REPLY_REQUEST,
  EVENT_CLIENT_REPLY_RESPONSE
} from '../../../defs/constants';
import { IEvent } from '../../../defs/event';
import { PayloadConfirm } from '../../../defs/payloads';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private subs: Subscription[] = []
  constructor(private hs:HubService) { }

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
    console.log('streaming ...')
  }

  private requestTransfer(to:string, files: File[]):Promise<IEvent<PayloadConfirm>> {
    return this.hs.signalWithReplyTo(EVENT_CLIENT_REPLY_REQUEST,
      to, 
      {
        files: files.map(f => ({name: f.name, size: f.size, type: f.type}))
      }
    )
  }

  confirmTransferRequest(to: string):Promise<IEvent<any>> {
    return this.hs.signalWithReply(EVENT_CLIENT_REPLY_RESPONSE, {
      success: true
    })
  }

  rejectTransferRequest(to: string):Promise<IEvent<any>> {
    return this.hs.signalWithReply(EVENT_CLIENT_REPLY_RESPONSE, {
      success: false,
      info: 'User rejected file transfer request'
    })
  }
}
