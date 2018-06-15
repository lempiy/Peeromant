import { Subject, fromEvent, Observable, race, throwError, of as obsOf } from 'rxjs'
import { switchMap, map } from 'rxjs/operators'

export class Channel {
    public onMessage: Subject<any> = new Subject()
    private channel: RTCDataChannel
    constructor(
        private conn: RTCPeerConnection,
        public label: string,
        channel?:RTCDataChannel) {
        if (channel) {
            this.channel = channel
            this.channel.onmessage = (e) => this.onMessage.next(e.data)
            this.channel.onclose = () => console.log(`Send Channel ${this.label} Closed`)
        }
    }

    launch():Observable<Event> {
        this.channel = this.conn.createDataChannel(this.label, null)
        this.channel.onclose = () => console.log(`Send Channel ${this.label} Closed`)
        this.channel.onmessage = (e) => this.onMessage.next(e.data)
        return race(
            fromEvent(this.channel, 'open').pipe(map(v => {
                console.log('OPEned', this.label)
                return v
            })), 
            fromEvent(this.channel, "error")).pipe(
                switchMap(e => e.type == 'error' ?
                    throwError(`Error upon creating data channel ${this.label}`) :
                    obsOf(e)
                )
            )
    }

    send(data: string | Blob | ArrayBuffer | ArrayBufferView) {
        this.channel.send(data)
    }

    die() {
        this.onMessage.unsubscribe()
        this.channel.close()
    }
}
