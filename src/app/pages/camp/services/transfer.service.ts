import { Injectable } from '@angular/core';
import { HubService } from './hub.service';
import {
  EVENT_CLIENT_REPLY_REQUEST,
  EVENT_CLIENT_REPLY_RESPONSE,
  CHUNCK_SIZE
} from '../../../defs/constants';
import { IEvent } from '../../../defs/event';
import { PayloadConfirm } from '../../../defs/payloads';
import { Subscription, Observable, zip, of as obsOf, empty, from, merge, BehaviorSubject, throwError, combineLatest } from 'rxjs';
import { switchMap, finalize, flatMap, mergeScan, takeWhile, take } from 'rxjs/operators';
import { ITFile, IProgress } from '../defs/peer';
import { SignallerService } from '../../../services/signaller.service';
import { Channel } from '../../../classes/channel';
import { LinkState } from '../defs/peer-state.enum';
import { ClientChangeType } from '../defs/client-change.enum';

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private subs: Subscription[] = []
  private pendingTransfers: {[key:string]: ITFile} = {}
  private pendingAccepts: {[key:string]: ITFile} = {}
  constructor(private hs:HubService, private sgn:SignallerService) { }

  transferFiles(to: string, files: File[]):Observable<IProgress[]> {
    const peer = this.hs.peers.find(p => p.name === to)
    console.log("find" ,this.hs.peers, to, peer)
    return from(this.requestTransfer(to, files))
      .pipe(
        switchMap(reply => {
          if (reply.payload.success) {
            peer.$change.next({type: ClientChangeType.State, value: LinkState.Transfering})
            return this.stream(to, files)
          }
          return throwError(reply.payload.info)
        }),
        finalize(() => console.log("FINALIZZE!"))
      )
  }

  watchForTransfers():Observable<IProgress|File> {
    return this.hs.$channels.pipe(
      flatMap(ch => {
        const accept = this.pendingAccepts[ch.label]
        const peer = this.hs.peers.find(p => p.name === accept.from)
        peer.transferProgress = []
        peer.transferProgress.push({
          max: accept.size,
          name: accept.name,
          value: 0,
          target: peer.name
        })
        peer.$change.next({type: ClientChangeType.State, value: LinkState.Transfering})
        if (accept) {
          accept.buffer = []
          accept.progress = 0
          return ch.onMessage.pipe(
            switchMap(chunk => {
                accept.buffer.push(chunk)
                accept.progress += (<ArrayBuffer>chunk).byteLength
                if (accept.progress == accept.size) {
                  const file = new File(accept.buffer, accept.name)
                  accept.buffer = []
                  delete this.pendingAccepts[ch.label]
                  console.log(`Done ${accept.name}`, file)
                  return obsOf(file)
                }
                return obsOf({
                  max: accept.size,
                  name: accept.name,
                  value: accept.progress,
                  target: peer.name
                })
              }
            )
          )
        } else {
          ch.die()
          return empty()
        }
      })
    )
  }

  private stream(to:string, files: File[]):Observable<IProgress[]> {
    console.log('streaming ...')
    const channels = Object.entries(this.pendingTransfers).map(([key, value]) => {
      return this.hs.getChannel(to, key)
    })
    return this.launchChannels(channels)
      .pipe(
        switchMap(() => {
          console.log("channels", channels)
          return combineLatest(...channels.map(c => {
            const file = files.find(f => this.pendingTransfers[c.label].name == f.name)
            console.log(`stream file ${file.name}...`)
            return this.streamFile(c, file, to)
          }))
        }),
        takeWhile((pgs: IProgress[]) => !pgs.every(p => p.max === p.value)),
        finalize(() => {
          channels.forEach(c => c.die())
          this.pendingTransfers = {}
        })
      )
  }

  private streamFile(channel: Channel, file: File, to: string):Observable<IProgress> {
    const sendProgress = {
      max: file.size,
      value: 0,
      name: file.name,
      target: to
    }
    const progress = new BehaviorSubject(sendProgress);
    const sliceFile = offset => {
      const reader = new FileReader();
      const fn = (function(file: File) {
        return function(e) {
          channel.send(e.target.result);
          if (file.size > offset + e.target.result.byteLength) {
            setTimeout(sliceFile, 0, offset + CHUNCK_SIZE)
          }
          sendProgress.value = offset + e.target.result.byteLength;
          progress.next(sendProgress)
          if (file.size <= offset + e.target.result.byteLength) {
            progress.complete()
          }
        };
      })(file)
      reader.onload = fn;
      const slice = file.slice(offset, offset + CHUNCK_SIZE)
      reader.readAsArrayBuffer(slice)
    }
    sliceFile(0)
    return progress
  }

  private launchChannels(channels: Channel[]):Observable<Event[]> {
    return zip(...channels.map(c => c.launch()))
  }

  private requestTransfer(to:string, files: File[]):Promise<IEvent<PayloadConfirm>> {
    const fls: ITFile[] = files.map(f => 
      ({from: this.hs.clientName, name: f.name, size: f.size, channel: this.sgn.generateID()})
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
