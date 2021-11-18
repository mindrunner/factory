import {
  BN,
  Idl,
  Program,
  Provider,
  web3
} from '@project-serum/anchor'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { SystemProgram } from '@solana/web3.js';
import { getPlayerFactionPDA } from '.';
import { baseIdl } from './util/scoreIdl'

const factionProgramId = new web3.PublicKey('FACTNmq2FhA2QNTnGM2aWJH3i7zT3cND5CgvjYTjyVYe');

/**
 * Returns the base IDL for the SCORE program following as generated by Anchor with provided program ID appended to metadata.
 * 
 * @param programId - Deployed program ID for the SCORE program
 * @returns - The base IDL object
 */
export function getScoreIDL(
  programId: web3.PublicKey,
): unknown {
  const _tmp = baseIdl;
  _tmp['metadata']['address'] = programId.toBase58();
  return _tmp;
}

/**
 * Returns the public key and bump seed for the SCORE variables account.
 * 
 * @param programId - Deployed program ID for the SCORE program
 * @returns - [Public key, bump seed]
 */
export async function getScoreVarsAccount(
  programId: web3.PublicKey
): Promise<[web3.PublicKey, number]> {
  return web3.PublicKey.findProgramAddress(
    [
      Buffer.from('SCOREVARS')
    ],
      programId,
  );
}

/**
 * Returns the public key and bump seed for the SCORE variables ship account associated with the provided ship mint.
 * 
 * @param programId - Deployed program ID for the SCORE program
 * @param shipMint - Ship mint address
 * @returns - [Ship account public key, bump seed]
 */
export async function getScoreVarsShipAccount(
  programId: web3.PublicKey,
  shipMint: web3.PublicKey,
): Promise<[web3.PublicKey, number]> {
  return web3.PublicKey.findProgramAddress(
    [
      Buffer.from('SCOREVARS_SHIP'),
      shipMint.toBuffer()
    ],
      programId,
  );
}

/**
 * Returns the public key and bump seed for a user's SCORE escrow account.
 * 
 * @param programId - Deployed program ID for the SCORE program
 * @param shipMint - Ship mint address
 * @param resourceMint - Mint address for the desired R4 resource
 * @param user - User's public key
 * @returns - [Escrow account public key, bump seed]
 */
export async function getScoreEscrowAccount(
  programId: web3.PublicKey,
  shipMint: web3.PublicKey,
  resourceMint: web3.PublicKey,
  user: web3.PublicKey):
  Promise<[web3.PublicKey, number]> {
  const seeds = [
    Buffer.from('SCORE_ESCROW'),
    user.toBuffer(),
    shipMint.toBuffer()
  ];
  if (resourceMint !== null) {
    seeds.push(resourceMint.toBuffer());
  }
  return web3.PublicKey.findProgramAddress(
    seeds,
    programId
  );
}

/**
 * Returns the SCORE escrow authority account
 * 
 * @param programId - Deployed program ID for the SCORE program
 * @param shipMint - Ship mint address
 * @param user - User's public key
 * @returns - [Authority account public key, bump seed]
 */
export async function getScoreEscrowAuthAccount(
  programId: web3.PublicKey,
  shipMint: web3.PublicKey,
  user: web3.PublicKey,
): Promise<[web3.PublicKey, number]> {
  return web3.PublicKey.findProgramAddress(
    [
      Buffer.from('SCORE_ESCROW_AUTHORITY'),
      user.toBuffer(),
      shipMint.toBuffer()
    ],
    programId,
  );
}

/**
 * Returns a user's ship staking account
 * 
 * @param programId - Deployed program ID for the SCORE program
 * @param assetMint - Mint address for the desired resource
 * @param user - User's public key
 * @returns - [Staking account public key, bump seed]
 */
