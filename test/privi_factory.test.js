const { assert } = require("chai");

const PRIVIFactory = artifacts.require("PRIVIFactory");
const PRIVIPodToken = artifacts.require("PRIVIPodToken");

contract("PRIVIFactory", (accounts) => {
    let priviFactoryContract;
    let priviPodTokenAddress;

    const admin = accounts[0];
    const mod1 = accounts[1];
    const mod2 = accounts[2];
    const investor1 = accounts[3];
    const hacker = accounts[9];

    const podId1 = 'podId1';
    const investTokenAddres_DAI = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const addressZero = '0x0000000000000000000000000000000000000000';
    const now = new Date();
    const secondsSinceEpoch = Math.round(now.getTime() / 1000);
    const podEndDate = secondsSinceEpoch + 3600;

    beforeEach(async () => {
        priviFactoryContract = await PRIVIFactory.new();
        await priviFactoryContract.createPodToken(podId1, investTokenAddres_DAI, podEndDate);
        priviPodTokenAddress = await priviFactoryContract.podTokenAddresses(podId1)
    });

    it("Create a pod and check the pod has a valid address", async () => {
        assert.notDeepEqual(priviPodTokenAddress, addressZero, "Error: pod address is equal to address 0x00.");
    });

    it("Asset that the Pod is depoyed from factory", async () => {
        const priviPodTokenContract = await PRIVIPodToken.at(priviPodTokenAddress);
        const podFactoryAddress = await priviPodTokenContract.parentFactory();
        assert.deepEqual(priviFactoryContract.address, podFactoryAddress, "Error: pod is not deployed from factory.");
    });

    it("Invest 1000 for investor 1", async () => {
        const priviPodTokenContract = await PRIVIPodToken.at(priviPodTokenAddress);
        await priviFactoryContract.callPodInvest(podId1, investor1, 1000);
        const investor1Balance = await priviPodTokenContract.balanceOf(investor1);
        assert.deepEqual(investor1Balance.toString(), '1000', "Error: investor 1 balance is not correct.");
    });

    it("Set 1000 as first cycle's interest reward", async () => {
        const priviPodTokenContract = await PRIVIPodToken.at(priviPodTokenAddress);
        await priviFactoryContract.setPodCycleInterest(podId1, 1, 1000);
        const cycle1InterestReward = await priviPodTokenContract.interestPerCycle(1);
        assert.deepEqual(cycle1InterestReward.toString(), '1000', "Error: cycle 1 interest reward is not 1000.");
    });

});