import { Status } from '../../../defs/status.enum'
import { Subject } from 'rxjs'

export interface IConfirmEvent {
    confirm: boolean
    peer: IPeer
}

export interface IPeer {
    name: string
    $status: Subject<Status>
    pendingRequest?: ITransferRequest
    transfering?: ITFile[]
}

interface ITransferRequest {
    files: ITFile[]
    id: string
}

interface ITFile {
    name: string,
    size: number,
    progress?: number
}