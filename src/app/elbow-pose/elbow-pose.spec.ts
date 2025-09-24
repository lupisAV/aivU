import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ElbowPose } from './elbow-pose';

describe('ElbowPose', () => {
  let component: ElbowPose;
  let fixture: ComponentFixture<ElbowPose>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ElbowPose]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ElbowPose);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