export async function getShipStakingAccount(
  programId: web3.PublicKey,
  assetMint: web3.PublicKey,
  user: web3.PublicKey
): Promise<[web3.PublicKey, number]> {
  return web3.PublicKey.findProgramAddress(
    [
      Buffer.from('SCORE_INFO'),
      user.toBuffer(),
      assetMint.toBuffer(),
    ],
      programId,
  );
}

/**
 * Returns the public key and bump seed for the SCORE treasury token account.
 * 
 * @param programId - Deployed program ID for the SCORE program
 * @returns - [Treasury's Public key, bump seed]
 */
export async function getScoreTreasuryTokenAccount(
  programId: web3.PublicKey
): Promise<[web3.PublicKey, number]> {
  return web3.PublicKey.findProgramAddress(
  [
    Buffer.from('SCORE_TREASURY')
  ],
    programId,
  );
}

/**
 * Returns the treasury authority account
 * 
 * @param programId - Deployed program ID for the SCORE program
 * @returns - [Authority account public key, bump seed]
 */
export async function getScoreTreasuryAuthAccount(
  programId: web3.PublicKey,
):
  Promise<[web3.PublicKey, number]> {
  return web3.PublicKey.findProgramAddress(
  [
    Buffer.from('SCORE_TREASURY_AUTHORITY'),
  ],
    programId,
  );
}

/**
 * Initializes Score variables account and creates ATLAS treasury token account
 * 
 * @param connection - web3.Connection object
 * @param updateAuthorityAccount - Desired authority public key
 * @param atlasMint - ATLAS mint address
 * @param fuelMint - Fuel mint address
 * @param foodMint - Food mint address
 * @param armsMint - Arms mint address
 * @param toolkitMint - Toolkit mint address
 * @param programId - Deployed program ID for the SCORE program
 */
export async function initializeInstruction(
  connection: web3.Connection, 
  updateAuthorityAccount: web3.PublicKey,
  atlasMint: web3.PublicKey,
  fuelMint: web3.PublicKey,
  foodMint: web3.PublicKey,
  armsMint: web3.PublicKey,
  toolkitMint: web3.PublicKey,
  programId: web3.PublicKey
): Promise<web3.TransactionInstruction> {
  const idl = getScoreIDL(programId);
  const provider = new Provider(connection, null, null);
  const program = new Program(<Idl>idl, programId, provider);

  const [treasuryTokenAccount] = await getScoreTreasuryTokenAccount(programId);
  const [treasuryAuthorityAccount] = await getScoreTreasuryAuthAccount(programId);
  const [scoreVarsAccount, scoreVarsBump] = await getScoreVarsAccount(programId);

  const ix = await program.instruction.processInitialize(
    scoreVarsBump,
    {
      accounts: {
        updateAuthorityAccount: updateAuthorityAccount,
        scoreVarsAccount: scoreVarsAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
        treasuryTokenAccount: treasuryTokenAccount,
        treasuryAuthorityAccount: treasuryAuthorityAccount,
        atlasMint: atlasMint,
        fuelMint: fuelMint,
        foodMint: foodMint,
        armsMint: armsMint,
        toolkitMint: toolkitMint,
      },
      signers: [],
    }
  );
  return ix;
}

/**
 * Initiates Score variables account for a provided ship mint.
 * 
 * @param connection - web3.Connection object
 * @param updateAuthorityAccount - valid authority public key 
 * @param shipMint - Ship mint address
 * @param fuelMaxReserve - Max fuel in units
 * @param foodMaxReserve - Max food in units
 * @param armsMaxReserve - Max arms in units
 * @param toolkitMaxReserve - Max toolkits in units
 * @param secondsToBurnFuel 
 * @param secondsToBurnFood 
 * @param secondsToBurnArms 
 * @param secondsToBurnToolkit 
 * @param rewardRatePerSecond - Atlas rewarded per second
 * @param programId - Deployed Score program ID
 */
