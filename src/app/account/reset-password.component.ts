import { Component, OnInit, ChangeDetectorRef, NgZone} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, NonNullableFormBuilder } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';
import { MustMatch } from '@app/_helpers';

enum TokenStatus {
  Validating,
  Valid,
  Invalid,
}

@Component({
  selector: 'app-reset-password',
  templateUrl: 'reset-password.component.html',
  standalone: false,
})
export class ResetPasswordComponent implements OnInit {
  TokenStatus = TokenStatus;
  tokenStatus = TokenStatus.Validating;
  token?: string;
  form!: FormGroup<{ password: any; confirmPassword: any }>;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: NonNullableFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private alertService: AlertService,
    private changeDetector: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
      },
      {
        validators: MustMatch('password', 'confirmPassword'),
      },
    );

    const token = this.route.snapshot.queryParams['token'];

    // remove token from url to prevent http referer leakage
    this.router.navigate([], { relativeTo: this.route, replaceUrl: true });

    if (!token) {
      this.tokenStatus = TokenStatus.Invalid;
      return;
    }

    this.accountService
      .validateResetToken(token)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.token = token;
          this.zone.run(() => {
            this.tokenStatus = TokenStatus.Valid;
            this.changeDetector.detectChanges();
          });
        },
        error: (error) => {
          this.zone.run(() => {
            this.tokenStatus = TokenStatus.Invalid;
            this.changeDetector.detectChanges();
          });
        },
      });
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.form.controls;
  }

  onSubmit() {
    this.submitted = true;

    // reset alerts on submit
    this.alertService.clear();

    // stop here if form is invalid
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.accountService
      .resetPassword(this.token!, this.f['password'].value, this.f['confirmPassword'].value)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Password reset successful, you can now login', {
            keepAfterRouteChange: true,
          });
          this.router.navigate(['../login'], { relativeTo: this.route });
        },
        error: (error) => {
          this.alertService.error(error);
          this.loading = false;
        },
      });
  }
}
