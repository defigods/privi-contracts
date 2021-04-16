const PRIVIPodERC721Token = artifacts.require("PRIVIPodERC721Token");
const PRIVIPodERC721Factory = artifacts.require("PRIVIPodERC721Factory");
const AtomicSwapERC721 = artifacts.require("AtomicSwapERC721Mock");
const BridgeManager = artifacts.require("BridgeManager");

const { BN, soliditySha3 } = require("web3-utils");

function getUnixEpochTimeStamp(value) {
    return Math.floor(value.getTime() / 1000);
}

contract("AtomicSwapERC721", (accounts) => {
    let PRIVIPodERC721Token_contract;
    let PRIVIPodERC721Factory_contract;
    let AtomicSwapERC721_contract;
    let BridgeManager_contract;

    const podId1 = 'podId1'
    const pod1Name = 'podName1'
    const pod1Symbol = 'PT1'
    let podAdress1;
    const tokenId = '0x222222229bd51a8f1fd5a5f74e4a256513210caf2ade63cd25c7e4c654175555';

    before(async () => {
        await BridgeManager.new({ from: accounts[0] }).then(function (instance) {
            BridgeManager_contract = instance;
        });

        await PRIVIPodERC721Factory.new(BridgeManager_contract.address, { from: accounts[0] }).then(function (instance) {
            PRIVIPodERC721Factory_contract = instance;
        });

        await AtomicSwapERC721.new({ from: accounts[0] }).then(function (instance) {
            AtomicSwapERC721_contract = instance;
        });

        await PRIVIPodERC721Factory_contract.createPod(
            podId1,
            pod1Name,
            pod1Symbol,
            '',
        )

        podAdress1 = await PRIVIPodERC721Factory_contract.getPodAddressById(podId1);

        await PRIVIPodERC721Factory_contract.mintPodTokenById(
            podId1,
            tokenId,
            accounts[1],
            {from: accounts[0]}
        )

        PRIVIPodERC721Token_contract = await PRIVIPodERC721Token.at(podAdress1);
    });

    describe("atomic swap", () => {
        it("everything is working fine with normal flow", async () => {

            let date = new Date();
            date.setDate(date.getDate() + 1);

            await PRIVIPodERC721Token_contract.approve(AtomicSwapERC721_contract.address, tokenId, {from: accounts[1]})
            await PRIVIPodERC721Token_contract.setApprovalForAll(
                AtomicSwapERC721_contract.address,
                true,
                { from: accounts[1] }
            );

            await AtomicSwapERC721_contract.createProposal(
                "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce",
                tokenId,
                podAdress1,
                accounts[2],
                soliditySha3(
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    accounts[2],
                ),
                getUnixEpochTimeStamp(date),
                {from: accounts[1]}
            );

            await AtomicSwapERC721_contract.claimFunds(
                '0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                {from: accounts[2]}
            );

            assert.equal(await PRIVIPodERC721Token_contract.ownerOf(tokenId, {from: accounts[0]}), accounts[2]);
        });

        it("claiming funds is not working with wrong secret or wrong swap id", async () => {

            let date = new Date();
            date.setDate(date.getDate() + 1);

            await PRIVIPodERC721Token_contract.approve(AtomicSwapERC721_contract.address, tokenId, {from: accounts[2]})
            await PRIVIPodERC721Token_contract.setApprovalForAll(
                AtomicSwapERC721_contract.address,
                true,
                { from: accounts[2] }
            );

            await AtomicSwapERC721_contract.createProposal(
                "0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce",
                tokenId,
                podAdress1,
                accounts[3],
                soliditySha3(
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    accounts[3],
                ),
                getUnixEpochTimeStamp(date),
                {from: accounts[2]}
            );

            try {
                await AtomicSwapERC721_contract.claimFunds(
                    '0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ca',
                    {from: accounts[3]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC721: Invalid secret key',
            )

            try {
                await AtomicSwapERC721_contract.claimFunds(
                    '0x851f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    {from: accounts[3]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC721: Swap is not opened',
            )
        });

        it("claiming funds is not working from faker", async () => {
            try {
                await AtomicSwapERC721_contract.claimFunds(
                    '0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    {from: accounts[9]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC721: Caller is not the withdrawer',
            )
        });

        it("only working with all correct information", async () => {
            await AtomicSwapERC721_contract.claimFunds(
                '0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                {from: accounts[3]}
            );

            assert.equal(await PRIVIPodERC721Token_contract.ownerOf(tokenId, {from: accounts[0]}), accounts[3]);
        });

        it("not working if withdraw trader try to claim again", async () => {
            let thrownError;

            try {
                await AtomicSwapERC721_contract.claimFunds(
                    '0x841f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    '0x441f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    {from: accounts[3]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC721: Swap is not opened',
            )
        });

        it("refund", async () => {
            let date = new Date();
            date.setDate(date.getDate() + 1);

            await PRIVIPodERC721Token_contract.approve(AtomicSwapERC721_contract.address, tokenId, {from: accounts[3]})
            await PRIVIPodERC721Token_contract.setApprovalForAll(
                AtomicSwapERC721_contract.address,
                true,
                { from: accounts[3] }
            );

            await AtomicSwapERC721_contract.createProposal(
                "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747cf",
                tokenId,
                podAdress1,
                accounts[4],
                soliditySha3(
                    '0x541f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    accounts[4],
                ),
                getUnixEpochTimeStamp(date),
                {from: accounts[3]}
            );

            date.setDate(date.getDate() + 2);
            await AtomicSwapERC721_contract.setBlockTimeStamp(getUnixEpochTimeStamp(date));


            await AtomicSwapERC721_contract.refundFunds(
                "0x341f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747cf",
                {from: accounts[3]}
            );

            assert.equal(await PRIVIPodERC721Token_contract.ownerOf(tokenId, {from: accounts[0]}), accounts[3]);
        });

        it("refunding is not working while timelock", async () => {
            let date = new Date();
            date.setDate(date.getDate() + 30);

            await PRIVIPodERC721Token_contract.approve(AtomicSwapERC721_contract.address, tokenId, {from: accounts[3]})
            await PRIVIPodERC721Token_contract.setApprovalForAll(
                AtomicSwapERC721_contract.address,
                true,
                { from: accounts[3] }
            );

            await AtomicSwapERC721_contract.createProposal(
                "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                tokenId,
                podAdress1,
                accounts[5],
                soliditySha3(
                    '0x541f85f5eca6304166fcfb6f591d49f6019f23fa39be0615e6417da06bf747ce',
                    accounts[4],
                ),
                getUnixEpochTimeStamp(date),
                {from: accounts[3]}
            );

            let thrownError;

            try {
                await AtomicSwapERC721_contract.refundFunds(
                    "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                    {from: accounts[3]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC721: Swap is not expired',
            )
        });

        it("refunding is not working from faker", async () => {
            let date = new Date();

            date.setDate(date.getDate() + 60);
            await AtomicSwapERC721_contract.setBlockTimeStamp(getUnixEpochTimeStamp(date));

            let thrownError;

            try {
                await AtomicSwapERC721_contract.refundFunds(
                    "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                    {from: accounts[9]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC721: Caller is not the proposer',
            )
        });

        it("refunding is only working from trader after time lock", async () => {
            let date = new Date();

            date.setDate(date.getDate() + 60);
            await AtomicSwapERC721_contract.setBlockTimeStamp(getUnixEpochTimeStamp(date));

            await AtomicSwapERC721_contract.refundFunds(
                "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                {from: accounts[3]}
            );

            assert.equal(await PRIVIPodERC721Token_contract.ownerOf(tokenId, {from: accounts[0]}), accounts[3]);
        });

        it("not working if trader refund again", async () => {
            let thrownError;

            try {
                await AtomicSwapERC721_contract.refundFunds(
                    "0x341f85f5eca6304166fcfb6f501d49f6019f23fa39be0615e6417da06bf747cf",
                    {from: accounts[3]}
                );
            } catch (error) {
                thrownError = error;
            }

            assert.include(
                thrownError.message,
                'AtomicSwapERC721: Swap is not opened',
            )
        });
    });
});
