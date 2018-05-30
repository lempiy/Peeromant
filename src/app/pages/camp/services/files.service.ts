import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class FilesService {
  private _files: File[] = []
  selected: {[key: string]:File[]}
  constructor() {}
  get files():File[] {
    return this._files
  }

  set files(value) {
    throw Error('Cannot set files.')
  }

  addFile(file: File) {
    this._files.push(file)
  }

  removeFile(file: File) {
    const index = this._files.findIndex(f => f == file)
    if (index == -1) {
      throw Error(`File ${file.name} not found in storage`)
    }
    this._files.splice(index, 1)
  }

  setPeers(peers: string[]) {
    this.selected = {}
    peers.forEach(p => this.selected[p] = [])
  }
}
