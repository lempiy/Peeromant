export interface IEvent<T> {
    id: string
    action: string
    to?:string
    payload?:T
}
