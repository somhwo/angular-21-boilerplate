import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';

import { AccountService } from '@app/_services';
import { Account } from '@app/_models';

@Component({ selector: 'app-account-list', templateUrl: 'list.component.html', standalone: false })
export class ListComponent implements OnInit {
  accounts: Account[] = [];
  loading = false;

  constructor(private accountService: AccountService) {}

  ngOnInit() {
    this.loadAllAccounts();
  }

  private loadAllAccounts() {
    this.loading = true;
    this.accountService
      .getAll()
      .pipe(first())
      .subscribe((accounts) => {
        this.accounts = accounts;
        this.loading = false;
      });
  }

  deleteAccount(id: string) {
    const account = this.accounts.find((x) => x.id === id);
    if (!account) return;
    account.isDeleting = true;
    this.accountService
      .delete(id)
      .pipe(first())
      .subscribe(() => {
        this.accounts = this.accounts.filter((x) => x.id !== id);
      });
  }
}