export async function registerShipInstruction(
  connection: web3.Connection,
  updateAuthorityAccount: web3.PublicKey,
  shipMint: web3.PublicKey,
  fuelMaxReserve: number,
  foodMaxReserve: number,
  armsMaxReserve: number,
  toolkitMaxReserve: number,
  secondsToBurnFuel: number,
  secondsToBurnFood: number,
  secondsToBurnArms: number,
  secondsToBurnToolkit: number,
  rewardRatePerSecond: number,
  programId: web3.PublicKey
): Promise<[web3.TransactionInstruction]> {
  const idl = getScoreIDL(programId);
  const provider = new Provider(connection, null, null);
  const program = new Program(<Idl>idl, programId, provider);

  const [scoreVarsShipAccount, scoreVarsShipBump] = await getScoreVarsShipAccount(programId, shipMint);
  const [scoreVarsAccount] = await getScoreVarsAccount(programId);

  const ix = await program.instruction.processRegisterShip(
    scoreVarsShipBump,
    new BN(rewardRatePerSecond),
    fuelMaxReserve,
    foodMaxReserve,
    armsMaxReserve,
    toolkitMaxReserve,
    secondsToBurnFuel,
    secondsToBurnFood,
    secondsToBurnArms,
    secondsToBurnToolkit,
    {
      accounts: {
        updateAuthorityAccount: updateAuthorityAccount,
        scoreVarsAccount: scoreVarsAccount,
        scoreVarsShipAccount: scoreVarsShipAccount,
        shipMint: shipMint,
        systemProgram: SystemProgram.programId,
      },
      signers: [],
    },
  );
  return ix;
}

/**
 * Provides a transaction instruction which can be used to deposit a specified quantity of ships to a player's ship staking account.
 * 
 * @param connection - web3.Connection object
 * @param playerPublicKey - Player's public key
 * @param shipQuantity - Quantity to deposit as u64
 * @param shipMint - Ship mint address
 * @param shipTokenAccount - Token account for the ship resource being deposited
 * @param programId - Deployed program ID for the SCORE program
 */
export async function initialDepositInstruction(
  connection: web3.Connection,
  playerPublicKey: web3.PublicKey,
  shipQuantity: number,
  shipMint: web3.PublicKey,
  shipTokenAccount: web3.PublicKey,
  programId: web3.PublicKey
): Promise<web3.TransactionInstruction> {
  const [escrowAuthority] = await getScoreEscrowAuthAccount(programId, shipMint, playerPublicKey);
  const [shipEscrow] = await getScoreEscrowAccount(programId, shipMint, null, playerPublicKey);
  const [shipStakingAccount, shipStakingBump] = await getShipStakingAccount(programId, shipMint, playerPublicKey);
  const [scoreVarsShipAccount] = await getScoreVarsShipAccount(programId, shipMint);
  const [playerFactionPDA] = await getPlayerFactionPDA(playerPublicKey, factionProgramId);

  const idl = getScoreIDL(programId);
  const provider = new Provider(connection, null, null);
  const program = new Program(<Idl>idl, programId, provider);
  const ix = await program.instruction.processInitialDeposit(
    shipStakingBump,
    new BN(shipQuantity),
    {
      accounts: {
        playerAccount: playerPublicKey,
        shipStakingAccount: shipStakingAccount,
        scoreVarsShipAccount: scoreVarsShipAccount,
        playerFactionAccount: playerFactionPDA,
        escrowAuthority: escrowAuthority,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: web3.SYSVAR_CLOCK_PUBKEY,
        rent: web3.SYSVAR_RENT_PUBKEY,
        shipMint: shipMint,
        shipTokenAccountSource: shipTokenAccount,
        shipTokenAccountEscrow: shipEscrow
      }
    }
  );
  return ix;
}

