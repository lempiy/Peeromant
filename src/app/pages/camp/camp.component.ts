import { Component, OnInit } from '@angular/core';
import { FilesService } from './services/files.service'
import { HubService } from './services/hub.service'

@Component({
  selector: 'peer-camp',
  templateUrl: './camp.component.html',
  styleUrls: ['./camp.component.sass']
})
export class CampComponent implements OnInit {

  constructor(public fs: FilesService, public hs: HubService) { }

  ngOnInit() {
    this.fs.setPeers(this.hs.clients.map(c => c.name))
  }

}
