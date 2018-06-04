export enum WsState {
    NotCreated = -1,
    Connecting = WebSocket.CONNECTING,
    Open = WebSocket.OPEN,
    Closed = WebSocket.CLOSED,
    Closing = WebSocket.CLOSING
}
