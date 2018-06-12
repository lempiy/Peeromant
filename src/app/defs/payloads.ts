export interface PayloadHubs {
    hubs: string[]|null
}

export interface PayloadCreateHub {
    name: string
}

export interface PayloadConfirm {
    success: boolean
    info?: string
}

export interface PayloadHubCreated {
    name: string
}

export interface PayloadHubRemoved {
    name: string
}

export interface PayloadTransferFileRequest {
    files: IFileTransfer[]
}

export interface IFileTransfer {
    name: string
    size: number
    type: string
}
