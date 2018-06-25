import { Status } from '../../../defs/status.enum'
import { Subject } from 'rxjs'
import { LinkState } from './peer-state.enum';
import { ClientChangeType } from './client-change.enum';

export interface IConfirmEvent {
    confirm: boolean
    peer: IPeer
}

export interface IPeer {
    name: string
    $change: Subject<IClientChange>
    state: LinkState
    pendingRequest?: ITransferRequest
    transferProgress?: IProgress[]
}

export interface IClientChange {
    type: ClientChangeType,
    value: Status|LinkState
}

export interface IProgress {
    max: number
    value: number
    name: string
    target: string
    result?: string
} 

export interface IResult {
    value: File
    target: string
}

interface ITransferRequest {
    files: ITFile[]
    id: string
}

export interface ITFile {
    from: string,
    name: string,
    size: number,
    channel: string,
    progress?: number,
    buffer?: ArrayBuffer[]
}
