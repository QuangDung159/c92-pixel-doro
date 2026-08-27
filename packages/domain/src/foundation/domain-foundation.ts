export const DOMAIN_PACKAGE_ID = '@pixeldoro/domain' as const;

export interface DomainFoundationHealth {
  readonly packageId: typeof DOMAIN_PACKAGE_ID;
  readonly isPureTypeScript: true;
}

export const domainFoundationHealth: DomainFoundationHealth = Object.freeze({
  packageId: DOMAIN_PACKAGE_ID,
  isPureTypeScript: true,
});