/**
 * Provides a transaction instruction which can be used to transfer arms resources to a player's arms escrow account.
 * 
 * @param connection - web3.Connection object
 * @param playerPublicKey - Player's public key
 * @param armsQuantity - Arms resource quantity as u64
 * @param shipMint - Ship mint address
 * @param armsMint - Arms resource mint address
 * @param armsTokenAccount - Token account for the arms resources being deposited
 * @param programId - Deployed program ID for the SCORE program
 */
export async function rearmInstruction(
  connection: web3.Connection,
  playerPublicKey: web3.PublicKey,
  armsQuantity: number,
  shipMint: web3.PublicKey,
  armsMint: web3.PublicKey,
  armsTokenAccount: web3.PublicKey,
  programId: web3.PublicKey
): Promise<web3.TransactionInstruction> {
  const [escrowAuthority] = await getScoreEscrowAuthAccount(programId, shipMint, playerPublicKey);
  const [armsEscrow] = await getScoreEscrowAccount(programId, shipMint, armsMint, playerPublicKey);
  const [shipStakingAccount] = await getShipStakingAccount(programId, shipMint, playerPublicKey);
  const [scoreVarsShipAccount] = await getScoreVarsShipAccount(programId, shipMint);
  const [scoreVarsAccount] = await getScoreVarsAccount(programId);

  const idl = getScoreIDL(programId);
  const provider = new Provider(connection, null, null);
  const program = new Program(<Idl>idl, programId, provider);
  const ix = await program.instruction.processRearm(
    new BN(armsQuantity),
    {
      accounts: {
        playerAccount: playerPublicKey,
        shipStakingAccount: shipStakingAccount,
        scoreVarsAccount: scoreVarsAccount,
        scoreVarsShipAccount: scoreVarsShipAccount,
        escrowAuthority: escrowAuthority,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: web3.SYSVAR_CLOCK_PUBKEY,
        rent: web3.SYSVAR_RENT_PUBKEY,
        shipMint: shipMint,
        armsMint: armsMint,
        armsTokenAccountSource: armsTokenAccount,
        armsTokenAccountEscrow: armsEscrow,
      }
    }
  );
  return ix;
}

/**
 * Provides a transaction instruction which can be used to transfer food resources to a player's food escrow account.
 * 
 * @param connection - web3.Connection object
 * @param playerPublicKey - Player's public key
 * @param foodQuantity - Food resource quantity as u64
 * @param shipMint - Ship mint address
 * @param foodMint - Food resource mint address
 * @param foodTokenAccount - Token account for the food resource being deposited
 * @param programId - Deployed program ID for the SCORE program
 */
export async function refeedInstruction(
  connection: web3.Connection,
  playerPublicKey: web3.PublicKey,
  foodQuantity: number,
  shipMint: web3.PublicKey,
  foodMint: web3.PublicKey,
  foodTokenAccount: web3.PublicKey,
  programId: web3.PublicKey
): Promise<web3.TransactionInstruction> {
  const [escrowAuthority] = await getScoreEscrowAuthAccount(programId, shipMint, playerPublicKey);
  const [foodEscrow] = await getScoreEscrowAccount(programId, shipMint, foodMint, playerPublicKey);
  const [shipStakingAccount] = await getShipStakingAccount(programId, shipMint, playerPublicKey);
  const [scoreVarsShipAccount] = await getScoreVarsShipAccount(programId, shipMint);
  const [scoreVarsAccount] = await getScoreVarsAccount(programId);

  const idl = getScoreIDL(programId);
  const provider = new Provider(connection, null, null);
  const program = new Program(<Idl>idl, programId, provider);
  const ix = await program.instruction.processRefeed(
    new BN(foodQuantity),
    {
      accounts: {
        playerAccount: playerPublicKey,
        shipStakingAccount: shipStakingAccount,
        scoreVarsAccount: scoreVarsAccount,
        scoreVarsShipAccount: scoreVarsShipAccount,
        escrowAuthority: escrowAuthority,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: web3.SYSVAR_CLOCK_PUBKEY,
        rent: web3.SYSVAR_RENT_PUBKEY,
        shipMint: shipMint,
        foodMint: foodMint,
        foodTokenAccountSource: foodTokenAccount,
        foodTokenAccountEscrow: foodEscrow,
      }
    }
  );
  return ix;
}

