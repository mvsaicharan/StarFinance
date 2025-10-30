import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KycForm } from './kyc-form';

describe('KycForm', () => {
  let component: KycForm;
  let fixture: ComponentFixture<KycForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KycForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KycForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
