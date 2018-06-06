import { Status } from '../../../defs/status.enum'
import { Subject } from 'rxjs'

export interface IPeer {
    name: string
    $status: Subject<Status>
}
