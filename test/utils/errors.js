module.exports = {
    ALREADY_REGISTERED: 'BridgeManager: address already registered.',
    EMPTY_NAME: "BridgeManager: tokenName can't be empty.",
    EMPTY_SYMBOL: "BridgeManager: token symbol can't be empty.",
    SYMBOL_TOO_LONG: 'BridgeManager: token Symbol too long.',
    ONLY_MODERATOR: (token) => `PRIVIPodERC${token}Factory: must have MODERATOR_ROLE to invest for investor.`,
    UNIQUE_ID: (token) => `PRIVIPodERC${token}Factory: Pod ${token === '1155' ? 'uri' : 'id'} already exists.`,
    UNIQUE_SYMBOL: (token) => `PRIVIPodERC${token}Factory: Pod symbol already exists.`,
    INVESTMENT_ADDRESS: (token) => `PRIVIPodERC${token}Factory: Account address should not be zero.`,
    INVESTMENT_AMOUNT: (token) => `PRIVIPodERC${token}Factory: amount should not be zero.`,
  };