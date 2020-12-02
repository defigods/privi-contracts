const { assert } = require("chai");

const PRIVIFactory = artifacts.require("PRIVIPodERC20Factory_Stakeable");
const PRIVIPodToken = artifacts.require("PRIVIPodERC20TokenStakable");

contract("PRIVIFactory", (accounts) => {
    let priviFactoryContract;
    let podAdress1;
    let podAdress2;

    const admin = accounts[0];
    const mod1 = accounts[1];
    const mod2 = accounts[2];
    const investor1 = accounts[3];
    const hacker = accounts[9];

    const podId1 = 'podId1';
    const investTokenAddress_DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const podId2 = 'podId2';
    const investTokenAddress_HEZ = '0xEEF9f339514298C6A857EfCfC1A762aF84438dEE';
    const podId3 = 'podId3';
    const investTokenAddress_WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    const addressZero = '0x0000000000000000000000000000000000000000';
    const now = new Date();
    const secondsSinceEpoch = Math.round(now.getTime() / 1000);
    const podEndDate = secondsSinceEpoch + 3600;

    beforeEach(async () => {
        priviFactoryContract = await PRIVIFactory.new();
        await priviFactoryContract.createPod(podId1, investTokenAddress_DAI, podEndDate);
        await priviFactoryContract.createPod(podId2, investTokenAddress_HEZ, podEndDate);
        podAdress1 = await priviFactoryContract.podTokenAddresses(podId1)
        podAdress2 = await priviFactoryContract.podTokenAddresses(podId2)
    });

    it("Create a pod and check the pod has a valid address", async () => {
        await priviFactoryContract.createPod(podId3, investTokenAddress_WETH, podEndDate);
        const podAdress = await priviFactoryContract.podTokenAddresses(podId3)
        assert.notDeepEqual(podAdress, addressZero, "Error: pod address is equal to address 0x00.");
    });

    it("Check if there is 2 pod created", async () => {
        const totalPodCreated = await priviFactoryContract.totalPodCreated();
        assert.notDeepEqual(totalPodCreated, '2', "Error: more pod created than 2.");
    });

    it("Assert that the Pod is depoyed from factory", async () => {
        const priviPodTokenContract = await PRIVIPodToken.at(podAdress1);
        const podFactoryAddress = await priviPodTokenContract.parentFactory();
        assert.deepEqual(priviFactoryContract.address, podFactoryAddress, "Error: pod is not deployed from factory.");
    });

    it("Invest 1000 for investor 1", async () => {
        const priviPodTokenContract = await PRIVIPodToken.at(podAdress1);
        await priviFactoryContract.callPodInvest(podId1, investor1, 1000);
        const investor1Balance = await priviPodTokenContract.balanceOf(investor1);
        assert.deepEqual(investor1Balance.toString(), '1000', "Error: investor 1 balance is not correct.");
    });

    it("Set 1000 as first cycle's interest reward", async () => {
        const priviPodTokenContract = await PRIVIPodToken.at(podAdress1);
        await priviFactoryContract.setPodCycleInterest(podId1, 0, 1000, 10);
        const cycle0InterestReward = await priviPodTokenContract.interestPerCyclePerDayPerTokenMap(0);
        assert.deepEqual(cycle0InterestReward.toString(), '1000', "Error: cycle 0 interest reward is not 1000.");
    });

});