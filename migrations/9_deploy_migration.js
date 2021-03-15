const SwapManager = artifacts.require('SwapManager')
const FakePrivi = artifacts.require('FakePrivi')

const FakeBAL = artifacts.require('FakeBAL')
const FakeBAT = artifacts.require('FakeBAT')
const FakeCOMP = artifacts.require('FakeCOMP')
const FakeDAI = artifacts.require('FakeDAI')
const FakeLINK = artifacts.require('FakeLINK')
const FakeMKR = artifacts.require('FakeMKR')
const FakeUNI = artifacts.require('FakeUNI')
const FakeUSDT = artifacts.require('FakeUSDT')
const FakeWBTC = artifacts.require('FakeWBTC')
const FakeWETH = artifacts.require('FakeWETH')
const FakeYFI = artifacts.require('FakeYFI')

module.exports = async function(deployer, networks, accounts) {
  const swapManagerContract = await SwapManager.deployed()

  console.log('Granting Roles to PRIVI BACKEND on swapManager')

  const ETH_PRIVI_ADDRESS = '0x9353395A21C4eFe442d1C5B41f3808766AA62cC9'

  const swapTRANSFER_ROLE = await swapManagerContract.TRANSFER_ROLE()

  console.log(
    'Granting swap manager roles',
    swapTRANSFER_ROLE,
    'to',
    ETH_PRIVI_ADDRESS
  )

  await swapManagerContract.grantRole(swapTRANSFER_ROLE, ETH_PRIVI_ADDRESS)
}
