import { IEvent } from './event'
import { Subscription, PartialObserver } from 'rxjs'
export interface ISignaller<T> {
    send(event: IEvent<T>):void
    subscribe<T>(eventName: string, a?: PartialObserver<T> | Function, onError?: (exception: any) => void, onCompleted?: () => void):Subscription
    generateID():string
}
