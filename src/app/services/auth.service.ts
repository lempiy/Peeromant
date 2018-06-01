import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _name: string = localStorage.getItem('name') || ''
  constructor() {}

  get name ():string {
    return this._name
  }

  set name (value: string) {
    localStorage.setItem('name', value)
    this._name = value
  }
}
