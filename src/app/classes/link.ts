import {
    STUN_TURN,
    SEND_DATA_CHANNEL,
    EVENT_OFFER_CONNECTION,
    EVENT_CANDIDATE_CONNECTION,
    EVENT_ANSWER_CONNECTION
} from '../defs/constants';
import { PeerState } from '../defs/peer-state.enum';
import { ISignaller } from '../defs/signaller';
import { Subscription, Subject } from 'rxjs';
import { IEvent } from '../defs/event';
import { Channel } from './channel';

interface Marshaller {
    toJSON():string
}

export class Link {
    private initiator: string
    private responder: string
    private connection: RTCPeerConnection
    private sendChannel: RTCDataChannel
    private recieveChannel: RTCDataChannel
    private signaller: ISignaller<any>
    private initiatorCandidate: string
    private isInitiator: boolean
    private initiatorDesc: RTCSessionDescription
    private subs: Subscription[] = []
    public onChange: Subject<PeerState> = new Subject()
    public onMessage: Subject<any> = new Subject()
    public onNewChannel: Subject<Channel> = new Subject() 
    constructor(props) {
        this.initiator = props.initiator
        this.responder = props.responder
        this.signaller = props.signaller
        this.isInitiator = props.isInitiator
        this.initiatorDesc = props.initiatorDesc
        this.subscribe()
    }

    subscribe() {
        this.subs.push(
            this.signaller.subscribe(
                `${EVENT_ANSWER_CONNECTION}|${this.isInitiator ? this.responder : this.initiator}`, e => {
                this.connection.setRemoteDescription(e.payload.desc)
            }),
            this.signaller.subscribe(`${EVENT_CANDIDATE_CONNECTION}|${this.isInitiator ? this.responder : this.initiator}`, e => {
                let candidate = new RTCIceCandidate({
                    sdpMLineIndex: e.payload.label,
                    candidate: e.payload.candidate
                });
                this.connection.addIceCandidate(candidate);
            })
        )
    }

    getChannel(label: string):Channel {
        return new Channel(this.connection, label)
    }

    get online() {
        if (!this.connection) return false;
        switch (this.connection.iceConnectionState) {
            case PeerState.Connected:
            case PeerState.Completed:
                return true
            default:
                return false
        }
    }

    set online(value) {
        throw new Error('Should not set online state manually.')
    }

    get pending() {
        if (!this.connection) return true
        switch (this.connection.iceConnectionState) {
            case PeerState.Checking:
            case PeerState.New:
                return true
            default:
                return false
        }
    }

    get failed() {
        return this.connection && this.connection.iceConnectionState === "failed"
    }

    connect() {
        this.connection = new RTCPeerConnection(STUN_TURN)
        this.onChange.next((<PeerState>this.connection.iceConnectionState))      
        this.connection.onicecandidate = e => this.iceCallback(e);
        this.connection.ondatachannel = e => this.receiveChannelCallback(e);
        this.connection.oniceconnectionstatechange = () => {
            this.onChange.next((<PeerState>this.connection.iceConnectionState))
        }

        if (this.isInitiator) {
            this.sendChannel = this.connection.createDataChannel(SEND_DATA_CHANNEL, null)
            this.sendChannel.onopen = () => console.log(`Send Channel ${this.responder} Openned`)
            this.sendChannel.onclose = () => console.log(`Send Channel ${this.responder} Closed`)
            this.sendChannel.onmessage = (e) => this.onMessage.next(e.data)
            this.connection.createOffer().then(desc => {
                console.log("Create Connection Offer")
                this.connection.setLocalDescription(desc);
                this.signaller.send({
                    action: EVENT_OFFER_CONNECTION,
                    id: this.signaller.generateID(),
                    to: this.responder,
                    payload: {
                        from: this.initiator,
                        desc: (<Marshaller>desc).toJSON() // typings workaround
                    }
                })
            })
        } else {
            this.connection.setRemoteDescription(this.initiatorDesc)
            this.connection.createAnswer().then(desc => {
                console.log("Create Connection Answer")
                this.connection.setLocalDescription(desc)
                this.signaller.send({
                    action: EVENT_ANSWER_CONNECTION,
                    id: this.signaller.generateID(),
                    to: this.initiator,
                    payload: {
                        from: this.responder,
                        desc: (<Marshaller>desc).toJSON() // typings workaround
                    }
                })
            })
        }
    }

    destroy() {
        this.connection.close()
        this.subs.forEach(s => s.unsubscribe())
    }

    iceCallback(event) {
        if (!event.candidate) return
        if (!this.isInitiator) {
            console.log(`Reveal ${this.responder} responder candidate`)
            const initiator = this.initiatorCandidate
            this.signaller.send({
                action: EVENT_CANDIDATE_CONNECTION,
                id: this.signaller.generateID(),
                to: this.initiator,
                payload: {
                    from: this.responder,
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                }
            })
        } else {
            console.log(`Paste ${this.initiator} initiator candidate`)
            this.signaller.send({
                action: EVENT_CANDIDATE_CONNECTION,
                id: this.signaller.generateID(),
                to: this.responder,
                payload: {
                    from: this.initiator,
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                }
            })
        }
    }

    send(event) {
        if (this.isInitiator) {
            this.sendChannel.send(event)
        } else {
            this.recieveChannel.send(event)
        }
    }

    receiveChannelCallback(event) {
        if (event.channel.label != SEND_DATA_CHANNEL) {
            this.onNewChannel.next(
                new Channel(this.connection, event.channel.label, event.channel)
            )
        } else {
            this.recieveChannel = event.channel
            this.recieveChannel.onmessage = (event) => this.onMessage.next(event.data)
            this.recieveChannel.onclose = () => console.log("Receive Channel Closed")
            this.recieveChannel.onopen = () => console.log("Receive Channel Openned")
        }
    }
}
