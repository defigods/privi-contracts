const { assert } = require('chai')

const PRIVIFactory = artifacts.require('PRIVIPodERC20Factory')
const PRIVIPodToken = artifacts.require('PRIVIPodERC20Token')

contract('PRIVIFactory', (accounts) => {
  let priviFactoryContract
  let podAdress1
  let podAdress2

  const [admin, mod1, mod2, investor1, hacker, ...rest] = accounts

  const podId1 = 'podId1'
  const pod1Name = 'podName1'
  const pod1Symbol = 'PT1'

  const podId2 = 'podId2'
  const pod2Name = 'podName2'
  const pod2Symbol = 'PT2'

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

  before(async () => {
    priviFactoryContract = await PRIVIFactory.new()
    await priviFactoryContract.createPod(podId1, pod1Name, pod1Symbol)
    podAdress1 = await priviFactoryContract.podTokenAddresses(podId1)
  })

  it('Create a pod and check the pod has a valid address', async () => {
    await priviFactoryContract.createPod(podId2, pod2Name, pod2Symbol)
    const podAdress = await priviFactoryContract.podTokenAddresses(podId2)
    assert.notDeepEqual(
      podAdress,
      ZERO_ADDRESS,
      'Error: pod address is equal to address 0x00.'
    )
  })

  it('Check if there is 2 pod created', async () => {
    const totalPodCreated = await priviFactoryContract.totalPodCreated()
    assert.notDeepEqual(totalPodCreated, '2', 'Error: more pod created than 2.')
  })

  it('Assert that the Pod is depoyed from factory', async () => {
    const priviPodTokenContract = await PRIVIPodToken.at(podAdress1)
    const podFactoryAddress = await priviPodTokenContract.parentFactory()
    assert.deepEqual(
      priviFactoryContract.address,
      podFactoryAddress,
      'Error: pod is not deployed from factory.'
    )
  })

  it('Mint 1000 for investor 1', async () => {
    const priviPodTokenContract = await PRIVIPodToken.at(podAdress1)
    await priviFactoryContract.podMint(podId1, investor1, 1000)
    const investor1Balance = await priviPodTokenContract.balanceOf(investor1)
    assert.deepEqual(
      investor1Balance.toString(),
      '1000',
      'Error: investor 1 balance is not correct.'
    )
  })
})
