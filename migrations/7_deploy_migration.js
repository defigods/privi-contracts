const SwapManager = artifacts.require('SwapManager')

const FakeMKR = artifacts.require('FakeMKR')
const FakeUNI = artifacts.require('FakeUNI')
const FakeUSDT = artifacts.require('FakeUSDT')
const FakeWBTC = artifacts.require('FakeWBTC')
const FakeWETH = artifacts.require('FakeWETH')
const FakeYFI = artifacts.require('FakeYFI')

module.exports = async function(deployer, networks, accounts) {
  if (networks !== 'mainnet') { 
    const swapManagerContract = await SwapManager.deployed()
    const swapManagerAddress = swapManagerContract.address
    await deployer.deploy(FakeMKR, swapManagerAddress)
    await deployer.deploy(FakeUNI, swapManagerAddress)
    await deployer.deploy(FakeUSDT, swapManagerAddress)
    await deployer.deploy(FakeWBTC, swapManagerAddress)
    await deployer.deploy(FakeWETH, swapManagerAddress)
    await deployer.deploy(FakeYFI, swapManagerAddress)
  }
}
