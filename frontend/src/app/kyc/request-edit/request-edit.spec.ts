import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestEdit } from './request-edit';

describe('RequestEdit', () => {
  let component: RequestEdit;
  let fixture: ComponentFixture<RequestEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
