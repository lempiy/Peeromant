import { Component, OnInit } from '@angular/core';
import { FilesService } from './services/files.service';
import { HubService } from './services/hub.service';
import { ActivatedRoute } from '@angular/router';
import { zip, of as obsOf } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'peer-camp',
  templateUrl: './camp.component.html',
  styleUrls: ['./camp.component.sass']
})
export class CampComponent implements OnInit {

  constructor(
    public fs: FilesService,
    public hs: HubService,
    private r: ActivatedRoute) { }

  ngOnInit() {
    this.fs.setPeers(this.hs.clients.map(c => c.name))
    zip(this.r.params, this.r.queryParams)
      .pipe(
        switchMap(([p, q]) => {
          return this.hs.connect(!!q.initial, p.id)
        })
      ).subscribe(e => console.log(e), e => console.log(e))
  }

}
