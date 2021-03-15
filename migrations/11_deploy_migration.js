const PRIVIPodERC20Factory = artifacts.require('PRIVIPodERC20Factory')
const SwapManager = artifacts.require('SwapManager')

module.exports = async function(deployer, networks, accounts) {
  const priviPodERC20FactoryContract = await PRIVIPodERC20Factory.deployed()

  console.log('Granting Roles to PRIVI BACKEND on priviPodERC20FactoryContract')

  const ETH_PRIVI_ADDRESS = '0x9353395A21C4eFe442d1C5B41f3808766AA62cC9'

  const factoryMODERATOR_ROLE = await priviPodERC20FactoryContract.MODERATOR_ROLE()

  console.log(
    'Granting MODERATOR_ROLE roles',
    factoryMODERATOR_ROLE,
    'to',
    ETH_PRIVI_ADDRESS
  )

  await priviPodERC20FactoryContract.grantRole(
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

  await priviPodERC20FactoryContract.grantRole(
    factoryMODERATOR_ROLE,
    swapManagerAddress
  )
}
