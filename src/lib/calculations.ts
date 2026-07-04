export interface CalculationInput {
  generation: number
  exportKwh: number
  importKwh: number
  rate: number
  discountPercent: number
  fixedCharge: number
  securityDeposit?: number
  arrears?: number
}

export interface CalculationResult {
  consumption: number
  energyCharge: number
  discountAmount: number
  fixedCharge: number
  tenantTotal: number
  securityDeposit: number
  arrears: number
  rate: number
  discountPercent: number
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function roundEnergy(value: number): number {
  return Math.round(value * 1000) / 1000
}

/** Consumption = Generation − (Export − Import) */
export function calculateConsumption(
  generation: number,
  exportKwh: number,
  importKwh: number,
): number {
  return roundEnergy(generation - (exportKwh - importKwh))
}

/** Energy Charge = Consumption × Rate */
export function calculateEnergyCharge(
  consumption: number,
  rate: number,
): number {
  return roundMoney(consumption * rate)
}

/** Discount = Energy × Discount % */
export function calculateDiscountAmount(
  energyCharge: number,
  discountPercent: number,
): number {
  return roundMoney(energyCharge * (discountPercent / 100))
}

/**
 * Tenant Total = Energy − Discount + Fixed Charge
 * Security Deposit and Arrears are stored separately and never included.
 */
export function calculateTenantTotal(
  energyCharge: number,
  discountAmount: number,
  fixedCharge: number,
): number {
  return roundMoney(energyCharge - discountAmount + fixedCharge)
}

export function calculateBill(input: CalculationInput): CalculationResult {
  const consumption = calculateConsumption(
    input.generation,
    input.exportKwh,
    input.importKwh,
  )
  const energyCharge = calculateEnergyCharge(consumption, input.rate)
  const discountAmount = calculateDiscountAmount(
    energyCharge,
    input.discountPercent,
  )
  const fixedCharge = roundMoney(input.fixedCharge)
  const tenantTotal = calculateTenantTotal(
    energyCharge,
    discountAmount,
    fixedCharge,
  )

  return {
    consumption,
    energyCharge,
    discountAmount,
    fixedCharge,
    tenantTotal,
    securityDeposit: roundMoney(input.securityDeposit ?? 0),
    arrears: roundMoney(input.arrears ?? 0),
    rate: input.rate,
    discountPercent: input.discountPercent,
  }
}
