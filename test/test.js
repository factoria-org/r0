const { expect } = require("chai");
const { ethers } = require("hardhat");
const F0ABI = require('./F0abi.js')
const deploy = async () => {
  const Royalty = await ethers.getContractFactory("Royalty")
  const royalty = await Royalty.deploy()
  await royalty.deployed();
  return royalty
}
describe("token", function() {
  it('should not be able to set if the contract address is not owned by the msg.sender', async () => {
    // The signed in wallet is 0x73316d4224263496201c3420b36cdda9c0249574
    // 1. 0x946Fe10DcbF31E6C8da95Ce3C27C2B563Ac3F93a is owned by 0xfb7b2717f7a2a30b42e21cef03dd0fc76ef761e9
    // Try to set => should fail because the owner doesn't match the currently signed-in wallet
    const royalty = await deploy()
    let tx = royalty.set("0x946Fe10DcbF31E6C8da95Ce3C27C2B563Ac3F93a", {
      receiver: "0x502b2FE7Cc3488fcfF2E16158615AF87b4Ab5C41",
      amount: 500000
    })
    await expect(tx).to.be.revertedWith("1")
    let r = await royalty.get("0x946Fe10DcbF31E6C8da95Ce3C27C2B563Ac3F93a", 1, "" + Math.pow(10, 18))
    expect(r[0]).to.equal("0x0000000000000000000000000000000000000000")
    expect(r[1]).to.equal(0)
  })
  it('should be able to set if the contract address is owned by the msg.sender', async () => {
    // The signed in wallet is 0x73316d4224263496201c3420b36cdda9c0249574
    // 2. 0x4dfc2bEbc82201515e6b5C21e0FA7A7eEC06aAe5 is owned by 0x73316d4224263496201c3420b36cdda9c0249574
    // Try to set => should work because the owner matches the currently signed-in wallet
    const royalty = await deploy()
    let tx = await royalty.set("0x4dfc2bEbc82201515e6b5C21e0FA7A7eEC06aAe5", {
      receiver: "0x502b2FE7Cc3488fcfF2E16158615AF87b4Ab5C41",
      amount: 500000
    })
    await tx.wait()
    let r = await royalty.get("0x4dfc2bEbc82201515e6b5C21e0FA7A7eEC06aAe5", 1, "" + Math.pow(10, 18))
    expect(r[0]).to.equal("0x502b2FE7Cc3488fcfF2E16158615AF87b4Ab5C41")
    expect(r[1]).to.equal("" + Math.pow(10, 18)/2)
  })
  it('after setting, the token contract should NOT return the correct value if it has not been connected to the royalty contract yet', async () => {
    const royalty = await deploy()
    let tx = await royalty.set("0x4dfc2bEbc82201515e6b5C21e0FA7A7eEC06aAe5", {
      receiver: "0x502b2FE7Cc3488fcfF2E16158615AF87b4Ab5C41",
      amount: 500000
    })
    await tx.wait()

    const [signer] = await ethers.getSigners();
    let f0 = new ethers.Contract("0x4dfc2bEbc82201515e6b5C21e0FA7A7eEC06aAe5", F0ABI, signer)
    let info = await f0.royaltyInfo(1, "" + Math.pow(10,18))
    expect(info.receiver).to.equal("0x0000000000000000000000000000000000000000")
    expect(info.royaltyAmount).to.equal(0)
    console.log("info", info)
  })
  it('after setting, the token contract should return the correct value after connecting to the royalty contract', async () => {
    const royalty = await deploy()
    let tx = await royalty.set("0x4dfc2bEbc82201515e6b5C21e0FA7A7eEC06aAe5", {
      receiver: "0x502b2FE7Cc3488fcfF2E16158615AF87b4Ab5C41",
      amount: 300000
    })
    await tx.wait()

    const [signer] = await ethers.getSigners();
    let f0 = new ethers.Contract("0x4dfc2bEbc82201515e6b5C21e0FA7A7eEC06aAe5", F0ABI, signer)
    // connect the F0 contract with the royalty contract
    tx = await f0.setRoyalty(royalty.address)
    await tx.wait()

    let info = await f0.royaltyInfo(1, "" + Math.pow(10,18))
    console.log("info", info)
    console.log(info.royaltyAmount.toString())

    expect(info.receiver).to.equal("0x502b2FE7Cc3488fcfF2E16158615AF87b4Ab5C41")
    expect(info.royaltyAmount).to.equal("" + Math.pow(10, 18) * 0.3)

  });
  it.only('should not allow set if already set permanent', async () => {
    const royalty = await deploy()
    let tx = await royalty.set("0x4dfc2bEbc82201515e6b5C21e0FA7A7eEC06aAe5", {
      receiver: "0x502b2FE7Cc3488fcfF2E16158615AF87b4Ab5C41",
      amount: 300000,
      permanent: true
    })
    await tx.wait()
    console.log("x");

    let r = await royalty.get("0x4dfc2bEbc82201515e6b5C21e0FA7A7eEC06aAe5", 1, "" + Math.pow(10, 18));
    console.log(r)
    expect(r[0]).to.equal("0x502b2FE7Cc3488fcfF2E16158615AF87b4Ab5C41")
    expect(r[1]).to.equal("" + 3 * Math.pow(10, 17))

    tx = royalty.set("0x4dfc2bEbc82201515e6b5C21e0FA7A7eEC06aAe5", {
      receiver: "0x502b2FE7Cc3488fcfF2E16158615AF87b4Ab5C41",
      amount: 100000,
      permanent: true
    })
    await expect(tx).to.be.revertedWith("3");

    r = await royalty.get("0x4dfc2bEbc82201515e6b5C21e0FA7A7eEC06aAe5", 1, "" + Math.pow(10, 18));
    console.log(r)
    expect(r[0]).to.equal("0x502b2FE7Cc3488fcfF2E16158615AF87b4Ab5C41")
    expect(r[1]).to.equal("" + 3 * Math.pow(10, 17))


  })
});
