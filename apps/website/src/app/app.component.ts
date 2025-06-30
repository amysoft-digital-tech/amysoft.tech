import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageLayoutComponent } from '@amysoft/shared-ui-components';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PageLayoutComponent],
  template: `
    <amysoft-page-layout>
      <router-outlet></router-outlet>
    </amysoft-page-layout>
  `
})
export class AppComponent {
  title = 'Beyond the AI Plateau';
}