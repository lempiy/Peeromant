import { Subject, PartialObserver, Subscription, } from 'rxjs'
import { refCount } from 'rxjs/operators'

export class ThreadSubject<T> extends Subject<T> {
    
    private _threads: {[key: string]: Subject<T>}
    private _refCounts: {[key: string]: number}
    constructor() {
        super()

    }

    emit () {

    }
    
    threadSubscribe(thread: string, a?: PartialObserver<T> | Function, onError?: (exception: any) => void, onCompleted?: () => void) {
        let t: Subject<T>|null = null
        let unsub: Subscription|null = null
        if (this._threads[thread]) {
            t = this._threads[thread]
        } else {
            t = new Subject()
            this._threads[thread] = t
            this._refCounts[thread] = 0
        }
        this._refCounts[thread]++
        if (a instanceof Function) {
            unsub = t.subscribe(a as (value:T) => void, onError, onCompleted)
        } else {
            unsub = t.subscribe(a)
        }
        return new Subscription(() => {
            this._refCounts[thread]--
            unsub.unsubscribe()
            if (!this._refCounts[thread]) {
                delete this._threads[thread]
                delete this._refCounts[thread]
            }
        })
    }

    subscribe(a?: PartialObserver<T> | Function, onError?: (exception: any) => void, onCompleted?: () => void) {
        const unsub = super.subscribe.apply(this, arguments)
        return new Subscription(() => {

            unsub()
        })
    }
}