/**
 * Provides a transaction instruction which can be used to transfer fuel resources to a player's fuel escrow account.
 * 
 * @param connection - web3.Connection object
 * @param playerPublicKey - Player's public key
 * @param fuelQuantity - Fuel resource quantity as u64
 * @param shipMint - Ship mint address
 * @param fuelMint - Fuel resource mint address
 * @param fuelTokenAccount - Token account for the fuel resource being deposited
 * @param programId - Deployed program ID for the SCORE program
 */
export async function refuelInstruction(
  connection: web3.Connection,
  playerPublicKey: web3.PublicKey,
  fuelQuantity: number,
  shipMint: web3.PublicKey,
  fuelMint: web3.PublicKey,
  fuelTokenAccount: web3.PublicKey,
  programId: web3.PublicKey
): Promise<web3.TransactionInstruction> {
  const [escrowAuthority] = await getScoreEscrowAuthAccount(programId, shipMint, playerPublicKey);
  const [fuelEscrow] = await getScoreEscrowAccount(programId, shipMint, fuelMint, playerPublicKey);
  const [shipStakingAccount] = await getShipStakingAccount(programId, shipMint, playerPublicKey);
  const [scoreVarsShipAccount] = await getScoreVarsShipAccount(programId, shipMint);
  const [scoreVarsAccount] = await getScoreVarsAccount(programId);

  const idl = getScoreIDL(programId);
  const provider = new Provider(connection, null, null);
  const program = new Program(<Idl>idl, programId, provider);
  const ix = await program.instruction.processRefuel(
    new BN(fuelQuantity),
    {
      accounts: {
        playerAccount: playerPublicKey,
        shipStakingAccount: shipStakingAccount,
        scoreVarsAccount: scoreVarsAccount,
        scoreVarsShipAccount: scoreVarsShipAccount,
        escrowAuthority: escrowAuthority,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: web3.SYSVAR_CLOCK_PUBKEY,
        rent: web3.SYSVAR_RENT_PUBKEY,
        shipMint: shipMint,
        fuelMint: fuelMint,
        fuelTokenAccountSource: fuelTokenAccount,
        fuelTokenAccountEscrow: fuelEscrow,
      }
    }
  );
  return ix;
}

/**
 * Provides a transaction instruction which can be used to transfer toolkit resources to a player's toolkit escrow account.
 * 
 * @param connection - web3.Connection object
 * @param playerPublicKey - Player's public key
 * @param toolkitQuantity - Toolkit resource quantity as u64
 * @param shipMint - Ship mint address
 * @param toolkitMint - Toolkit resource mint address
 * @param toolkitTokenAccount - Token account for the toolkit resource being deposited
 * @param toolkitTokenAccountBurn - Burn account which tokens are transfered to when used
 * @param programId - Deployed program ID for the SCORE program
 */
export async function repairInstruction(
  connection: web3.Connection,
  playerPublicKey: web3.PublicKey,
  toolkitQuantity: number,
  shipMint: web3.PublicKey,
  toolkitMint: web3.PublicKey,
  toolkitTokenAccount: web3.PublicKey,
  toolkitTokenAccountBurn: web3.PublicKey,
  programId: web3.PublicKey
): Promise<web3.TransactionInstruction> {
  const [shipStakingAccount] = await getShipStakingAccount(programId, shipMint, playerPublicKey);
  const [scoreVarsShipAccount] = await getScoreVarsShipAccount(programId, shipMint);
  const [scoreVarsAccount] = await getScoreVarsAccount(programId);

  const idl = getScoreIDL(programId);
  const provider = new Provider(connection, null, null);
  const program = new Program(<Idl>idl, programId, provider);
  const ix = await program.instruction.processRepair(
    new BN(toolkitQuantity),
    {
      accounts: {
        playerAccount: playerPublicKey,
        shipStakingAccount: shipStakingAccount,
        scoreVarsAccount: scoreVarsAccount,
        scoreVarsShipAccount: scoreVarsShipAccount,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: web3.SYSVAR_CLOCK_PUBKEY,
        rent: web3.SYSVAR_RENT_PUBKEY,
        shipMint: shipMint,
        toolkitMint: toolkitMint,
        toolkitTokenAccountSource: toolkitTokenAccount,
        toolkitTokenAccountBurn: toolkitTokenAccountBurn,
      }
    }
  );
  return ix;
}

