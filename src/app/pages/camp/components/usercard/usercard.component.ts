import { Component, OnInit } from '@angular/core';
import { FilesService } from '../../services/files.service'
import { Input } from '@angular/core'
import { IPeer } from '../../defs/peer'

@Component({
  selector: 'peer-usercard',
  templateUrl: './usercard.component.html',
  styleUrls: ['./usercard.component.sass']
})
export class UsercardComponent implements OnInit {
  @Input()
  readonly client: IPeer

  selected:any[] = []
  constructor(public fs: FilesService) {}

  ngOnInit() {

  }

}
