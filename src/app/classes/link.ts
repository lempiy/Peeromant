import {
    STUN_TURN,
    SEND_DATA_CHANNEL,
    EVENT_OFFER_CONNECTION,
    EVENT_CANDIDATE_CONNECTION,
    EVENT_ANSWER_CONNECTION
} from '../defs/constants';
import { ISignaller } from '../defs/signaller';
import { Subscription } from 'rxjs';

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
    private responderCandidate: string
    private isInitiator: boolean
    private initiatorDesc: RTCSessionDescription
    private subs: Subscription[] = []
    constructor(props) {
        this.initiator = props.initiator
        this.responder = props.responder
        this.connection = null
        this.sendChannel = null
        this.recieveChannel = null
        this.signaller = props.signaller
        this.initiatorCandidate = null
        this.responderCandidate = null
        this.isInitiator = props.isInitiator
        this.initiatorDesc = props.initiatorDesc || null
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

    get online() {
        return this.connection && this.connection.iceConnectionState === "connected"
    }

    set online(value) {
        throw new Error('Should not set online state manually.')
    }

    connect() {
        this.connection = new RTCPeerConnection(STUN_TURN)        
        this.connection.onicecandidate = e => this.iceCallback(e);
        this.connection.ondatachannel = e => this.receiveChannelCallback(e);

        if (this.isInitiator) {
            this.sendChannel = this.connection.createDataChannel(SEND_DATA_CHANNEL, null)
            this.sendChannel.onopen = () => {
                console.log(`Send Channel ${this.responder} Openned`)
                setInterval(() => {
                    console.log("SEND DATA")
                    this.sendChannel.send("TIME: " + Date.now())
                }, 1000)
            }
            this.sendChannel.onclose = () => console.log(`Send Channel ${this.responder} Closed`)
            this.sendChannel.onmessage = (e) => console.log(`Received message from ${this.responder}: `, e.data)
            this.connection.createOffer().then(desc => {
                console.log("createOffer")
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
                console.log("createAnswer")
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

    receiveChannelCallback(event) {
        if (this.isInitiator) return
        console.log('receiveChannelCallback', event)
        this.recieveChannel = event.channel
        this.recieveChannel.onmessage = (event) => console.log(`Received message from ${this.initiator}: `, event.data)
        this.recieveChannel.onclose = () => console.log("Receive Channel Closed")
        this.recieveChannel.onopen = () => {
            console.log("Receive Channel Openned")
            setInterval(() => {
                console.log("REPLY DATA")
                this.recieveChannel.send("RANDOM: " + Math.round(Math.random()*100))
            }, 1000)
        }
    }
}
