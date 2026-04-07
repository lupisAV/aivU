import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseRecommendationComponent } from './exercise-recommendation.component';

describe('ExerciseRecommendationComponent', () => {
  let component: ExerciseRecommendationComponent;
  let fixture: ComponentFixture<ExerciseRecommendationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseRecommendationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExerciseRecommendationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate BMI correctly', () => {
    component.userProfile.weight = 70;
    component.userProfile.height = 170;
    component.calculateBMI();
    expect(component.bmi).toBeCloseTo(24.22, 1);
  });

  it('should validate form correctly', () => {
    expect(component.validateForm()).toBeFalse();
    component.userProfile.weight = 70;
    component.userProfile.height = 170;
    component.userProfile.age = 30;
    expect(component.validateForm()).toBeTrue();
  });

  it('should toggle limitations', () => {
    const limitation = 'Dolor de rodilla';
    expect(component.isLimitationSelected(limitation)).toBeFalse();
    component.toggleLimitation(limitation);
    expect(component.isLimitationSelected(limitation)).toBeTrue();
    component.toggleLimitation(limitation);
    expect(component.isLimitationSelected(limitation)).toBeFalse();
  });
});
