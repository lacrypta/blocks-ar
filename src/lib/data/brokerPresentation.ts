export interface BrokerPresentationAlias {
  displayKey?: string;
  displayName?: string;
  displayUrl?: string;
}

const PRESENTATION_ALIASES: Record<string, BrokerPresentationAlias> = {
  buenbit: {
    displayKey: "nexo",
    displayName: "Nexo",
    displayUrl: "https://www.nexo.com/",
  },
};

export function brokerPresentationAlias(
  key: string,
): BrokerPresentationAlias | undefined {
  return PRESENTATION_ALIASES[key];
}

export function brokerDisplayKey(key: string): string {
  return brokerPresentationAlias(key)?.displayKey ?? key;
}

