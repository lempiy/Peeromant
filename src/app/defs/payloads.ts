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