/**
 * Returns an instruction that can be used to update the amount of ATLAS in a player's pending rewards and update staked time paid
 * 
 * @param connection - web3.Connection object
 * @param playerPublicKey - Player's public key
 * @param updateAuthorityAccount - valid authority public key
 * @param shipMint - Ship mint address
 * @param programId - Deployed program ID for the SCORE program
 */
export async function settleInstruction(
  connection: web3.Connection,
  playerPublicKey: web3.PublicKey,
  updateAuthorityAccount: web3.PublicKey,
  shipMint: web3.PublicKey,
  programId: web3.PublicKey
): Promise<web3.TransactionInstruction> {
  const [shipStakingAccount] = await getShipStakingAccount(programId, shipMint, playerPublicKey)
  const [scoreVarsShipAccount] = await getScoreVarsShipAccount(programId, shipMint);
  const [scoreVarsAccount] = await getScoreVarsAccount(programId);

  const idl = getScoreIDL(programId); 
  const provider = new Provider(connection, null, null);
  const program = new Program(<Idl>idl, programId, provider);
  const ix = await program.instruction.processSettle(
    {
      accounts: {
        updateAuthorityAccount: updateAuthorityAccount,
        shipStakingAccount: shipStakingAccount,
        scoreVarsShipAccount: scoreVarsShipAccount,
        scoreVarsAccount: scoreVarsAccount,
      }
    }
  );
  return ix;
}

/**
 * 
 * @param connection - web3.Connection object
 * @param playerPublicKey - Player's public key
 * @param playerAtlasTokenAccount - Player's atlas token account public key TODO: can replace with getAtaForMint once we have ATLAS mint address
 * @param shipMint - Ship mint address
 * @param programId - Deployed program ID for the SCORE program
 */
export async function harvestInstruction(
  connection: web3.Connection,
  playerPublicKey: web3.PublicKey,
  playerAtlasTokenAccount: web3.PublicKey,
  shipMint: web3.PublicKey,
  programId: web3.PublicKey
): Promise<web3.TransactionInstruction> {
  const [shipStakingAccount] = await getShipStakingAccount(programId, shipMint, playerPublicKey)
  const [scoreVarsShipAccount] = await getScoreVarsShipAccount(programId, shipMint);
  const [treasuryTokenAccount] = await getScoreTreasuryTokenAccount(programId);
  const [treasuryAuthorityAccount] = await getScoreTreasuryAuthAccount(programId);

  const idl = getScoreIDL(programId);
  const provider = new Provider(connection, null, null);
  const program = new Program(<Idl>idl, programId, provider);
  const ix = await program.instruction.processHarvest(
    {
      accounts: {
        playerAccount: playerPublicKey,
        shipStakingAccount: shipStakingAccount,
        scoreVarsShipAccount: scoreVarsShipAccount,
        playerAtlasTokenAccount: playerAtlasTokenAccount,
        treasuryTokenAccount: treasuryTokenAccount,
        treasuryAuthorityAccount: treasuryAuthorityAccount,
        tokenProgram: TOKEN_PROGRAM_ID
      }
    }
  );
  return ix;
}