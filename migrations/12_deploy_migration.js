const PRIVIPodERC721RoyaltyFactory = artifacts.require('PRIVIPodERC721RoyaltyFactory')
const SwapManager = artifacts.require('SwapManager')

module.exports = async function(deployer, networks, accounts) {
  const PRIVIPodERC721RoyaltyFactoryContract = await PRIVIPodERC721RoyaltyFactory.deployed()

  console.log('Granting Roles to PRIVI BACKEND on PRIVIPodERC721RoyaltyFactoryContract')

  const ETH_PRIVI_ADDRESS = '0x9353395A21C4eFe442d1C5B41f3808766AA62cC9'

  const factoryMODERATOR_ROLE = await PRIVIPodERC721RoyaltyFactoryContract.MODERATOR_ROLE()

  console.log(
    'Granting MODERATOR_ROLE roles',
    factoryMODERATOR_ROLE,
    'to',
    ETH_PRIVI_ADDRESS
  )

  await PRIVIPodERC721RoyaltyFactoryContract.grantRole(
    factoryMODERATOR_ROLE,
    ETH_PRIVI_ADDRESS
  )

  const swapManagerContract = await SwapManager.deployed()
  const swapManagerAddress = swapManagerContract.address

  console.log(
    'Granting MODERATOR_ROLE roles',
    factoryMODERATOR_ROLE,
    'to',
    swapManagerAddress
  )

  await PRIVIPodERC721RoyaltyFactoryContract.grantRole(
    factoryMODERATOR_ROLE,
    swapManagerAddress
  )
}
