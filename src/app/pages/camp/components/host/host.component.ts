import { Component, OnInit } from '@angular/core';
import { FilesService } from '../../services/files.service';
import { HubService } from '../../services/hub.service';
import { Input } from '@angular/compiler/src/core';
import { AuthService } from '../../../../services/auth.service'

@Component({
  selector: 'peer-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.sass']
})
export class HostComponent implements OnInit {
  constructor(public fs: FilesService, public auth: AuthService, public hs: HubService) { }

  ngOnInit() {}

  onNewFile($event: Event) {
    const target = $event.target as HTMLInputElement
    const files = Array.from(target.files || [])
    files.forEach(f => {
      this.fs.addFile(f)
    })
  }

  onRemoveFile(f: File) {
    this.fs.removeFile(f)
  }
}
