const { assert } = require('chai')

const PRIVIFactory = artifacts.require('PRIVIPodERC1155Factory')
const PRIVIPodToken = artifacts.require('PRIVIPodERC1155Token')

contract('PRIVIFactory', (accounts) => {
  let priviFactoryContract
  let podAdress1
  let podAdress2

  const admin = accounts[0]
  const mod1 = accounts[1]
  const mod2 = accounts[2]
  const investor1 = accounts[3]
  const investor2 = accounts[4]
  const investor3 = accounts[5]
  const investor4 = accounts[6]
  const hacker = accounts[9]

  const podId1 = 'podId1'
  const pod1Uri = 'http://www.pt1.com'
  const pod1TokenId1 = '0'
  const pod1TokenId2 = '1'
  const pod1TokenId3 = '2'

  const podId2 = 'podId2'
  const pod2Uri = 'http://www.pt2.com'
  const pod2TokenId1 = '0'
  const pod2TokenId2 = '1'
  const pod2TokenId3 = '2'

  const addressZero = '0x0000000000000000000000000000000000000000'

  before(async () => {
    priviFactoryContract = await PRIVIFactory.new()
    await priviFactoryContract.createPod(podId1, pod1Uri)
    podAdress1 = await priviFactoryContract.podTokenAddresses(podId1)
  })

  it('Create a pod and check the pod has a valid address', async () => {
    await priviFactoryContract.createPod(podId2, pod2Uri)
    const podAdress = await priviFactoryContract.podTokenAddresses(podId2)
    assert.notDeepEqual(
      podAdress,
      addressZero,
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

  it('Mint 100 of podTokenId1 for investor 1', async () => {
    const priviPodTokenContract = await PRIVIPodToken.at(podAdress1)
    await priviFactoryContract.podMint(
      podId1,
      investor1,
      pod1TokenId1,
      100,
      '0x1234'
    )
    const investor1Balance = await priviPodTokenContract.balanceOf(
      investor1,
      pod1TokenId1
    )
    assert.deepEqual(
      investor1Balance.toString(),
      '100',
      'Error: investor 1 balance is not correct.'
    )
  })

  it('Batch Mint 100 of podTokenId2, and 200 of podTokenId3 for investor 1', async () => {
    const priviPodTokenContract = await PRIVIPodToken.at(podAdress1)
    await priviFactoryContract.podMintBatch(
      podId1,
      investor1,
      [pod1TokenId2, pod1TokenId3],
      [100, 200],
      '0x100200'
    )
    const investor1BalancePod1TokenId2 = await priviPodTokenContract.balanceOf(
      investor1,
      pod1TokenId2
    )
    const investor1BalancePod1TokenId3 = await priviPodTokenContract.balanceOf(
      investor1,
      pod1TokenId3
    )
    assert.deepEqual(
      investor1BalancePod1TokenId2.toString(),
      '100',
      'Error: investor 1 balance of pod1TokenId2 is not correct.'
    )
    assert.deepEqual(
      investor1BalancePod1TokenId3.toString(),
      '200',
      'Error: investor 1 balance of pod1TokenId3 is not correct.'
    )
  })

  it('check balance of batch, 100 of podTokenId1 for investor3, and 100 of podTokenId2 for investor 4', async () => {
    const priviPodTokenContract = await PRIVIPodToken.at(podAdress1)
    await priviFactoryContract.podMint(
      podId1,
      investor3,
      pod1TokenId1,
      100,
      '0x1001'
    )
    await priviFactoryContract.podMint(
      podId1,
      investor4,
      pod1TokenId2,
      100,
      '0x1002'
    )
    const balanceArray = await priviPodTokenContract.balanceOfBatch(
      [investor3, investor4],
      [pod1TokenId1, pod1TokenId2]
    )
    // console.log('balance Array: ',balanceArray);
    assert.deepEqual(
      balanceArray[0].toString(),
      '100',
      'Error: investor 3 balance of pod1TokenId1 is not correct.'
    )
    assert.deepEqual(
      balanceArray[1].toString(),
      '100',
      'Error: investor 4 balance of pod1TokenId2 is not correct.'
    )
  })
})
