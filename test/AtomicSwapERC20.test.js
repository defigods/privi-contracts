const PRIVIPodERC20Token = artifacts.require("PRIVIPodERC20Token");
const PRIVIPodERC20Factory = artifacts.require("PRIVIPodERC20Factory");
const AtomicSwapERC20 = artifacts.require("AtomicSwapERC20Mock");
const BridgeManager = artifacts.require("BridgeManager");

const { BN, soliditySha3 } = require("web3-utils");

function getUnixEpochTimeStamp(value) {
    return Math.floor(value.getTime() / 1000);
}

contract("AtomicSwapERC20", (accounts) => {
    let PRIVIPodERC20Token_contract;
    let PRIVIPodERC20Factory_contract;
    let AtomicSwapERC20_contract;
    let BridgeManager_contract;

    const podId1 = 'podId1'
    const pod1Name = 'podName1'
    const pod1Symbol = 'PT1'
    let podAdress1;

    before(async () => {
        await BridgeManager.new({ from: accounts[0] }).then(function (instance) {
            BridgeManager_contract = instance;
        });

        await PRIVIPodERC20Factory.new(BridgeManager_contract.address, { from: accounts[0] }).then(function (instance) {
            PRIVIPodERC20Factory_contract = instance;
        });

        await AtomicSwapERC20.new({ from: accounts[0] }).then(function (instance) {
            AtomicSwapERC20_contract = instance;
        });

        await PRIVIPodERC20Factory_contract.createPod(
            podId1,
            pod1Name,
            pod1Symbol,
        )

        podAdress1 = await PRIVIPodERC20Factory_contract.getPodAddressById(podId1);

        await PRIVIPodERC20Factory_contract.mintPodTokenById(
            podId1,
            accounts[1],
            1000,
            {from: accounts[0]}
        )

        PRIVIPodERC20Token_contract = await PRIVIPodERC20Token.at(podAdress1);
    });

    describe("atomic swap", () => {
        it("everything is working fine with normal flow", async () => {

            let date = new Date();
            date.setDate(date.getDate() + 1);

            await PRIVIPodERC20Token_contract.approve(AtomicSwapERC20_contract.address, 1000, {from: accounts[1]})

            await AtomicSwapERC20_contract.createProposal(
                "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce",
                "100",
                podAdress1,
                accounts[2],
                soliditySha3(
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    accounts[2],
                ),
                getUnixEpochTimeStamp(date),
                {from: accounts[1]}
            );

            await AtomicSwapERC20_contract.claimFunds(
                '0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                {from: accounts[2]}
            );

            assert.equal(new BN(await PRIVIPodERC20Token_contract.balanceOf(accounts[2]), {from: accounts[0]}).toString(), 100);
        });

        it("claiming funds is not working with wrong secret or wrong swap id", async () => {

            let date = new Date();
            date.setDate(date.getDate() + 1);

            await PRIVIPodERC20Token_contract.approve(AtomicSwapERC20_contract.address, 1000, {from: accounts[1]})

            await AtomicSwapERC20_contract.createProposal(
                "0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce",
                "100",
                podAdress1,
                accounts[2],
                soliditySha3(
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    accounts[2],
                ),
                getUnixEpochTimeStamp(date),
                {from: accounts[1]}
            );

            try {
                await AtomicSwapERC20_contract.claimFunds(
                    '0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ca',
                    {from: accounts[2]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC20: Invalid secret key',
            )

            try {
                await AtomicSwapERC20_contract.claimFunds(
                    '0x851f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    {from: accounts[2]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC20: Swap is not opened',
            )
        });

        it("claiming funds is not working from faker", async () => {
            try {
                await AtomicSwapERC20_contract.claimFunds(
                    '0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    {from: accounts[9]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC20: Caller is not the withdrawer',
            )
        });

        it("only working with all correct information", async () => {
            await AtomicSwapERC20_contract.claimFunds(
                '0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                {from: accounts[2]}
            );

            assert.equal(new BN(await PRIVIPodERC20Token_contract.balanceOf(accounts[2]), {from: accounts[0]}).toString(), 200);
        });

        it("not working if withdrawer tries to claim again", async () => {
            let thrownError;

            try {
                await AtomicSwapERC20_contract.claimFunds(
                    '0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    {from: accounts[2]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC20: Swap is not opened',
            )
        });

        it("refund", async () => {
            let date = new Date();
            date.setDate(date.getDate() + 1);

            await PRIVIPodERC20Token_contract.approve(AtomicSwapERC20_contract.address, 1000, {from: accounts[1]})

            await AtomicSwapERC20_contract.createProposal(
                "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747cf",
                "100",
                podAdress1,
                accounts[2],
                soliditySha3(
                    '0x541f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    accounts[2],
                ),
                getUnixEpochTimeStamp(date),
                {from: accounts[1]}
            );

            date.setDate(date.getDate() + 2);
            await AtomicSwapERC20_contract.setBlockTimeStamp(getUnixEpochTimeStamp(date));


            await AtomicSwapERC20_contract.refundFunds(
                "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747cf",
                {from: accounts[1]}
            );

            assert.equal(new BN(await PRIVIPodERC20Token_contract.balanceOf(accounts[1]), {from: accounts[0]}).toString(), 800);
        });

        it("refunding is not working while timelock", async () => {
            let date = new Date();
            date.setDate(date.getDate() + 30);

            await PRIVIPodERC20Token_contract.approve(AtomicSwapERC20_contract.address, 1000, {from: accounts[1]})

            await AtomicSwapERC20_contract.createProposal(
                "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                "100",
                podAdress1,
                accounts[2],
                soliditySha3(
                    '0x541f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    accounts[2],
                ),
                getUnixEpochTimeStamp(date),
                {from: accounts[1]}
            );

            let thrownError;

            try {
                await AtomicSwapERC20_contract.refundFunds(
                    "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                    {from: accounts[1]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC20: Swap is not expired',
            )
        });

        it("refunding is not working from faker", async () => {
            let date = new Date();

            date.setDate(date.getDate() + 60);
            await AtomicSwapERC20_contract.setBlockTimeStamp(getUnixEpochTimeStamp(date));

            let thrownError;

            try {
                await AtomicSwapERC20_contract.refundFunds(
                    "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                    {from: accounts[9]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC20: Caller is not the proposer',
            )
        });

        it("refunding is only working from proposer after time lock", async () => {
            let date = new Date();

            date.setDate(date.getDate() + 60);
            await AtomicSwapERC20_contract.setBlockTimeStamp(getUnixEpochTimeStamp(date));

            await AtomicSwapERC20_contract.refundFunds(
                "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                {from: accounts[1]}
            );

            assert.equal(new BN(await PRIVIPodERC20Token_contract.balanceOf(accounts[1]), {from: accounts[0]}).toString(), 800);
        });

        it("not working if proposer refund again", async () => {
            let thrownError;

            try {
                await AtomicSwapERC20_contract.refundFunds(
                    "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                    {from: accounts[1]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC20: Swap is not opened',
            )
        });
    });
});
