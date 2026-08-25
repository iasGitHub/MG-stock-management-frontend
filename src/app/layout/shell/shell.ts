import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-shell',
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  readonly auth = inject(AuthService);
}
