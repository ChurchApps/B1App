// Church currency for the giving screens: first gateway's currency, else the public "currency" setting, else usd
// (same order as CurrencyHelper.loadCurrency and the Api's loadChurchRates).
export function churchCurrency(gateways?: { currency?: string }[] | null, settings?: Record<string, string> | null): string {
  return (gateways?.[0]?.currency || settings?.currency || "usd").toLowerCase();
}
