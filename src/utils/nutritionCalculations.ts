
export interface TMBParameters {
    weight: number;
    height: number;
    age: number;
    sex: 'male' | 'female';
    bodyFat?: number;
    activityLevel: number;
}

export interface TMBResults {
    mifflin: number;
    tinsleyTotal: number;
    tinsleyLBM: number;
    get: number;
}

/**
 * Mifflin-St Jeor Equation
 * Men: (9.99 * weight) + (6.25 * height) - (4.92 * age) + 5
 * Women: (9.99 * weight) + (6.25 * height) - (4.92 * age) - 161
 */
export const calculateMifflin = (p: TMBParameters): number => {
    const { weight, height, age, sex } = p;
    const base = (9.99 * weight) + (6.25 * height) - (4.92 * age);
    return sex === 'male' ? base + 5 : base - 161;
};

/**
 * Tinsley Equation (Total Weight)
 * GET = (24.8 * weight) + 10
 */
export const calculateTinsleyTotal = (weight: number): number => {
    return (24.8 * weight) + 10;
};

/**
 * Tinsley Equation (LBM)
 * GET = (25.3 * LBM) + 284
 */
export const calculateTinsleyLBM = (weight: number, bodyFat: number): number => {
    const lbm = weight * (1 - bodyFat / 100);
    return (25.3 * lbm) + 284;
};

export const calculateMacros = (calories: number, weight: number, goal: string) => {
    // Default splits based on objective
    let pRatio = 2.0; // g/kg
    let fRatio = 0.8; // g/kg
    
    if (goal === 'emagrecimento') {
        pRatio = 2.2;
        fRatio = 0.7;
    } else if (goal === 'hipertrofia') {
        pRatio = 2.0;
        fRatio = 1.0;
    }

    const pCal = weight * pRatio * 4;
    const fCal = weight * fRatio * 9;
    const cCal = calories - (pCal + fCal);
    const cGrams = cCal / 4;

    return {
        protein: { grams: weight * pRatio, calories: pCal, percentage: (pCal / calories) * 100 },
        fats: { grams: weight * fRatio, calories: fCal, percentage: (fCal / calories) * 100 },
        carbs: { grams: cGrams, calories: cCal, percentage: (cCal / calories) * 100 },
        totalCalories: calories
    };
};
