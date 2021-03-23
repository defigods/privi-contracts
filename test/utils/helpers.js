const registerToken = async (contract, token) => {
    switch (token.type) {
      case 'ERC20': {
        const tokenCountEmpty = await contract.getAllErc20Count();
  
        await contract.registerTokenERC20(token.name, token.symbol, token.deployedAddress);
  
        const registeredAddress = await contract.getErc20AddressRegistered(token.symbol);
  
        const tokenCount = await contract.getAllErc20Count();
  
        const [tokenAddedEvent] = await contract.getPastEvents('allEvents');
  
        return { tokenCountEmpty, registeredAddress, tokenCount, tokenAddedEvent };
      }
      case 'ERC721': {
        const tokenCountEmpty = await contract.getAllErc721Count();
  
        await contract.registerTokenERC721(token.name, token.symbol, token.deployedAddress);
  
        const registeredAddress = await contract.getErc721AddressRegistered(token.symbol);
  
        const tokenCount = await contract.getAllErc721Count();
  
        const [tokenAddedEvent] = await contract.getPastEvents('allEvents');
  
        return { tokenCountEmpty, registeredAddress, tokenCount, tokenAddedEvent };
      }
      case 'ERC1155': {
        const tokenCountEmpty = await contract.getAllErc1155Count();
  
        await contract.registerTokenERC1155(token.name, token.tokenURI, token.deployedAddress);
  
        const registeredAddress = await contract.getErc1155AddressRegistered(token.tokenURI);
  
        const tokenCount = await contract.getAllErc1155Count();
  
        const [tokenAddedEvent] = await contract.getPastEvents('allEvents');
  
        return { tokenCountEmpty, registeredAddress, tokenCount, tokenAddedEvent };
      }
      default:
        return null;
    }
  };
  
  module.exports = {
    registerToken,
  };