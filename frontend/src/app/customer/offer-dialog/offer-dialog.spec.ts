import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfferDialog } from './offer-dialog';

describe('OfferDialog', () => {
  let component: OfferDialog;
  let fixture: ComponentFixture<OfferDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfferDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfferDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
