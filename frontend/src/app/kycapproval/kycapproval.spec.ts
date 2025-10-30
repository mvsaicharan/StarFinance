import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Kycapproval } from './kycapproval';

describe('Kycapproval', () => {
  let component: Kycapproval;
  let fixture: ComponentFixture<Kycapproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Kycapproval]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Kycapproval);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
