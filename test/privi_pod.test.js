const { assert } = require("chai");
const BN = require('bn.js');

const PRIVIFactory = artifacts.require("PRIVIFactory");
const PRIVIPodToken = artifacts.require("PRIVIPodToken");

const advanceTime = async (time) => {
    // console.log('web3:', web3.eth);
    await web3.eth.currentProvider.send(
        {
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [time],
            id: new Date().getTime(),
        }, 
        (err, result) => {
            if (err) {
                console.log('err:',err, 'result:', result);
            }
        }
    );
    // console.log('block number:', await web3.eth.getBlockNumber() );
    // const blockInfo = await web3.eth.getBlock(await web3.eth.getBlockNumber());
    // let currentTimestamp = blockInfo.timestamp;
    // console.log('currentTimestamp:', currentTimestamp);
  };

contract("PRIVIPodToken", (accounts) => {
    let priviFactoryContract;
    let podAdress1;
    let podDeploymentTime1;
    let podAdress2;

    const admin = accounts[0];
    const mod1 = accounts[1];
    const mod2 = accounts[2];
    const investor1 = accounts[3];
    const investor2 = accounts[4];
    const investor3 = accounts[5];
    const hacker = accounts[9];

    const oneDay = 86400;

    let investorBalance1;
    let investorBalance2;

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
        const blockInfo = await web3.eth.getBlock(await web3.eth.getBlockNumber());
        let currentTimestamp = blockInfo.timestamp;
        podDeploymentTime1 = currentTimestamp;
        podAdress1 = await priviFactoryContract.podTokenAddresses(podId1);
        
    });

    it("Check if a pod is created and it has a valid address", async () => {
        assert.notDeepEqual(podAdress1, addressZero, "Error: pod address is equal to address 0x00.");
    });

    it("Assert that the Pod is depoyed from factory", async () => {
        const priviPodTokenContract = await PRIVIPodToken.at(podAdress1);
        const podFactoryAddress = await priviPodTokenContract.parentFactory();
        assert.deepEqual(priviFactoryContract.address, podFactoryAddress, "Error: pod is not deployed from factory.");
    });

    it("Invest 1000 for investor 1 & Investor 2", async () => {
        const priviPodTokenContract = await PRIVIPodToken.at(podAdress1);
        await priviFactoryContract.callPodInvest(podId1, investor1, 1000);
        const investor1Balance = await priviPodTokenContract.balanceOf(investor1, {from: investor1});
        assert.deepEqual(investor1Balance.toString(), '1000', "Error: investor 1 balance is not correct.");
        await priviFactoryContract.callPodInvest(podId1, investor2, 1000);
        const investor2Balance = await priviPodTokenContract.balanceOf(investor2, {from: investor2});
        assert.deepEqual(investor2Balance.toString(), '1000', "Error: investor 2 balance is not correct.");
    });

    it("Assert no time has passed since deployment", async () => {
        const blockInfo = await web3.eth.getBlock(await web3.eth.getBlockNumber());
        let currentTimestamp = blockInfo.timestamp;
        // console.log('deploy time vs current time', podDeploymentTime1, currentTimestamp);
        assert.deepEqual(podDeploymentTime1, currentTimestamp, "Error: time has passed already.");
    });

    it("Assert only 10 second is passed inside pod cotract between 2 cycles", async () => {
        const priviPodTokenContract = await PRIVIPodToken.at(podAdress1);
        let lastCycleDate = await priviPodTokenContract.lastCycleDate();
        // console.log('lastCycleDate:', lastCycleDate);
        await advanceTime((10 * oneDay));
        await priviFactoryContract.setPodCycleInterest(podId1, 0, 1000, 10);
        const cycle0InterestReward = await priviPodTokenContract.interestPerCycle(0);
        assert.deepEqual(cycle0InterestReward.toString(), '1000', "Error: cycle 0 interest reward is not 1000.");
        let lastCycleDateAfter = await priviPodTokenContract.lastCycleDate();
        // console.log('lastCycleDateAfter:', lastCycleDateAfter);
        // console.log('lastCycleDate time vs lastCycleDateAfter time', lastCycleDate.toNumber(), lastCycleDateAfter.toNumber());
        assert.isTrue((lastCycleDate.add(new BN(10 * oneDay))).eq(lastCycleDateAfter), "Error: more or less than 10 second has passed already.");
    });

    it("Assert investor 1 stake 111 token in his/her first input in his/her lasyCycleInputs", async () => {
        const priviPodTokenContract = await PRIVIPodToken.at(podAdress1);
        await priviFactoryContract.callPodInvest(podId1, investor1, 1000);
        const investor1Balance = await priviPodTokenContract.balanceOf(investor1, {from: investor1});
        assert.deepEqual(investor1Balance.toString(), '1000', "Error: investor 1 balance is not correct.");
        await priviPodTokenContract.stake(111, {from: investor1});
        let stakeTracker = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTracker: lasyCycleInputs:', stakeTracker.lasyCycleInputs[0].acumulatedAmount);
        assert.deepEqual(stakeTracker.lasyCycleInputs[0].acumulatedAmount, '111', "Error: staked is not the correct amount of 111.");
    });

    it("Assert investor 1 stake 111 token and 112 token in in the days, and have an acumulated of 223", async () => {
        await priviFactoryContract.setPodDayLength(podId1, 5); // set day length to 5 seconds
        const priviPodTokenContract = await PRIVIPodToken.at(podAdress1);
        const oneDayInContract = await priviPodTokenContract.oneDay();
        // console.log('oneDayInContract', oneDayInContract.toNumber());
        assert.deepEqual(oneDayInContract.toNumber(), 5, "Error: contract day length is not 5 seconds.");
        await priviFactoryContract.callPodInvest(podId1, investor1, 1000);
        const investor1Balance = await priviPodTokenContract.balanceOf(investor1, {from: investor1});
        assert.deepEqual(investor1Balance.toString(), '1000', "Error: investor 1 balance is not correct.");
        await priviPodTokenContract.stake(111, {from: investor1});
        await priviPodTokenContract.stake(112, {from: investor1});
        let stakeTracker = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTracker: lasyCycleInputs:', stakeTracker.lasyCycleInputs[0].day, stakeTracker.lasyCycleInputs[0].acumulatedAmount);
        assert.deepEqual(stakeTracker.lasyCycleInputs[0].day, '0', "Error: 2nd staked is not the correct day of 0.");
        assert.deepEqual(stakeTracker.lasyCycleInputs[0].acumulatedAmount, '223', "Error: staked is not the correct amount of 112.");
    });

    it("Assert investor 1 stake 111 token and 112 token in 2 consecutive days", async () => {
        await priviFactoryContract.setPodDayLength(podId1, 5); // set day length to 5 seconds
        const priviPodTokenContract = await PRIVIPodToken.at(podAdress1);
        const oneDayInContract = await priviPodTokenContract.oneDay();
        // console.log('oneDayInContract', oneDayInContract.toNumber());
        assert.deepEqual(oneDayInContract.toNumber(), 5, "Error: contract day length is not 5 seconds.");
        await priviFactoryContract.callPodInvest(podId1, investor1, 1000);
        const investor1Balance = await priviPodTokenContract.balanceOf(investor1, {from: investor1});
        assert.deepEqual(investor1Balance.toString(), '1000', "Error: investor 1 balance is not correct.");
        await priviPodTokenContract.stake(111, {from: investor1});
        // let stakeTracker = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTracker: lasyCycleInputs:', stakeTracker.lasyCycleInputs[0].acumulatedAmount);
        await advanceTime(oneDay + 1);
        await priviPodTokenContract.stake(112, {from: investor1});
        let stakeTrackerAfter = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTrackerAfter: lasyCycleInputs:', stakeTrackerAfter.lasyCycleInputs);
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[0].day, '0', "Error: staked is not the correct day of 0.");
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[0].acumulatedAmount, '111', "Error: staked is not the correct amount of 111.");
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[1].day, '1', "Error: staked is not the correct day of 1.");
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[1].acumulatedAmount, '112', "Error: staked is not the correct amount of 112.");
    });

    it("Assert investor 1 223 token staked from 2 input of previouse cycle, calculated correctly", async () => {
        await priviFactoryContract.setPodDayLength(podId1, 5); // set day length to 5 seconds
        const priviPodTokenContract = await PRIVIPodToken.at(podAdress1);
        const oneDayInContract = await priviPodTokenContract.oneDay();
        // console.log('oneDayInContract', oneDayInContract.toNumber());
        assert.deepEqual(oneDayInContract.toNumber(), 5, "Error: contract day length is not 5 seconds.");
        await priviFactoryContract.callPodInvest(podId1, investor1, 1000);
        const investor1Balance = await priviPodTokenContract.balanceOf(investor1, {from: investor1});
        assert.deepEqual(investor1Balance.toString(), '1000', "Error: investor 1 balance is not correct.");
        await priviPodTokenContract.stake(111, {from: investor1});
        // let stakeTracker = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTracker: lasyCycleInputs:', stakeTracker.lasyCycleInputs[0].acumulatedAmount);
        await advanceTime(oneDay + 1);
        await priviPodTokenContract.stake(112, {from: investor1});
        let stakeTrackerAfter = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTrackerAfter 1 : lasyCycleInputs:', stakeTrackerAfter);
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[0].day, '0', "Error: staked is not the correct day of 0.");
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[0].acumulatedAmount, '111', "Error: staked is not the correct amount of 111.");
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[1].day, '1', "Error: staked is not the correct day of 1.");
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[1].acumulatedAmount, '112', "Error: staked is not the correct amount of 112.");
        // grab the acumulated ammount for calculation locally
        // calculate reward locally, to be compared to smart contract's calculation
        //      reward  =  input  * (cycleLengthInDays - inputDay) * perDayInterest
        const firstInputReward = parseInt(stakeTrackerAfter.lasyCycleInputs[0].acumulatedAmount) * (10 - parseInt(stakeTrackerAfter.lasyCycleInputs[0].day)) * 10;
        const secondInputReward = parseInt(stakeTrackerAfter.lasyCycleInputs[1].acumulatedAmount) * (10 - parseInt(stakeTrackerAfter.lasyCycleInputs[1].day)) * 10;
        // factory set this cycle's interest of 10 per_Cycle_per_Token_Staked. asumes that cycle length is 10
        await priviFactoryContract.setPodCycleInterest(podId1, 0, 10, 10);
        stakeTrackerAfter = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTrackerAfter 2 : lasyCycleInputs:', stakeTrackerAfter);
        const totalUnPaidRewards = firstInputReward + secondInputReward;
        // console.log('calculated reward vs. local calcucated:', stakeTrackerAfter.unPaidRewards.toNumber(), totalUnPaidRewards);
        assert.deepEqual(stakeTrackerAfter.unPaidRewards.toNumber(), totalUnPaidRewards, "Error: calculated reward inside contract is not similar to test claculation.");
    });

    it("Assert investor 1 has an input of 50 at day 5 of second cycle", async () => {
        await priviFactoryContract.setPodDayLength(podId1, 5); // set day length to 5 seconds
        const priviPodTokenContract = await PRIVIPodToken.at(podAdress1);
        const oneDayInContract = await priviPodTokenContract.oneDay();
        // console.log('oneDayInContract', oneDayInContract.toNumber());
        assert.deepEqual(oneDayInContract.toNumber(), 5, "Error: contract day length is not 5 seconds.");
        await priviFactoryContract.callPodInvest(podId1, investor1, 1000);
        const investor1Balance = await priviPodTokenContract.balanceOf(investor1, {from: investor1});
        assert.deepEqual(investor1Balance.toString(), '1000', "Error: investor 1 balance is not correct.");
        await priviPodTokenContract.stake(111, {from: investor1});
        // let stakeTracker = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTracker: lasyCycleInputs:', stakeTracker.lasyCycleInputs[0].acumulatedAmount);
        await advanceTime(oneDay + 1);
        await priviPodTokenContract.stake(112, {from: investor1});
        let stakeTrackerAfter = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTrackerAfter 1 : lasyCycleInputs:', stakeTrackerAfter);
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[0].day, '0', "Error: staked is not the correct day of 0.");
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[0].acumulatedAmount, '111', "Error: staked is not the correct amount of 111.");
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[1].day, '1', "Error: staked is not the correct day of 1.");
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[1].acumulatedAmount, '112', "Error: staked is not the correct amount of 112.");
        // grab the acumulated ammount for calculation locally
        // calculate reward locally, to be compared to smart contract's calculation
        //      reward  =  input  * (cycleLengthInDays - inputDay) * perDayInterest
        const firstInputReward = parseInt(stakeTrackerAfter.lasyCycleInputs[0].acumulatedAmount) * (10 - parseInt(stakeTrackerAfter.lasyCycleInputs[0].day)) * 10;
        const secondInputReward = parseInt(stakeTrackerAfter.lasyCycleInputs[1].acumulatedAmount) * (10 - parseInt(stakeTrackerAfter.lasyCycleInputs[1].day)) * 10;
        // factory set this cycle's interest of 10 per_Cycle_per_Token_Staked. asumes that cycle length is 10
        await priviFactoryContract.setPodCycleInterest(podId1, 0, 10, 10);
        stakeTrackerAfter = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTrackerAfter 2 : lasyCycleInputs:', stakeTrackerAfter);
        const totalUnPaidRewards = firstInputReward + secondInputReward;
        // console.log('calculated reward vs. local calcucated:', stakeTrackerAfter.unPaidRewards.toNumber(), totalUnPaidRewards);
        assert.deepEqual(stakeTrackerAfter.unPaidRewards.toNumber(), totalUnPaidRewards, "Error: calculated reward inside contract is not similar to test claculation.");
        // advance 26 second, to get 5 days as 1 day length in test is 5 seconds
        await advanceTime((5 * oneDay) + 1);
        await priviPodTokenContract.stake(50, {from: investor1});
        const stakeTrackerInCycle1 = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTrackerInCycle1 : lasyCycleInputs:', stakeTrackerInCycle1);
        assert.deepEqual(stakeTrackerInCycle1.lasyCycleInputs[0].day, '5', "Error: staked is not the correct day of 5.");
        assert.deepEqual(stakeTrackerInCycle1.lasyCycleInputs[0].acumulatedAmount, '50', "Error: staked is not the correct amount of 50.");
    });

    it("Assert investor 1 has his/her previouse cycle's inputs of total 223 calculated into full cycle", async () => {
        await priviFactoryContract.setPodDayLength(podId1, 5); // set day length to 5 seconds
        const priviPodTokenContract = await PRIVIPodToken.at(podAdress1);
        const oneDayInContract = await priviPodTokenContract.oneDay();
        // console.log('oneDayInContract', oneDayInContract.toNumber());
        assert.deepEqual(oneDayInContract.toNumber(), 5, "Error: contract day length is not 5 seconds.");
        await priviFactoryContract.callPodInvest(podId1, investor1, 1000);
        const investor1Balance = await priviPodTokenContract.balanceOf(investor1, {from: investor1});
        assert.deepEqual(investor1Balance.toString(), '1000', "Error: investor 1 balance is not correct.");
        await priviPodTokenContract.stake(111, {from: investor1});
        // let stakeTracker = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTracker: lasyCycleInputs:', stakeTracker.lasyCycleInputs[0].acumulatedAmount);
        await advanceTime((5 * oneDay) + 1);
        await priviPodTokenContract.stake(112, {from: investor1});
        const stakeTrackerAfter = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTrackerAfter 1 : lasyCycleInputs:', stakeTrackerAfter);
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[0].day, '0', "Error: staked is not the correct day of 0.");
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[0].acumulatedAmount, '111', "Error: staked is not the correct amount of 111.");
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[1].day, '1', "Error: staked is not the correct day of 1.");
        assert.deepEqual(stakeTrackerAfter.lasyCycleInputs[1].acumulatedAmount, '112', "Error: staked is not the correct amount of 112.");
        // grab the acumulated ammount for calculation locally
        // calculate reward locally, to be compared to smart contract's calculation
        //      reward  =  input  * (cycleLengthInDays - inputDay) * perDayInterest
        const firstInputReward = parseInt(stakeTrackerAfter.lasyCycleInputs[0].acumulatedAmount) * (10 - parseInt(stakeTrackerAfter.lasyCycleInputs[0].day)) * 10;
        const secondInputReward = parseInt(stakeTrackerAfter.lasyCycleInputs[1].acumulatedAmount) * (10 - parseInt(stakeTrackerAfter.lasyCycleInputs[1].day)) * 10;
        // factory set this cycle's interest of 10 per_Cycle_per_Token_Staked. asumes that cycle length is 10
        await priviFactoryContract.setPodCycleInterest(podId1, 0, 10, 10);
        const stakeTrackerAfter2 = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTrackerAfter 2 : lasyCycleInputs:', stakeTrackerAfter2);
        const totalUnPaidRewards = firstInputReward + secondInputReward;
        // console.log('calculated reward vs. local calcucated:', stakeTrackerAfter.unPaidRewards.toNumber(), totalUnPaidRewards);
        assert.deepEqual(stakeTrackerAfter2.unPaidRewards.toNumber(), totalUnPaidRewards, "Error: calculated reward inside contract is not similar to test claculation.");
        // advance 26 second, to get 5 days as 1 day length in test is 5 seconds
        await advanceTime((5 * oneDay) + 1);
        await priviPodTokenContract.stake(50, {from: investor1});
        const stakeTrackerInCycle1 = await priviPodTokenContract.getAccountStakeTracker(investor1, {from: investor1});
        // console.log('stakeTrackerInCycle1 : lasyCycleInputs:', stakeTrackerInCycle1);
        assert.deepEqual(stakeTrackerInCycle1.lasyCycleInputs[0].day, '5', "Error: staked is not the correct day of 5.");
        assert.deepEqual(stakeTrackerInCycle1.lasyCycleInputs[0].acumulatedAmount, '50', "Error: staked is not the correct amount of 50.");
        // currenty as investor staked new inputs, he/she should have his/her previouse cycle input calculated into a full cycle 
        // test sums them locally
        const sum = parseInt(stakeTrackerAfter.lasyCycleInputs[0].acumulatedAmount) + parseInt(stakeTrackerAfter.lasyCycleInputs[1].acumulatedAmount);
        assert.deepEqual(stakeTrackerInCycle1.fullCycleBalance.toNumber(), sum, "Error: fullCycleBalance is not the correct amount of 223.");
    });

    // lots of test remaining , not apt for production

});